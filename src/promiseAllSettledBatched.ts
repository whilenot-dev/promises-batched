/**
 * Dispatch multiple promises like Promise.allSettled, but in a
 * batched manner - as soon as one promise in a batch settles, another
 * promise will be added to the batch and dispatched.
 *
 * This way a single pending promise will not block a whole batch
 * of settled promises, like it would when calling Promise.allSettled
 * sequentially instead.
 *
 * Besides that it behaves like Promise.allSettled:
 * - the order of passed promises is consistent with the order
 *   of the result
 */
export function promiseAllSettledBatched<
  T extends readonly (() => unknown)[] | [],
  U = {
    -readonly [P in keyof T]: PromiseSettledResult<Awaited<ReturnType<T[P]>>>;
  },
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
  const results = Array.from<PromiseSettledResult<unknown> | undefined>({
    length: promiseFns.length,
  });

  let dispatchIdx = 0;

  const executor = (
    resolve: (value: U) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    const hasPending = batch.some((val) => val !== null);
    const hasWaiting = dispatchIdx < promiseFns.length;
    if (!hasWaiting) {
      if (!hasPending) {
        resolve(results as U);
      }
      return;
    }

    const iterations = hasPending ? 1 : batchSize;
    for (let i = 0; i < iterations; i++) {
      const batchIdx = batch.indexOf(null);
      const resultsIdx = dispatchIdx++;
      // biome-ignore lint/style/noNonNullAssertion: Asserted by variable `hasWaiting`
      const promiseFn = promiseFns[resultsIdx]!;
      batch[batchIdx] = Promise.resolve(promiseFn())
        .then(
          (value): PromiseFulfilledResult<unknown> => ({
            status: "fulfilled",
            value,
          }),
        )
        .catch(
          (reason): PromiseRejectedResult => ({
            status: "rejected",
            reason,
          }),
        )
        .then((result) => {
          batch[batchIdx] = null;
          results[resultsIdx] = result;
          executor(resolve, reject);
        });
    }
  };

  return new Promise(executor);
}
