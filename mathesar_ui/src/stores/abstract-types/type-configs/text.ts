import type { FormValues } from '@mathesar-component-library/types';
import type { Column } from '@mathesar/stores/table-data/types.d';
import type { AbstractTypeConfiguration } from '../types.d';

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
              defaults: {
                [DB_TYPES.CHAR]: true,
                [DB_TYPES.VARCHAR]: true,
                [DB_TYPES.TEXT]: false,
              },
            },
            length: {
              type: 'integer',
              isSaved: true,
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
                    errors: {
                      validation: {
                        isEmpty:
                          'Please specify the field size limit inorder to impose restriction',
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
        determineDbType: (
          formValues: FormValues,
          columnType: Column['type'],
          columnTypeOptions: Column['type_options'],
        ) => {
          if (formValues.restrictFieldSize) {
            if (
              typeof formValues.length === 'number' &&
              formValues.length > 255
            ) {
              return DB_TYPES.VARCHAR;
            }
            return columnType === DB_TYPES.CHAR
              ? DB_TYPES.CHAR
              : DB_TYPES.VARCHAR;
          }
          // If previous column type was VARCHAR(#n), then change it to TEXT
          if (typeof columnTypeOptions?.length === 'number') {
            return DB_TYPES.TEXT;
          }
          return columnType === DB_TYPES.VARCHAR
            ? DB_TYPES.VARCHAR
            : DB_TYPES.TEXT;
        },
      },
    },
  },
  input: {
    type: 'string',
  },
};

export default textType;
