import { BaseEntity } from "./base-entity.model";
import { jest, describe, beforeEach, it, expect } from "@jest/globals";

// Minimal concrete subclass for testing the abstract base
class TestEntity extends BaseEntity {
  validate = (): boolean => true;
  getDisplayName = (): string => "test";
  serialize = (): Record<string, unknown> => this.baseSerialize();
  clone = (): TestEntity => new TestEntity(this.createdBy);
}

describe("BaseEntity", () => {
  let entity: TestEntity;

  beforeEach(() => {
    entity = new TestEntity("tester");
  });

  // ── Identity ─────────────────────────────────

  describe("generateId", () => {
    it("returns a non-empty string", () => {
      expect(typeof BaseEntity.generateId()).toBe("string");
      expect(BaseEntity.generateId().length).toBeGreaterThan(0);
    });

    it("generates unique values", () => {
      const ids = new Set(
        Array.from({ length: 100 }, () => BaseEntity.generateId()),
      );
      expect(ids.size).toBe(100);
    });
  });

  describe("constructor", () => {
    it("assigns a non-empty id", () =>
      expect(entity.id.length).toBeGreaterThan(0));
    it("sets createdBy", () => expect(entity.createdBy).toBe("tester"));
    it('defaults createdBy to "system"', () =>
      expect(new TestEntity().createdBy).toBe("system"));
    it("sets createdAt to approximately now", () => {
      expect(Date.now() - entity.createdAt.getTime()).toBeLessThan(500);
    });
    it('initialises status to "active"', () =>
      expect(entity.status).toBe("active"));
  });

  // ── Lifecycle ─────────────────────────────────

  describe("touch", () => {
    it("updates updatedAt", async () => {
      const before = entity.updatedAt.getTime();
      await new Promise((r) => setTimeout(r, 5));
      entity.touch();
      expect(entity.updatedAt.getTime()).toBeGreaterThan(before);
    });
  });

  describe("archive", () => {
    it('sets status to "archived"', () => {
      entity.archive();
      expect(entity.status).toBe("archived");
    });
    it("calls touch", () => {
      const spy = jest.spyOn(entity, "touch");
      entity.archive();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe("restore", () => {
    it('returns status to "active"', () => {
      entity.archive();
      entity.restore();
      expect(entity.status).toBe("active");
    });
  });

  describe("softDelete", () => {
    it('sets status to "deleted"', () => {
      entity.softDelete();
      expect(entity.status).toBe("deleted");
    });
  });

  describe("isActive", () => {
    it("returns true when active", () => expect(entity.isActive()).toBe(true));
    it("returns false when archived", () => {
      entity.archive();
      expect(entity.isActive()).toBe(false);
    });
  });

  // ── Metadata ──────────────────────────────────

  describe("setMeta / getMeta", () => {
    it("stores and retrieves a typed value", () => {
      entity.setMeta("count", 42);
      expect(entity.getMeta<number>("count")).toBe(42);
    });

    it("returns undefined for missing key", () => {
      expect(entity.getMeta("missing")).toBeUndefined();
    });
  });

  describe("getAllMeta", () => {
    it("returns a plain object of all entries", () => {
      entity.setMeta("a", 1);
      entity.setMeta("b", "x");
      expect(entity.getAllMeta()).toEqual({ a: 1, b: "x" });
    });
  });

  // ── Serialisation ─────────────────────────────

  describe("baseSerialize", () => {
    it("includes id, status, createdBy, and ISO timestamps", () => {
      const s = entity.serialize();
      expect(s["id"]).toBe(entity.id);
      expect(s["status"]).toBe("active");
      expect(s["createdBy"]).toBe("tester");
      expect(typeof s["createdAt"]).toBe("string");
      expect(typeof s["updatedAt"]).toBe("string");
    });
  });

  describe("toJSON", () => {
    it("merges serialize output with metadata", () => {
      entity.setMeta("key", "val");
      const json = entity.toJSON();
      expect((json["_metadata"] as Record<string, unknown>)["key"]).toBe("val");
    });
  });
});
