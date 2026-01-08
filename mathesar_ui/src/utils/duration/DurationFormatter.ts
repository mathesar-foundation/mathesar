import type { Duration, DurationUnitType } from 'dayjs/plugin/duration';

import type { DurationUnit } from '@mathesar/api/rpc/_common/columnDisplayOptions';
import { dayjs } from '@mathesar-component-library';
import type {
  InputFormatter,
  ParseResult,
} from '@mathesar-component-library/types';

import type DurationSpecification from './DurationSpecification';

const FLOAT_REGEX = /^((\.?\d+)|(\d+(\.\d+)?))$/;

function parseTextBasedDuration(userInput: string): string | null {
  const cleanedInput = userInput.trim().toLowerCase();
  if (cleanedInput === '') {
    return null;
  }

  const durationPattern = /(\d+(?:\.\d+)?)\s*(ms|[dhms])/g;
  const matches = Array.from(cleanedInput.matchAll(durationPattern));

  if (matches.length === 0) {
    return null;
  }

  const matchedText = matches.map((m) => m[0]).join('');
  const inputWithoutSpaces = cleanedInput.replace(/\s+/g, '');
  if (matchedText.replace(/\s+/g, '') !== inputWithoutSpaces) {
    return null;
  }

  const unitWithValue: Partial<Record<DurationUnit, number>> = {};

  for (const match of matches) {
    const value = parseFloat(match[1]);
    const unit = match[2] as DurationUnit;

    if (Number.isNaN(value)) {
      return null;
    }

    unitWithValue[unit] = (unitWithValue[unit] ?? 0) + value;
  }

  return dayjs
    .duration({
      years: 0,
      months: 0,
      days: unitWithValue.d ?? 0,
      hours: unitWithValue.h ?? 0,
      minutes: unitWithValue.m ?? 0,
      seconds: unitWithValue.s ?? 0,
      milliseconds: unitWithValue.ms ?? 0,
    })
    .toISOString();
}

function parseRawDurationStringToISOString(
  specification: DurationSpecification,
  userInput: string,
): string | null {
  let unitsInRange = specification.getUnitsInRange();
  if (unitsInRange[unitsInRange.length - 1] === 'ms') {
    unitsInRange = unitsInRange.slice(0, unitsInRange.length - 1);
  }

  let cleanedInput = userInput.trim();
  if (cleanedInput === '') {
    return null;
  }

  const firstEntry = cleanedInput[0];
  if (firstEntry === ':') {
    cleanedInput = `0${cleanedInput}`;
  }

  const lastEntry = cleanedInput[cleanedInput.length - 1];
  if (lastEntry === ':' || lastEntry === '.') {
    cleanedInput = `${cleanedInput}0`;
  }

  const unitValues = cleanedInput.split(':');
  if (unitValues.length > unitsInRange.length) {
    throw new Error('Duration exceeds specified unit range');
  }

  const terms = cleanedInput
    .split(':')
    .map((entry) => {
      let valueString = entry;
      if (
        valueString.length > 1 &&
        valueString[valueString.length - 1] === '.'
      ) {
        valueString = `${valueString}0`;
      }
      const value = parseFloat(valueString);
      // We are additionally testing with a regex because
      // parseFloat("12.12string") will return 12.12, which is valid
      // Since we have to direcly pass the input string as intermediateDisplay,
      // we will have to throw a parsing error here for such cases.
      if (Number.isNaN(value) || !FLOAT_REGEX.test(valueString)) {
        throw new Error('Unable to parse duration');
      }
      return value;
    })
    .slice(-unitsInRange.length);

  const slicedUnits = unitsInRange.slice(-terms.length);

  const unitWithValue: Partial<Record<DurationUnit, number>> = {};
  slicedUnits.forEach((unit, index) => {
    unitWithValue[unit] = terms[index] ?? 0;
  });

  return dayjs
    .duration({
      years: 0,
      months: 0,
      days: unitWithValue.d ?? 0,
      hours: unitWithValue.h ?? 0,
      minutes: unitWithValue.m ?? 0,
      seconds: unitWithValue.s ?? 0,
    })
    .toISOString();
}

const unitConfig: Record<
  DurationUnit,
  {
    convert: (duration: Duration) => number;
    unitName: DurationUnitType;
    decimalCorrection?: number;
  }
