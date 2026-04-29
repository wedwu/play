import { describe, beforeEach, it, expect } from "@jest/globals";
import { User, AdminUser } from "./user.model";

describe("User", () => {
  let user: User;

  beforeEach(() => {
    user = new User(
      "Alice",
      "Zhang",
      "alice@acme.com",
      "developer",
      "engineering",
    );
  });

  // ── Constructor ───────────────────────────────

  describe("constructor", () => {
    it("sets first/last name and email", () => {
      expect(user.firstName).toBe("Alice");
      expect(user.lastName).toBe("Zhang");
      expect(user.email).toBe("alice@acme.com");
    });
    it("sets role and department", () => {
      expect(user.role).toBe("developer");
      expect(user.department).toBe("engineering");
    });
    it('defaults role to "developer"', () =>
      expect(new User("A", "B", "a@b.com").role).toBe("developer"));
    it('defaults department to "engineering"', () =>
      expect(new User("A", "B", "a@b.com").department).toBe("engineering"));
  });

  // ── Getters ───────────────────────────────────

  describe("fullName", () => {
    it("concatenates first and last name", () =>
      expect(user.fullName).toBe("Alice Zhang"));
  });

  describe("initials", () => {
    it("returns two uppercase letters", () => expect(user.initials).toBe("AZ"));
  });

  describe("permissions", () => {
    it("developer can create and read but not delete", () => {
      expect(user.permissions.canCreate).toBe(true);
      expect(user.permissions.canRead).toBe(true);
      expect(user.permissions.canDelete).toBe(false);
    });

    it("admin has all permissions", () => {
      const admin = new User("A", "B", "a@b.com", "admin");
      expect(admin.permissions.canDelete).toBe(true);
      expect(admin.permissions.canManageUsers).toBe(true);
    });

    it("viewer cannot create", () => {
      const viewer = new User("A", "B", "a@b.com", "viewer");
      expect(viewer.permissions.canCreate).toBe(false);
    });
  });

  // ── Validation ────────────────────────────────

  describe("validate", () => {
    it("passes for a valid user", () => expect(user.validate()).toBe(true));
    it("fails for empty first name", () => {
      user.firstName = "";
      expect(user.validate()).toBe(false);
    });
    it("fails for invalid email", () => {
      user.email = "not-an-email";
      expect(user.validate()).toBe(false);
    });
  });

  // ── can() ─────────────────────────────────────

  describe("can", () => {
    it("returns true for a granted permission", () =>
      expect(user.can("canCreate")).toBe(true));
    it("returns false for a denied permission", () =>
      expect(user.can("canDelete")).toBe(false));
  });

  // ── recordLogin ───────────────────────────────

  describe("recordLogin", () => {
    it("increments login count", () => {
      user.recordLogin();
      expect(user.loginCount).toBe(1);
    });
    it("sets lastLoginAt to ~now", () => {
      user.recordLogin();
      expect(Date.now() - user.lastLoginAt!.getTime()).toBeLessThan(500);
    });
    it("accumulates multiple calls", () => {
      user.recordLogin();
      user.recordLogin();
      expect(user.loginCount).toBe(2);
    });
  });

  // ── Skills ────────────────────────────────────

  describe("addSkill", () => {
    it("adds a new skill", () => {
      user.addSkill("TypeScript");
      expect(user.skills).toContain("TypeScript");
    });
    it("ignores duplicate skills", () => {
      user.addSkill("TS");
      user.addSkill("TS");
      expect(user.skills).toHaveLength(1);
    });
  });

  describe("removeSkill", () => {
    it("removes an existing skill", () => {
      user.addSkill("Go");
      user.removeSkill("Go");
      expect(user.skills).not.toContain("Go");
    });
    it("no-ops for unknown skill", () => {
      expect(() => user.removeSkill("X")).not.toThrow();
    });
  });

  // ── promote ───────────────────────────────────

  describe("promote", () => {
    it("changes the role", () => {
      user.promote("manager");
      expect(user.role).toBe("manager");
    });
    it("touches the timestamp", () => {
      const before = user.updatedAt.getTime();
      user.promote("admin");
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before);
    });
  });

  // ── clone / serialize ─────────────────────────

  describe("clone", () => {
    it("creates an independent copy", () => {
      user.addSkill("Rust");
      const copy = user.clone();
      copy.skills.push("Extra");
      expect(user.skills).toHaveLength(1);
    });

    it("preserves role and department", () => {
      const copy = user.clone();
      expect(copy.role).toBe("developer");
      expect(copy.department).toBe("engineering");
    });
  });

  describe("serialize", () => {
    it("includes all user fields", () => {
      const s = user.serialize();
      expect(s["email"]).toBe("alice@acme.com");
      expect(s["role"]).toBe("developer");
    });
  });
});

// ── AdminUser ─────────────────────────────────

describe("AdminUser", () => {
  let admin: AdminUser;

  beforeEach(() => {
    admin = new AdminUser("Bob", "Root", "bob@acme.com", true);
  });

  it('has role "admin"', () => expect(admin.role).toBe("admin"));
  it("sets superAdmin flag", () => expect(admin.superAdmin).toBe(true));

  describe("validate", () => {
    it("passes for a valid admin", () => expect(admin.validate()).toBe(true));
    it("fails if role is not admin", () => {
      admin.promote("developer");
      expect(admin.validate()).toBe(false);
    });
  });

  describe("getDisplayName", () => {
    it("prefixes name with [ADMIN]", () =>
      expect(admin.getDisplayName()).toBe("[ADMIN] Bob Root"));
  });

  describe("log", () => {
    it("appends a timestamped entry", () => {
      admin.log("Created user");
      expect(admin.auditLog).toHaveLength(1);
      expect(admin.auditLog[0]).toMatch(/Created user/);
    });
  });

  describe("assignDepartment", () => {
    it("adds a department", () => {
      admin.assignDepartment("engineering");
      expect(admin.managedDepartments).toContain("engineering");
    });
    it("ignores duplicates", () => {
      admin.assignDepartment("ops");
      admin.assignDepartment("ops");
      expect(admin.managedDepartments).toHaveLength(1);
    });
    it("logs the assignment action", () => {
      admin.assignDepartment("design");
      expect(admin.auditLog.some((e) => e.includes("design"))).toBe(true);
    });
  });

  describe("serialize", () => {
    it("includes superAdmin and managedDepartments", () => {
      const s = admin.serialize();
      expect(s["superAdmin"]).toBe(true);
      expect(Array.isArray(s["managedDepartments"])).toBe(true);
    });
  });
});
