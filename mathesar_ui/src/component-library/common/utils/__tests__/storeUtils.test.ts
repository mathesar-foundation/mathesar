import { type Readable, get, writable } from 'svelte/store';

import { asyncDynamicDerived, collapse, unite } from '../storeUtils';

test('collapse', () => {
  const innerA = writable(21);
  const innerB = writable(31);
  const outer = writable(innerA);
  const collapsed = collapse<number>(outer);
  expect(get(collapsed)).toBe(21);
  innerA.set(22);
  expect(get(collapsed)).toBe(22);
  outer.set(innerB);
  expect(get(collapsed)).toBe(31);
  innerB.set(32);
  expect(get(collapsed)).toBe(32);
});

test('unite', () => {
  const a = writable(21);
  const b = writable(31);
  const all = [a, b];
  const united = unite(all);
  expect(get(united)).toEqual([21, 31]);
  a.set(22);
  expect(get(united)).toEqual([22, 31]);
  b.set(32);
  expect(get(united)).toEqual([22, 32]);
});

function track<T>(store: Readable<T>) {
  const values: T[] = [];
  const unsub = store.subscribe((v) => values.push(v));
  return {
    values,
    unsub,
  };
}

describe('asyncDynamicDerived', () => {
  const innerA = writable(1);
  const innerB = writable(2);
  const nestedInner = writable(3);
  const innerC = { nestedInner };
  const source = writable({ innerA, innerB, innerC });
  let computed = 0;

  const result = asyncDynamicDerived(
    source,
    (sourceSubstance) => [
      sourceSubstance.innerA,
      sourceSubstance.innerB,
      sourceSubstance.innerC.nestedInner,
    ],
    (sourceSubtance, getInner) => {
      computed += 1;
      return (
        getInner(sourceSubtance.innerA) +
        getInner(sourceSubtance.innerB) +
        getInner(sourceSubtance.innerC.nestedInner)
      );
    },
    0,
  );

  const reset = () => {
    innerA.set(1);
    innerB.set(2);
    nestedInner.set(3);
    source.set({ innerA, innerB, innerC: { nestedInner } });
    computed = 0;
  };

  beforeEach(() => {
    reset();
  });

  test('store should compute when source changes', () => {
    const { values, unsub } = track(result);

    const firstValue = 1 + 2 + 3;
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    source.set({
      innerA: writable(100),
      innerB: writable(200),
      innerC: { nestedInner: writable(300) },
    });
    const secondValue = 100 + 200 + 300;
    expect(get(result)).toEqual(secondValue);
    expect(values).toEqual([firstValue, secondValue]);
    expect(computed).toEqual(2);

    unsub();
  });

  test('store should compute when inner stores change', async () => {
    const { values, unsub } = track(result);

    const firstValue = 1 + 2 + 3;
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    innerA.set(200);

    // Value doesn't change right away
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    await result.tick();

    // Value should have been updated now
    const secondValue = 200 + 2 + 3;
    expect(get(result)).toEqual(secondValue);
    expect(values).toEqual([firstValue, secondValue]);
    expect(computed).toEqual(2);

    unsub();
  });

  test('inner store changes should be batched', async () => {
    const { values, unsub } = track(result);

    const firstValue = 1 + 2 + 3;
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    innerA.set(200);
    innerB.set(300);
    nestedInner.set(600);

    // Value doesn't change right away
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    await result.tick();

    // Value should have been updated now
    const secondValue = 200 + 300 + 600;
    expect(get(result)).toEqual(secondValue);
    expect(values).toEqual([firstValue, secondValue]);
    expect(computed).toEqual(2);

    unsub();
  });

  test('inner stores should not trigger re-compute immeditately after source changes', async () => {
    const { values, unsub } = track(result);

    const firstValue = 1 + 2 + 3;
    expect(get(result)).toEqual(firstValue);
    expect(computed).toEqual(1);
    expect(values).toEqual([firstValue]);

    innerA.set(213);
    nestedInner.set(600);
    source.update((v) => ({ ...v, innerB: writable(459) }));
    const secondValue = 213 + 459 + 600;

    // Value changes since source changes, but shouldn't recompute multiple times
    expect(get(result)).toEqual(secondValue);
    expect(computed).toEqual(2);
    expect(values).toEqual([firstValue, secondValue]);
    await result.tick();
    expect(get(result)).toEqual(secondValue);
    expect(computed).toEqual(2);
    expect(values).toEqual([firstValue, secondValue]);

    nestedInner.set(940);
    const thirdValue = 213 + 459 + 940;

    expect(get(result)).toEqual(secondValue);
    expect(computed).toEqual(2);
    expect(values).toEqual([firstValue, secondValue]);
    await result.tick();
    expect(computed).toEqual(3);
    expect(get(result)).toEqual(thirdValue);
    expect(values).toEqual([firstValue, secondValue, thirdValue]);

    unsub();
  });
});
