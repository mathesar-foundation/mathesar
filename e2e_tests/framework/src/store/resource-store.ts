import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Tracks the lifecycle state of a resource instance.
 */
export interface ResourceInstance {
  /** The resource type string (from defineResource). */
  resourceType: string;
  /** The instance key (from Resource.key()). */
  instanceKey: string;
  /** The resource state data (matches the resource's Zod schema). */
  state: unknown;
  /** Which task created this instance. */
  createdBy: string;
}

/**
 * Resource lifecycle cache.
 *
 * Tracks which resource instances exist (have been created and not deleted).
 * Used by t.ensure() to skip task execution when a resource already exists.
 *
 * Like OutcomeStore, uses hybrid in-memory + filesystem storage for
 * cross-worker sharing.
 */
export class ResourceStore {
  /** In-memory cache: "resourceType:instanceKey" → ResourceInstance */
  private memory = new Map<string, ResourceInstance>();
  private readonly dir: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(process.cwd(), '.output', 'resources');
  }

  private toStoreKey(resourceType: string, instanceKey: string): string {
    return `${resourceType}:${instanceKey}`;
  }

  private toFileName(storeKey: string): string {
    return encodeURIComponent(storeKey) + '.json';
  }

  /**
   * Record that a resource instance was created.
   */
  set(
    resourceType: string,
    instanceKey: string,
    state: unknown,
    createdBy: string,
  ): void {
    const storeKey = this.toStoreKey(resourceType, instanceKey);
    const entry: ResourceInstance = {
      resourceType,
      instanceKey,
      state,
      createdBy,
    };

    this.memory.set(storeKey, entry);

    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    const filePath = path.join(this.dir, this.toFileName(storeKey));
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  }

  /**
   * Get a resource instance if it exists.
   */
  get(resourceType: string, instanceKey: string): ResourceInstance | undefined {
    const storeKey = this.toStoreKey(resourceType, instanceKey);

    if (this.memory.has(storeKey)) {
      return this.memory.get(storeKey);
    }

    // Check filesystem (cross-worker sharing)
    const filePath = path.join(this.dir, this.toFileName(storeKey));
    if (fs.existsSync(filePath)) {
      try {
        const parsed = JSON.parse(
          fs.readFileSync(filePath, 'utf-8'),
        ) as ResourceInstance;
        this.memory.set(storeKey, parsed);
        return parsed;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Check if a resource instance exists.
   */
  has(resourceType: string, instanceKey: string): boolean {
    return this.get(resourceType, instanceKey) !== undefined;
  }

  /**
   * Remove a resource instance (marks it as deleted).
   */
  delete(resourceType: string, instanceKey: string): void {
    const storeKey = this.toStoreKey(resourceType, instanceKey);
    this.memory.delete(storeKey);

    const filePath = path.join(this.dir, this.toFileName(storeKey));
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
  }

  /**
   * Remove all instances of a given resource type that match a prefix.
   * Used for cascade deletes (e.g., deleting all schemas under a database).
   */
  deleteByPrefix(resourceType: string, keyPrefix: string): void {
    // In-memory cleanup
    for (const [storeKey, instance] of this.memory) {
      if (
        instance.resourceType === resourceType &&
        instance.instanceKey.startsWith(keyPrefix)
      ) {
        this.memory.delete(storeKey);
        const filePath = path.join(this.dir, this.toFileName(storeKey));
        if (fs.existsSync(filePath)) {
          fs.rmSync(filePath);
        }
      }
    }

    // Filesystem cleanup (for entries not in memory)
    if (fs.existsSync(this.dir)) {
      const prefix = encodeURIComponent(
        this.toStoreKey(resourceType, keyPrefix),
      );
      for (const file of fs.readdirSync(this.dir)) {
        if (file.startsWith(prefix)) {
          fs.rmSync(path.join(this.dir, file));
        }
      }
    }
  }

  /**
   * Clear all resource instances.
   */
  clear(): void {
    this.memory.clear();
    if (fs.existsSync(this.dir)) {
      fs.rmSync(this.dir, { recursive: true, force: true });
    }
  }
}

export const resourceStore = new ResourceStore();
