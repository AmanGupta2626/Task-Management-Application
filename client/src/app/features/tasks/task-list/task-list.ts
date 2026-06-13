import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/auth.service';
import { TaskService } from '../../../core/task.service';
import { UserService } from '../../../core/user.service';
import { SocketService } from '../../../core/socket.service';
import { Role, Task, TaskStatus, User } from '../../../core/models';

type Filter = 'all' | TaskStatus;
type Sort = 'recent' | 'oldest';

const PAGE_INFO: Record<Role, { title: string; lead: string; accent: string }> = {
  Employee: {
    title: 'My Execution Pipeline',
    lead: 'Focus on your individual contributions. Tasks created here are',
    accent: 'automatically assigned to your queue for immediate action.',
  },
  TeamLead: {
    title: 'Team Execution Board',
    lead: 'Coordinate your squad. Create, assign and track work across',
    accent: 'your team members from a single command surface.',
  },
  Manager: {
    title: 'Operations Command Center',
    lead: 'Oversee the organisation. Assign and reassign work across',
    accent: 'every team lead and their squad in real time.',
  },
};

@Component({
  selector: 'app-task-list',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss',
})
export class TaskList implements OnInit {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private socket = inject(SocketService);
  protected auth = inject(AuthService);

  readonly tasks = signal<Task[]>([]);
  readonly assignableUsers = signal<User[]>([]);
  readonly people = signal<User[]>([]);
  readonly filter = signal<Filter>('all');
  readonly sort = signal<Sort>('recent');
  readonly personFilter = signal<string>('all');
  readonly loading = signal(false);
  readonly error = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly viewing = signal<Task | null>(null);
  readonly canAssign = computed(() => this.auth.role() !== 'Employee');

  readonly filters: { label: string; value: Filter }[] = [
    { label: 'All Tasks', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
  ];

  readonly pageInfo = computed(() => {
    const role = this.auth.role();
    return role ? PAGE_INFO[role] : PAGE_INFO.Employee;
  });

  readonly relationHeader = computed(() =>
    this.auth.role() === 'Employee' ? 'Assigned By' : 'Assigned To',
  );

  readonly visibleTasks = computed(() => {
    const f = this.filter();
    const dir = this.sort();
    const person = this.personFilter();
    let list = this.tasks().filter((t) => (f === 'all' ? true : t.status === f));
    if (person !== 'all') {
      list = list.filter((t) => t.assignedTo?._id === person || t.createdBy?._id === person);
    }
    return [...list].sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return dir === 'recent' ? diff : -diff;
    });
  });

  readonly pendingCount = computed(() => this.tasks().filter((t) => t.status === 'pending').length);
  readonly completedCount = computed(
    () => this.tasks().filter((t) => t.status === 'completed').length,
  );

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    assignedTo: [''],
  });

  constructor() {
    effect(() => {
      if (this.socket.lastEvent()) {
        this.load();
      }
    });
  }

  ngOnInit(): void {
    this.load();
    if (this.canAssign()) {
      this.userService.assignable().subscribe((u) => this.assignableUsers.set(u));
      this.userService.list().subscribe((u) => this.people.set(u));
    }
  }

  setPerson(id: string): void {
    this.personFilter.set(id);
  }

  load(): void {
    this.loading.set(true);
    this.taskService.list().subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tasks');
        this.loading.set(false);
      },
    });
  }

  setFilter(value: Filter): void {
    this.filter.set(value);
  }

  toggleSort(): void {
    this.sort.update((s) => (s === 'recent' ? 'oldest' : 'recent'));
  }

  relationUser(task: Task): User {
    return this.auth.role() === 'Employee' ? task.createdBy : task.assignedTo;
  }

  relationLabel(task: Task): string {
    const user = this.relationUser(task);
    if (user?._id === this.auth.currentUser()?._id) return 'Me';
    return user?.username ?? '—';
  }

  relationPill(task: Task): string {
    const user = this.relationUser(task);
    if (user?._id === this.auth.currentUser()?._id) return 'bg-brand-500/15 text-brand-200';
    switch (user?.role) {
      case 'TeamLead':
        return 'bg-violet-500/15 text-violet-300';
      case 'Manager':
        return 'bg-amber-500/15 text-amber-300';
      case 'Employee':
        return 'bg-sky-500/15 text-sky-300';
      default:
        return 'bg-white/5 text-slate-300';
    }
  }

  openCreate(): void {
    this.editingId.set(null);
    this.error.set('');
    this.form.reset({ title: '', description: '', assignedTo: '' });
    this.showForm.set(true);
  }

  openEdit(task: Task): void {
    this.editingId.set(task._id);
    this.error.set('');
    this.form.reset({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  openDetails(task: Task): void {
    this.viewing.set(task);
  }

  closeDetails(): void {
    this.viewing.set(null);
  }

  descIsLong(task: Task): boolean {
    const d = task.description ?? '';
    return d.length > 180 || d.split('\n').length > 5;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      title: value.title,
      description: value.description,
    };
    if (this.canAssign() && value.assignedTo) {
      payload['assignedTo'] = value.assignedTo;
    }

    const id = this.editingId();
    const request = id
      ? this.taskService.update(id, payload)
      : this.taskService.create(payload as any);

    request.subscribe({
      next: () => {
        this.showForm.set(false);
        this.load();
      },
      error: (err) => this.error.set(err.error?.message || 'Failed to save task'),
    });
  }

  toggleStatus(task: Task): void {
    const status: TaskStatus = task.status === 'pending' ? 'completed' : 'pending';
    this.taskService.update(task._id, { status }).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message || 'Failed to update task'),
    });
  }

  remove(task: Task): void {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    this.taskService.remove(task._id).subscribe({
      next: () => this.load(),
      error: (err) => this.error.set(err.error?.message || 'Failed to delete task'),
    });
  }
}
