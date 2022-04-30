import string from './string';
import boolean from './boolean';
import number from './number';
import money from './money';
import type { CellDataType, CellComponentFactory } from './typeDefinitions';

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  string,
  boolean,
  number,
  money,
};

export default dataTypeComponentFactories;
