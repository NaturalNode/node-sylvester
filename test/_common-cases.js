import { Line, Plane, Vector, InvalidOperationError } from '../src';
import { expect, assert } from 'chai';

const testCommunitiveCases = (method, testCases) => (ForType, expectCall) => {
  const compare = (a, b) =>
    a && typeof a === 'object' && 'eql' in a
      ? a.eql(b)
      : typeof a === 'number' && typeof b === 'number'
      ? Math.abs(a - b) < 0.0001
      : a === b;

  const inspect = v => (v && typeof v === 'object' && 'inspect' in v ? v.inspect() : v);

  for (let [a, b, expected] of testCases) {
    if (b instanceof ForType && !(a instanceof ForType)) {
      [a, b] = [b, a];
    }

    if (a instanceof ForType) {
      const v =
        expected && typeof expected === 'object' && 'inspect' in expected
          ? expected.inspect()
          : expected;

      if (!compare(a[method](b), expected)) {
        const actual = a[method](b);
        assert.fail(
          actual,
          expected,
          `Expected ${a.inspect()}.${method}(${b.inspect()}) = ${inspect(v)}, got ${inspect(
            actual,
          )}`,
        );
      }

      if (!compare(b[method](a), expected)) {
        const actual = b[method](a);
        assert.fail(
          actual,
          expected,
          `Expected ${b.inspect()}.${method}(${a.inspect()}) = ${inspect(v)}, got ${inspect(
            actual,
          )}`,
        );
      }

      expectCall(a)[method](b); // just for the docs
      expect(() => a[method]({})).to.throw(
        InvalidOperationError,
        '',
        `Expected ${a.inspect()}.${method}({}) to throw`,
      );
    }
  }
};

export const testPerpendicularTo = testCommunitiveCases('isPerpendicularTo', [
  // Lines:
  [new Line([0, 0], [3, 4]), new Line([1, 1], [6, 8]), false],
  [new Line([0, 0], [3, 4]), new Line([0, 0], [-4, 3]), true],
  [new Line([0, 0], [3, 4]), new Line.Segment([1, 2], [4, 6]), false],
  [new Line([0, 0], [3, 4]), new Line.Segment([2, 2], [-2, 5]), true],
  [new Line([0, 0], [3, 4]), new Plane([2, 3, 1], [0, 1, 0]), false],
  [new Line([0, 0], [3, 4]), new Plane([0, 0, 0], [3, 4, 0]), true],
  [new Line([0, 0], [3, 4]), new Vector([6, 8]), false],
  [new Line([0, 0], [3, 4]), new Vector([-4, 3]), true],

  // Segments:
  [new Line.Segment([0, 0], [3, 4]), new Line.Segment([1, 1], [6, 8]), false],
  [new Line.Segment([0, 0], [3, 4]), new Line.Segment([0, 0], [-4, 3]), true],
  [new Line.Segment([0, 0], [3, 4]), new Plane([2, 3, 1], [0, 1, 0]), false],
  [new Line.Segment([0, 0], [3, 4]), new Plane([0, 0, 0], [3, 4, 0]), true],
  [new Line.Segment([0, 0], [3, 4]), new Vector([6, 8]), false],
  [new Line.Segment([0, 0], [3, 4]), new Vector([-4, 3]), true],

  // Planes:
  [new Plane([1, 2, 3], [4, 5, 6]), new Plane([2, 3, 1], [-5, 4, 0]), true],
  [new Plane([1, 2, 3], [4, 5, 6]), new Plane([2, 3, 1], [1, 1, 0]), false],
  [new Plane([1, 2, 3], [4, 5, 6]), new Vector([4, 5, 6]), true],

  // Vectors:
  [new Vector([3, 4]), new Vector([-4, 3]), true],
  [new Vector([4, 4]), new Vector([1, 2]), false],
]);

export const testParallelTo = testCommunitiveCases('isParallelTo', [
  // Lines:
  [new Line([0, 0], [3, 4]), new Line([1, 1], [6, 8]), true],
  [new Line([0, 0], [3, 4]), new Line([1, 0], [1, 1]), false],
  [new Line([0, 0], [3, 4]), new Line.Segment([1, 2], [4, 6]), true],
  [new Line([0, 0], [3, 4]), new Line.Segment([2, 2], [4, 6]), false],
  [new Line([0, 0], [3, 4]), Plane.fromPoints([1, 0, 1], [0, 1, 1], [0, 0, 1]), true],
  [new Line([0, 0], [3, 4]), Plane.fromPoints([1, 0, 1], [0, 0, 0], [2, 1, 1]), false],
  [new Line([0, 0], [3, 4]), new Vector([6, 8]), true],
  [new Line([0, 0], [3, 4]), new Vector([7, 8]), false],

  // Segments:
  [new Line.Segment([1, 2], [4, 6]), new Line.Segment([2, 3], [5, 7]), true],
  [new Line.Segment([1, 2], [4, 6]), new Line.Segment([2, 3], [2, 7]), false],
  [new Line.Segment([1, 2], [4, 6]), Plane.fromPoints([1, 0, 1], [0, 1, 1], [0, 0, 1]), true],
  [new Line.Segment([1, 2], [4, 6]), Plane.fromPoints([1, 0, 1], [0, 0, 0], [2, 1, 1]), false],
  [new Line.Segment([1, 2], [4, 6]), new Vector([6, 8]), true],
  [new Line.Segment([1, 2], [4, 6]), new Vector([7, 8]), false],

  // Planes:
  [
    Plane.fromPoints([1, 1, 1], [1, 0, 0], [2, 2, 2]),
    Plane.fromPoints([1, 1, 2], [1, 0, 1], [2, 2, 3]),
    true,
  ],
  [
    Plane.fromPoints([1, 1, 1], [1, 0, 0], [2, 2, 2]),
    Plane.fromPoints([1, 1, 1], [1, 0, 1], [2, 2, 3]),
    false,
  ],
  [Plane.fromPoints([1, 1, 1], [1, 0, 1], [2, 2, 1]), new Vector([3, 4, 0]), true],
  [Plane.fromPoints([1, 1, 1], [1, 0, 0], [2, 2, 2]), new Vector([3, 4, 1]), false],

  // Vectors:
  [new Vector([3, 4]), new Vector([6, 8]), true],
  [new Vector([4, 4]), new Vector([6, 8]), false],
]);

