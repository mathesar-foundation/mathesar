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
              defaults: {
                CHAR: true,
                VARCHAR: true,
                TEXT: false,
              },
            },
            length: {
              type: 'integer',
              isSaved: true,
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
                  id: 'length',
                  op: 'lte',
                  value: 255,
                },
                {
                  id: 'length',
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
                      id: 'length',
                      op: 'gt',
                      value: 255,
                    },
                    {
                      id: 'length',
                      op: 'eq',
                      value: null,
                    },
                  ],
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
      },
    },
  },
};

export default textType;
