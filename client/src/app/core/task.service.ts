import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { Task, TaskStatus } from './models';

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = `${environment.apiUrl}/api/tasks`;

  constructor(private http: HttpClient) {}

  list(status?: TaskStatus | 'all'): Observable<Task[]> {
    let params = new HttpParams();
    if (status && status !== 'all') {
      params = params.set('status', status);
    }
    return this.http.get<Task[]>(this.api, { params });
  }

  create(payload: TaskPayload): Observable<Task> {
    return this.http.post<Task>(this.api, payload);
  }

  update(id: string, payload: Partial<TaskPayload>): Observable<Task> {
    return this.http.put<Task>(`${this.api}/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string; id: string }> {
    return this.http.delete<{ message: string; id: string }>(`${this.api}/${id}`);
  }
}
