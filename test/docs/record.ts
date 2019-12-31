import * as fs from 'fs';
import { expect } from 'chai';
import { Vector } from '../../src/vector';
import { Matrix } from '../../src/matrix';
import { Line, Segment } from '../../src/line';
import { Polygon } from '../../src/polygon';
import { Geometry } from '../../src/likeness';
import { Plane } from '../../src';
import { Suite } from 'benchmark';
import Benchmark = require('benchmark');
import { readJson, writeJson } from 'fs-extra';

export interface IRecording {
  callee: RecordedValue;
  method: string;
  args: RecordedValue[];
  retValue: RecordedValue;
  code: string;
  benchmark(): void;
}

export interface IBenchmarks {
  env: {
    version: string;
    os: string;
  };
  data: { [name: string]: number };
}

const examples: { [key: string]: IRecording } = {};

export type RecordedValue =
  | { type: 'Constructor'; name: string }
  | { type: 'Vector'; elements: ReadonlyArray<number> }
  | { type: 'Matrix'; elements: ReadonlyArray<ReadonlyArray<number>> }
  | { type: 'Line'; anchor: ReadonlyArray<number>; direction: ReadonlyArray<number> }
  | { type: 'Segment'; start: ReadonlyArray<number>; end: ReadonlyArray<number> }
  | { type: 'Polygon'; verticies: ReadonlyArray<ReadonlyArray<number>> }
  | { type: 'Plane'; anchor: ReadonlyArray<number>; norm: ReadonlyArray<number> }
  | { type: 'Object'; value: { [key: string]: RecordedValue } }
  | { type: 'Primitive'; value: string | number | boolean | null };

/**
 * Magical function that can intercept method calls and stick them in a JSON
 * for the LaTeX renderer to pull.
 * @example
 * asDiagram('Vector.toUnitVector').it('should calculate unit vector', expectCall => {
 *   record(x).toUnitVector().to.vector.equal([0.6, 0.8]);
 *   record(new Vector([0, 0])).toUnitVector().to.vector.equal([0, 0]);
 * });
 * @param  {String} name identifier of the diagram
 */
export const record = <T extends Geometry>(obj: T): T =>
  new Proxy(obj, {
    get(callee: any, method: string) {
      return (...args: any[]) => {
        const retValue = callee[method](...args);
        examples[`${testName}-${testIndex++}`] = {
          callee: toRecordedValue(callee),
          args: args.map(toRecordedValue),
          method,
          retValue: toRecordedValue(retValue),
          code: `${toCode(callee)}.${method}(${args.map(toCode).join(',')})`,
          benchmark: () => callee[method](...args),
        };

        return expect(retValue);
      };
    },
  });

const toCode = (value: unknown): string => {
  if (typeof value === 'function') {
    return value.name;
  } else if (value instanceof Vector) {
    return `new Vector(${JSON.stringify(value.elements)})`;
  } else if (value instanceof Plane) {
    return `new Plane(${JSON.stringify(value.anchor.elements)}, ${JSON.stringify(
      value.normal.elements,
    )})`;
  } else if (value instanceof Matrix) {
    return `new Matrix(${JSON.stringify(value.elements)})`;
  } else if (value instanceof Line) {
    return `new Line(${JSON.stringify(value.anchor.elements)}, ${JSON.stringify(
      value.direction.elements,
    )})`;
  } else if (value instanceof Segment) {
    return `new Line.Segment(${JSON.stringify(value.start.elements)}, ${JSON.stringify(
      value.end.elements,
    )})`;
  } else if (value instanceof Polygon) {
    return `new Polygon(${JSON.stringify(value.vertices.toArray().map(v => v.elements))})`;
  } else if (value instanceof Array) {
    return JSON.stringify(value.map(toCode));
  } else if (value === undefined) {
    return 'undefined';
  } else {
    return JSON.stringify(value);
  }
};

const toRecordedValue = (value: unknown): RecordedValue => {
  if (typeof value === 'function') {
    return { type: 'Constructor', name: value.name };
  } else if (value instanceof Vector) {
    return { type: 'Vector', elements: value.elements };
  } else if (value instanceof Plane) {
    return { type: 'Plane', anchor: value.anchor.elements, norm: value.normal.elements };
  } else if (value instanceof Matrix) {
    return { type: 'Matrix', elements: value.elements };
  } else if (value instanceof Line) {
    return { type: 'Line', anchor: value.anchor.elements, direction: value.direction.elements };
  } else if (value instanceof Segment) {
    return { type: 'Segment', start: value.start.elements, end: value.end.elements };
  } else if (value instanceof Polygon) {
    return { type: 'Polygon', verticies: value.vertices.toArray().map(v => v.elements) };
  } else if (typeof value === 'object' && !!value) {
    const out: { [key: string]: RecordedValue } = {};
    for (const key of Object.keys(value)) {
      out[key] = toRecordedValue((value as any)[key]);
    }
    return { type: 'Object', value: out };
  } else if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return { type: 'Primitive', value };
  } else {
    throw new Error(`cannot serialize value ${JSON.stringify(value)}`);
  }
};

async function benchmark(file: string) {
  let previous: IBenchmarks | undefined;
  try {
    previous = await readJson(file);
  } catch (e) {
    // ignored
  }

  const suite = new Suite();

  for (const example of Object.keys(examples)) {
    suite.add(example, examples[example].benchmark);
  }

  let results: IBenchmarks = {
    env: { version: process.version, os: process.platform },
    data: {},
  };

  suite.on('cycle', (evt: { target: Benchmark }) => {
    const name: string = (evt.target as any).name; // typings are wrong
    results.data[name] = evt.target.hz;

    const oldHz = previous?.data[name];
    const delta = oldHz ? `(${((evt.target.hz / oldHz) * 100).toFixed(0)}% change)` : '';
    console.log(`${name.padStart(30)} @ ${evt.target.hz.toFixed(0)} ops/sec ${delta}`);
  });

  const complete = new Promise(resolve => suite.on('complete', resolve));
  suite.run();
  await complete;

  await writeJson(file, results, { spaces: 2 });
}

let testName = '';
let testIndex = 0;

beforeEach(function() {
  testName = this.currentTest?.title ?? '';
  testIndex = 0;
});

after(async function() {
  fs.writeFileSync(`${__dirname}/recorded-tests.json`, JSON.stringify(examples));

  if (process.argv.includes('--benchmark') || process.env.SYL_BENCHMARK) {
    this.timeout(1000 * 3000);
    await benchmark(`${__dirname}/../../../benchmark-results.json`);
  }
});
