// ============================================================
// NAV COMPONENT — ES6 Arrow Functions
// ============================================================

import { Component, ChangeDetectionStrategy, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { TooltipDirective } from '../../directives/directives';

export interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  @HostBinding('class.collapsed') collapsed = false;

  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks',     label: 'Tasks',     icon: 'task_alt'  },
    { path: '/users',     label: 'Team',      icon: 'group'     },
  ];

  readonly notifications = inject(NotificationService);

  toggle(): void {
    this.collapsed = !this.collapsed;
    document.documentElement.style.setProperty(
      '--nav-width',
      this.collapsed ? '64px' : '260px'
    );
  }
}