export const testIntersectionWith = testCommunitiveCases('intersectionWith', [
  // Lines:
  [new Line([0, 0], [1, 1]), new Line([0, 0], [-1, -1]), null],
  [new Line([1, 0], [1, 1]), new Line([0, 0], [1, 1]), null],
  [new Line([1, 0], [1, -1]), new Line([0, 0], [1, 1]), new Vector([0.5, 0.5, 0])],
  [new Line([1, 0], [1, -1]), new Line.Segment([0, 0], [1, 1]), new Vector([0.5, 0.5, 0])],
  [new Line([1, 0], [1, -1]), new Line.Segment([-1, -1], [0, 0]), null],
  [new Line([0, 0], [1, 1]), new Plane([1, 1, 1], [0, 0, 1]), null],
  [new Line([0, 0], [1, 1]), new Plane([1, 1, 1], [0, 0, 1]), null],
  [new Line([0, 0], [1, 1]), new Plane([1, 1, 1], [1, 0, 2]), new Vector([3, 3, 0])],

  // Segments:
  [new Line.Segment([1, 0], [0, 1]), new Line.Segment([-1, -1], [0, 0]), null],
  [new Line.Segment([1, 0], [0, 1]), new Line.Segment([1, 1], [0, 0]), new Vector([0.5, 0.5, 0])],
  [new Line.Segment([1, 0], [0, 1]), new Plane([0, 0, 0], [0, 0, 1]), null],
  [new Line.Segment([1, 0], [0, 1]), new Plane([0, 0, 1], [0, 0, 1]), null],
  [new Line.Segment([1, 0], [0, 1]), new Plane([0, 0, 1], [0, 0.5, 1]), null],
  [new Line.Segment([2, 0], [0, 1]), new Plane([0, 0, 1], [1, 0, 1]), new Vector([1, 0.5, 0])],

  // Planes:
  [new Plane([1, 1, 1], [0, 0, 1]), new Plane([0, 0, 0], [0, 0, 1]), null],
  [new Plane([1, 1, 1], [0, 0, 1]), new Plane([0, 0, 0], [1, 1, 1]), new Line([0, -1, 1], [-1, 1])],
]);

export const testDistanceFrom = testCommunitiveCases('distanceFrom', [
  // Lines:
  [new Line([0, 0], [1, 1]), new Vector([1, 2]), 0.707107],
  [new Line([0, 0], [1, 1]), new Vector([2, 2]), 0],
  [new Line([0, 0], [1, 1]), new Line([0, 0], [1, -1]), 0],
  [new Line([0, 0], [1, 1]), new Line([0, 1], [1, 1]), Math.sqrt(2) / 2],
  [new Line([0, 0], [1, 1]), new Plane([1, 1, 1], [1, 0, 1]), 0],
  [new Line([0, 0], [1, 1]), new Plane([1, 1, 1], [0, 0, 1]), 1],

  // Segments:
  [new Line.Segment([1, 2], [4, 6]), new Vector([0, 0]), Math.sqrt(5)],
  [new Line.Segment([1, 2], [4, 6]), new Vector([2, 2 + 4 / 3]), 0],
  [new Line.Segment([1, 2], [4, 6]), new Vector([2, 2]), 0.8],
  [new Line.Segment([1, 2], [4, 6]), new Line([3, 0], [0, 1]), 0],
  [new Line.Segment([1, 2], [4, 6]), new Line([0, 1, 1], [1, 1, 0]), 1],
  [new Line.Segment([1, 2], [4, 6]), new Line([1, 1], [3, 4]), 0.6],
  [new Line.Segment([0, 0], [1, 1]), new Plane([0.5, 1, 1], [1, 0, 0]), 0],
  [new Line.Segment([0, 0], [1, 1]), new Plane([1, 1, 1], [0, 0, 1]), 1],

  // Planes:
  [new Plane([1, 1, 1], [1, 0, 1]), new Plane([1, 1, 1], [1, 0, 1]), 0],
  [new Plane([1, 1, 1], [1, 0, 1]), new Plane([0, 1, 1], [1, 0, 1]), Math.sqrt(2) / 2],
  [new Plane([1, 1, 1], [1, 0, 1]), new Plane([1, 1, 1], [0, 0, 1]), 0],
]);
