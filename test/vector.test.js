import { expect } from 'chai';
import { Vector, DimensionalityMismatchError, Line, Plane, Matrix } from '../src';
import { record } from './docs/record';
import { testParallelTo, testPerpendicularTo, testDistanceFrom } from './_common-cases';

describe('vector', () => {
  const x = new Vector([3, 4]);

  it('Vector.magnitude', () => {
    record(x).magnitude().to.equal(5);
  });

  it('Vector.e', () => {
    record(x).e(0).to.be.null;
    record(x).e(1).to.equal(3);
    record(x).e(3).to.be.null;
  });

  it('Vector.toUnitVector', () => {
    record(x).toUnitVector().to.vector.equal([0.6, 0.8]);
    record(new Vector([0, 0]))
      .toUnitVector()
      .to.vector.equal([0, 0]);
  });

  it('Vector.dimensions', () => {
    record(x).dimensions().to.deep.equal({ rows: 1, cols: 2 });
  });

  it('Vector.rows', () => {
    record(x).rows().to.equal(1);
  });

  it('Vector.cols', () => {
    record(x).cols().to.equal(2);
  });

  it('Vector.product', () => {
    record(x).product().to.equal(12);
  });

  it('Vector.eql', () => {
    record(x).eql([3, 4]).to.be.true;
    record(x).eql([5, 6]).to.be.false;
    record(x).eql([7]).to.be.false;
  });

  it('Vector.angleFrom', () => {
    record(new Vector([1, 1]))
      .angleFrom(new Vector([1, 0]))
      .to.approx.equal(Math.PI / 4);

    record(new Vector([1, 1])).angleFrom(new Vector([-1, -0])).to.be.nan;

    expect(new Vector([1, 1]).angleFrom([1, 0])).to.approx.equal(Math.PI / 4);
    expect(new Vector([0, 0]).angleFrom(new Vector([-1, -0]))).to.be.nan;
    expect(() => new Vector([1, 2]).angleFrom(new Vector([2]))).to.throw(
      DimensionalityMismatchError,
    );
  });

  it('Vector.map', () => {
    expect(x.map((y) => y * 2)).to.vector.equal([6, 8]);
    expect(x.map((y, i) => i)).to.vector.equal([1, 2]);
  });

  it('Vector.each', () => {
    let sum = 0;
    x.each((y) => {
      sum += y;
    });
    expect(sum).to.equal(7);
  });

  it('Vector.isParallelTo', () => {
    testParallelTo(Vector);
  });

  it('Vector.isAntiparallelTo', () => {
    record(x).isAntiparallelTo(new Vector([-3, -4])).to.be.true;
    record(x).isAntiparallelTo(x).to.be.false;
    expect(x.isAntiparallelTo(Vector.Zero(2))).to.be.false;
  });

  it('Vector.isPerpendicularTo', () => {
    testPerpendicularTo(Vector);
  });

  it('Vector.dot', () => {
    record(x)
      .dot(new Vector([2, 3]))
      .to.equal(18);
    expect(() => x.dot(Vector.Zero(1))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.add', () => {
    record(x).add(2).to.vector.equal([5, 6]);
    record(x).add([3, 2]).to.vector.equal([6, 6]);
    expect(() => x.add(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.subtract', () => {
    record(x).subtract(2).to.vector.equal([1, 2]);
    record(x).subtract([3, 2]).to.vector.equal([0, 2]);
    expect(() => x.subtract(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.multiply', () => {
    record(x).multiply(2).to.vector.equal([6, 8]);
    record(x).multiply([3, 2]).to.vector.equal([9, 8]);
    expect(() => x.multiply(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.sum', () => {
    record(x).sum().to.equal(7);
  });

  it('Vector.chomp', () => {
    record(x).chomp(1).to.vector.equal([4]);
  });

  it('Vector.top', () => {
    record(x).top(1).to.vector.equal([3]);
  });

  it('Vector.augment', () => {
    record(x)
      .augment(new Vector([5]))
      .to.vector.equal([3, 4, 5]);
  });

  it('Vector.log', () => {
    record(x).log().to.vector.equal([1.0986122886681098, 1.38629436111989]);
    record(new Vector([2, 8]))
      .log(2)
      .to.vector.equal([1, 3]);
  });

  it('Vector.cross', () => {
    record(new Vector([2, 3, 4]))
      .cross([5, 6, 7])
      .to.vector.equal([-3, 6, -3]);
    expect(new Vector([2, 3, 4]).cross(new Vector([5, 6, 7]))).to.vector.equal([-3, 6, -3]);
    expect(() => new Vector([2, 3, 4]).cross(Vector.Zero(1))).to.throw(DimensionalityMismatchError);
    expect(() => Vector.Zero(1).cross(new Vector([2, 3, 4]))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.max', () => {
    record(x).max().to.equal(4);
    expect(Vector.Zero(0).max()).to.equal(0);
  });

  it('Vector.maxIndex', () => {
    record(x).maxIndex().to.equal(2);
    expect(Vector.Zero(0).maxIndex()).to.equal(-1);
  });

  it('Vector.indexOf', () => {
    record(x).indexOf(4).to.equal(2);
    expect(Vector.Zero(0).indexOf(0)).to.equal(-1);
  });

  it('Vector.round', () => {
    record(new Vector([1.5, 2.6, 3.1]))
      .round()
      .to.vector.equal([2, 3, 3]);
  });

  it('Vector.snapTo', () => {
    record(new Vector([0.4000000000001, 0.5]))
      .snapTo(0.4)
      .to.vector.equal([0.4, 0.5]);
    record(new Vector([-1, 0.25, 0.5, 0.75, 1]))
      .snapTo(0.3, 0.5)
      .to.vector.equal([-1, 0.3, 0.3, 0.3, 1]);
  });

  it('Vector.transpose', () => {
    record(x)
      .transpose()
      .to.matrix.equal([[3], [4]]);
  });

  it('Vector.distanceFrom', () => {
    testDistanceFrom(Vector);
  });

  it('Vector.liesOn', () => {
    record(x).liesOn(new Line(Vector.Zero(2), new Vector([-1, 0]))).to.be.false;
    record(x).liesOn(new Line(new Vector([7, 0]), new Vector([-1, 1]))).to.be.true;
  });

  it('Vector.liesIn', () => {
    const plane = new Plane(new Vector([1, -2, 0]), new Vector([3, 1, 4]), new Vector([0, -1, 2]));
    record(new Vector([2, -0.5, 2])).liesIn(plane).to.be.true;
    record(new Vector([3, 4, 5])).liesIn(plane).to.be.false;
  });

  it('Vector.rotate2D', () => {
    record(x)
      .rotate2D(Math.PI / 2, Vector.One(2))
      .to.vector.equal([-2, 3]);
    record(x)
      .rotate2D(Matrix.Rotation(Math.PI / 2), Vector.One(2))
      .to.vector.equal([-2, 3]);

    const rotationLine = new Line(Vector.Zero(3), new Vector([1, 1, -1]));
    record(new Vector([1, 2, 3]))
      .rotate3D(Math.PI / 2, rotationLine)
      .to.vector.equal([2.88675, -2.3094, 0.57735]);
    record(new Vector([1, 2, 3]))
      .rotate3D(Matrix.RotationZ(Math.PI / 2), Line.Z)
      .to.vector.equal([-2, 1, 3]);
    expect(() => x.rotate2D(0, Vector.Zero(4))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.reflectionIn', () => {
    record(x).reflectionIn(Vector.One(2)).to.vector.equal([-1, -2]);
    record(x)
      .reflectionIn(new Line(Vector.Zero(2), new Vector([1, 2])))
      .to.vector.equal([1.4, 4.8]);
    expect(() => x.reflectionIn(Vector.Zero(0))).to.throw(DimensionalityMismatchError);
  });

  it('Vector.chomp', () => {
    record(x).chomp(1).to.vector.equal([4]);
  });

  it('Vector.sum', () => {
    record(x).sum().to.equal(7);
  });

  it('Vector.augment', () => {
    record(x).augment([4, 5]).to.vector.equal([3, 4, 4, 5]);
  });

  it('toString', () => {
    expect(x.toString()).to.equal('Vector<[3, 4]>');
  });

  it('random', () => {
    const v = Vector.Random(3);
    expect(v.elements.length).to.equal(3);
    v.elements.forEach((e) => expect(e).to.be.within(0, 1));
  });

  it('to3D', () => {
    expect(Vector.One(0).to3D()).to.vector.equal([0, 0, 0]);
    expect(Vector.One(1).to3D()).to.vector.equal([1, 0, 0]);
    expect(Vector.One(2).to3D()).to.vector.equal([1, 1, 0]);
    expect(Vector.One(3).to3D()).to.vector.equal([1, 1, 1]);
    expect(() => Vector.One(4).to3D()).to.throw(DimensionalityMismatchError);
  });
});
