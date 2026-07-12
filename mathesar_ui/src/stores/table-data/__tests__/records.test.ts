import { readable } from 'svelte/store';

import type { RawColumnWithMetadata } from '@mathesar/api/rpc/columns';

import { getRecordIdentifier, isRecordReadyToCreate } from '../records';

vi.mock('svelte-i18n', () => {
  const translate = (s: string) => s;
  return { _: readable(translate) };
});

function column(
  id: number,
  overrides: Partial<RawColumnWithMetadata> = {},
): RawColumnWithMetadata {
  return {
    id,
    name: `column_${id}`,
    description: null,
    type: 'text',
    type_options: null,
    nullable: false,
    primary_key: true,
    default: null,
    has_dependents: false,
    current_role_priv: [],
    metadata: null,
    ...overrides,
  };
}

describe('getRecordIdentifier', () => {
  test('returns undefined without primary key columns', () => {
    expect(getRecordIdentifier({ 1: 3 }, [])).toBeUndefined();
  });

  test('returns a scalar value for a single-column primary key', () => {
    expect(getRecordIdentifier({ 1: 3, 2: 'pending' }, [column(1)])).toBe(3);
  });

  test('returns an attnum-keyed object for a composite primary key', () => {
    expect(
      getRecordIdentifier({ 1: 3, 2: 103, 3: '2024-01-17', 4: 'pending' }, [
        column(1),
        column(2),
        column(3),
      ]),
    ).toEqual({ 1: 3, 2: 103, 3: '2024-01-17' });
  });

  test('returns undefined when any composite primary key value is missing', () => {
    expect(
      getRecordIdentifier({ 1: 3, 2: 103 }, [column(1), column(2), column(3)]),
    ).toBeUndefined();
  });
});

describe('isRecordReadyToCreate', () => {
  test('returns false when a required composite primary key value is missing', () => {
    expect(
      isRecordReadyToCreate({ 1: 3 }, [
        column(1),
        column(2),
        column(3, { type: 'date' }),
        column(4, { nullable: true, primary_key: false }),
      ]),
    ).toBe(false);
  });

  test('returns true when required composite primary key values are present', () => {
    expect(
      isRecordReadyToCreate({ 1: 3, 2: 105, 3: '2024-01-19' }, [
        column(1),
        column(2),
        column(3, { type: 'date' }),
        column(4, { nullable: true, primary_key: false }),
      ]),
    ).toBe(true);
  });

  test('does not require dynamic default primary key values', () => {
    expect(
      isRecordReadyToCreate({ 2: 'USB Hub' }, [
        column(1, {
          default: {
            value: "nextval('products_product_id_seq'::regclass)",
            is_dynamic: true,
          },
        }),
        column(2, { primary_key: false }),
      ]),
    ).toBe(true);
  });
});
