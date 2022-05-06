import string from './string';
import boolean from './boolean';
import number from './number';
import money from './money';
import duration from './duration';
import type { CellDataType, CellComponentFactory } from './typeDefinitions';

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  string,
  boolean,
  number,
  money,
  duration,
};

export default dataTypeComponentFactories;
