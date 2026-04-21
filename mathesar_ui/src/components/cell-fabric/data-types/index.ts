import arrayFactory from './arrayFactory';
import boolean from './boolean';
import date from './date';
import datetime from './datetime';
import duration from './duration';
import enumFactory from './enum';
import file from './file';
import money from './money';
import number from './number';
import string from './string';
import time from './time';
import type {
  CellComponentFactory,
  CellDataType,
  CompoundCellDataTypes,
  SimpleCellDataTypes,
} from './typeDefinitions';
import uri from './uri';
import user from './user';

const simpleDataTypeComponentFactories: Record<
  SimpleCellDataTypes,
  CellComponentFactory
> = {
  string,
  boolean,
  number,
  money,
  uri,
  duration,
  date,
  time,
  datetime,
  file,
  user,
  enum: enumFactory,
};

const compoundDataTypeComponentFactories: Record<
  CompoundCellDataTypes,
  CellComponentFactory
> = {
  array: arrayFactory(simpleDataTypeComponentFactories),
};

const dataTypeComponentFactories: Record<CellDataType, CellComponentFactory> = {
  ...simpleDataTypeComponentFactories,
  ...compoundDataTypeComponentFactories,
};

export default dataTypeComponentFactories;
