import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { Role, User } from '../../../core/models';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly managers = signal<User[]>([]);
  readonly teamLeads = signal<User[]>([]);

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['Employee' as Role, Validators.required],
    manager: [''],
    teamLead: [''],
  });

  ngOnInit(): void {
    this.auth.managers().subscribe((m) => this.managers.set(m));
    this.auth.teamLeads().subscribe((t) => this.teamLeads.set(t));
    this.applyRoleValidators(this.form.controls.role.value);
    this.form.controls.role.valueChanges.subscribe((role) => this.applyRoleValidators(role));
  }

  private applyRoleValidators(role: Role): void {
    const manager = this.form.controls.manager;
    const teamLead = this.form.controls.teamLead;

    manager.clearValidators();
    teamLead.clearValidators();
    manager.setValue('');
    teamLead.setValue('');

    if (role === 'TeamLead') {
      manager.setValidators(Validators.required);
    } else if (role === 'Employee') {
      teamLead.setValidators(Validators.required);
    }
    manager.updateValueAndValidity();
    teamLead.updateValueAndValidity();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();

    const payload = {
      username: value.username,
      email: value.email,
      password: value.password,
      role: value.role,
      ...(value.role === 'TeamLead' ? { manager: value.manager } : {}),
      ...(value.role === 'Employee' ? { teamLead: value.teamLead } : {}),
    };

    this.auth.register(payload).subscribe({
      next: () => this.router.navigateByUrl('/tasks'),
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}
