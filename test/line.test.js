import { expect } from 'chai';
import { Line, Plane, Vector, DimensionalityMismatchError } from '../src';
import { asDiagram } from './_as-diagram';
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

  asDiagram('Line.eql').it(expectCall => {
    expectCall(lineA).eql(new Line([1, 1], [-1, -1])).to.be.true;
    expectCall(lineA).eql(lineB).to.be.false;
  });

  asDiagram('Line.translate').it(expectCall => {
    expectCall(lineA)
      .translate([2, 3])
      .to.line.equal([2, 3], [1, 1]);
  });

  asDiagram('Line.isParallelTo').it(expectCall => {
    testParallelTo(Line, expectCall);
  });

  asDiagram('Line.isPerpendicularTo').it(expectCall => {
    testPerpendicularTo(Vector, expectCall);
  });

  asDiagram('Line.distanceFrom').it(expectCall => {
    testDistanceFrom(Line, expectCall);
  });

  asDiagram('Line.contains').it(expectCall => {
    expectCall(lineA).contains(new Vector([1, 2])).to.be.false;
    expectCall(lineA).contains(new Vector([3, 3])).to.be.true;
    expectCall(lineA).contains(new Segment([1, 1], [4, 4])).to.be.true;
    expectCall(lineA).contains(new Segment([1, 1], [1, 4])).to.be.false;
  });

  asDiagram('Line.positionOf').it(expectCall => {
    expectCall(lineA)
      .positionOf(new Vector([2, 2]))
      .to.approx.equal(2.828427);
    expectCall(lineA)
      .positionOf(new Vector([-2, -2]))
      .to.approx.equal(-2.828427);
    expectCall(lineA).positionOf(new Vector([3, 1])).to.be.null;
  });

  asDiagram('Line.liesIn').it(expectCall => {
    expectCall(lineA).liesIn(new Plane([-1, -1, 0], [1, 1, 0], [2, 0, 1])).to.be.true;
    expectCall(lineA).liesIn(new Plane([-1, -1, -1], [1, 1, 3], [2, 0, 1])).to.be.false;
  });

  asDiagram('Line.intersects').it(expectCall => {
    expectCall(lineA).intersects(new Line([1, 0], [1, 1])).to.be.false;
    expectCall(lineA).intersects(lineB).to.be.true;
    expectCall(lineA).intersects(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.false;
    expectCall(lineA).intersects(new Plane([1, 1, 1], [0, 0, 0], [2, 1, 1])).to.be.true;
  });

  asDiagram('Line.intersectionWith').it(expectCall => {
    testIntersectionWith(Line, expectCall);
  });

  asDiagram('Line.pointClosestTo').it(expectCall => {
    expectCall(lineA)
      .pointClosestTo([3, 1])
      .to.vector.equal([2, 2, 0]);
    expectCall(lineA)
      .pointClosestTo([1, 1])
      .to.vector.equal([1, 1, 0]);

    expectCall(lineA)
      .pointClosestTo(new Segment([-2, 2], [1, 2]))
      .to.vector.equal([1.5, 1.5, 0]);
    expectCall(lineA).pointClosestTo(new Segment([1, 1], [-1, -1])).to.be.null;

    expectCall(lineA)
      .pointClosestTo(lineB.translate([0, 1]))
      .to.vector.equal([0.5, 0.5, 0]);
    expectCall(lineA).pointClosestTo(lineA.translate([0, 1])).to.be.null;
    expectCall(lineA)
      .pointClosestTo(new Line([0, 1, 1], [1, 1, 3]))
      .to.vector.equal([0.166666, 0.166666, 0]);

    expectCall(lineA)
      .pointClosestTo(new Plane([-1, -1, -1], [1, 1, 3], [2, 0, 1]))
      .to.vector.equal([-0.5, -0.5, 0]);
    expectCall(lineA).pointClosestTo(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.null;
  });

  asDiagram('Line.rotate').it(expectCall => {
    expectCall(lineA)
      .rotate(Math.PI / 2, Line.X)
      .to.line.equal([0, 0], [1, 0, 1]);
    expectCall(lineA)
      .rotate(Math.PI / 2, Line.Y)
      .to.line.equal([0, 0], [0, 1, -1]);
    expectCall(lineA)
      .rotate(Math.PI / 2, Line.Z)
      .to.line.equal([0, 0], [-1, 1, 0]);

    expectCall(lineA)
      .rotate(Math.PI / 2, new Line([0, 0, 0], [1, 1, 1]))
      .to.line.equal([0, 0], [0.063156, 0.879654, 0.471402]);

    expectCall(lineA)
      .rotate(Math.PI, [0, 1])
      .to.line.equal([0, 2], [-1, -1, 0]);
  });

  asDiagram('Line.reverse').it(expectCall => {
    expectCall(lineA)
      .reverse()
      .to.line.equal([0, 0], [-1, -1]);
  });

  asDiagram('Line.reflectionIn').it(expectCall => {
    expectCall(lineA)
      .reflectionIn([-1, 1])
      .to.line.equal([-2, 2], [1, 1]);
    expectCall(lineA)
      .reflectionIn(Line.Y)
      .to.line.equal([0, 0], [-1, 1]);
    expectCall(lineA)
      .reflectionIn(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1]))
      .to.line.equal([0, 0, 2], [1, 1, 0]);
  });

  describe('segment', () => {
    const segA = new Segment([1, 2], [4, 6]);

    asDiagram('Segment.eql').it(expectCall => {
      expectCall(segA).eql(segA).to.be.true;
      expectCall(segA).eql(new Segment([4, 6], [1, 2])).to.be.true;
      expectCall(segA).eql(new Segment([1, 2], [4, 4])).to.be.false;
      expectCall(segA).eql(new Segment([2, 2], [4, 6])).to.be.false;
    });

    asDiagram('Segment.length').it(expectCall => {
      expectCall(segA)
        .length()
        .to.equal(5);
    });

    asDiagram('Segment.length').it(expectCall => {
      expectCall(segA)
        .toVector()
        .to.vector.equal([3, 4, 0]);
    });

    asDiagram('Segment.midpoint').it(expectCall => {
      expectCall(segA)
        .midpoint()
        .to.vector.equal([2.5, 4, 0]);
    });

    asDiagram('Segment.bisectingPlane').it(expectCall => {
      expectCall(segA)
        .bisectingPlane()
        .to.geo.equal(new Plane([2.5, 4], [3, 4]));
    });

    asDiagram('Segment.translate').it(expectCall => {
      expectCall(segA)
        .translate(new Vector([-2, -4]))
        .to.segment.equal([-1, -2], [2, 2]);
    });

    asDiagram('Segment.isParallelTo').it(expectCall => {
      testParallelTo(Segment, expectCall);
    });

    asDiagram('Segment.isPerpendicularTo').it(expectCall => {
      testPerpendicularTo(Segment, expectCall);
    });

    asDiagram('Segment.distanceFrom').it(expectCall => {
      testDistanceFrom(Segment, expectCall);
    });

    asDiagram('Segment.contains').it(expectCall => {
      expectCall(segA).contains(new Segment([2, 2 + 4 / 3], [4, 6])).to.be.true;
      expectCall(segA).contains(new Segment([0, 2 - 4 / 3], [4, 6])).to.be.false;

      expectCall(segA).contains(new Vector([2, 2 + 4 / 3])).to.be.true;
      expectCall(segA).contains(new Vector([2, 2])).to.be.false;
    });

    asDiagram('Segment.intersects').it(expectCall => {
      expectCall(segA).intersects(new Line([0, 0], [1, 1])).to.be.false;
      expectCall(segA).intersects(new Line([3, 0], [0, 1])).to.be.true;
      expectCall(segA).intersects(new Plane([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.false;
      expectCall(segA).intersects(new Plane([1, 1, 1], [0, 3, 0], [2, 1, 1])).to.be.true;
    });

    asDiagram('Segment.intersectionWith').it(expectCall => {
      testIntersectionWith(Segment, expectCall);
    });
  });
});
