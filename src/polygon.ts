import { Line } from './line';
import { Matrix } from './matrix';
import { Plane } from './plane';
import { Sylvester, InvalidOperationError } from './sylvester';
import { Vector } from './vector';
import { VectorOrList } from './likeness';

export class Polygon {
  /**
   * Plane on which the polygon lies.
   */
  public readonly plane: Plane;

  /**
   * Polygon verticies.
   */
  public readonly vertices: ReadonlyArray<Vertex>;

  private surfaceIntegralElements?: ReadonlyArray<Polygon>;
  private triangles?: ReadonlyArray<Polygon>;
  private convexVertices: Vertex[];
  private reflexVertices: Vertex[];

  /**
   * Creates a new polygon formed from the given points, optionally projected
   * onto the plane.
   */
  constructor(points: ReadonlyArray<VectorOrList>, plane: Plane) {
    if (points.length === 0) {
      throw new InvalidOperationError('Cannot create a polygon with zero points');
    }

    this.vertices = points.map(point => (point instanceof Vertex ? point : new Vertex(point)));
    this.plane = plane || Plane.fromPoints(...this.vertices);

    this.convexVertices = [];
    this.reflexVertices = [];
    this.vertices.forEach(node => {
      if (node.isConvex(this)) {
        this.convexVertices.push(node);
      } else {
        this.reflexVertices.push(node);
      }
    });
  }

