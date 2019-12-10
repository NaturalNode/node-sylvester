import { expect } from 'chai';
import { Line, Plane, Vector, DimensionalityMismatchError } from '../src';
import { asDiagram } from './_as-diagram';

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
    expectCall(lineA).translate([2, 3]).to.line.equal([2, 3], [1, 1]);
  });

  asDiagram('Line.isParallelTo').it(expectCall => {
    expectCall(lineA).isParallelTo(new Line([1, 0], [1, 1])).to.be.true;
    expectCall(lineA).isParallelTo(lineB).to.be.false;
    expectCall(lineA).isParallelTo(Plane.create([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.true;
    expectCall(lineA).isParallelTo(Plane.create([1, 1, 1], [0, 0, 0], [2, 1, 1])).to.be.false;
  });

  asDiagram('Line.distanceFrom').it(expectCall => {
    expectCall(lineA).distanceFrom(new Vector([1, 2])).to.approx.equal(0.707107);
    expectCall(lineA).distanceFrom(lineB).to.equal(0);
    expectCall(lineA).distanceFrom(lineA.translate([-1, 1])).to.approx.equal(1.414214);
  });

  asDiagram('Line.contains').it(expectCall => {
    expectCall(lineA).contains(new Vector([1, 2])).to.be.false;
    expectCall(lineA).contains(new Vector([3, 3])).to.be.true;
  });

  asDiagram('Line.positionOf').it(expectCall => {
    expectCall(lineA).positionOf(new Vector([2, 2])).to.approx.equal(2.828427);
    expectCall(lineA).positionOf(new Vector([-2, -2])).to.approx.equal(-2.828427);
    expectCall(lineA).contains(new Vector([3, 3])).to.be.true;
  });

  asDiagram('Line.liesIn').it(expectCall => {
    expectCall(lineA).liesIn(Plane.create([-1, -1, 0], [1, 1, 0], [2, 0, 1])).to.be.true;
    expectCall(lineA).liesIn(Plane.create([-1, -1, -1], [1, 1, 3], [2, 0, 1])).to.be.false;
  });

  asDiagram('Line.intersects').it(expectCall => {
    expectCall(lineA).intersects(new Line([1, 0], [1, 1])).to.be.false;
    expectCall(lineA).intersects(lineB).to.be.true;
    expectCall(lineA).intersects(Plane.create([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.false;
    expectCall(lineA).intersects(Plane.create([1, 1, 1], [0, 0, 0], [2, 1, 1])).to.be.true;
  });

  asDiagram('Line.intersectionWith').it(expectCall => {
    expectCall(lineA).intersectionWith(lineB.translate([0, 1])).to.vector.equal([0.5, 0.5, 0]);
    expectCall(lineA).intersectionWith(lineA.translate([0, 1])).to.be.null;
    expectCall(lineA).intersectionWith(lineA).to.be.null;

    expectCall(lineA).intersectionWith(Plane.create([-1, -1, -1], [1, 1, 3], [2, 0, 1])).to.vector.equal([-0.5, -0.5, 0]);
    expectCall(lineA).intersectionWith(Plane.create([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.null;
  });

  asDiagram('Line.pointClosestTo').it(expectCall => {
    expectCall(lineA).pointClosestTo([3, 1]).to.vector.equal([2, 2, 0]);
    expectCall(lineA).pointClosestTo([1, 1]).to.vector.equal([1, 1]);

    expectCall(lineA).pointClosestTo(lineB.translate([0, 1])).to.vector.equal([0.5, 0.5, 0]);
    expectCall(lineA).pointClosestTo(lineA.translate([0, 1])).to.be.null;
    expectCall(lineA).pointClosestTo(new Line([0, 1, 1], [1, 1, 3])).to.vector.equal([0.166666, 0.166666, 0]);

    expectCall(lineA).pointClosestTo(Plane.create([-1, -1, -1], [1, 1, 3], [2, 0, 1])).to.vector.equal([-0.5, -0.5, 0]);
    expectCall(lineA).pointClosestTo(Plane.create([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.be.null;
  });

  asDiagram('Line.rotate').it(expectCall => {
    expectCall(lineA).rotate(Math.PI / 2, Line.X)
      .to.line.equal([0, 0], [1, 0, 1]);
    expectCall(lineA).rotate(Math.PI / 2, Line.Y)
      .to.line.equal([0, 0], [0, 1, -1]);
    expectCall(lineA).rotate(Math.PI / 2, Line.Z)
      .to.line.equal([0, 0], [-1, 1, 0]);

    expectCall(lineA).rotate(Math.PI / 2, new Line([0, 0, 0], [1, 1, 1]))
      .to.line.equal([0, 0], [0.063156, 0.879654, 0.471402]);
  });

  asDiagram('Line.reverse').it(expectCall => {
    expectCall(lineA).reverse().to.line.equal([0, 0], [-1, -1]);
  });

  asDiagram('Line.reflectionIn').it(expectCall => {
    expectCall(lineA).reflectionIn([-1, 1]).to.line.equal([-2, 2], [1, 1]);
    expectCall(lineA).reflectionIn(Line.Y).to.line.equal([0, 0], [-1, 1]);
    expectCall(lineA).reflectionIn(Plane.create([1, 1, 1], [0, 0, 1], [2, 1, 1])).to.line.equal([0, 0, 2], [1, 1, 0]);
  });
});
