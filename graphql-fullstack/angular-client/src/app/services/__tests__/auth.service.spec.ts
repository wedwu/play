import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { LOGIN_MUTATION, REGISTER_MUTATION } from '../../graphql/mutations';
import { ME_QUERY } from '../../graphql/queries';

const mockUser = {
  id: 'user-1',
  name: 'Alice Admin',
  email: 'admin@taskflow.dev',
  role: 'ADMIN',
  avatarUrl: null,
  __typename: 'User',
};

describe('AuthService', () => {
  let service: AuthService;
  let controller: ApolloTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [ApolloTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    controller = TestBed.inject(ApolloTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
  });

  // ─── Signals ───────────────────────────────────────────────────────────────

  describe('initial signal state', () => {
    it('user() starts as null', () => {
      expect(service.user()).toBeNull();
    });

    it('isAuthenticated() starts as false', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });
  });

  // ─── loadCurrentUser() ─────────────────────────────────────────────────────

  describe('loadCurrentUser()', () => {
    it('sets user signal when ME_QUERY returns a user', fakeAsync(() => {
      service.loadCurrentUser().subscribe();
      const op = controller.expectOne(ME_QUERY);
      op.flushData({ me: mockUser });
      tick();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    }));

    it('sets user to null when ME_QUERY returns null', fakeAsync(() => {
      service.loadCurrentUser().subscribe();
      const op = controller.expectOne(ME_QUERY);
      op.flushData({ me: null });
      tick();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    }));
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('stores token in localStorage', fakeAsync(() => {
      service.login('admin@taskflow.dev', 'admin123').subscribe();
      const op = controller.expectOne(LOGIN_MUTATION);
      op.flushData({ login: { token: 'jwt-test', user: mockUser } });
      tick();

      expect(localStorage.getItem('token')).toBe('jwt-test');
    }));

    it('updates user signal on successful login', fakeAsync(() => {
      service.login('admin@taskflow.dev', 'admin123').subscribe();
      const op = controller.expectOne(LOGIN_MUTATION);
      op.flushData({ login: { token: 'jwt-test', user: mockUser } });
      tick();

      expect(service.user()).toEqual(mockUser);
      expect(service.isAuthenticated()).toBeTrue();
    }));

    it('emits auth payload from observable', fakeAsync(() => {
      let result: any;
      service.login('admin@taskflow.dev', 'admin123').subscribe((r) => (result = r));
      const op = controller.expectOne(LOGIN_MUTATION);
      op.flushData({ login: { token: 'jwt-test', user: mockUser } });
      tick();

      expect(result.token).toBe('jwt-test');
      expect(result.user.email).toBe('admin@taskflow.dev');
    }));

    it('sends correct variables to LOGIN_MUTATION', fakeAsync(() => {
      service.login('bob@taskflow.dev', 'member123').subscribe();
      const op = controller.expectOne(LOGIN_MUTATION);

      expect(op.operation.variables).toEqual({
        input: { email: 'bob@taskflow.dev', password: 'member123' },
      });

      op.flushData({ login: { token: 'tok', user: mockUser } });
      tick();
    }));

    it('does not store token when mutation errors', fakeAsync(() => {
      let errorCaught = false;
      service.login('bad@example.com', 'wrong').subscribe({
        error: () => (errorCaught = true),
      });
      const op = controller.expectOne(LOGIN_MUTATION);
      op.networkError(new Error('Invalid credentials'));
      tick();

      expect(localStorage.getItem('token')).toBeNull();
      expect(errorCaught).toBeTrue();
    }));
  });

  // ─── register() ────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('stores token and sets user on success', fakeAsync(() => {
      const newUser = { ...mockUser, id: 'user-new', email: 'new@test.com', role: 'MEMBER' };
      service.register('new@test.com', 'pass123', 'New User').subscribe();
      const op = controller.expectOne(REGISTER_MUTATION);
      op.flushData({ register: { token: 'jwt-reg', user: newUser } });
      tick();

      expect(localStorage.getItem('token')).toBe('jwt-reg');
      expect(service.user()?.email).toBe('new@test.com');
    }));

    it('sends correct variables to REGISTER_MUTATION', fakeAsync(() => {
      service.register('new@test.com', 'pass123', 'New User').subscribe();
      const op = controller.expectOne(REGISTER_MUTATION);

      expect(op.operation.variables).toEqual({
        input: { email: 'new@test.com', password: 'pass123', name: 'New User' },
      });

      op.flushData({ register: { token: 'tok', user: mockUser } });
      tick();
    }));
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('removes token from localStorage', fakeAsync(() => {
      localStorage.setItem('token', 'existing');
      service.logout();
      tick();
      expect(localStorage.getItem('token')).toBeNull();
    }));

    it('sets user signal to null', fakeAsync(() => {
      // Simulate logged-in state
      service.login('admin@taskflow.dev', 'admin123').subscribe();
      const op = controller.expectOne(LOGIN_MUTATION);
      op.flushData({ login: { token: 'tok', user: mockUser } });
      tick();

      expect(service.isAuthenticated()).toBeTrue();
      service.logout();
      tick();

      expect(service.user()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    }));

    it('navigates to /login', fakeAsync(() => {
      service.logout();
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    }));
  });
});
