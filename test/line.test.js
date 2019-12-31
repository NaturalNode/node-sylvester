import { expect } from 'chai';
import { Line, Plane, Vector, DimensionalityMismatchError } from '../src';
import { record } from './docs/record';
import { Segment } from '../src/line';
import {
  testParallelTo,
  testPerpendicularTo,
  testIntersectionWith,
  testDistanceFrom,
} from './_common-cases';

describe('line', () => {
  const lineA = new Line([0, 0], [1, 1]);
  const lineB = new Line([0, 0], [1, -1]);

  it('should create', () => {
    const line = new Line([1, 2], [3, 4]);
    expect(line.anchor).to.vector.equal([1, 2, 0]);
    expect(line.direction).to.vector.equal([3 / 5, 4 / 5, 0]);
    expect(() => new Line([0, 0], [0, 0])).to.throw(DimensionalityMismatchError);
  });

  it('Line.eql', () => {
    record(lineA).eql(new Line([1, 1], [-1, -1])).to.be.true;
    record(lineA).eql(lineB).to.be.false;
  });

  it('Line.translate', () => {
    record(lineA)
      .translate([2, 3])
      .to.line.equal([2, 3], [1, 1]);
  });

  it('Line.isParallelTo', () => {
    testParallelTo(Line);
  });

  it('Line.isPerpendicularTo', () => {
    testPerpendicularTo(Vector);
  });

  it('Line.distanceFrom', () => {
    testDistanceFrom(Line);
  });

  it('Line.contains', () => {
    record(lineA).contains(new Vector([1, 2])).to.be.false;
    record(lineA).contains(new Vector([3, 3])).to.be.true;
    record(lineA).contains(new Segment([1, 1], [4, 4])).to.be.true;
    record(lineA).contains(new Segment([1, 1], [1, 4])).to.be.false;
  });

  it('Line.positionOf', () => {
    record(lineA)
      .positionOf(new Vector([2, 2]))
      .to.approx.equal(2.828427);
    record(lineA)
      .positionOf(new Vector([-2, -2]))
      .to.approx.equal(-2.828427);
    record(lineA).positionOf(new Vector([3, 1])).to.be.null;
  });

  it('Line.liesIn', () => {
    record(lineA).liesIn(new Plane([-1, -1, 0], [1, 1, 0], [2, 0, 1])).to.be.true;
    record(lineA).liesIn(new Plane([-1, -1, -1], [1, 1, 3], [2, 0, 1])).to.be.false;
  });

  it('Line.intersects', () => {
    record(lineA).intersects(new Line([1, 0], [1, 1])).to.be.false;
    record(lineA).intersects(lineB).to.be.true;
    record(lineA).intersects(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.false;
    record(lineA).intersects(new Plane([1, 1, 1], [0, 0, 0], [2, 1, 1])).to.be.true;
  });

  it('Line.intersectionWith', () => {
    testIntersectionWith(Line);
  });

  it('Line.pointClosestTo', () => {
    record(lineA)
      .pointClosestTo([3, 1])
      .to.vector.equal([2, 2, 0]);
    record(lineA)
      .pointClosestTo([1, 1])
      .to.vector.equal([1, 1, 0]);

    record(lineA)
      .pointClosestTo(new Segment([-2, 2], [1, 2]))
      .to.vector.equal([1.5, 1.5, 0]);
    record(lineA).pointClosestTo(new Segment([1, 1], [-1, -1])).to.be.null;

    record(lineA)
      .pointClosestTo(lineB.translate([0, 1]))
      .to.vector.equal([0.5, 0.5, 0]);
    record(lineA).pointClosestTo(lineA.translate([0, 1])).to.be.null;
    record(lineA)
      .pointClosestTo(new Line([0, 1, 1], [1, 1, 3]))
      .to.vector.equal([0.166666, 0.166666, 0]);

    record(lineA)
      .pointClosestTo(new Plane([-1, -1, -1], [1, 1, 3], [2, 0, 1]))
      .to.vector.equal([-0.5, -0.5, 0]);
    record(lineA).pointClosestTo(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.null;
  });

  it('Line.rotate', () => {
    record(lineA)
      .rotate(Math.PI / 2, Line.X)
      .to.line.equal([0, 0], [1, 0, 1]);
    record(lineA)
      .rotate(Math.PI / 2, Line.Y)
      .to.line.equal([0, 0], [0, 1, -1]);
    record(lineA)
      .rotate(Math.PI / 2, Line.Z)
      .to.line.equal([0, 0], [-1, 1, 0]);

    record(lineA)
      .rotate(Math.PI / 2, new Line([0, 0, 0], [1, 1, 1]))
      .to.line.equal([0, 0], [0.063156, 0.879654, 0.471402]);

    record(lineA)
      .rotate(Math.PI, [0, 1])
      .to.line.equal([0, 2], [-1, -1, 0]);
  });

  it('Line.reverse', () => {
    record(lineA)
      .reverse()
      .to.line.equal([0, 0], [-1, -1]);
  });

  it('Line.reflectionIn', () => {
    record(lineA)
      .reflectionIn([-1, 1])
      .to.line.equal([-2, 2], [1, 1]);
    record(lineA)
      .reflectionIn(Line.Y)
      .to.line.equal([0, 0], [-1, 1]);
    record(lineA)
      .reflectionIn(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1]))
      .to.line.equal([0, 0, 2], [1, 1, 0]);
  });

  describe('segment', () => {
    const segA = new Segment([1, 2], [4, 6]);

    it('Segment.eql', () => {
      record(segA).eql(segA).to.be.true;
      record(segA).eql(new Segment([4, 6], [1, 2])).to.be.true;
      record(segA).eql(new Segment([1, 2], [4, 4])).to.be.false;
      record(segA).eql(new Segment([2, 2], [4, 6])).to.be.false;
    });

    it('Segment.length', () => {
      record(segA)
        .length()
        .to.equal(5);
    });

    it('Segment.length', () => {
      record(segA)
        .toVector()
        .to.vector.equal([3, 4, 0]);
    });

    it('Segment.midpoint', () => {
      record(segA)
        .midpoint()
        .to.vector.equal([2.5, 4, 0]);
    });

    it('Segment.bisectingPlane', () => {
      record(segA)
        .bisectingPlane()
        .to.geo.equal(new Plane([2.5, 4], [3, 4]));
    });

    it('Segment.translate', () => {
      record(segA)
        .translate(new Vector([-2, -4]))
        .to.segment.equal([-1, -2], [2, 2]);
    });

    it('Segment.isParallelTo', () => {
      testParallelTo(Segment);
    });

    it('Segment.isPerpendicularTo', () => {
      testPerpendicularTo(Segment);
    });

    it('Segment.distanceFrom', () => {
      testDistanceFrom(Segment);
    });

    it('Segment.contains', () => {
      record(segA).contains(new Segment([2, 2 + 4 / 3], [4, 6])).to.be.true;
      record(segA).contains(new Segment([0, 2 - 4 / 3], [4, 6])).to.be.false;

      record(segA).contains(new Vector([2, 2 + 4 / 3])).to.be.true;
      record(segA).contains(new Vector([2, 2])).to.be.false;
    });

    it('Segment.intersects', () => {
      record(segA).intersects(new Line([0, 0], [1, 1])).to.be.false;
      record(segA).intersects(new Line([3, 0], [0, 1])).to.be.true;
      record(segA).intersects(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.false;
      record(segA).intersects(new Plane([1, 1, 1], [0, 3, 0], [2, 1, 1])).to.be.true;
    });

    it('Segment.intersectionWith', () => {
      testIntersectionWith(Segment);
    });
  });
});
