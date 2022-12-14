import string from './string';
import boolean from './boolean';
import number from './number';
import money from './money';
import uri from './uri';
import duration from './duration';
import date from './date';
import time from './time';
import datetime from './datetime';
import arrayFactory from './arrayFactory';
import type { CellDataType, CellComponentFactory } from './typeDefinitions';

const simpleDataTypeComponentFactories = {
  string,
  boolean,
  number,
  money,
  uri,
  duration,
  date,
  time,
  datetime,
};

const compoundDataTypeComponentFactories = {
  array: arrayFactory(simpleDataTypeComponentFactories),
};

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  ...simpleDataTypeComponentFactories,
  ...compoundDataTypeComponentFactories,
};

export default dataTypeComponentFactories;
