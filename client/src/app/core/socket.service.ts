import { Injectable, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';

import { environment } from '../../environments/environment';
import { Task } from './models';

export interface TaskEvent {
  type: 'created' | 'updated' | 'deleted';
  task: Task;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  readonly lastEvent = signal<TaskEvent | null>(null);

  connect(token: string): void {
    if (this.socket) return;

    this.socket = io(environment.apiUrl || '/', {
      auth: { token },
    });

    this.socket.on('task:created', (task: Task) =>
      this.lastEvent.set({ type: 'created', task })
    );
    this.socket.on('task:updated', (task: Task) =>
      this.lastEvent.set({ type: 'updated', task })
    );
    this.socket.on('task:deleted', (task: Task) =>
      this.lastEvent.set({ type: 'deleted', task })
    );
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
