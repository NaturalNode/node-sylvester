import { Line } from './line';
import { Matrix } from './matrix';
import { Sylvester, OutOfRangeError, InvalidOperationError } from './sylvester';
import { Vector } from './vector';
import { isPlaneLike, isLineLike, isSegmentLike, isVectorOrListLike, isGeometry, VectorOrList, Geometry } from './likeness';

export class Plane {
  /**
   * Plane anchor point.
   */
  public readonly anchor: Vector;

  /**
   * Plane normal from the anchor.
   */
  public readonly normal: Vector;

  /**
   * Creates a plan from the anchor point and normal to the plane. If three
   * arguments are specified, the normal is calculated by assuming the three
   * points should lie in the same plane. If only two are sepcified, the second
   * is taken to be the normal. Normal vector is normalised before storage.
   * @param {Vector|number[]} anchor
   * @param {Vector|number[]} v1
   * @param {?(Vector|number[])} v2
   * @returns {Plane}
   */
  constructor(anchor: VectorOrList, v1: VectorOrList, v2?: VectorOrList) {
    anchor = new Vector(anchor).to3D();
    v1 = new Vector(v1).to3D();
    v2 = v2 && new Vector(v2).to3D();
    const A1 = anchor.elements[0];
    const A2 = anchor.elements[1];
    const A3 = anchor.elements[2];
    const v11 = v1.elements[0];
    const v12 = v1.elements[1];
    const v13 = v1.elements[2];
    let normal;
    let mod;
    if (!v2) {
      mod = Math.sqrt(v11 * v11 + v12 * v12 + v13 * v13);
      if (mod === 0) {
        throw new OutOfRangeError('Vectors provided to the plane must refer to unique points');
      }

      normal = new Vector([v1.elements[0] / mod, v1.elements[1] / mod, v1.elements[2] / mod]);
    } else {
      const v21 = v2.elements[0];
      const v22 = v2.elements[1];
      const v23 = v2.elements[2];
      normal = new Vector([
        (v12 - A2) * (v23 - A3) - (v13 - A3) * (v22 - A2),
        (v13 - A3) * (v21 - A1) - (v11 - A1) * (v23 - A3),
        (v11 - A1) * (v22 - A2) - (v12 - A2) * (v21 - A1),
      ]);
      mod = normal.magnitude();
      if (mod === 0) {
        throw new OutOfRangeError(
          'Vectors provided to the plane must refer to unique, non-colinear points',
        );
      }

      normal = new Vector([
        normal.elements[0] / mod,
        normal.elements[1] / mod,
        normal.elements[2] / mod,
      ]);
    }

    this.anchor = anchor;
    this.normal = normal;
  }

  /**
   * Returns true iff the plane occupies the same space as the argument.
   * @param epsilon - precision used for comparing angles
   */
  public eql(plane: unknown, epsilon = Sylvester.precision): boolean {
    return plane instanceof Plane && this.contains(plane.anchor) && this.isParallelTo(plane, epsilon);
  }

  /**
   * Returns the result of translating the plane by the given vector
   */
  public translate(vector: VectorOrList): Plane {
    const V = Vector.toElements(vector, 3);
    return new Plane(
      [
        this.anchor.elements[0] + V[0],
        this.anchor.elements[1] + V[1],
        this.anchor.elements[2] + V[2],
      ],
      this.normal,
    );
  }

  /**
   * Returns true iff the plane is parallel to the argument. Will return true
   * if the planes are equal, or if you give a line and it lies in the plane.
   * @param epsilon - precision used for comparing angles
   */
  public isParallelTo(obj: Geometry, epsilon = Sylvester.precision): boolean {
    if (isPlaneLike(obj)) {
      return this.normal.isParallelTo(obj.normal, epsilon);
    } else if (isLineLike(obj)) {
      return this.normal.isPerpendicularTo(obj.direction, epsilon);
    } else if (isSegmentLike(obj)) {
      return this.normal.isPerpendicularTo(obj.line.direction, epsilon);
    } else if (isVectorOrListLike(obj)) {
      return this.normal.isPerpendicularTo(obj, epsilon);
    } else {
      throw new InvalidOperationError(`Cannot check whether ${obj} is parallel to a plane`);
    }
  }

