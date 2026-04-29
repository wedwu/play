import { jest, describe, beforeEach, it, expect } from "@jest/globals";
import { TestBed } from "@angular/core/testing";
import {
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { Observable, BehaviorSubject } from "rxjs";
import { authGuard, roleGuard } from "./auth.guard";
import { UserService } from "../services/user.service";
import { User, UserRole } from "../models/user.model";

const mockRouter = { navigate: jest.fn() };

const route = {} as ActivatedRouteSnapshot;
const state = {} as RouterStateSnapshot;

const makeUser = (role: UserRole): User =>
  new User("Test", "User", "test@acme.com", role, "engineering");

// ── authGuard ─────────────────────────────────

describe("authGuard", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
    localStorage.clear();
    mockRouter.navigate.mockClear();
  });

  it("returns true when auth_token is present", () => {
    localStorage.setItem("auth_token", "abc123");
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(
      true,
    );
  });

  it("returns false when auth_token is absent", () => {
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(
      false,
    );
  });

  it("navigates to /login when no token", () => {
    TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
  });
});

// ── roleGuard ─────────────────────────────────

describe("roleGuard", () => {
  let selected$: BehaviorSubject<User | null>;

  beforeEach(() => {
    selected$ = new BehaviorSubject<User | null>(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: UserService, useValue: { selected$ } },
      ],
    });
    mockRouter.navigate.mockClear();
  });

  /** Invokes the guard and returns its Observable result. */
  const run = (...roles: UserRole[]): Observable<boolean> =>
    TestBed.runInInjectionContext(() =>
      roleGuard(...roles)(route, state),
    ) as Observable<boolean>;

  it("emits true for a user with the required role", (done) => {
    selected$.next(makeUser("admin"));
    run("admin").subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it("emits false and navigates to /unauthorized for wrong role", (done) => {
    selected$.next(makeUser("viewer"));
    run("admin").subscribe((result) => {
      expect(result).toBe(false);
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/unauthorized"]);
      done();
    });
  });

  it("emits false when no user is selected", (done) => {
    selected$.next(null);
    run("admin").subscribe((result) => {
      expect(result).toBe(false);
      done();
    });
  });

  it("accepts multiple allowed roles", (done) => {
    selected$.next(makeUser("manager"));
    run("admin", "manager").subscribe((result) => {
      expect(result).toBe(true);
      done();
    });
  });
});
