import arrayFactory from './arrayFactory';
import boolean from './boolean';
import date from './date';
import datetime from './datetime';
import duration from './duration';
import email from './email';
import file from './file';
import json from './json';
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
import uuid from './uuid';

const simpleDataTypeComponentFactories: Record<
  SimpleCellDataTypes,
  CellComponentFactory
> = {
  string,
  boolean,
  number,
  money,
  uri,
  email,
  uuid,
  json,
  duration,
  date,
  time,
  datetime,
  file,
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
