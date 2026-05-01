// ============================================================
// NAV COMPONENT
// ============================================================

import { Component, ChangeDetectionStrategy, HostBinding, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { TooltipDirective } from '../../directives/directives';

/** Shape of a single navigation item. */
export interface NavItem { path: string; label: string; icon: string; }

/**
 * Fixed sidebar navigation component.
 *
 * Supports collapsible mode: when collapsed, only Material icons are shown and
 * each icon gains a right-side tooltip with the route label. The collapsed width
 * (64 px) and expanded width (260 px) are written to the `--nav-width` CSS custom
 * property on `:root` so the main content area transitions in sync.
 *
 * Uses `@HostBinding('class.collapsed')` to drive all collapsed styles from a
 * single boolean field, avoiding imperative DOM manipulation beyond the CSS variable.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss'
})
export class NavComponent {
  /** When `true`, adds the `collapsed` class to the host and triggers icon-only layout. */
  @HostBinding('class.collapsed') collapsed = false;

  /** Top-level route definitions rendered in the sidebar. */
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tasks',     label: 'Tasks',     icon: 'task_alt'  },
    { path: '/users',     label: 'Team',      icon: 'group'     },
  ];

  readonly notifications = inject(NotificationService);

  /**
   * Toggles the collapsed state and updates the `--nav-width` CSS custom property
   * on `:root` so both the sidebar and `.app-main` margin transition together.
   */
  toggle(): void {
    this.collapsed = !this.collapsed;
    document.documentElement.style.setProperty(
      '--nav-width',
      this.collapsed ? '64px' : '260px'
    );
  }
}
