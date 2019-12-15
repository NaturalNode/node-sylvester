import { expect } from 'chai';
import { Plane, Line, Matrix, OutOfRangeError } from '../src';
import { asDiagram } from './_as-diagram';
import {
  testParallelTo,
  testPerpendicularTo,
  testIntersectionWith,
  testDistanceFrom,
} from './_common-cases';

describe('plane', () => {
  asDiagram('Plane.isPerpendicularTo').it(expectCall => {
    testPerpendicularTo(Plane, expectCall);
  });

  asDiagram('Plane.isParallelTo').it(expectCall => {
    testParallelTo(Plane, expectCall);
  });

  asDiagram('Plane.intersectionWith').it(expectCall => {
    testIntersectionWith(Plane, expectCall);
  });

  asDiagram('Plane.distanceFrom').it(expectCall => {
    testDistanceFrom(Plane, expectCall);
  });

  asDiagram('Plane.translate').it(expectCall => {
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .translate([3, 4, 5])
      .to.geo.equal(new Plane([4, 6, 8], [1, 0, 1]));
  });

  asDiagram('Plane.rotate').it(expectCall => {
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .rotate(Math.PI / 2, Line.Z)
      .to.geo.equal(new Plane([-1, 1, 3], [0, 1, 1]));
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .rotate(Matrix.RotationZ(Math.PI / 2), Line.Z)
      .to.geo.equal(new Plane([-1, 1, 3], [0, 1, 1]));
  });

  asDiagram('Plane.reflectionIn').it(expectCall => {
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn([0, 0, 0])
      .to.geo.equal(new Plane([-1, -2, -3], [1, 0, 1]));
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn(Line.Z)
      .to.geo.equal(new Plane([-1, -2, 3], [-1, 0, 1]));
    expectCall(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn(new Plane([1, 1, 1], [1, 1, 0]))
      .to.geo.equal(new Plane([0, 1, 3], [0, -1, 1]));
  });

  asDiagram('Plane.fromPoints').it(expectCall => {
    expectCall(Plane)
      .fromPoints([0, 0, 0], [1, 1, 1], [1, 0, 1])
      .to.geo.equal(new Plane([0, 0, 0], [1, 0, -1]));
    expectCall(Plane)
      .fromPoints([0, 0, 0], [1, 1, 1], [1, 0, 1], [2, 0, 2])
      .to.geo.equal(new Plane([0, 0, 0], [1, 0, -1]));
    expect(() => Plane.fromPoints([0, 0, 0], [1, 1, 1], [1, 0, 1], [0, 0, 1])).to.throw(
      OutOfRangeError,
    );
  });

  it('throws if built from invalid arguments', () => {
    expect(() => new Plane([0, 0, 0], [0, 1, 0], [0, 2, 0])).to.throw(OutOfRangeError, /colinear/);
    expect(() => new Plane([0, 0, 0], [0, 0, 0])).to.throw(OutOfRangeError, /unique points/);
  });
});