  /**
   * Returns true iff the receiver is perpendicular to the argument.
   * @param epsilon - precision used for comparing angles
   */
  public isPerpendicularTo(obj: Geometry, epsilon = Sylvester.precision): boolean {
    if (isPlaneLike(obj)) {
      return this.normal.isPerpendicularTo(obj.normal, epsilon);
    } else if (isLineLike(obj)) {
      return this.normal.isParallelTo(obj.direction, epsilon);
    } else if (isSegmentLike(obj)) {
      return this.normal.isParallelTo(obj.line.direction, epsilon);
    } else if (isVectorOrListLike(obj)) {
      return this.normal.isParallelTo(obj, epsilon);
    } else {
      throw new InvalidOperationError(`Cannot check whether ${obj} is parallel to a plane`);
    }
  }

  /**
   * Returns the plane's distance from the given object (point, line or plane)
   */
  public distanceFrom(obj: Geometry): number {
    if (this.intersects(obj) || this.contains(obj)) {
      return 0;
    }

    if (isSegmentLike(obj)) {
      return Math.min(this.distanceFrom(obj.start), this.distanceFrom(obj.end));
    } else if (isLineLike(obj) || isPlaneLike(obj)) {
      const A = this.anchor.elements;
      const B = obj.anchor.elements;
      const N = this.normal.elements;
      return Math.abs((A[0] - B[0]) * N[0] + (A[1] - B[1]) * N[1] + (A[2] - B[2]) * N[2]);
    } else if (isVectorOrListLike(obj)) {
      const P = Vector.toElements(obj, 3);
      const A = this.anchor.elements;
      const N = this.normal.elements;
      return Math.abs((A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - P[2]) * N[2]);
    } else {
      throw new InvalidOperationError(`Cannot get plane distance from {obj}`);
    }
  }

  /**
   * Returns true iff the plane contains the given point or line.
   * @param epsilon - precision used for comparing angles
   */
  public contains(obj: Geometry, epsilon = Sylvester.precision): boolean {
    if (isLineLike(obj)) {
      return (
        this.contains(obj.anchor, epsilon) && this.contains(obj.anchor.add(obj.direction), epsilon)
      );
    } else if (isSegmentLike(obj)) {
      return this.contains(obj.line, epsilon);
    } else if (isPlaneLike(obj)) {
      return this.eql(obj, epsilon);
    } else if (isVectorOrListLike(obj)) {
      const P = Vector.toElements(obj, 3);
      const A = this.anchor.elements;
      const N = this.normal.elements;
      const diff = Math.abs(N[0] * (A[0] - P[0]) + N[1] * (A[1] - P[1]) + N[2] * (A[2] - P[2]));
      return diff <= epsilon;
    } else {
      throw new InvalidOperationError(`Cannot check if a plane contains {obj}`);
    }
  }

  /**
   * Returns true iff the plane has a unique point/line of intersection with the argument.
   * @param {Plane|Line|Segment|Vector} obj
   * @param {Number} epsilon precision used for comparing angles
   * @returns {Boolean}
   */
  public intersects(obj: Geometry, epsilon = Sylvester.precision): boolean {
    if (isVectorOrListLike(obj)) {
      return this.contains(obj, epsilon);
    } else if (isGeometry(obj)) {
      return !this.isParallelTo(obj, epsilon);
    } else {
      throw new InvalidOperationError(`Cannot get a plane's intersection with ${obj}`);
    }
  }

