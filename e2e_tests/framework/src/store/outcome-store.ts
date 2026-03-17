import * as fs from 'node:fs';
import * as path from 'node:path';

export class OutcomeStore {
  private memory = new Map<string, unknown>();
  private readonly dir: string;

  constructor(dir?: string) {
    this.dir = dir ?? path.join(process.cwd(), '.outcome-data');
  }

  set(outcomeCode: string, data: unknown): void {
    this.memory.set(outcomeCode, data);
    if (!fs.existsSync(this.dir)) {
      fs.mkdirSync(this.dir, { recursive: true });
    }
    const filePath = path.join(this.dir, this.toFileName(outcomeCode));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  get(outcomeCode: string): unknown | undefined {
    if (this.memory.has(outcomeCode)) {
      return this.memory.get(outcomeCode);
    }
    const filePath = path.join(this.dir, this.toFileName(outcomeCode));
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.memory.set(outcomeCode, data);
      return data;
    }
    return undefined;
  }

  has(outcomeCode: string): boolean {
    if (this.memory.has(outcomeCode)) return true;
    const filePath = path.join(this.dir, this.toFileName(outcomeCode));
    return fs.existsSync(filePath);
  }

  clear(): void {
    this.memory.clear();
    if (fs.existsSync(this.dir)) {
      fs.rmSync(this.dir, { recursive: true, force: true });
    }
  }

  private toFileName(outcomeCode: string): string {
    return encodeURIComponent(outcomeCode) + '.json';
  }
}

export const outcomeStore = new OutcomeStore();
