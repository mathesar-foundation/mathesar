import { vi } from 'vitest';
import CancellablePromise from '../CancellablePromise';

const dummyOnCancel = vi.fn().mockReturnValueOnce('cancelled');
test('CancellablePromise cancelled', () => {
  const fakePromise = new CancellablePromise((resolve, reject) => {
    try {
      resolve(202);
    } catch (e) {
      reject('Rejected: error');
    }
  }, dummyOnCancel);
  expect(fakePromise.isCancelled).toBeFalsy();
  fakePromise.cancel();
  expect(fakePromise.isCancelled).toBeTruthy();
  expect(dummyOnCancel).toHaveBeenCalledTimes(1);
  expect(fakePromise.then((res) => res)).toEqual(null);
  expect(fakePromise.catch(() => {})).toEqual(null);
  expect(fakePromise.finally(() => {})).toEqual(null);
});

test('CancellablePromise not cancelled gets resolved', async () => {
  const fakePromise = new CancellablePromise((resolve, reject) => {
    try {
      resolve(202);
    } catch (e) {
      reject('Rejected: error');
    }
  }, dummyOnCancel);
  expect(fakePromise.isCancelled).toBeFalsy();
  await expect(fakePromise.then((res) => res)).resolves.toBe(202);
});

test('CancellablePromise not cancelled gets rejected', async () => {
  const fakePromise = new CancellablePromise((resolve, reject) => {
    reject('Rejected: error');
  }, dummyOnCancel);
  expect(fakePromise.isCancelled).toBeFalsy();
  await expect(fakePromise.then((res) => res)).rejects.toEqual(
    'Rejected: error',
  );
});
