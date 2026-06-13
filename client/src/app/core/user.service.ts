import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { User } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly api = `${environment.apiUrl}/api/users`;

  constructor(private http: HttpClient) {}

  list(): Observable<User[]> {
    return this.http.get<User[]>(this.api);
  }

  assignable(): Observable<User[]> {
    return this.http.get<User[]>(`${this.api}/assignable`);
  }

  assignMembers(teamLeadId: string, employeeIds: string[]): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/team`, { teamLeadId, employeeIds });
  }
}
