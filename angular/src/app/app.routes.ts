import { Routes } from '@angular/router';
import { Home } from './home/home';
import { Playground } from './playground/playground';
import { Cheatsheet } from './cheatsheet/cheatsheet';
import { CheatsheetEs6 } from './cheatsheet-es6/cheatsheet-es6';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'playground', component: Playground },
  { path: 'cheatsheet', component: Cheatsheet },
  { path: 'cheatsheet-es6', component: CheatsheetEs6 },
];
