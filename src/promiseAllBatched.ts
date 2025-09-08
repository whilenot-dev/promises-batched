/**
 * Dispatch multiple promises like Promise.all, but in a batched
 * manner - as soon as one promise in a batch resolves, another
 * promise will be added to the batch and dispatched.
 *
 * This way a single pending promise will not block a whole batch
 * of resolved promises, like it would when calling Promise.all
 * sequentially instead.
 *
 * Besides that it behaves like Promise.all:
 * - the order of passed promises is consistent with the order
 *   of the result
 * - the first rejected promise rejects the whole promise
 *   immediately
 */
export function promiseAllBatched<
  T extends readonly (() => unknown)[] | [],
  U = { -readonly [P in keyof T]: Awaited<ReturnType<T[P]>> },
>(size: number, promiseFns: T): Promise<U> {
  if (!Number.isSafeInteger(size)) {
    throw new Error(`Argument <size> is not a safe integer: ${size}`);
  }
  if (size < 1) {
    throw new Error(`Argument <size> must be GTE 1: ${size}`);
  }

  const batchSize = Math.min(size, promiseFns.length);

  const batch = Array.from<unknown, Promise<void> | null>(
    { length: batchSize },
    () => null,
  );
  const values = Array.from({ length: promiseFns.length });

  let dispatchIdx = 0;
  let isSettled = false;

  const executor = (
    resolve: (value: U) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    if (isSettled) {
      return;
    }

    const hasPending = batch.some((val) => val !== null);
    const hasWaiting = dispatchIdx < promiseFns.length;
    if (!hasWaiting) {
      if (!hasPending) {
        resolve(values as U);
      }
      return;
    }

    const iterations = hasPending ? 1 : batchSize;
    for (let i = 0; i < iterations; i++) {
      const batchIdx = batch.indexOf(null);
      const valuesIdx = dispatchIdx++;
      // biome-ignore lint/style/noNonNullAssertion: Asserted by variable `hasWaiting`
      const promiseFn = promiseFns[valuesIdx]!;
      batch[batchIdx] = Promise.resolve(promiseFn())
        .then((value) => {
          batch[batchIdx] = null;
          values[valuesIdx] = value;
          executor(resolve, reject);
        })
        .catch((reason) => {
          isSettled = true;
          reject(reason);
        });
    }
  };

  return new Promise(executor);
}
