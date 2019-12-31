import * as fs from 'fs';
import { expect } from 'chai';
import { Vector } from '../../src/vector';
import { Matrix } from '../../src/matrix';
import { Line, Segment } from '../../src/line';
import { Polygon } from '../../src/polygon';
import { Geometry } from '../../src/likeness';

export interface IRecording {
  callee: RecordedValue;
  method: string;
  args: RecordedValue[];
  retValue: RecordedValue;
}

const examples: { [key: string]: IRecording } = {};

export type RecordedValue =
  | { type: 'Constructor'; name: string }
  | { type: 'Vector'; elements: ReadonlyArray<number> }
  | { type: 'Matrix'; elements: ReadonlyArray<ReadonlyArray<number>> }
  | { type: 'Line'; anchor: ReadonlyArray<number>; direction: ReadonlyArray<number> }
  | { type: 'Segment'; start: ReadonlyArray<number>; end: ReadonlyArray<number> }
  | { type: 'Polygon'; verticies: ReadonlyArray<ReadonlyArray<number>> }
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
    get(callee, method: string) {
      return (...args: any[]) => {
        const retValue = (callee as any)[method](...args);
        examples[`${testName}-${testIndex++}`] = {
          callee: replacer(callee),
          args: args.map(replacer),
          method,
          retValue: replacer(retValue),
        };

        return expect(retValue);
      };
    },
  });

const replacer = (value: unknown): RecordedValue => {
  if (typeof value === 'function') {
    return { type: 'Constructor', name: value.name };
  } else if (value instanceof Vector) {
    return { type: 'Vector', elements: value.elements };
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
      out[key] = replacer((value as any)[key]);
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

let testName = '';
let testIndex = 0;

beforeEach(function() {
  testName = this.currentTest?.title ?? '';
  testIndex = 0;
});
after(() => fs.writeFileSync(`${__dirname}/recorded-tests.json`, JSON.stringify(examples)));
