import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { SocketService } from './core/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly socket = inject(SocketService);

  constructor() {
    this.auth.verifySession();

    effect(() => {
      if (this.auth.currentUser()) {
        this.socket.connect();
      } else {
        this.socket.disconnect();
      }
    });
  }
}
