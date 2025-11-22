import { withDefaults, withoutUndefinedValues } from '../miscUtils';

test('withoutUndefinedValues', () => {
  expect(withoutUndefinedValues({})).toEqual({});
  expect(withoutUndefinedValues({ a: 7 })).toEqual({ a: 7 });
  expect(withoutUndefinedValues({ a: 7, b: undefined })).toEqual({ a: 7 });
  expect(withoutUndefinedValues({ a: undefined, b: undefined })).toEqual({});
});

test('withDefaults', () => {
  expect(withDefaults({ a: 7, b: 8 })).toEqual({ a: 7, b: 8 });
  expect(withDefaults({ a: 7, b: 8 }, { a: 100 })).toEqual({ a: 100, b: 8 });
  expect(withDefaults({ a: 7, b: 8 }, { b: 200 })).toEqual({ a: 7, b: 200 });
  expect(withDefaults({ a: 7, b: 8 }, { b: undefined })).toEqual({
    a: 7,
    b: 8,
  });
  expect(withDefaults({ a: 7, b: 8 }, { a: undefined, b: 200 })).toEqual({
    a: 7,
    b: 200,
  });
});
