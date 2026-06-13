import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';
import { AuthResponse, User } from './models';

const USER_KEY = 'tm_user';

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = `${environment.apiUrl}/api/auth`;

  private readonly userSignal = signal<User | null>(this.readUser());
  readonly currentUser = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);
  readonly role = computed(() => this.userSignal()?.role ?? null);

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(tap((res) => this.persistUser(res.user)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, payload)
      .pipe(tap((res) => this.persistUser(res.user)));
  }

  verifySession(): void {
    if (!this.userSignal()) return;
    this.http.get<{ user: User }>(`${this.api}/me`).subscribe({
      next: (res) => this.persistUser(res.user),
      error: () => this.clearSession(),
    });
  }

  managers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/managers`);
  }

  teamLeads(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/team-leads`);
  }

  logout(): void {
    this.http.post(`${this.api}/logout`, {}).subscribe({ next: () => {}, error: () => {} });
    this.clearSession();
  }

  clearSession(): void {
    localStorage.removeItem(USER_KEY);
    this.userSignal.set(null);
  }

  private persistUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
