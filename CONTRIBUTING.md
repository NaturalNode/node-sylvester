# Contributing

You can use [Yarn](https://yarnpkg.com/) to install package dependencies. Once you install it, run `yarn` to grab dependencies.

Code is written in TypeScript in the `src` folder. I needs to be compiled before it can be run. You can do so once by running `yarn build`, or start a watcher by running `yarn watch`. I recommend keeping a watcher open during development.

Once you make your change, you should write tests for it. You can run unit tests via `yarn test:unit` or, if you use VS Code, via the `Run Tests` launch configuration (hitting F5 will start them up).

### Docs

Documentation is created from the typedocs in the source code, with an extra plugin that creates latex diagrams. You can use the `record` utility within unit tests to 'record' a method call that can be referenced in the docs, for instance:

```js
import { record } from './docs/record';

// result is wrapped in a Chai expectation
it('my test', () => {
  record(matrix1)
    .multiply(matrix2)
    .to.matrix.equal(matrix3);
});
```

You can then reference the diagram by its test name in the typedoc via a tag like `@diagram my test`.

The test examples are also used for benchmarking. You can run all benchmarks by setting the `SYL_BENCHMARK` enviroment variable, which will cause benchmarks to run when you run `test:unit`. This will take a while, and then record its results in `benchmark-results.json`. (For development, you can combine this with Mocha's `--grep` to run a subset of tests.)

The existing benchmark results were taken on a `D2s_v3` Azure VM. If you use a different machine, your baseline benchmarks will be different.
