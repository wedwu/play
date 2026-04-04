import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../theme.service';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Playground', href: '/playground' },
];

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  navItems = navItems;
  themeService = inject(ThemeService);
}
