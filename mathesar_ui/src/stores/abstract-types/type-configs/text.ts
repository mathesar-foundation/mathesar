import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types.d';
import type { AbstractTypeConfiguration } from '../types';

const DB_TYPES = {
  VARCHAR: 'VARCHAR',
  CHAR: 'CHAR',
  TEXT: 'TEXT',
};

const textType: AbstractTypeConfiguration = {
  icon: 'T',
  defaultDbType: DB_TYPES.VARCHAR,
  typeSwitchOptions: {
    database: {
      allowDefault: true,
      configuration: {
        form: {
          variables: {
            restrictFieldSize: {
              type: 'boolean',
              conditionalDefault: {
                [DB_TYPES.CHAR]: true,
                [DB_TYPES.VARCHAR]: true,
                [DB_TYPES.TEXT]: false,
              },
            },
            length: {
              type: 'integer',
              default: 255,
              validation: {
                checks: ['isEmpty'],
              },
            },
          },
          layout: {
            orientation: 'vertical',
            elements: [
              {
                type: 'input',
                variable: 'restrictFieldSize',
                label: 'Restrict Field Size',
              },
              {
                type: 'if',
                variable: 'restrictFieldSize',
                condition: 'eq',
                value: true,
                elements: [
                  {
                    type: 'input',
                    variable: 'length',
                    label: 'Field Size Limit',
                  },
                ],
              },
            ],
          },
        },
        determineDbType: (
          formValues: FormValues,
          columnType: Column['type'],
        ) => {
          if (formValues.restrictFieldSize) {
            if (typeof formValues.length === 'string') {
              const formValueLength = parseInt(formValues.length, 10);
              if (formValueLength > 255) {
                return DB_TYPES.VARCHAR;
              }
            }
            return columnType === DB_TYPES.CHAR
              ? DB_TYPES.CHAR
              : DB_TYPES.VARCHAR;
          }
          return DB_TYPES.TEXT;
        },
        getSavableTypeOptions: (columnType: Column['type']): string[] => {
          const savableTypeOptions = [];
          if (columnType === DB_TYPES.CHAR || columnType === DB_TYPES.VARCHAR) {
            savableTypeOptions.push('length');
          }
          return savableTypeOptions;
        },
      },
    },
  },
  input: {
    type: 'string',
    config: {
      multiLine: true,
    },
    conditionalConfig: {
      [DB_TYPES.CHAR]: {
        multiLine: false,
      },
    },
  },
};

export default textType;
