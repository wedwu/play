import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from '../login.component';
import { AuthService } from '../../../services/auth.service';

function mockAuthService(overrides = {}) {
  return {
    login: jasmine.createSpy('login').and.returnValue(of({ token: 'tok', user: {} })),
    register: jasmine.createSpy('register').and.returnValue(of({ token: 'tok', user: {} })),
    ...overrides,
  };
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: any;
  let router: any;

  beforeEach(async () => {
    authService = mockAuthService();
    router = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Mode toggle ───────────────────────────────────────────────────────────

  describe('mode toggle', () => {
    it('defaults to login mode', () => {
      expect(component.mode()).toBe('login');
    });

    it('switches to register mode on tab click', () => {
      const registerBtn = fixture.debugElement
        .queryAll(By.css('button'))
        .find((el) => el.nativeElement.textContent.includes('Create Account'));
      registerBtn!.nativeElement.click();
      fixture.detectChanges();

      expect(component.mode()).toBe('register');
    });

    it('shows Name field only in register mode', () => {
      // Login mode — no name field
      expect(fixture.debugElement.query(By.css('input[name="name"]'))).toBeNull();

      // Switch to register
      component.mode.set('register');
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('input[name="name"]'))).toBeTruthy();
    });

    it('shows "Sign In" button text in login mode', () => {
      const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitBtn.nativeElement.textContent).toContain('Sign In');
    });

    it('shows "Create Account" button text in register mode', () => {
      component.mode.set('register');
      fixture.detectChanges();
      const submitBtn = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(submitBtn.nativeElement.textContent).toContain('Create Account');
    });
  });

  // ─── Login submission ──────────────────────────────────────────────────────

  describe('login form submission', () => {
    it('calls AuthService.login with email and password', fakeAsync(() => {
      component.email = 'admin@taskflow.dev';
      component.password = 'admin123';
      component.submit();
      tick();

      expect(authService.login).toHaveBeenCalledWith('admin@taskflow.dev', 'admin123');
    }));

    it('navigates to / on successful login', fakeAsync(() => {
      component.email = 'admin@taskflow.dev';
      component.password = 'admin123';
      component.submit();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('sets error signal on login failure', fakeAsync(() => {
      authService.login = jasmine.createSpy('login').and.returnValue(
        throwError(() => new Error('Invalid credentials'))
      );

      component.email = 'bad@test.com';
      component.password = 'wrong';
      component.submit();
      tick();

      expect(component.error()).toBe('Invalid credentials');
    }));

    it('sets loading to false after failure', fakeAsync(() => {
      authService.login = jasmine.createSpy('login').and.returnValue(
        throwError(() => new Error('fail'))
      );

      component.submit();
      tick();

      expect(component.loading()).toBe(false);
    }));

    it('does not call register in login mode', fakeAsync(() => {
      component.submit();
      tick();
      expect(authService.register).not.toHaveBeenCalled();
    }));
  });

  // ─── Register submission ───────────────────────────────────────────────────

  describe('register form submission', () => {
    beforeEach(() => {
      component.mode.set('register');
      fixture.detectChanges();
    });

    it('calls AuthService.register with all three fields', fakeAsync(() => {
      component.email = 'new@test.com';
      component.password = 'pass123';
      component.name = 'New User';
      component.submit();
      tick();

      expect(authService.register).toHaveBeenCalledWith('new@test.com', 'pass123', 'New User');
    }));

    it('navigates to / on successful registration', fakeAsync(() => {
      component.email = 'new@test.com';
      component.password = 'pass123';
      component.name = 'New User';
      component.submit();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/']);
    }));

    it('does not call login in register mode', fakeAsync(() => {
      component.submit();
      tick();
      expect(authService.login).not.toHaveBeenCalled();
    }));

    it('sets error on duplicate email', fakeAsync(() => {
      authService.register = jasmine.createSpy('register').and.returnValue(
        throwError(() => new Error('Email already in use'))
      );

      component.email = 'dup@test.com';
      component.password = 'pass';
      component.name = 'Dup';
      component.submit();
      tick();

      expect(component.error()).toBe('Email already in use');
    }));
  });

  // ─── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('disables submit button while loading', fakeAsync(() => {
      // Create a never-resolving observable to keep loading state
      authService.login = jasmine.createSpy('login').and.returnValue(
        new (require('rxjs').Subject)().asObservable()
      );

      component.submit();
      fixture.detectChanges();

      const btn = fixture.debugElement.query(By.css('button[type="submit"]'));
      expect(btn.nativeElement.disabled).toBe(true);
    }));
  });

  // ─── Demo credentials ──────────────────────────────────────────────────────

  it('pre-fills demo credentials', () => {
    expect(component.email).toBe('admin@taskflow.dev');
    expect(component.password).toBe('admin123');
  });

  it('shows demo credentials hint section', () => {
    const hint = fixture.debugElement.query(By.css('.bg-gray-50'));
    expect(hint).toBeTruthy();
    expect(hint.nativeElement.textContent).toContain('admin');
  });
});
