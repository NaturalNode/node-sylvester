import { expect } from 'chai';
import { Vector, DimensionalityMismatchError, Line, Plane } from '../src';
import { asDiagram } from './_as-diagram';

describe('vector', () => {
  const x = new Vector([3, 4]);

  asDiagram('Vector.magnitude').it(expectCall => {
    expectCall(x).magnitude().to.equal(5);
  });

  asDiagram('Vector.e').it(expectCall => {
    expectCall(x).e(0).to.be.null;
    expectCall(x).e(1).to.equal(3);
    expectCall(x).e(3).to.be.null;
  });

  asDiagram('Vector.toUnitVector').it(expectCall => {
    expectCall(x).toUnitVector().to.vector.equal([0.6, 0.8]);
    expectCall(new Vector([0, 0])).toUnitVector().to.vector.equal([0, 0]);
  });

  asDiagram('Vector.dimensions').it(expectCall => {
    expectCall(x).dimensions().to.deep.equal({ rows: 1, cols: 2 });
  });

  asDiagram('Vector.rows').it(expectCall => {
    expectCall(x).rows().to.equal(1);
  });

  asDiagram('Vector.cols').it(expectCall => {
    expectCall(x).cols().to.equal(2);
  });

  asDiagram('Vector.product').it(expectCall => {
    expectCall(x).product().to.equal(12);
  });

  asDiagram('Vector.eql').it(expectCall => {
    expectCall(x).eql([3, 4]).to.be.true;
    expectCall(x).eql([5, 6]).to.be.false;
    expectCall(x).eql([7]).to.be.false;
  });

  asDiagram('Vector.angleFrom').it(expectCall => {
    expectCall(new Vector([1, 1]))
      .angleFrom(new Vector([1, 0]))
      .to.approx.equal(Math.PI / 4);

    expectCall(new Vector([1, 1]))
      .angleFrom(new Vector([-1, -0]))
      .to.be.nan;

    expect(new Vector([1, 1]).angleFrom([1, 0])).to.approx.equal(Math.PI / 4);
    expect(new Vector([0, 0]).angleFrom(new Vector([-1, -0]))).to.be.nan;
    expect(() => new Vector([1, 2]).angleFrom(new Vector(2))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.map', () => {
    expect(x.map(y => y * 2)).to.vector.equal([6, 8]);
    expect(x.map((y, i) => i)).to.vector.equal([1, 2]);
  });

  it('Vector.each', () => {
    let sum = 0;
    x.each(y => {
      sum += y;
    });
    expect(sum).to.equal(7);
  });

  asDiagram('Vector.isParallelTo').it(expectCall => {
    expectCall(x).isParallelTo(new Vector([6, 8])).to.be.true;
    expectCall(x).isParallelTo(new Vector([1, 1])).to.be.false;
    expect(x.isParallelTo(Vector.Zero(2))).to.be.false;
  });

  asDiagram('Vector.isAntiparallelTo').it(expectCall => {
    expectCall(x).isAntiparallelTo(new Vector([-3, -4])).to.be.true;
    expectCall(x).isAntiparallelTo(x).to.be.false;
    expect(x.isAntiparallelTo(Vector.Zero(2))).to.be.false;
  });

  asDiagram('Vector.isPerpendicularTo').it(expectCall => {
    expectCall(x).isPerpendicularTo(new Vector([-4, 3])).to.be.true;
    expectCall(x).isPerpendicularTo(x).to.be.false;
  });

  asDiagram('Vector.dot').it(expectCall => {
    expectCall(x).dot(new Vector([2, 3])).to.equal(18);
    expect(() => x.dot(Vector.Zero(1))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.add').it(expectCall => {
    expectCall(x).add(2).to.vector.equal([5, 6]);
    expectCall(x).add([3, 2]).to.vector.equal([6, 6]);
    expect(() => x.add(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.subtract').it(expectCall => {
    expectCall(x).subtract(2).to.vector.equal([1, 2]);
    expectCall(x).subtract([3, 2]).to.vector.equal([0, 2]);
    expect(() => x.subtract(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.multiply').it(expectCall => {
    expectCall(x).multiply(2).to.vector.equal([6, 8]);
    expectCall(x).multiply([3, 2]).to.vector.equal([9, 8]);
    expect(() => x.multiply(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.sum').it(expectCall => {
    expectCall(x).sum().to.equal(7);
  });

  asDiagram('Vector.chomp').it(expectCall => {
    expectCall(x).chomp(1).to.vector.equal([4]);
  });

  asDiagram('Vector.top').it(expectCall => {
    expectCall(x).top(1).to.vector.equal([3]);
  });

  asDiagram('Vector.augment').it(expectCall => {
    expectCall(x).augment(new Vector([5])).to.vector.equal([3, 4, 5]);
  });

  asDiagram('Vector.log').it(expectCall => {
    expectCall(x).log().to.vector.equal([1.0986122886681098, 1.386294361119890]);
    expectCall(new Vector([2, 8])).log(2).to.vector.equal([1, 3]);
  });

  asDiagram('Vector.cross').it(expectCall => {
    expectCall(new Vector([2, 3, 4])).cross([5, 6, 7]).to.vector.equal([-3, 6, -3]);
    expect(new Vector([2, 3, 4]).cross(new Vector([5, 6, 7]))).to.vector.equal([-3, 6, -3]);
    expect(() => new Vector([2, 3, 4]).cross(Vector.Zero(1))).to.throw(DimensionalityMismatchError);
    expect(() => Vector.Zero(1).cross(new Vector([2, 3, 4]))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.max').it(expectCall => {
    expectCall(x).max().to.equal(4);
    expect(Vector.Zero(0).max()).to.equal(0);
  });

  asDiagram('Vector.maxIndex').it(expectCall => {
    expectCall(x).maxIndex().to.equal(2);
    expect(Vector.Zero(0).maxIndex()).to.equal(-1);
  });

  asDiagram('Vector.indexOf').it(expectCall => {
    expectCall(x).indexOf(4).to.equal(2);
    expect(Vector.Zero(0).indexOf(0)).to.equal(-1);
  });

  asDiagram('Vector.round').it(expectCall => {
    expectCall(new Vector([1.5, 2.6, 3.1])).round().to.vector.equal([2, 3, 3]);
  });

  asDiagram('Vector.snapTo').it(expectCall => {
    expectCall(new Vector([-1, 0.25, 0.5, 0.75, 1])).snapTo(0.3, 0.5).to.vector.equal([-1, 0.3, 0.3, 0.3, 1]);
  });

  asDiagram('Vector.transpose').it(expectCall => {
    expectCall(x).transpose().to.matrix.equal([[3], [4]]);
  });

  asDiagram('Vector.distanceFrom').it(expectCall => {
    expectCall(x).distanceFrom(Vector.Zero(2)).to.equal(5);
    expectCall(x).distanceFrom(Line.create(Vector.Zero(2), new Vector([-4, 3]))).to.equal(5);
    expect(() => x.distanceFrom(Vector.Zero(1))).to.throw(DimensionalityMismatchError);
  });

  asDiagram('Vector.liesOn').it(expectCall => {
    expectCall(x).liesOn(Line.create(Vector.Zero(2), new Vector([-1, 0]))).to.be.false;
    expectCall(x).liesOn(Line.create(new Vector([7, 0]), new Vector([-1, 1]))).to.be.true;
  });

  asDiagram('Vector.liesIn').it(expectCall => {
    const plane = Plane.create(
      new Vector([1, -2, 0]),
      new Vector([3, 1, 4]),
      new Vector([0, -1, 2]),
    );
    expectCall(new Vector([2, -0.5, 2])).liesIn(plane).to.be.true;
    expectCall(new Vector([3, 4, 5])).liesIn(plane).to.be.false;
  });

  asDiagram('Vector.rotate').it(expectCall => {
    expectCall(x).rotate(Math.PI / 2, Vector.One(2)).to.vector.equal([-2, 3]);

    const rotationLine = Line.create(Vector.Zero(3), new Vector([1, 1, -1]));
    expectCall(new Vector([1, 2, 3])).rotate(Math.PI / 2, rotationLine).to.vector.equal([2.88675, -2.30940, 0.57735]);
    expect(() => x.rotate(0, Vector.Zero(1))).to.throw(DimensionalityMismatchError);
    expect(() => Vector.Zero(3).rotate(0, Vector.Zero(1))).to.throw(DimensionalityMismatchError);
    expect(() => Vector.Zero(4).rotate(0, Vector.Zero(4))).to.throw(DimensionalityMismatchError);
  });

  it('chomp', () => {
    expect(x.chomp(1)).to.vector.equal([4]);
  });

  it('sum', () => {
    expect(x.sum()).to.equal(7);
  });

  it('augment', () => {
    expect(x.augment([4, 5])).to.vector.equal([3, 4, 4, 5]);
  });

  it('show allow for scalar addition', () => {
    const a = new Vector([2, 3, 4]);
    const b = a.add(1);
    expect(b).to.vector.equal([3, 4, 5]);
  });

  it('show add', () => {
    const a = new Vector([2, 3, 4]);
    const b = a.add(new Vector([2, 4, 8]));
    expect(b).to.vector.equal([undefined, 7, 12]);
  });
});
