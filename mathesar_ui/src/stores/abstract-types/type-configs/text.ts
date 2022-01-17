import type { AbstractTypeConfiguration } from '../types.d';

const textType: AbstractTypeConfiguration = {
  icon: 'T',
  input: {
    type: 'string',
    validationRules: {
      CHAR: {
        method: 'length',
        op: 'lte',
        value: 255,
      },
      VARCHAR: {
        method: 'length',
        op: 'lte',
        value: 32672,
      },
    },
  },
  defaultDbType: 'VARCHAR',
  typeSwitchOptions: {
    database: {
      allowDefault: true,
      configuration: {
        form: {
          variables: {
            restrictFieldSize: {
              type: 'boolean',
              default: false,
            },
            fieldSizeLimit: {
              type: 'integer',
              default: 255,
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
                elements: [{
                  type: 'input',
                  variable: 'fieldSizeLimit',
                  label: 'Field Size Limit',
                }],
              },
            ],
          },
        },
        determinationRules: [
          {
            resolve: 'CHAR',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'restrictFieldSize',
                  op: 'eq',
                  value: true,
                },
                {
                  id: 'fieldSizeLimit',
                  op: 'lte',
                  value: 255,
                },
              ],
            },
          },
          {
            resolve: 'VARCHAR',
            rule: {
              combination: 'and',
              terms: [
                {
                  id: 'restrictFieldSize',
                  op: 'eq',
                  value: true,
                },
                {
                  id: 'fieldSizeLimit',
                  op: 'lte',
                  value: 32672,
                },
              ],
            },
          },
          {
            resolve: 'TEXT',
            rule: {
              combination: 'or',
              terms: [
                {
                  id: 'restrictFieldSize',
                  op: 'eq',
                  value: false,
                },
                {
                  id: 'fieldSizeLimit',
                  op: 'gt',
                  value: 32672,
                },
              ],
            },
          },
        ],
      },
    },
  },
};

export default textType;
