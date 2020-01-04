import { Polygon, Vertex } from '../src/polygon';
import { expect } from 'chai';
import { record } from './docs/record';
import { Line, Plane, Vector } from '../src';

describe('polygon', () => {
  const simple = new Polygon([
    [0, 0],
    [1, 0],
    [0, 1],
  ]);
  const complex = new Polygon([
    [3, 4],
    [5, 11],
    [12, 8],
    [9, 5],
    [5, 6],
  ]);

  it('Polygon.v', () => {
    record(simple)
      .v(1)
      .to.vector.equal([0, 0, 0]);
    expect(simple.v(2)).to.vector.equal([1, 0, 0]);
    expect(simple.v(3)).to.vector.equal([0, 1, 0]);
    record(simple)
      .v(4)
      .to.vector.equal([0, 0, 0]);
  });

  it('Polygon.translate', () => {
    record(simple)
      .translate([1, 2, 3])
      .to.geo.equal(
        new Polygon([
          [1, 2, 3],
          [2, 2, 3],
          [1, 3, 3],
        ]),
      );
  });

  it('Polygon.rotate', () => {
    record(simple)
      .rotate(Math.PI / 2, Line.Z)
      .to.geo.equal(
        new Polygon([
          [0, 0, 0],
          [0, 1, 0],
          [-1, 0, 0],
        ]),
      );
  });

  it('Polygon.scale', () => {
    record(simple)
      .scale(2, [-1, -1, 0])
      .to.geo.equal(
        new Polygon([
          [1, 1, 0],
          [3, 1, 0],
          [1, 3, 0],
        ]),
      );
    record(simple)
      .scale(2)
      .to.geo.equal(
        new Polygon([
          [0, 0, 0],
          [2, 0, 0],
          [0, 2, 0],
        ]),
      );
  });

  it('Polygon.isTriangle', () => {
    record(simple).isTriangle().to.be.true;
    record(
      new Polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
    ).isTriangle().to.be.false;
  });

  it('Polygon.hasEdgeContaining', () => {
    record(simple).hasEdgeContaining(new Vector([1, 1, 1])).to.be.false;
    record(simple).hasEdgeContaining(new Vector([0, 0.5, 0])).to.be.true;
  });

  it('Polygon.area', () => {
    record(simple, { reset: p => p.decache() })
      .area()
      .to.approx.equal(0.5);
    record(
      new Polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
      { reset: p => p.decache() },
    )
      .area()
      .to.approx.equal(1);
    record(
      new Polygon([
        [0, 0],
        [0.5, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
      { reset: p => p.decache() },
    )
      .area()
      .to.approx.equal(1);
    record(complex, { reset: p => p.decache() })
      .area()
      .to.approx.equal(30);
  });

  it('Polygon.centroid', () => {
    record(simple, { reset: p => p.decache() })
      .centroid()
      .to.vector.equal([1 / 3, 1 / 3, 0]);
    record(complex, { reset: p => p.decache() })
      .centroid()
      .to.vector.equal([7.166667, 7.611111, 0]);
  });

  it('Polygon.projectionOn', () => {
    record(simple)
      .projectionOn(new Plane([0, 0, 1], [1, 0, 2]))
      .to.geo.equal(
        new Polygon([
          [0.4, 0, 0.8],
          [1.2, 0, 0.4],
          [0.4, 1, 0.8],
        ]),
      );
  });

  it('Polygon.removeVertex', () => {
    const p1 = new Polygon([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    const p2 = p1.removeVertex(p1.v(2));
    record(p1).removeVertex(p1.v(2)); // for docs
    expect(p2).to.geo.equal(
      new Polygon([
        [0, 0],
        [1, 1],
        [0, 1],
      ]),
    );
    expect(p1.removeVertex(new Vertex([-1, 0]))).to.geo.equal(p1);
    expect(p2.removeVertex(p2.v(1))).to.geo.equal(p2);
  });

  it('Polygon.contains', () => {
    record(complex).contains([7, 8, 1]).to.be.false;
    record(complex).contains([7, 8, 0]).to.be.true;
    expect(complex.contains([3, 4, 0])).to.be.false;
    expect(complex.contains([4, 7.5, 0])).to.be.false; // edge
  });

  it('Polygon.toTriangles', () => {
    const result = complex.toTriangles();
    record(complex, { reset: p => p.decache() }).toTriangles(); // for docs

    for (const triangle of result) {
      expect(triangle.isTriangle()).to.be.true;
    }

    const area = result.reduce((acc, t) => t.area() + acc, 0);
    expect(area).to.approx.equal(30);
  });

  it('equals', () => {
    expect(complex.eql({})).to.be.false;
    expect(complex.eql(simple)).to.be.false;
    expect(complex.eql(complex.translate([1, 0, 0]))).to.be.false;
    expect(complex.eql(complex.translate([0, 0, 0]))).to.be.true;
  });

  it('inspects', () => {
    expect(complex.toString()).to.equal(
      'Polygon<Vector<[3, 4, 0]> -> Vector<[5, 11, 0]> -> Vector<[12, 8, 0]> -> Vector<[9, 5, 0]> -> Vector<[5, 6, 0]>>',
    );
  });

  it('detects convex vs reflex vertices', () => {
    expect(complex.v(1).isConvex(complex)).to.be.true;
    expect(complex.v(1).isReflex(complex)).to.be.false;
    expect(complex.v(5).isConvex(complex)).to.be.false;
    expect(complex.v(5).isReflex(complex)).to.be.true;
  });
});