  /**
   * Returns the unique intersection with the argument, if one exists. The result
   * will be a vector if a line is supplied, and a line if a plane is supplied.
   * @param epsilon - precision used for comparing angles
   */
  intersectionWith(obj: Line, epsilon?: number): Vector;
  intersectionWith(obj: Plane, epsilon?: number): Line;
  intersectionWith(obj: Plane | Line, epsilon = Sylvester.precision): Line | Vector | null {
    if (!this.intersects(obj, epsilon)) {
      return null;
    }

    if (isLineLike(obj)) {
      const A = obj.anchor.elements;

      const D = obj.direction.elements;
      const P = this.anchor.elements;
      const N = this.normal.elements;
      const multiplier =
        (N[0] * (P[0] - A[0]) + N[1] * (P[1] - A[1]) + N[2] * (P[2] - A[2])) /
        (N[0] * D[0] + N[1] * D[1] + N[2] * D[2]);

      return new Vector([
        A[0] + D[0] * multiplier,
        A[1] + D[1] * multiplier,
        A[2] + D[2] * multiplier,
      ]);
    }

    if (isSegmentLike(obj)) {
      const point = this.intersectionWith(obj.line);
      return obj.contains(point) ? point : null;
    }

    if (isPlaneLike(obj)) {
      const direction = this.normal.cross(obj.normal).toUnitVector();

      // To find an anchor point, we find one co-ordinate that has a value
      // of zero somewhere on the intersection, and remember which one we picked
      const N = this.normal.elements;

      const A = this.anchor.elements;
      const O = obj.normal.elements;
      const B = obj.anchor.elements;
      let solver = Matrix.Zero(2, 2);
      let i = 0;
      while (solver.isSingular()) {
        i++;
        solver = new Matrix([
          [N[i % 3], N[(i + 1) % 3]],
          [O[i % 3], O[(i + 1) % 3]],
        ]);
      }
      // Then we solve the simultaneous equations in the remaining dimensions
      const inverse = solver.inverse().elements;
      const x = N[0] * A[0] + N[1] * A[1] + N[2] * A[2];
      const y = O[0] * B[0] + O[1] * B[1] + O[2] * B[2];
      const intersection = [
        inverse[0][0] * x + inverse[0][1] * y,
        inverse[1][0] * x + inverse[1][1] * y,
      ];
      const anchor = [];
      for (let j = 1; j <= 3; j++) {
        // This formula picks the right element from intersection by
        // cycling depending on which element we set to zero above
        anchor.push(i === j ? 0 : intersection[(j + ((5 - i) % 3)) % 3]);
      }
      return new Line(anchor, direction);
    }

    throw new InvalidOperationError(`Cannot get a plane's intersection with ${obj}`);
  }

  /**
   * Returns the point in the plane closest to the given point.
   * @param {Vector|number[]} point
   * @returns {Vector}
   */
  public pointClosestTo(point: VectorOrList): Vector {
    const P = Vector.toElements(point, 3);
    const A = this.anchor.elements;
    const N = this.normal.elements;
    const dot = (A[0] - P[0]) * N[0] + (A[1] - P[1]) * N[1] + (A[2] - P[2]) * N[2];
    return new Vector([P[0] + N[0] * dot, P[1] + N[1] * dot, P[2] + N[2] * dot]);
  }

  /**
   * Returns a copy of the plane, rotated by t radians about the given line.
   * See notes on {@link Line.rotate}.
   * @param t - degrees in radians
   */
  public rotate(t: number | Matrix, line: Line): Plane {
    const R = t instanceof Matrix ? t.elements : Matrix.Rotation(t, line.direction).elements;
    const C = line.pointClosestTo(this.anchor).elements;
    const A = this.anchor.elements;
    const N = this.normal.elements;
    const C1 = C[0];
    const C2 = C[1];
    const C3 = C[2];
    const A1 = A[0];
    const A2 = A[1];
    const A3 = A[2];
    const x = A1 - C1;
    const y = A2 - C2;
    const z = A3 - C3;
    return new Plane(
      [
        C1 + R[0][0] * x + R[0][1] * y + R[0][2] * z,
        C2 + R[1][0] * x + R[1][1] * y + R[1][2] * z,
        C3 + R[2][0] * x + R[2][1] * y + R[2][2] * z,
      ],
      [
        R[0][0] * N[0] + R[0][1] * N[1] + R[0][2] * N[2],
        R[1][0] * N[0] + R[1][1] * N[1] + R[1][2] * N[2],
        R[2][0] * N[0] + R[2][1] * N[1] + R[2][2] * N[2],
      ],
    );
  }

  /**
   * Returns the reflection of the plane in the given point, line or plane.
   */
  public reflectionIn(obj: Geometry): Plane {
    if (isPlaneLike(obj)) {
      const A = this.anchor.elements;
      const N = this.normal.elements;
      const A1 = A[0];
      const A2 = A[1];
      const A3 = A[2];
      const N1 = N[0];
      const N2 = N[1];
      const N3 = N[2];
      const newA = this.anchor.reflectionIn(obj).elements;

      // Add the plane's normal to its anchor, then mirror that in the other plane
      const AN1 = A1 + N1;

      const AN2 = A2 + N2;
      const AN3 = A3 + N3;
      const Q = obj.pointClosestTo([AN1, AN2, AN3]).elements;
      const newN = [
        Q[0] + (Q[0] - AN1) - newA[0],
        Q[1] + (Q[1] - AN2) - newA[1],
        Q[2] + (Q[2] - AN3) - newA[2],
      ];
      return new Plane(newA, newN);
    }

    if (isLineLike(obj)) {
      return this.rotate(Math.PI, obj);
    }

    if (isSegmentLike(obj)) {
      return this.rotate(Math.PI, obj.line);
    }

    const P = Vector.toElements(obj, 3);
    return new Plane(this.anchor.reflectionIn([P[0], P[1], P[2]]), this.normal);
  }

