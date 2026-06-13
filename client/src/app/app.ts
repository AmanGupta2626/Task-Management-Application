import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { SocketService } from './core/socket.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly auth = inject(AuthService);
  private readonly socket = inject(SocketService);
  private readonly router = inject(Router);

  constructor() {
    this.auth.verifySession();

    effect(() => {
      const user = this.auth.currentUser();
      if (user && this.auth.token) {
        this.socket.connect(this.auth.token);
      } else {
        this.socket.disconnect();
      }
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
