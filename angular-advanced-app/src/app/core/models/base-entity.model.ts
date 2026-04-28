// ============================================================
// BASE ENTITY CLASS — ES6 Arrow Functions Throughout
// ============================================================

/** Lifecycle states an entity can occupy throughout its existence. */
export type EntityStatus = 'active' | 'inactive' | 'archived' | 'deleted';

/** Audit trail fields required on every persisted entity. */
export interface Auditable {
  /** ISO timestamp of initial creation. */
  createdAt: Date;
  /** ISO timestamp of the most recent mutation. */
  updatedAt: Date;
  /** Identifier of the user or process that created this record. */
  createdBy: string;
}

/**
 * Contract for entities that can be serialised to a plain object and deep-copied.
 * @template T The concrete entity type returned by `clone`.
 */
export interface Serializable<T> {
  serialize(): Record<string, unknown>;
  clone(): T;
}

/**
 * A predicate that validates a field value of type `T`.
 * Returns `true` when the value is considered valid.
 */
export type Validator<T> = (value: T) => boolean;

/**
 * Class decorator that stamps a static `tableName` and `createdAt` onto the target.
 * Uses a mixin pattern so the original constructor signature is fully preserved.
 *
 * @param tableName - The database / storage collection this entity maps to.
 * @example
 * \@Entity('projects')
 * class Project extends BaseEntity { ... }
 */
export const Entity = (tableName: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends new (...args: any[]) => object>(constructor: T): T => {
    const decorated = class extends constructor {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(...args: any[]) { super(...args); }
      static readonly tableName = tableName;
      static readonly createdAt = new Date();
    };
    return decorated as unknown as T;
  };

/**
 * Property decorator that registers a non-null / non-empty validator for the
 * decorated field on the prototype's `__validators__` map.
 *
 * @param target - The class prototype.
 * @param propertyKey - The name of the decorated property.
 */
export const Required = (target: object, propertyKey: string): void => {
  const validators: Map<string, Validator<unknown>[]> =
    (target as Record<string, unknown>)['__validators__'] instanceof Map
      ? (target as Record<string, unknown>)['__validators__'] as Map<string, Validator<unknown>[]>
      : new Map();
  const existing = validators.get(propertyKey) ?? [];
  validators.set(propertyKey, [...existing, v => v !== null && v !== undefined && v !== '']);
  (target as Record<string, unknown>)['__validators__'] = validators;
};

// ─────────────────────────────────────────────
// ABSTRACT BASE CLASS
// ─────────────────────────────────────────────

/**
 * Abstract root for all domain entities.
 *
 * Provides identity generation, audit timestamps, soft-delete lifecycle,
 * and an arbitrary key/value metadata store.
 *
 * Subclasses must implement {@link validate}, {@link getDisplayName},
 * {@link serialize}, and {@link clone}.
 */
export abstract class BaseEntity implements Auditable, Serializable<BaseEntity> {
  /** Unique, time-ordered identifier generated at construction. */
  readonly id: string;
  /** Current lifecycle state of the entity. Defaults to `'active'`. */
  status: EntityStatus = 'active';
  createdAt: Date;
  updatedAt: Date;
  /** Identifier of the actor who created this record. */
  createdBy: string;
  private _metadata: Map<string, unknown> = new Map();

  /** @param createdBy - Actor creating this entity. Defaults to `'system'`. */
  constructor(createdBy = 'system') {
    this.id = BaseEntity.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.createdBy = createdBy;
  }

  /**
   * Generates a collision-resistant, time-prefixed ID string.
   * @returns A string of the form `"<timestamp>-<random>"`.
   */
  static generateId = (): string =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  /** Subclass must return `true` when all required fields are valid. */
  abstract validate(): boolean;
  /** Subclass must return a human-readable label for this entity. */
  abstract getDisplayName(): string;
  /** Subclass must return a plain-object snapshot suitable for persistence. */
  abstract serialize(): Record<string, unknown>;
  /** Subclass must return a deep copy of itself. */
  abstract clone(): BaseEntity;

  /** Updates `updatedAt` to now. Call after any mutation. */
  touch = (): void => {
    this.updatedAt = new Date();
  };

  /** Moves the entity to `'archived'` and records the timestamp. */
  archive = (): void => {
    this.status = 'archived';
    this.touch();
  };

  /** Moves the entity back to `'active'` and records the timestamp. */
  restore = (): void => {
    this.status = 'active';
    this.touch();
  };

  /** Marks the entity as `'deleted'` without removing it from storage. */
  softDelete = (): void => {
    this.status = 'deleted';
    this.touch();
  };

  /** Returns `true` when `status === 'active'`. */
  isActive = (): boolean => this.status === 'active';

  /**
   * Stores an arbitrary value under `key` in the entity's private metadata map.
   * @param key - Lookup key.
   * @param value - Any value to associate with the key.
   */
  setMeta = <T>(key: string, value: T): void => {
    this._metadata.set(key, value);
  };

  /**
   * Retrieves a typed value from the metadata map.
   * Returns `undefined` if the key does not exist.
   */
  getMeta = <T>(key: string): T | undefined =>
    this._metadata.get(key) as T;

  /** Returns the entire metadata map as a plain object. */
  getAllMeta = (): Record<string, unknown> =>
    Object.fromEntries(this._metadata);

  /** Serialises the entity including its metadata, suitable for JSON output. */
  toJSON = (): Record<string, unknown> => ({
    ...this.serialize(),
    _metadata: this.getAllMeta(),
  });

  /**
   * Returns the shared audit fields (id, status, timestamps, createdBy).
   * Spread this inside subclass `serialize` implementations.
   */
  protected baseSerialize = (): Record<string, unknown> => ({
    id: this.id,
    status: this.status,
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
    createdBy: this.createdBy,
  });
}
