// ============================================================
// NAV COMPONENT — ES6 Arrow Functions
// ============================================================

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks',     label: 'Tasks',     icon: 'task_alt'  },
    { path: '/users',     label: 'Team',      icon: 'group'     },
  ];

  readonly notifications = inject(NotificationService);
}
