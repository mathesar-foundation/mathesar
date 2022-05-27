import string from './string';
import boolean from './boolean';
import number from './number';
import money from './money';
import uri from './uri';
import duration from './duration';
import type { CellDataType, CellComponentFactory } from './typeDefinitions';

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  string,
  boolean,
  number,
  money,
  uri,
  duration,
};

export default dataTypeComponentFactories;
