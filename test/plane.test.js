import { expect } from 'chai';
import { Plane, Line, Matrix, OutOfRangeError, Vector, Segment } from '../src';
import { record } from './docs/record';
import {
  testParallelTo,
  testPerpendicularTo,
  testIntersectionWith,
  testDistanceFrom,
} from './_common-cases';

describe('plane', () => {
  it('Plane.isPerpendicularTo', () => {
    testPerpendicularTo(Plane);
  });

  it('Plane.isParallelTo', () => {
    testParallelTo(Plane);
  });

  it('Plane.intersectionWith', () => {
    testIntersectionWith(Plane);
  });

  it('Plane.distanceFrom', () => {
    testDistanceFrom(Plane);
  });

  it('Plane.pointClosestTo', () => {
    const p = new Plane([1, 2, 3], [1, 0, 1]);
    record(p)
      .pointClosestTo(new Vector([5, 3, 1]))
      .to.vector.equal([4, 3, 0]);
    record(p)
      .pointClosestTo(new Line([0, 0], [1, 1, 1]))
      .to.vector.equal([2, 2, 2]);
    record(p).pointClosestTo(new Line([0, 0], [0, 1, 0])).to.be.null;
  });

  it('Plane.intersects', () => {
    const p = new Plane([1, 2, 3], [1, 0, 1]);
    record(p).intersects(new Vector([2, 2, 2])).to.be.true;
    record(p).intersects(new Vector([2, 2, 1])).to.be.false;

    record(p).intersects(new Line([0, 0, 0], [0, 1, 1])).to.be.true;
    record(p).intersects(new Line([0, 0, 0], [0, 1, 0])).to.be.false;

    record(p).intersects(new Segment([0, 0, 0], [0, 0, 1])).to.be.false;
    record(p).intersects(new Segment([0, 0, 0], [0, 0, 10])).to.be.true;
    record(p).intersects(new Segment([0, 0, 0], [0, 10, 0])).to.be.false;

    record(p).intersects(new Plane([0, 0, 0], [2, 0, 2])).to.be.false;
    record(p).intersects(new Plane([0, 0, 0], [0, 1, 0])).to.be.true;
  });

  it('Plane.contains', () => {
    const p = new Plane([1, 2, 3], [1, 0, 1]);
    record(p).contains(new Vector([2, 2, 2])).to.be.true;
    record(p).contains(new Vector([2, 2, 1])).to.be.false;

    record(p).contains(new Line([1, 2, 3], [0, 1, 0])).to.be.true;
    record(p).contains(new Line([1, 2, 3], [0, 0, 1])).to.be.false;
    record(p).contains(new Line([1, 2, 4], [0, 1, 0])).to.be.false;

    record(p).contains(new Segment([1, 2, 3], [1, 1, 3])).to.be.true;
    record(p).contains(new Segment([1, 2, 3], [1, 1, 4])).to.be.false;

    record(p).contains(new Plane([1, 5, 3], [2, 0, 2])).to.be.true;
    record(p).contains(new Plane([1, 5, 3], [2, 0, 1])).to.be.false;
  });

  it('Plane.translate', () => {
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .translate([3, 4, 5])
      .to.geo.equal(new Plane([4, 6, 8], [1, 0, 1]));
  });

  it('Plane.rotate', () => {
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .rotate(Math.PI / 2, Line.Z)
      .to.geo.equal(new Plane([-1, 1, 3], [0, 1, 1]));
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .rotate(Matrix.RotationZ(Math.PI / 2), Line.Z)
      .to.geo.equal(new Plane([-1, 1, 3], [0, 1, 1]));
  });

  it('Plane.reflectionIn', () => {
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn([0, 0, 0])
      .to.geo.equal(new Plane([-1, -2, -3], [1, 0, 1]));
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn(Line.Z)
      .to.geo.equal(new Plane([-1, -2, 3], [-1, 0, 1]));
    record(new Plane([1, 2, 3], [1, 0, 1]))
      .reflectionIn(new Plane([1, 1, 1], [1, 1, 0]))
      .to.geo.equal(new Plane([0, 1, 3], [0, -1, 1]));
  });

  it('Plane.fromPoints', () => {
    record(Plane)
      .fromPoints([0, 0, 0], [1, 1, 1], [1, 0, 1])
      .to.geo.equal(new Plane([0, 0, 0], [1, 0, -1]));
    record(Plane)
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
