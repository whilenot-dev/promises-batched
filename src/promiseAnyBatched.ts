/**
 * Dispatch multiple promises like Promise.any, but in a batched
 * manner - as soon as one promise in a batch rejects, another
 * promise will be added to the batch and dispatched.
 *
 * This way a single pending promise will not block a whole batch
 * of rejected promises, like it would when calling Promise.any
 * sequentially instead.
 *
 * Besides that it behaves like Promise.any.
 */
export function promiseAnyBatched<T>(
  size: number,
  promiseFns: (() => T | PromiseLike<T>)[],
): Promise<Awaited<T>> {
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
  const errors = Array.from({ length: promiseFns.length });

  let dispatchIdx = 0;
  let isSettled = false;

  const executor = (
    resolve: (value: Awaited<T>) => void,
    reject: (reason?: unknown) => void,
  ): void => {
    if (isSettled) {
      return;
    }

    const hasPending = batch.some((val) => val !== null);
    const hasWaiting = dispatchIdx < promiseFns.length;
    if (!hasWaiting) {
      if (!hasPending) {
        reject(
          new AggregateError(
            errors,
            "No Promise in promiseAnyBatched was resolved",
          ),
        );
      }
      return;
    }

    const iterations = hasPending ? 1 : batchSize;
    for (let i = 0; i < iterations; i++) {
      const batchIdx = batch.indexOf(null);
      const errorsIdx = dispatchIdx++;
      // biome-ignore lint/style/noNonNullAssertion: Asserted by variable `hasWaiting`
      const promiseFn = promiseFns[errorsIdx]!;
      batch[batchIdx] = Promise.resolve(promiseFn())
        .then((value) => {
          isSettled = true;
          resolve(value);
        })
        .catch((reason) => {
          batch[batchIdx] = null;
          errors[errorsIdx] = reason;
          executor(resolve, reject);
        });
    }
  };

  return new Promise(executor);
}
