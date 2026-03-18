import * as fs from 'node:fs';
import * as path from 'node:path';

export interface SubStepRecord {
  testCode: string;
  cacheKey: string;
}

export interface StoredEntry {
  outcome: unknown;
  subSteps: SubStepRecord[];
}

export class OutcomeStore {
  private memory = new Map<string, StoredEntry>();
  private readonly dir: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(process.cwd(), '.output', 'outcomes');
  }

  set(cacheKey: string, outcome: unknown, subSteps: SubStepRecord[]): void {
    const entry: StoredEntry = { outcome, subSteps };
    this.memory.set(cacheKey, entry);
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    const filePath = path.join(this.dir, this.toFileName(cacheKey));
    fs.writeFileSync(filePath, JSON.stringify(entry, null, 2));
  }

  get(cacheKey: string): StoredEntry | undefined {
    if (this.memory.has(cacheKey)) {
      return this.memory.get(cacheKey);
    }
    const filePath = path.join(this.dir, this.toFileName(cacheKey));
    if (fs.existsSync(filePath)) {
      const entry = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as StoredEntry;
      this.memory.set(cacheKey, entry);
      return entry;
    }
    return undefined;
  }

  has(cacheKey: string): boolean {
    if (this.memory.has(cacheKey)) return true;
    const filePath = path.join(this.dir, this.toFileName(cacheKey));
    return fs.existsSync(filePath);
  }

  clear(): void {
    this.memory.clear();
    if (fs.existsSync(this.dir)) {
      fs.rmSync(this.dir, { recursive: true, force: true });
    }
  }

  private toFileName(cacheKey: string): string {
    return encodeURIComponent(cacheKey) + '.json';
  }
}

export const outcomeStore = new OutcomeStore();