  /**
   * Returns a textual representation of the object.
   * @returns {String}
   */
  public inspect() {
    return `Plane<${this.anchor.inspect()}, ${this.normal.inspect()}>`;
  }

  /**
   * Returns the plane containing the given points (can be arrays as
   * well as vectors). If the points are not coplanar, returns null.
   * @param {(Vector|number)[]} points
   * @returns {Vector|null}
   */
  public static fromPoints(...points: ReadonlyArray<VectorOrList>) {
    const np = points.length;
    const list: Vector[] = [];
    let i: number;
    let P: Vector;
    let n: number = 0;
    let N: Vector;
    let A: ReadonlyArray<number>;
    let B: ReadonlyArray<number>;
    let C: ReadonlyArray<number>;
    let theta: number;
    let prevN: Vector | undefined;
    let totalN = Vector.Zero(3);
    for (i = 0; i < np; i++) {
      P = new Vector(points[i]).to3D();
      list.push(P);
      n = list.length;
      if (n > 2) {
        // Compute plane normal for the latest three points
        A = list[n - 1].elements;
        B = list[n - 2].elements;
        C = list[n - 3].elements;
        N = new Vector([
          (A[1] - B[1]) * (C[2] - B[2]) - (A[2] - B[2]) * (C[1] - B[1]),
          (A[2] - B[2]) * (C[0] - B[0]) - (A[0] - B[0]) * (C[2] - B[2]),
          (A[0] - B[0]) * (C[1] - B[1]) - (A[1] - B[1]) * (C[0] - B[0]),
        ]).toUnitVector();

        if (n > 3) {
          // If the latest normal is not (anti)parallel to the previous one, we've strayed off the plane.
          // This might be a slightly long-winded way of doing things, but we need the sum of all the normals
          // to find which way the plane normal should point so that the points form an anticlockwise list.
          theta = N.angleFrom(prevN!);
          if (!isNaN(theta)) {
            if (
              !(
                Math.abs(theta) <= Sylvester.precision ||
                Math.abs(theta - Math.PI) <= Sylvester.precision
              )
            ) {
              throw new OutOfRangeError('The points provided to Plane.fromPoints are colinear');
            }
          }
        }
        totalN = totalN.add(N);
        prevN = N;
      }
    }
    // We need to add in the normals at the start and end points, which the above misses out
    A = list[1].elements;
    B = list[0].elements;
    C = list[n - 1].elements;
    const D = list[n - 2].elements;
    totalN = totalN
      .add(
        new Vector([
          (A[1] - B[1]) * (C[2] - B[2]) - (A[2] - B[2]) * (C[1] - B[1]),
          (A[2] - B[2]) * (C[0] - B[0]) - (A[0] - B[0]) * (C[2] - B[2]),
          (A[0] - B[0]) * (C[1] - B[1]) - (A[1] - B[1]) * (C[0] - B[0]),
        ]).toUnitVector(),
      )
      .add(
        new Vector([
          (B[1] - C[1]) * (D[2] - C[2]) - (B[2] - C[2]) * (D[1] - C[1]),
          (B[2] - C[2]) * (D[0] - C[0]) - (B[0] - C[0]) * (D[2] - C[2]),
          (B[0] - C[0]) * (D[1] - C[1]) - (B[1] - C[1]) * (D[0] - C[0]),
        ]).toUnitVector(),
      );

    return new Plane(list[0], totalN);
  }

  /**
   * XY plane.
   */
  public static readonly XY = new Plane(Vector.Zero(3), Vector.k);

  /**
   * YX plane.
   */
  public static readonly YX = new Plane(Vector.Zero(3), Vector.k);
  /**
   * YZ plane.
   */
  public static readonly YZ = new Plane(Vector.Zero(3), Vector.i);

  /**
   * ZY plane.
   */
  public static readonly ZY = new Plane(Vector.Zero(3), Vector.i);
  /**
   * ZX plane.
   */
  public static readonly ZX = new Plane(Vector.Zero(3), Vector.j);

  /**
   * XZ plane.
   */
  public static readonly XZ = new Plane(Vector.Zero(3), Vector.j);
}
