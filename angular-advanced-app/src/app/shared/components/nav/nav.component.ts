// ============================================================
// NAV COMPONENT — ES6 Arrow Functions
// ============================================================

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

interface NavItem { path: string; label: string; icon: string; }

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="sidebar">
      <div class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">AngularPro</span>
      </div>
      <ul class="nav-list">
        @for (item of navItems; track item.path) {
          <li>
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-link">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          </li>
        }
      </ul>
      <div class="nav-footer">
        <div class="user-badge">
          <span class="avatar">AU</span>
          <div class="user-info">
            <span class="user-name">Admin User</span>
            <span class="user-role">Administrator</span>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 1.5rem 0; z-index: 100; }
    .brand { display: flex; align-items: center; gap: 0.75rem; padding: 0 1.5rem 1.5rem; border-bottom: 1px solid var(--border); }
    .brand-icon { font-size: 1.5rem; }
    .brand-name { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: var(--accent); }
    .nav-list { list-style: none; padding: 1rem 0; flex: 1; margin: 0; }
    .nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; color: var(--text-secondary); text-decoration: none; font-family: 'Space Mono', monospace; font-size: 0.8rem; transition: all 0.2s; border-left: 3px solid transparent; }
    .nav-link:hover { color: var(--text-primary); background: var(--bg-hover); }
    .nav-link.active { color: var(--accent); border-left-color: var(--accent); background: var(--accent-dim); }
    .nav-icon { font-size: 1.1rem; width: 1.5rem; text-align: center; }
    .nav-footer { padding: 1rem 1.5rem; border-top: 1px solid var(--border); }
    .user-badge { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 36px; height: 36px; background: var(--accent); color: var(--bg-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.75rem; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.85rem; color: var(--text-primary); }
    .user-role { font-family: 'Space Mono', monospace; font-size: 0.7rem; color: var(--text-secondary); }
    @media (max-width: 768px) { .sidebar { display: none; } }
  `]
})
export class NavComponent {
  readonly navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/tasks',     label: 'Tasks',     icon: '✅' },
    { path: '/users',     label: 'Team',      icon: '👥' },
  ];

  constructor(public notifications: NotificationService) {}
}
