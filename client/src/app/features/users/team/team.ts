import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/auth.service';
import { UserService } from '../../../core/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-team',
  templateUrl: './team.html',
  styleUrl: './team.scss',
})
export class Team implements OnInit {
  protected auth = inject(AuthService);
  private userService = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly assigningLead = signal<User | null>(null);
  readonly selectedIds = signal<string[]>([]);

  readonly teamLeads = computed(() => this.users().filter((u) => u.role === 'TeamLead'));
  readonly employees = computed(() => this.users().filter((u) => u.role === 'Employee'));

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.userService.list().subscribe({
      next: (u) => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  membersOf(lead: User): User[] {
    return this.employees().filter((e) => e.teamLead === lead._id);
  }

  teamLeadName(employee: User): string | null {
    if (!employee.teamLead) return null;
    return this.teamLeads().find((l) => l._id === employee.teamLead)?.username ?? null;
  }

  openAssign(lead: User): void {
    this.assigningLead.set(lead);
    this.selectedIds.set(this.membersOf(lead).map((e) => e._id));
  }

  closeAssign(): void {
    this.assigningLead.set(null);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
    );
  }

  otherLeadName(employee: User): string | null {
    const lead = this.assigningLead();
    if (!employee.teamLead || employee.teamLead === lead?._id) return null;
    return this.teamLeadName(employee);
  }

  saveAssignment(): void {
    const lead = this.assigningLead();
    if (!lead) return;
    this.saving.set(true);
    this.userService.assignMembers(lead._id, this.selectedIds()).subscribe({
      next: () => {
        this.saving.set(false);
        this.assigningLead.set(null);
        this.load();
      },
      error: () => this.saving.set(false),
    });
  }
}
