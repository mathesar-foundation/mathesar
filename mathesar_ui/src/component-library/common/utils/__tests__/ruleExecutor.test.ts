import type { Rule } from '../ruleExecuter';
import { executeRule } from '../ruleExecuter';

describe('Rule executer', () => {
  test('Single term rule', () => {
    const rule: Rule = {
      id: 'restrictFieldSize',
      op: 'eq',
      value: false,
    };

    expect(executeRule(rule, { restrictFieldSize: false })).toBe(true);
    expect(executeRule(rule, { restrictFieldSize: true })).toBe(false);
    expect(executeRule(rule, {})).toBe(false);
  });

  test('Multi term rule with and', () => {
    const rule: Rule = {
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
    };

    expect(
      executeRule(rule, {
        restrictFieldSize: true,
        fieldSizeLimit: 200,
      }),
    ).toBe(true);
    expect(
      executeRule(rule, {
        restrictFieldSize: false,
        fieldSizeLimit: 200,
      }),
    ).toBe(false);
    expect(
      executeRule(rule, {
        restrictFieldSize: true,
        fieldSizeLimit: 300,
      }),
    ).toBe(false);
    expect(
      executeRule(rule, {
        restrictFieldSize: false,
        fieldSizeLimit: 300,
      }),
    ).toBe(false);
    expect(executeRule(rule, {})).toBe(false);
  });

  test('Multi term rule with or', () => {
    const rule: Rule = {
      combination: 'or',
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
    };

    expect(
      executeRule(rule, {
        restrictFieldSize: true,
        fieldSizeLimit: 200,
      }),
    ).toBe(true);
    expect(
      executeRule(rule, {
        restrictFieldSize: false,
        fieldSizeLimit: 200,
      }),
    ).toBe(true);
    expect(
      executeRule(rule, {
        restrictFieldSize: true,
        fieldSizeLimit: 300,
      }),
    ).toBe(true);
    expect(
      executeRule(rule, {
        restrictFieldSize: false,
        fieldSizeLimit: 300,
      }),
    ).toBe(false);
    expect(executeRule(rule, {})).toBe(false);
  });
});
