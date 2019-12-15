import fs from 'fs';
import { expect } from 'chai';
import { Vector } from '../src/vector';
import { Matrix } from '../src/matrix';
import { Line, Segment } from '../src/line';
import { Polygon } from '../src/polygon';

const examples = {};

/**
 * Magical function that can intercept method calls and stick them in a JSON
 * for the LaTeX renderer to pull.
 * @example
 * asDiagram('Vector.toUnitVector').it('should calculate unit vector', expectCall => {
 *   expectCall(x).toUnitVector().to.vector.equal([0.6, 0.8]);
 *   expectCall(new Vector([0, 0])).toUnitVector().to.vector.equal([0, 0]);
 * });
 * @param  {String} name identifier of the diagram
 */
export function asDiagram(name) {
  // yes, this is very magic, but it makes our tests clean
  function expectCall(instance) {
    return new Proxy(instance, {
      get(callee, method) {
        return (...args) => {
          const retValue = callee[method](...args);
          const record = { callee, args, method, retValue };
          if (name in examples) {
            examples[name].push(record);
          } else {
            examples[name] = [record];
          }

          return expect(retValue);
        };
      },
    });
  }

  return {
    it(tname, handler) {
      if (handler === undefined) {
        [handler, tname] = [tname, name];
      }

      it(tname, () => handler(expectCall));
    },
  };
}

const replacer = (_key, value) => {
  if (value instanceof Vector) {
    return { type: 'Vector', elements: value.elements };
  } else if (value instanceof Matrix) {
    return { type: 'Matrix', elements: value.elements };
  } else if (value instanceof Line) {
    return { type: 'Line', anchor: value.anchor.elements, direction: value.direction.elements };
  } else if (value instanceof Segment) {
    return { type: 'Segment', start: value.start.elements, end: value.end.elements };
  } else if (value instanceof Polygon) {
    return { type: 'Polygon', verticies: value.vertices.toArray().map(v => v.elements) };
  } else {
    return value;
  }
};

after(() =>
  fs.writeFileSync(`${__dirname}/../doc/gen/examples.json`, JSON.stringify(examples, replacer, 2)),
);
