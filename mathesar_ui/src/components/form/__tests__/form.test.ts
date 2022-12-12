import { get } from 'svelte/store';

import { uniqueWith, min, comboInvalidIf } from '../validators';
import { makeForm } from '../form';
import { requiredField } from '../field';

type Beverage = 'juice' | 'water' | 'beer';

const tooYoung = 'Too young.';
const noBeer = 'Too young for beer.';
const nameTakenMsg = 'Name already taken.';

test('ReadableForm', async () => {
  const name = requiredField<string>('', [uniqueWith(['Jim'], nameTakenMsg)]);
  const age = requiredField<number | undefined>(undefined, [min(16, tooYoung)]);
  const beverage = requiredField<undefined | Beverage>(undefined);
  const form = makeForm({ name, age, beverage }, [
    comboInvalidIf([age, beverage], ([a, b]) => b === 'beer' && a < 21, noBeer),
  ]);

  // Form with empty values
  expect(get(name)).toBe('');
  expect(get(age)).toBe(undefined);
  expect(get(beverage)).toBe(undefined);
  expect(get(form).values).toEqual({
    name: '',
    age: undefined,
    beverage: undefined,
  });
  expect(get(form).hasChanges).toBe(false);
  expect(get(form).isValid).toBe(false);

  // Fill in some values that have the following problems:
  //
  // - Name is already taken
  // - Age is too young on its own
  name.set('Jim');
  age.set(15);
  beverage.set('water');
  expect(get(form).values).toEqual({ name: 'Jim', age: 15, beverage: 'water' });
  expect(get(name)).toBe('Jim');
  expect(get(age)).toBe(15);
  expect(get(beverage)).toBe('water');
  expect(get(name.errors)).toEqual([nameTakenMsg]);
  expect(get(age.errors)).toEqual([tooYoung]);
  expect(get(beverage.errors)).toEqual([]);
  expect(get(form).hasChanges).toBe(true);

  // Fix the form validation problems
  age.set(20);
  expect(get(age.errors)).toEqual([]);
  name.set('Lisa');
  expect(get(name.errors)).toEqual([]);
  expect(get(form).hasChanges).toBe(true);
  expect(get(form).isValid).toBe(true);

  // Change one field to a value that causes a combo validator to fail
  beverage.set('beer');
  expect(get(beverage.errors)).toEqual([]);
  expect(get(beverage.isValid)).toEqual(true);
  expect(get(form).values).toBeDefined(); // <- QUIRK (See below)
  expect(get(beverage.errors)).toEqual([noBeer]);
  expect(get(beverage.isValid)).toEqual(false);
  expect(get(age.errors)).toEqual([noBeer]);
  expect(get(form).isValid).toBe(false);
  expect(get(name.errors)).toEqual([]);
  expect(get(name.isValid)).toEqual(true);

  // Fix the combo validation error by changing the value of another field
  age.set(21);
  expect(get(form).values).toBeDefined(); // <- QUIRK (See below)
  expect(get(age.errors)).toEqual([]);
  expect(get(beverage.errors)).toEqual([]);
  expect(get(form).isValid).toBe(true);

  // QUIRK (from above):
  //
  // The `form` store needs a subscription for the combo validators to run.
  // Calling `get(form)` subscribes to the store (and immediately unsubscribes)
  // which is a hacky work around to fake such a subscription within the context
  // of a test like this. Within a real component, we'd have at least one
  // subscription to `form` or one of its derived stores, so we wouldn't need
  // such a work around.
});
