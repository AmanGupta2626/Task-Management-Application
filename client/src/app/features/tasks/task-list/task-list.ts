import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe } from '@angular/common';

import { AuthService } from '../../../core/auth.service';
import { TaskService } from '../../../core/task.service';
import { UserService } from '../../../core/user.service';
import { SocketService } from '../../../core/socket.service';
import { Task, TaskStatus, User } from '../../../core/models';

type Filter = 'all' | TaskStatus;

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
  readonly filter = signal<Filter>('all');
  readonly loading = signal(false);
  readonly error = signal('');

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly canAssign = computed(() => this.auth.role() !== 'Employee');

  readonly visibleTasks = computed(() => {
    const f = this.filter();
    const all = this.tasks();
    return f === 'all' ? all : all.filter((t) => t.status === f);
  });

  readonly pendingCount = computed(() => this.tasks().filter((t) => t.status === 'pending').length);
  readonly completedCount = computed(
    () => this.tasks().filter((t) => t.status === 'completed').length
  );

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    status: ['pending' as TaskStatus],
    assignedTo: [''],
  });

  constructor() {
    effect(() => {
      const event = this.socket.lastEvent();
      if (event) {
        this.load();
      }
    });
  }

  ngOnInit(): void {
    this.load();
    if (this.canAssign()) {
      this.userService.assignable().subscribe((u) => this.assignableUsers.set(u));
    }
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

  openCreate(): void {
    this.editingId.set(null);
    this.error.set('');
    this.form.reset({ title: '', description: '', status: 'pending', assignedTo: '' });
    this.showForm.set(true);
  }

  openEdit(task: Task): void {
    this.editingId.set(task._id);
    this.error.set('');
    this.form.reset({
      title: task.title,
      description: task.description,
      status: task.status,
      assignedTo: task.assignedTo?._id || '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
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
      status: value.status,
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
