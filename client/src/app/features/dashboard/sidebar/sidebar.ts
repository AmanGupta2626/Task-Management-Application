import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../../core/auth.service';
import { NAV_BY_ROLE, ROLE_TITLES } from '../nav.config';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  private auth = inject(AuthService);

  readonly items = computed(() => {
    const role = this.auth.role();
    return role ? NAV_BY_ROLE[role] : [];
  });

  readonly roleTitle = computed(() => {
    const role = this.auth.role();
    return role ? ROLE_TITLES[role] : '';
  });
}
