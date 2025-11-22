import { get } from 'svelte/store';

import { makeForm } from '../formFactory';

describe('Form factory tests', () => {
  test('values should only return values of stores in use', () => {
    const form = makeForm({
      variables: {
        valueInUse: { type: 'string', default: 'valueInUse' },
        conditionalValue: { type: 'string', default: 'valid' },
        valueNotInUse: { type: 'string', default: 'valueNotInUse' },
        valueHiddenByIf: { type: 'string', default: 'valueHiddenByIf' },
        valueShownByIf: { type: 'string', default: 'valueShownByIf' },
        valueHiddenBySwitch: { type: 'string', default: 'valueHiddenBySwitch' },
        valueShownBySwitch: { type: 'string', default: 'valueShownBySwitch' },
      },
      layout: {
        orientation: 'vertical',
        elements: [
          {
            type: 'input',
            variable: 'valueInUse',
          },
          {
            type: 'if',
            variable: 'conditionalValue',
            condition: 'eq',
            value: 'valid',
            elements: [
              {
                type: 'input',
                variable: 'valueShownByIf',
              },
            ],
          },
          {
            type: 'if',
            variable: 'conditionalValue',
            condition: 'eq',
            value: 'invalid',
            elements: [
              {
                type: 'input',
                variable: 'valueHiddenByIf',
              },
            ],
          },
          {
            type: 'switch',
            variable: 'conditionalValue',
            cases: {
              valid: [
                {
                  type: 'input',
                  variable: 'valueShownBySwitch',
                },
              ],
              invalid: [
                {
                  type: 'input',
                  variable: 'valueHiddenBySwitch',
                },
              ],
            },
          },
        ],
      },
    });

    expect(get(form.values)).toEqual(
      expect.objectContaining({
        valueInUse: 'valueInUse',
        valueShownByIf: 'valueShownByIf',
        valueShownBySwitch: 'valueShownBySwitch',
      }),
    );
  });

  test('validation', () => {
    const form = makeForm(
      {
        variables: {
          validVariable: {
            type: 'string',
            validation: {
              checks: ['isEmpty'],
            },
          },
          invalidVariable: {
            type: 'string',
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
              variable: 'validVariable',
            },
            {
              type: 'input',
              variable: 'invalidVariable',
            },
          ],
        },
      },
      {
        validVariable: 'valid',
      },
    );
    expect(form.getValidationResult()).toEqual(
      expect.objectContaining({
        isValid: false,
        failedChecks: {
          invalidVariable: ['isEmpty'],
        },
      }),
    );
    form.stores.get('invalidVariable')?.set('validValue');
    expect(form.getValidationResult()).toEqual(
      expect.objectContaining({
        isValid: true,
        failedChecks: {},
      }),
    );
  });
});
