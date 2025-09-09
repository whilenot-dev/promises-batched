import { describe, expect, test } from "bun:test";

import { promiseAnyBatched } from "./promiseAnyBatched.js";

describe("promiseAnyBatched", () => {
  test("to batch in 2", async () => {
    const batchSize = 2;

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);

      return result;
    };

    const values = await promiseAnyBatched(batchSize, [
      () => Promise.reject(),
      () => delay(2000, 2),
      () => delay(1000, 3),
    ]);

    expect(values).toBe(3);
  });

  test("to batch in 3", async () => {
    const batchSize = 3;

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);

      return result;
    };

    const values = await promiseAnyBatched(batchSize, [
      () => Promise.reject(),
      () => delay(2000, 2),
      () => delay(1000, 3),
    ]);

    expect(values).toBe(3);
  });

  test("to skip one rejected", async () => {
    const batchSize = 2;

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);

      return result;
    };

    const values = await promiseAnyBatched(batchSize, [
      () => Promise.reject(),
      () => delay(1000, 2),
    ]);

    expect(values).toBe(2);
  });

  test("to throw AggregateError", async () => {
    const batchSize = 2;

    try {
      await promiseAnyBatched(batchSize, [
        () => Promise.reject("rejected 1"),
        () => Promise.reject("rejected 2"),
      ]);
    } catch (err) {
      expect(err).toBeInstanceOf(AggregateError);
      expect((err as AggregateError).message).toBe(
        "No Promise in promiseAnyBatched was resolved",
      );
      expect((err as AggregateError).errors).toStrictEqual([
        "rejected 1",
        "rejected 2",
      ]);
    }
  });
});
