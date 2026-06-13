import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/auth.service';
import { UserService } from '../../../core/user.service';
import { TaskService } from '../../../core/task.service';
import { Task, User } from '../../../core/models';

interface TeamMember {
  user: User;
  tasks: Task[];
}

@Component({
  selector: 'app-team',
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team implements OnInit {
  protected auth = inject(AuthService);
  private userService = inject(UserService);
  private taskService = inject(TaskService);

  readonly users = signal<User[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(false);

  readonly teamLeads = computed(() => this.users().filter((u) => u.role === 'TeamLead'));
  readonly employees = computed(() => this.users().filter((u) => u.role === 'Employee'));

  readonly members = computed<TeamMember[]>(() => {
    const relevant =
      this.auth.role() === 'Manager'
        ? this.users()
        : this.users().filter((u) => u._id !== this.auth.currentUser()?._id);
    return relevant.map((user) => ({
      user,
      tasks: this.tasks().filter((t) => t.assignedTo?._id === user._id),
    }));
  });

  ngOnInit(): void {
    this.loading.set(true);
    this.userService.list().subscribe((u) => this.users.set(u));
    this.taskService.list().subscribe({
      next: (t) => {
        this.tasks.set(t);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
