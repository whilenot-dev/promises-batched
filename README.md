# promises-batched

Iterate through promises in a batched manner.

This package implements the *ECMAScript* functions [Promise.all](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.all), [Promise.allSettled](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.allsettled), and [Promise.any](https://tc39.es/ecma262/multipage/control-abstraction-objects.html#sec-promise.any) as batched variants with 0 dependencies.

The type signature adheres to the [*TypeScript* lib implementation](https://github.com/microsoft/TypeScript/blob/main/src/lib/es2015.promise.d.ts) of the *ECMAScript* functions.

## Install

Install with your package manager of choice:

```shell
$ npm i promises-batched
```

## Usage

Since *Promise*s are executed eagerly we need to provide a lazy dispatch behavior by wrapping each *Promise* expression in a function.

### `promiseAllBatched`

```typescript
import { promiseAllBatched } from "promises-batched";

const promiseFn1 = () => Promise.resolve(3);
const promiseFn2 = () => 42;
const promiseFn3 = () => new Promise<string>((resolve, _reject) => setTimeout(resolve, 100, "foo"));

const promiseFns = [promiseFn1, promiseFn2, promiseFn3];

promiseAllBatched(2, promiseFns).then((values) => {
  console.log(values);
});

// Expected output: Array [3, 42, "foo"]
```

(Example from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all))

### `promiseAllSettledBatched`

```typescript
import { promiseAllSettledBatched } from "promises-batched";

const promiseFn1 = () => Promise.resolve(3);
const promiseFn2 = () => new Promise<string>((_resolve, reject) => setTimeout(reject, 100, "foo"));

const promiseFns = [promiseFn1, promiseFn2];

promiseAllSettledBatched(1, promiseFns).then((results) => {
  results.forEach((result) => {
    console.log(result.status);
  });
});

// Expected output:
// "fulfilled"
// "rejected"
```

(Example from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled))

### `promiseAnyBatched`

```typescript
import { promiseAnyBatched } from "promises-batched";

const promiseFn1 = () => Promise.reject(new Error("error"));
const promiseFn2 = () => new Promise<string>((resolve) => setTimeout(resolve, 100, "quick"));
const promiseFn3 = () => new Promise<string>((resolve) => setTimeout(resolve, 500, "slow"));

const promiseFns = [promiseFn1, promiseFn2, promiseFn3];

promiseAnyBatched(2, promiseFns).then((value) => {
  console.log(value);
});

// Expected output: "quick"
```

(Example from [MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any))

## Alternatives

- [p-limit](https://github.com/sindresorhus/p-limit) - Run multiple promise-returning & async functions with limited concurrency

## License

**MIT** - **wh!le (whilenot-dev)**, see [LICENSE](./LICENSE.txt)
