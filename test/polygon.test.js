import { Polygon, Vertex } from '../src/polygon';
import { expect } from 'chai';
import { asDiagram } from './_as-diagram';
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

  asDiagram('Polygon.v').it(expectCall => {
    expectCall(simple)
      .v(1)
      .to.vector.equal([0, 0, 0]);
    expect(simple.v(2)).to.vector.equal([1, 0, 0]);
    expect(simple.v(3)).to.vector.equal([0, 1, 0]);
    expectCall(simple)
      .v(4)
      .to.vector.equal([0, 0, 0]);
  });

  asDiagram('Polygon.translate').it(expectCall => {
    expectCall(simple)
      .translate([1, 2, 3])
      .to.geo.equal(
        new Polygon([
          [1, 2, 3],
          [2, 2, 3],
          [1, 3, 3],
        ]),
      );
  });

  asDiagram('Polygon.rotate').it(expectCall => {
    expectCall(simple)
      .rotate(Math.PI / 2, Line.Z)
      .to.geo.equal(
        new Polygon([
          [0, 0, 0],
          [0, 1, 0],
          [-1, 0, 0],
        ]),
      );
  });

  asDiagram('Polygon.scale').it(expectCall => {
    expectCall(simple)
      .scale(2, [-1, -1, 0])
      .to.geo.equal(
        new Polygon([
          [1, 1, 0],
          [3, 1, 0],
          [1, 3, 0],
        ]),
      );
    expectCall(simple)
      .scale(2)
      .to.geo.equal(
        new Polygon([
          [0, 0, 0],
          [2, 0, 0],
          [0, 2, 0],
        ]),
      );
  });

  asDiagram('Polygon.isTriangle').it(expectCall => {
    expectCall(simple).isTriangle().to.be.true;
    expectCall(
      new Polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
    ).isTriangle().to.be.false;
  });

  asDiagram('Polygon.area').it(expectCall => {
    expectCall(simple)
      .area()
      .to.approx.equal(0.5);
    expectCall(
      new Polygon([
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
    )
      .area()
      .to.approx.equal(1);
    expectCall(
      new Polygon([
        [0, 0],
        [0.5, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]),
    )
      .area()
      .to.approx.equal(1);
    expectCall(complex)
      .area()
      .to.approx.equal(30);
  });

  asDiagram('Polygon.centroid').it(expectCall => {
    expectCall(simple)
      .centroid()
      .to.vector.equal([1 / 3, 1 / 3, 0]);
    expectCall(complex)
      .centroid()
      .to.vector.equal([7.166667, 7.611111, 0]);
  });

  asDiagram('Polygon.projectionOn').it(expectCall => {
    expectCall(simple)
      .projectionOn(new Plane([0, 0, 1], [1, 0, 2]))
      .to.geo.equal(
        new Polygon([
          [0.4, 0, 0.8],
          [1.2, 0, 0.4],
          [0.4, 1, 0.8],
        ]),
      );
  });

  asDiagram('Polygon.removeVertex').it(expectCall => {
    const p1 = new Polygon([
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]);
    const p2 = p1.removeVertex(p1.v(2));
    expectCall(p1).removeVertex(p1.v(2)); // for docs
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

  asDiagram('Polygon.contains').it(expectCall => {
    expectCall(complex).contains([7, 8, 1]).to.be.false;
    expectCall(complex).contains([7, 8, 0]).to.be.true;
    expect(complex.contains([3, 4, 0])).to.be.false;
    expect(complex.contains([4, 7.5, 0])).to.be.false; // edge
  });

  asDiagram('Polygon.toTriangles').it(expectCall => {
    const result = complex.toTriangles();
    expectCall(complex).toTriangles(); // for docs

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
    expect(complex.inspect()).to.equal(
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
