import { describe, expect, test } from "bun:test";

import { promiseAllBatched } from "./promiseAllBatched.js";

describe("promiseAllBatched", () => {
  test("to batch in 2", async () => {
    const batchSize = 2;
    const tolerance = 1000;

    const tsBegin = Number(Date.now());
    const resultMap: Record<number, number> = {};

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);
      const tsEnd = Number(Date.now()) + 1;
      const delta = tsEnd - tsBegin;
      resultMap[result] = delta;

      return result;
    };

    await promiseAllBatched(batchSize, [
      () => delay(1000, 1),
      () => delay(1000, 2),
      () => delay(1000, 3),
    ]);

    expect(resultMap[1]).toBeGreaterThanOrEqual(1000);
    expect(resultMap[1]).toBeLessThan(1000 + tolerance);
    expect(resultMap[2]).toBeGreaterThanOrEqual(1000);
    expect(resultMap[2]).toBeLessThan(1000 + tolerance);
    expect(resultMap[3]).toBeGreaterThanOrEqual(2000);
    expect(resultMap[3]).toBeLessThan(2000 + tolerance);
  });

  test("to batch in 3", async () => {
    const batchSize = 3;
    const tolerance = 1000;

    const tsBegin = Number(Date.now());
    const resultMap: Record<number, number> = {};

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);
      const tsEnd = Number(Date.now()) + 1;
      const delta = tsEnd - tsBegin;
      resultMap[result] = delta;

      return result;
    };

    await promiseAllBatched(batchSize, [
      () => delay(1000, 1),
      () => delay(1000, 2),
      () => delay(1000, 3),
    ]);

    expect(resultMap[1]).toBeGreaterThanOrEqual(1000);
    expect(resultMap[1]).toBeLessThan(1000 + tolerance);
    expect(resultMap[2]).toBeGreaterThanOrEqual(1000);
    expect(resultMap[2]).toBeLessThan(1000 + tolerance);
    expect(resultMap[3]).toBeGreaterThanOrEqual(1000);
    expect(resultMap[3]).toBeLessThan(1000 + tolerance);
  });

  test("to keep order", async () => {
    const batchSize = 2;

    const delay = async (ms: number, result: number): Promise<number> => {
      await Bun.sleep(ms);

      return result;
    };

    const values = await promiseAllBatched(batchSize, [
      () => delay(1000, 1),
      () => delay(1000, 2),
      () => delay(1000, 3),
    ]);

    expect(values).toStrictEqual([1, 2, 3]);
  });
});
