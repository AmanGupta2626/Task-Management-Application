import { Component, ElementRef, HostListener, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { ROLE_TITLES } from '../nav.config';

@Component({
  selector: 'app-header',
  templateUrl: './header.html',
})
export class Header {
  protected auth = inject(AuthService);
  private router = inject(Router);
  private host = inject(ElementRef);

  readonly menuOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target)) {
      this.menuOpen.set(false);
    }
  }

  readonly roleTitle = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_TITLES[role] : '';
  });

  readonly initial = computed(() =>
    (this.auth.currentUser()?.username ?? '?').charAt(0).toUpperCase()
  );

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