  /**
   * Returns whether the other polygon is equal to this one.
   * @param epsilon - precision used for calculating equality
   */
  public eql(other: unknown, epsilon = Sylvester.precision) {
    if (!(other instanceof Polygon) || other.vertices.length !== this.vertices.length) {
      return false;
    }

    for (let i = 0; i < this.vertices.length; i++) {
      if (!other.vertices[i].eql(this.vertices[i], epsilon)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns the vertex at the given position on the vertex list, numbered from 1.
   * @diagram Polygon.v
   */
  public v(i: number) {
    i--;
    return i < 0
      ? this.vertices[this.vertices.length - (-i % this.vertices.length)]
      : this.vertices[i % this.vertices.length];
  }

  /**
   * Translates the polygon by the given vector and returns the polygon.
   * @diagram Polygon.translate
   */
  public translate(vector: VectorOrList) {
    const elements = Vector.toElements(vector, 3);
    return new Polygon(
      this.vertices.map(v => v.add(elements)),
      this.plane.translate(elements),
    );
  }

  /**
   * Rotates the polygon about the given line and returns the polygon.
   * @param t - degrees in radians
   * @diagram Polygon.rotate
   */
  public rotate(t: number, line: Line) {
    const R = Matrix.Rotation(t, line.direction);
    return new Polygon(
      this.vertices.map(v => v.rotate3D(R, line)),
      this.plane.rotate(R, line),
    );
  }

  /**
   * Scales the polygon relative to the given point and returns the polygon.
   * @param k - amount of scale
   * @param point - origin to scale from
   * @diagram Polygon.scale
   */
  public scale(k: number, point: VectorOrList = Vector.Zero(3)) {
    const P = Vector.toElements(point, 3);

    return new Polygon(
      this.vertices.map(node => {
        const E = node.elements;
        return new Vector([
          P[0] + k * (E[0] - P[0]),
          P[1] + k * (E[1] - P[1]),
          P[2] + k * (E[2] - P[2]),
        ]);
      }),
      new Plane(this.vertices[0], this.plane.normal),
    );
  }

  /**
   * Returns true iff the polygon is a triangle.
   * @diagram Polygon.isTriangle
   */
  isTriangle() {
    return this.vertices.length === 3;
  }
  /**
   * Returns a collection of triangles used for calculating area and center of mass.
   * Some of the triangles will not lie inside the polygon - this collection is essentially
   * a series of itervals in a surface integral, so some are 'negative'. If you want the
   * polygon broken into constituent triangles, use toTriangles(). This method is used
   * because it's much faster than toTriangles().
   * The triangles generated share vertices with the original polygon, so they transform
   * with the polygon. They are cached after first calculation and should remain in sync
   * with changes to the parent polygon.
   * @private
   */
  trianglesForSurfaceIntegral() {
    if (this.surfaceIntegralElements) {
      return this.surfaceIntegralElements;
    }

    const triangles: Polygon[] = [];
    const plane = this.plane;
    for (let i = 2; i < this.vertices.length; i++) {
      const a = this.vertices[0].elements;
      const b = this.vertices[i - 1].elements;
      const c = this.vertices[i].elements;

      // If the vertices lie on a straight line, give the polygon's own plane. If the
      // element has no area, it doesn't matter which way its normal faces.
      const colinear =
        (a[1] - b[1]) * (a[0] - c[0]) - (c[1] - a[1]) * (a[0] - b[0]) < Sylvester.precision;

      triangles.push(
        new Polygon(
          [this.vertices[0], this.vertices[i - 1], this.vertices[i]],
          colinear ? plane : Plane.fromPoints(a, b, c),
        ),
      );
    }

    this.surfaceIntegralElements = triangles;
    return triangles;
  }

  /**
   * Returns the area of the polygon. Requires that the polygon
   * be converted to triangles, so use with caution.
   * @diagram Polygon.area
   */
  area() {
    if (this.isTriangle()) {
      // Area is half the modulus of the cross product of two sides
      const a = this.vertices[0].elements;
      const b = this.vertices[1].elements;
      const c = this.vertices[2].elements;

      return (
        0.5 *
        new Vector([
          (a[1] - b[1]) * (c[2] - b[2]) - (a[2] - b[2]) * (c[1] - b[1]),
          (a[2] - b[2]) * (c[0] - b[0]) - (a[0] - b[0]) * (c[2] - b[2]),
          (a[0] - b[0]) * (c[1] - b[1]) - (a[1] - b[1]) * (c[0] - b[0]),
        ]).magnitude()
      );
    }

    const trigs = this.trianglesForSurfaceIntegral();
    let area = 0;
    for (let i = 0; i < trigs.length; i++) {
      area += trigs[i].area() * trigs[i].plane.normal.dot(this.plane.normal);
    }

    return area;
  }

  /**
   * Returns the centroid of the polygon. Requires division into
   * triangles - use with caution.
   * @diagram Polygon.centroid
   */
  centroid() {
    if (this.isTriangle()) {
      const A = this.v(1).elements;
      const B = this.v(2).elements;
      const C = this.v(3).elements;
      return new Vector([
        (A[0] + B[0] + C[0]) / 3,
        (A[1] + B[1] + C[1]) / 3,
        (A[2] + B[2] + C[2]) / 3,
      ]);
    }

    let V = Vector.Zero(3);
    const trigs = this.trianglesForSurfaceIntegral();
    let M = 0;
    let i = trigs.length;
    while (i--) {
      const A = trigs[i].area() * trigs[i].plane.normal.dot(this.plane.normal);
      M += A;
      const P = V.elements;
      const C = trigs[i].centroid().elements;

      V = new Vector([P[0] + C[0] * A, P[1] + C[1] * A, P[2] + C[2] * A]);
    }

    return V.x(1 / M);
  }

  /**
   * Returns the polygon's projection on the given plane as another polygon
   * @diagram Polygon.projectionOn
   */
  public projectionOn(plane: Plane) {
    return new Polygon(
      this.vertices.map(node => plane.pointClosestTo(node)),
      plane,
    );
  }

  /**
   * Removes the given vertex from the polygon as long as it's not triangular.
   * No-op if it is triangular, or if the vertex doesn't exist.
   * @diagram Polygon.removeVertex
   */
  public removeVertex(vertex: Vector) {
    if (this.isTriangle()) {
      return this;
    }

    return new Polygon(
      this.vertices.filter(n => !vertex.eql(n)),
      this.plane,
    );
  }

  /**
   * Returns true iff the point is strictly inside the polygon
   * @diagram Polygon.contains
   */
  public contains(point: VectorOrList, epsilon = Sylvester.precision): boolean {
    return this.containsByWindingNumber(point, epsilon);
  }

  /**
   * Returns true iff the given point is strictly inside the polygon using
   * the winding number method.
   * @diagram Polygon.contains
   */
  public containsByWindingNumber(point: VectorOrList, epsilon = Sylvester.precision): boolean {
    const P = Vector.toElements(point, 3);
    if (!this.plane.contains(P, epsilon)) {
      return false;
    }
    if (this.hasEdgeContaining(P, epsilon)) {
      return false;
    }

    let theta = 0;
    let loops = 0;
    const self = this;
    this.vertices.forEach((node, i) => {
      const V = node.elements;
      const W = this.v(i + 2).elements;
      const A = new Vector([V[0] - P[0], V[1] - P[1], V[2] - (P[2] || 0)]);
      const B = new Vector([W[0] - P[0], W[1] - P[1], W[2] - (P[2] || 0)]);
      const dt = A.angleFrom(B);
      if (dt === null || dt === 0) {
        return;
      }
      theta += (A.cross(B).isParallelTo(self.plane.normal) ? 1 : -1) * dt;
      if (theta >= 2 * Math.PI - epsilon) {
        loops++;
        theta -= 2 * Math.PI;
      }
      if (theta <= -2 * Math.PI + epsilon) {
        loops--;
        theta += 2 * Math.PI;
      }
    });

    return loops !== 0;
  }

  /**
   * Returns true if the given point lies on an edge of the polygon
   * May cause problems with 'hole-joining' edges.
   * @diagram Polygon.hasEdgeContaining
   */
  public hasEdgeContaining(point: VectorOrList, epsilon = Sylvester.precision): boolean {
    const P = Vector.toElements(point);
    return this.vertices.some((node, i) =>
      new Line.Segment(node, this.v(i + 2)).contains(P, epsilon),
    );
  }

  /**
   * Returns an array of 3-vertex polygons that the original has been split into.
   * @diagram Polygon.toTriangles
   */
  toTriangles() {
    if (!this.triangles) {
      this.triangles = this.triangulateByEarClipping();
    }

    return this.triangles;
  }

  /**
   * Implementation of ear clipping algorithm. Found in 'Triangulation by ear
   * clipping', by David Eberly at {@link http://www.geometrictools.com}. This
   * will not deal with overlapping sections - contruct your polygons sensibly.
   * @diagram Polygon.toTriangles
   */
  triangulateByEarClipping() {
    let poly: Polygon = this;
    const triangles = [];

    while (!poly.isTriangle()) {
      let success = false;
      let trig: Polygon;
      let mainNode: number;

      // Ear tips must be convex vertices - let's pick one at random
      let offset = Math.floor(Math.random() * poly.convexVertices.length);
      for (let i = 0; !success && i < poly.convexVertices.length; i++) {
        const convexNode = poly.convexVertices[(offset + i) % poly.convexVertices.length];
        mainNode = poly.vertices.indexOf(convexNode);
        const prev = poly.v(mainNode);
        const next = poly.v(mainNode + 2);

        // For convex vertices, this order will always be anticlockwise
        trig = new Polygon([convexNode, next, prev], this.plane);
        // Now test whether any reflex vertices lie within the ear
        success = !poly.reflexVertices.some(node => {
          // Don't test points belonging to this triangle. node won't be
          // equal to convexNode as node is reflex and vertex is convex.
          if (node !== prev && node !== next) {
            return trig.contains(node) || trig.hasEdgeContaining(node);
          }

          return false;
        });
      }

      if (!success) {
        throw new Error('Could not find any candidate veritices, this is a bug');
      }

      triangles.push(trig!);
      poly = poly.removeVertex(poly.vertices[mainNode!]);
    }
    // Need to do this to renumber the remaining vertices
    triangles.push(poly);
    return triangles;
  }

  /**
   * Returns a string representation of the polygon's vertices.
   */
  public toString() {
    const points: string[] = [];
    this.vertices.forEach(node => {
      points.push(node.toString());
    });
    return `Polygon<${points.join(' -> ')}>`;
  }

  /**
   * Removes cached data, used for benchmarking.
   * @hidden
   */
  public decache() {
    this.triangles = undefined;
    this.surfaceIntegralElements = undefined;
  }
}

export class Vertex extends Vector {
  constructor(point: VectorOrList) {
    super(Vector.toElements(point, 3));
  }

  /**
   * Returns true iff the vertex's internal angle is 0 <= x < 180
   * in the context of the given polygon object.
   * @throws A {@link InvalidOperationError} if the vertex is not in the polygon
   */
  public isConvex(polygon: Polygon, epsilon = Sylvester.precision): boolean {
    const node = polygon.vertices.indexOf(this);
    if (node === -1) {
      throw new InvalidOperationError('Provided vertex is not in the polygon');
    }
    const prev = polygon.v(node);
    const next = polygon.v(node + 2);
    const A = next.subtract(this);
    const B = prev.subtract(this);
    const theta = A.angleFrom(B);
    if (theta <= epsilon) {
      return true;
    }
    if (Math.abs(theta - Math.PI) <= epsilon) {
      return false;
    }
    return A.cross(B).dot(polygon.plane.normal) > 0;
  }

  /**
   * Returns true iff the vertex's internal angle is 180 <= x < 360.
   * @throws A {@link InvalidOperationError} if the vertex is not in the polygon
   */
  isReflex(polygon: Polygon) {
    const result = this.isConvex(polygon);
    return !result;
  }
}
