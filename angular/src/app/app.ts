import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ArrayMergePlayground } from './array-merge-playground/array-merge-playground';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ArrayMergePlayground],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular');
}
