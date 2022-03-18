import type { FormValues } from '@mathesar-component-library/types';
import type { DbType } from '@mathesar/App';
import type { AbstractTypeConfiguration } from '../types';

const DB_TYPES = {
  DECIMAL: 'DECIMAL',
  NUMERIC: 'NUMERIC',
  INTEGER: 'INTEGER',
  SMALLINT: 'SMALLINT',
  BIGINT: 'BIGINT',
  REAL: 'REAL',
  DOUBLE_PRECISION: 'DOUBLE PRECISION',
};

const numberType: AbstractTypeConfiguration = {
  icon: '#',
  input: {
    type: 'integer',
  },
  defaultDbType: DB_TYPES.NUMERIC,
  typeSwitchOptions: {
    database: {
      allowDefault: true,
      configuration: {
        form: {
          variables: {
            numberType: {
              type: 'string',
              enum: ['Integer', 'Decimal', 'Float'],
              conditionalDefault: {
                [DB_TYPES.INTEGER]: 'Integer',
                [DB_TYPES.SMALLINT]: 'Integer',
                [DB_TYPES.BIGINT]: 'Integer',
                [DB_TYPES.DECIMAL]: 'Decimal',
                [DB_TYPES.NUMERIC]: 'Decimal',
                [DB_TYPES.REAL]: 'Float',
                [DB_TYPES.DOUBLE_PRECISION]: 'Float',
              },
            },
            integerDataSize: {
              type: 'string',
              enum: ['default', 'bigInt', 'smallInt'],
              conditionalDefault: {
                [DB_TYPES.INTEGER]: 'default',
                [DB_TYPES.SMALLINT]: 'smallInt',
                [DB_TYPES.BIGINT]: 'bigInt',
              },
            },
            precision: {
              type: 'integer',
              default: 2,
            },
            scale: {
              type: 'integer',
              default: 2,
            },
            floatingPointType: {
              type: 'string',
              enum: ['real', 'doublePrecision'],
              conditionalDefault: {
                [DB_TYPES.REAL]: 'real',
                [DB_TYPES.DOUBLE_PRECISION]: 'doublePrecision',
              },
            },
          },
          layout: {
            orientation: 'vertical',
            elements: [
              {
                type: 'input',
                variable: 'numberType',
                label: 'Number Type',
              },
              {
                type: 'switch',
                variable: 'numberType',
                cases: {
                  Integer: [
                    {
                      type: 'input',
                      variable: 'integerDataSize',
                      label: 'Integer Data Size',
                      interfaceType: 'select',
                      options: {
                        default: { label: 'Default (4 bytes)' },
                        bigInt: { label: 'Big Integer (8 bytes)' },
                        smallInt: { label: 'Small Integer (2 bytes)' },
                      },
                    },
                  ],
                  Decimal: [
                    {
                      type: 'layout',
                      orientation: 'horizontal',
                      elements: [
                        {
                          type: 'input',
                          variable: 'precision',
                          label: 'Decimal Places',
                        },
                        {
                          type: 'input',
                          variable: 'scale',
                          label: 'Max Digits',
                        },
                      ],
                    },
                  ],
                  Float: [
                    {
                      type: 'input',
                      variable: 'floatingPointType',
                      label: 'Floating Point Type',
                      interfaceType: 'select',
                      options: {
                        real: { label: 'Real (6 digits)' },
                        doublePrecision: {
                          label: 'Double Precision (15 digits)',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        determineDbType: (formValues: FormValues, columnType: DbType) => {
          switch (formValues.numberType) {
            case 'Integer':
              switch (formValues.integerDataSize) {
                case 'smallInt':
                  return DB_TYPES.SMALLINT;
                case 'bigInt':
                  return DB_TYPES.BIGINT;
                default:
                  return DB_TYPES.INTEGER;
              }
            case 'Float':
              switch (formValues.floatingPointType) {
                case 'real':
                  return DB_TYPES.REAL;
                case 'doublePrecision':
                default:
                  return DB_TYPES.DOUBLE_PRECISION;
              }
            case 'Decimal':
            default:
              return columnType === DB_TYPES.DECIMAL
                ? DB_TYPES.DECIMAL
                : DB_TYPES.NUMERIC;
          }
        },
        getSavableTypeOptions: (columnType: DbType) => {
          const savableTypeOptions = [];
          if (
            columnType === DB_TYPES.DECIMAL ||
            columnType === DB_TYPES.NUMERIC
          ) {
            savableTypeOptions.push('precision', 'scale');
          }
          return savableTypeOptions;
        },
      },
    },
  },
};

export default numberType;
