import string from './string';
import boolean from './boolean';
import number from './number';
import uri from './uri';
import duration from './duration';
import date from './date';
import type { CellDataType, CellComponentFactory } from './typeDefinitions';

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  string,
  boolean,
  number,
  uri,
  duration,
  date,
};

export default dataTypeComponentFactories;
