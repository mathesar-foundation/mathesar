import type { AbstractTypeConfiguration } from '../types.d';

const textType: AbstractTypeConfiguration = {
  icon: 'T',
  input: {
    type: 'string',
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
                elements: [
                  {
                    type: 'input',
                    variable: 'fieldSizeLimit',
                    label: 'Field Size Limit',
                  },
                ],
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
                {
                  id: 'fieldSizeLimit',
                  op: 'neq',
                  value: null,
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
                  combination: 'or',
                  terms: [
                    {
                      id: 'fieldSizeLimit',
                      op: 'gt',
                      value: 255,
                    },
                    {
                      id: 'fieldSizeLimit',
                      op: 'eq',
                      value: null,
                    }
                  ]
                },
              ],
            },
          },
          {
            resolve: 'TEXT',
            rule: {
              id: 'restrictFieldSize',
              op: 'eq',
              value: false,
            },
          },
        ],
        ruleReversalValues: {
          CHAR: {
            restrictFieldSize: true,
            fieldSizeLimit: 255,
          },
          VARCHAR: {
            restrictFieldSize: true,
            fieldSizeLimit: null,
          },
          TEXT: {
            restrictFieldSize: false,
            fieldSizeLimit: null,
          },
        },
      },
    },
  },
};

export default textType;
