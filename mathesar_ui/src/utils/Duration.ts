export type DurationUnit = 'd' | 'h' | 'm' | 's' | 'ms';

export interface DurationConfig {
  max: DurationUnit;
  min: DurationUnit;
}

const allUnits: DurationUnit[] = ['d', 'h', 'm', 's', 'ms'];
const defaults: DurationConfig = {
  max: 'm',
  min: 's',
};

export default class Duration {
  private min: DurationUnit;

  private max: DurationUnit;

  constructor(config?: Partial<DurationConfig>) {
    this.min = config?.min ?? defaults.min;
    this.max = config?.max ?? defaults.max;
  }

  getFormattingString(): string {
    const range = allUnits.slice(
      allUnits.indexOf(this.max),
      allUnits.indexOf(this.min) + 1,
    );
    if (range[range.length - 1] === 'ms') {
      return `${range.slice(0, range.length - 1).join(':')}.${
        range[range.length - 1]
      }`;
    }
    return range.join(':');
  }

  static getAllUnits(): DurationUnit[] {
    return allUnits;
  }

  static getDefaults(): DurationConfig {
    return defaults;
  }
}
