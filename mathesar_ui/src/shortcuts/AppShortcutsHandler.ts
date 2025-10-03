import type {
  ShortcutsMode,
  ShortcutsHandler,
} from '@mathesar/stores/shortcuts';

export class AppShortcutsHandler implements ShortcutsHandler {
  private readonly modePriority: Array<string>;
  private readonly modeMap: Map<string, ShortcutsMode | undefined>;
  private readonly modeEnabled: Map<string, boolean>;

  constructor(modePriority: Array<string>) {
    this.modePriority = modePriority;
    this.modeMap = new Map<string, ShortcutsMode | undefined>();
    this.modeEnabled = new Map<string, boolean>();
  }

  registerMode(name: string, mode: ShortcutsMode | undefined): void {
    this.modeMap.set(name, mode);
  }

  unregisterMode(name: string): void {
    this.modeMap.delete(name);
  }

  enableMode(name: string): void {
    this.modeEnabled.set(name, true);
  }

  disableMode(name: string): void {
    this.modeEnabled.set(name, false);
  }

  async handleKeyDown(event: KeyboardEvent) {
    for (const name of this.modePriority) {
      if (this.modeEnabled.get(name)) {
        await this.modeMap.get(name)?.handleKeyDown(event);
        break;
      }
    }
  }
}