> = {
  ms: {
    convert: (duration: Duration) => duration.asMilliseconds(),
    unitName: 'milliseconds',
    decimalCorrection: 0,
  },
  s: {
    convert: (duration: Duration) => duration.asSeconds(),
    unitName: 'seconds',
  },
  m: {
    convert: (duration: Duration) => duration.asMinutes(),
    unitName: 'minutes',
  },
  h: {
    convert: (duration: Duration) => duration.asHours(),
    unitName: 'hours',
  },
  d: {
    convert: (duration: Duration) => duration.asDays(),
    unitName: 'days',
  },
};

// DISCUSS: What's best for Mathesar?
// Duration accuracy or user friendliness?
// Should 1H80M80S be displayed as is, or transform to 2H21M20S?
function shiftAndFormatISODurationString(
  canonicalValue: string,
  specification: DurationSpecification,
): string {
  const duration = dayjs.duration(canonicalValue);

  if (!duration || Number.isNaN(duration.asMilliseconds())) {
    return '00:00';
  }

  const units = specification.getUnitsInRange().reverse();

  if (units.length === 0) {
    // This should never happen;
    throw new Error('Invalid duration specification');
  }

  let currentUnitConfig = unitConfig[units[0]];
  let currentUnitValue = currentUnitConfig.convert(duration);

  if (Number.isNaN(currentUnitValue)) {
    return '00:00';
  }

  const unitsWithValues: Partial<Record<DurationUnit, number>> = {};

  for (const unit of units) {
    const higherUnit = specification.getHigherUnit(unit);
    let higherUnitValue = 0;
    if (higherUnit) {
      const higherUnitConfig = unitConfig[higherUnit];
      higherUnitValue = Math.floor(
        higherUnitConfig.convert(
          dayjs.duration(currentUnitValue, currentUnitConfig.unitName),
        ),
      );
      currentUnitValue -= currentUnitConfig.convert(
        dayjs.duration(higherUnitValue, higherUnitConfig.unitName),
      );
    }
    const finalValue = parseFloat(
      currentUnitValue.toFixed(currentUnitConfig.decimalCorrection ?? 3),
    );
    unitsWithValues[unit] = finalValue;
    if (higherUnit) {
      currentUnitValue = higherUnitValue;
      currentUnitConfig = unitConfig[higherUnit];
    }
  }

  // Manually format the duration string based on the specification
  const unitsInRange = specification.getUnitsInRange();

  // Build the formatted string
  const parts: string[] = [];
  for (const unit of unitsInRange) {
    const value = unitsWithValues[unit] ?? 0;

    if (unit === 'd') {
      parts.push(Math.floor(value).toString());
    } else if (unit === 'ms') {
      parts.push(Math.floor(value).toString().padStart(3, '0'));
    } else {
      parts.push(Math.floor(value).toString().padStart(2, '0'));
    }
  }

  // Join with : or . depending on milliseconds
  if (unitsInRange[unitsInRange.length - 1] === 'ms' && parts.length > 1) {
    const msValue = parts.pop();
    return `${parts.join('.')}.${msValue ?? '000'}`;
  }

  return parts.join(':');
}

export default class DurationFormatter implements InputFormatter<string> {
  specification: DurationSpecification;

  constructor(specification: DurationSpecification) {
    this.specification = specification;
  }

  parse(userInput: string): ParseResult<string> {
    const textBasedValue = parseTextBasedDuration(userInput);

    if (textBasedValue !== null) {
      return {
        value: textBasedValue,
        intermediateDisplay: userInput,
      };
    }

    const value = parseRawDurationStringToISOString(
      this.specification,
      userInput,
    );
    return {
      value,
      intermediateDisplay: userInput,
    };
  }

  format(canonicalValue: string): string {
    const timeFormatMatch = canonicalValue.match(
      /^(\d+):(\d+):(\d+(?:\.\d+)?)$/,
    );
    let isoString = canonicalValue;

    if (timeFormatMatch) {
      const hours = parseInt(timeFormatMatch[1], 10);
      const minutes = parseInt(timeFormatMatch[2], 10);
      const seconds = parseFloat(timeFormatMatch[3]);

      isoString = 'PT';
      if (hours > 0) isoString += `${hours}H`;
      if (minutes > 0) isoString += `${minutes}M`;
      if (seconds > 0) isoString += `${seconds}S`;
      if (isoString === 'PT') isoString = 'PT0S';
    }

    return shiftAndFormatISODurationString(isoString, this.specification);
  }
}
