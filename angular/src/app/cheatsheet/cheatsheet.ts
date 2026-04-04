import { Component } from '@angular/core';

interface Section {
  title: string;
  items: { label: string; code: string }[];
}

@Component({
  selector: 'app-cheatsheet',
  templateUrl: './cheatsheet.html',
  styleUrl: './cheatsheet.scss',
})
export class Cheatsheet {
  sections: Section[] = [
    {
      title: 'Component',
      items: [
        {
          label: 'Basic component',
          code: `@Component({
  selector: 'app-hello',
  template: \`<h1>Hello {{ name }}</h1>\`,
})
export class Hello {
  name = 'World';
}`,
        },
        {
          label: 'Standalone with imports',
          code: `@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MyComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}`,
        },
      ],
    },
    {
      title: 'Signals',
      items: [
        {
          label: 'signal / computed / effect',
          code: `import { signal, computed, effect } from '@angular/core';

count = signal(0);
double = computed(() => this.count() * 2);

constructor() {
  effect(() => console.log('count:', this.count()));
}

increment() {
  this.count.update(n => n + 1);
  // or: this.count.set(5);
}`,
        },
        {
          label: 'Signal in template',
          code: `<!-- call it like a function -->
<p>{{ count() }}</p>
<p>{{ double() }}</p>`,
        },
      ],
    },
    {
      title: 'Inputs & Outputs',
      items: [
        {
          label: 'Input / Output',
          code: `@Input() label = '';
@Input() variant: 'primary' | 'danger' = 'primary';
@Output() clicked = new EventEmitter<void>();`,
        },
        {
          label: 'input() / output() (v17.1+)',
          code: `import { input, output } from '@angular/core';

label = input('');
variant = input<'primary' | 'danger'>('primary');
clicked = output<void>();`,
        },
        {
          label: 'Usage in parent template',
          code: `<app-button
  label="Save"
  variant="primary"
  (clicked)="onSave()"
/>`,
        },
      ],
    },
    {
      title: 'Template Syntax',
      items: [
        {
          label: 'Binding types',
          code: `<!-- Property binding -->
<img [src]="imageUrl" />

<!-- Event binding -->
<button (click)="save()">Save</button>

<!-- Two-way binding -->
<input [(ngModel)]="name" />

<!-- String interpolation -->
<p>Hello {{ name }}</p>`,
        },
        {
          label: '@if / @else',
          code: `@if (isLoggedIn) {
  <p>Welcome back!</p>
} @else {
  <p>Please log in.</p>
}`,
        },
        {
          label: '@for',
          code: `@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found.</li>
}`,
        },
        {
          label: '@switch',
          code: `@switch (status) {
  @case ('active') { <span>Active</span> }
  @case ('inactive') { <span>Inactive</span> }
  @default { <span>Unknown</span> }
}`,
        },
      ],
    },
    {
      title: 'Dependency Injection',
      items: [
        {
          label: 'Create a service',
          code: `@Injectable({ providedIn: 'root' })
export class UserService {
  private users = signal<User[]>([]);

  getAll() { return this.users.asReadonly(); }
  add(user: User) { this.users.update(u => [...u, user]); }
}`,
        },
        {
          label: 'Inject a service',
          code: `// inject() function (recommended)
export class MyComponent {
  private userService = inject(UserService);
}

// Constructor injection
export class MyComponent {
  constructor(private userService: UserService) {}
}`,
        },
      ],
    },
    {
      title: 'Routing',
      items: [
        {
          label: 'Define routes',
          code: `export const routes: Routes = [
  { path: '', component: Home },
  { path: 'about', component: About },
  { path: 'users/:id', component: UserDetail },
  { path: '**', redirectTo: '' },
];`,
        },
        {
          label: 'Lazy loading',
          code: `{ path: 'admin', loadComponent: () =>
    import('./admin/admin').then(m => m.Admin) }`,
        },
        {
          label: 'Router directives',
          code: `<a routerLink="/about" routerLinkActive="active">About</a>
<router-outlet />`,
        },
        {
          label: 'Read route params',
          code: `import { ActivatedRoute } from '@angular/router';

route = inject(ActivatedRoute);
id = this.route.snapshot.paramMap.get('id');`,
        },
      ],
    },
    {
      title: 'Lifecycle Hooks',
      items: [
        {
          label: 'Common hooks',
          code: `export class MyComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // After first render, inputs are set
  }

  ngOnChanges(changes: SimpleChanges) {
    // Input value changed
  }

  ngOnDestroy() {
    // Cleanup subscriptions
  }
}`,
        },
        {
          label: 'afterNextRender / afterRender',
          code: `import { afterNextRender } from '@angular/core';

constructor() {
  afterNextRender(() => {
    // DOM is ready — safe to access nativeElement
  });
}`,
        },
      ],
    },
    {
      title: 'Forms',
      items: [
        {
          label: 'Template-driven (FormsModule)',
          code: `// Import FormsModule in component
<form #f="ngForm" (ngSubmit)="onSubmit(f)">
  <input name="email" ngModel required />
  <button type="submit">Submit</button>
</form>`,
        },
        {
          label: 'Reactive (ReactiveFormsModule)',
          code: `import { FormBuilder, Validators } from '@angular/forms';

fb = inject(FormBuilder);
form = this.fb.group({
  email: ['', [Validators.required, Validators.email]],
  password: ['', Validators.minLength(8)],
});

onSubmit() {
  if (this.form.valid) console.log(this.form.value);
}`,
        },
        {
          label: 'Reactive form template',
          code: `<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <input formControlName="email" />
  @if (form.get('email')?.invalid) {
    <span>Invalid email</span>
  }
  <button type="submit">Submit</button>
</form>`,
        },
      ],
    },
    {
      title: 'Pipes',
      items: [
        {
          label: 'Built-in pipes',
          code: `{{ price | currency:'USD' }}
{{ today | date:'mediumDate' }}
{{ name | uppercase }}
{{ value | json }}
{{ longText | slice:0:100 }}`,
        },
        {
          label: 'Custom pipe',
          code: `@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50): string {
    return value.length > limit
      ? value.slice(0, limit) + '…'
      : value;
  }
}

// Usage: {{ text | truncate:80 }}`,
        },
      ],
    },
    {
      title: 'HTTP',
      items: [
        {
          label: 'Setup (app.config.ts)',
          code: `import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};`,
        },
        {
          label: 'Service with HttpClient',
          code: `@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = 'https://api.example.com';

  getUsers() {
    return this.http.get<User[]>(\`\${this.base}/users\`);
  }

  createUser(user: User) {
    return this.http.post<User>(\`\${this.base}/users\`, user);
  }
}`,
        },
      ],
    },
  ];
}
