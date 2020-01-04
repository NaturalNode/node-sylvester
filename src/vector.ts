import { DimensionalityMismatchError, Sylvester, InvalidOperationError } from './sylvester';
import {
  isPlaneLike,
  isLineLike,
  isVectorOrListLike,
  isGeometry,
  VectorOrList,
  Geometry,
} from './likeness';
import { Matrix } from './matrix';
import { Line } from './line';
import { Plane } from './plane';
import { asm } from './asm';

/**
 * Returns the elements from the given vector or number array.
 * @private
 */
const getElements = (vectorOrList: VectorOrList): ReadonlyArray<number> =>
  (vectorOrList as any).elements || vectorOrList;

/**
 * The Vector class is designed to model vectors in any number of dimensions.
 * All the elements of a vector must be real numbers. Depending on what you’re
 * using them for, it can be helpful to think of a vector either as a point
 * in n-dimensional space, or as a line connecting
 * the origin to that same point.
 */
export class Vector {
  /**
   * Gets the elements of the vector or list of numbers.
   * @param requireDimension - Desired dimension of elements
   * @private
   */
  public static toElements(vectorOrElements: VectorOrList, requireDimension?: number) {
    let elements = getElements(vectorOrElements);

    if (!requireDimension || requireDimension === elements.length) {
      return elements;
    }

    if (elements.length > requireDimension) {
      throw new DimensionalityMismatchError(
        `Cannot convert a ${elements.length}D vector to a ${requireDimension}D one`,
      );
    }

    const dup = (elements = elements.slice());
    while (elements.length < requireDimension) {
      dup.push(0);
    }

    return dup;
  }

  /**
   * Unit vector `[1, 0, 0]`
   */
  public static readonly i = new Vector([1, 0, 0]);

  /**
   * Unit vector `[0, 1, 0]`
   */
  public static readonly j = new Vector([0, 1, 0]);

  /**
   * Unit vector `[0, 0, 1]`
   */
  public static readonly k = new Vector([0, 0, 1]);

  /**
   * Vector elements.
   */
  public readonly elements: ReadonlyArray<number>;

  /**
   * Creates a new vector, initializing it with the provided elements.
   */
  constructor(elements: VectorOrList) {
    this.elements = Vector.toElements(elements);
  }

  /**
   * Returns the magnitude (also: euclidean norm, magnitude) of the vector.
   *
   * @see https://en.wikipedia.org/wiki/Euclidean_distance
   * @diagram Vector.magnitude
   */
  public magnitude() {
    const arr = asm.__retain(asm.__allocArray(asm.FLOAT64ARRAY, this.elements));
    const result = asm.vectorMagnitude(arr);
    asm.__release(arr);
    return result;
  }

  /**
   * Returns the `ith` element if the vector. Returns null if `i` is out
   * of bounds, indexing starts from 1.
   * @diagram Vector.e
   */
  public e(i: number) {
    return i < 1 || i > this.elements.length ? null : this.elements[i - 1];
  }

  /**
   * Returns the number of rows and columns the vector has.
   * @diagram Vector.dimensions
   * @return {IDimensions} the "rows" will always equal zero
   */
  public dimensions() {
    return {
      rows: 1,
      cols: this.elements.length,
    };
  }

  /**
   * Returns the number of rows the vector has.
   * @diagram Vector.rows
   * @return {Number} always `1`
   */
  public rows() {
    return 1;
  }

  /**
   * Returns the number of columns the vector has.
   * @diagram Vector.cols
   * @return {Number}
   */
  public cols() {
    return this.elements.length;
  }

  /**
   * Returns if the Vector is equal to the input vector.
   * @param epsilon - The precision to compare each number.
   * @diagram Vector.eql
   */
  public eql(other: unknown, precision = Sylvester.approxPrecision) {
    if (!isGeometry(other)) {
      return false;
    }

    if (!isVectorOrListLike(other)) {
      return false;
    }

    let n = this.elements.length;
    const elements = getElements(other);
    if (n !== elements.length) {
      return false;
    }

    while (n--) {
      if (Math.abs(this.elements[n] - elements[n]) > precision) {
        return false;
      }
    }

    return true;
  }

  /**
   * Returns a new function created by calling the iterator on all values of this vector.
   */
  public map(fn: (value: number, index: number) => number) {
    const n = this.elements.length;
    const elements = new Array(n);
    for (let i = 0; i < n; i++) {
      elements[i] = fn(this.elements[i], i + 1);
    }

    return new Vector(elements);
  }

  /**
   * Iterates through the elements of the vector
   */
  public each(fn: (value: number, index: number) => void) {
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      fn(this.elements[i], i + 1);
    }
  }

  /**
   * Returns a new vector created by normalizing this one to a have a
   * magnitude of `1`. If the vector is the zero vector, it will not be modified.
   * @diagram Vector.toUnitVector
   */
  public toUnitVector() {
    const r = this.magnitude();
    if (r === 0) {
      return this;
    }

    return this.map(x => x / r);
  }

  /**
   * Returns the angle between this vector the argument in radians. If the
   * vectors are mirrored across their axes this will return `NaN`.
   *
   * @throws A {@link DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @diagram Vector.angleFrom
   */
  public angleFrom(vector: VectorOrList) {
    const V = getElements(vector);
    const n = this.elements.length;
    if (n !== V.length) {
      throw new DimensionalityMismatchError(
        'Cannot compute the angle between vectors with different dimensionality',
      );
    }

    // Work things out in parallel to save time
    let dot = 0;
    let mod1 = 0;
    let mod2 = 0;
    this.each((x, i) => {
      dot += x * V[i - 1];
      mod1 += x * x;
      mod2 += V[i - 1] * V[i - 1];
    });
    mod1 = Math.sqrt(mod1);
    mod2 = Math.sqrt(mod2);
    if (mod1 * mod2 === 0) {
      return NaN;
    }

    let theta = dot / (mod1 * mod2);
    if (theta < -1) {
      theta = -1;
    }
    if (theta > 1) {
      theta = 1;
    }
    return Math.acos(theta);
  }

  /**
   * Returns whether the vectors are parallel to each other.
   * @param epsilon - precision used for comparing angles
   * @diagram Vector.isParallelTo
   */
  public isParallelTo(obj: Geometry, epsilon = Sylvester.precision): boolean {
    if (isVectorOrListLike(obj)) {
      return this.angleFrom(obj) <= epsilon;
    } else if (isGeometry(obj)) {
      return obj.isParallelTo(this, epsilon);
    } else {
      throw new InvalidOperationError(`Cannot compare the angle of ${obj} to a vector`);
    }
  }

  /**
   * Returns whether the vectors are antiparallel to each other.
   * @param epsilon - precision used for comparing angles
   * @diagram Vector.isAntiparallelTo
   */
  public isAntiparallelTo(vector: VectorOrList, epsilon = Sylvester.precision) {
    const angle = this.angleFrom(vector);
    return Math.abs(angle - Math.PI) <= epsilon;
  }

  /**
   * Returns whether the vectors are perpendicular to each other.
   * @param epsilon - precision used for comparing angles
   * @diagram Vector.isPerpendicularTo
   */
  public isPerpendicularTo(obj: Geometry, epsilon = Sylvester.precision) {
    if (isVectorOrListLike(obj)) {
      return Math.abs(this.dot(obj)) <= epsilon;
    } else if (isGeometry(obj)) {
      return obj.isPerpendicularTo(this, epsilon);
    } else {
      throw new InvalidOperationError(`Cannot compare the angle of ${obj} to a vector`);
    }
  }

  private _runBinaryOp(value: VectorOrList | number, operator: (a: number, b: number) => number) {
    if (typeof value === 'number') {
      return this.map(v => operator(v, value));
    }

    const values = getElements(value);
    if (this.elements.length !== values.length) {
      throw new DimensionalityMismatchError('Cannot add vectors with different dimensions.');
    }

    return this.map((x, i) => operator(x, values[i - 1]));
  }

  /**
   * When the input is a constant, this returns the result of adding it to
   * all cevtor elements. When it's a vector, the vectors will be added.
   * @throws A {@link DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @diagram Vector.add
   */
  public add(value: VectorOrList | number) {
    return this._runBinaryOp(value, (a, b) => a + b);
  }

  /**
   * When the input is a constant, this returns the result of subtracting it
   * from all vector elements. When it's a vector, the vectors will be subtracted.
   * @throws A {@link DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @diagram Vector.subtract
   */
  public subtract(value: VectorOrList | number) {
    return this._runBinaryOp(value, (a, b) => a - b);
  }

  /**
   * When the input is a constant, this returns the result of multiplying it
   * with all vector elements. When it's a vector, the vectors will be
   * element-wise multiplied.
   * @throws A {@link DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @diagram Vector.multiply
   */
  public multiply(value: VectorOrList | number) {
    return this._runBinaryOp(value, (a, b) => a * b);
  }

  /**
   * @alias Vector#multiply
   * @diagram Vector.multiply
   */
  x(value: VectorOrList | number) {
    return this.multiply(value);
  }

  /**
   * Returns the sum of all elements in the Vector.
   * @diagram Vector.sum
   */
  public sum() {
    let sum = 0;
    this.each(x => {
      sum += x;
    });
    return sum;
  }

  /**
   * Returns a new vector with the first `n` elements removed from the beginning.
   * @diagram Vector.chomp
   */
  public chomp(n: number) {
    const elements = [];
    for (let i = n; i < this.elements.length; i++) {
      elements.push(this.elements[i]);
    }

    return new Vector(elements);
  }

  /**
   * Returns a new vector consisting only of the first `n` elements.
   * @diagram Vector.top
   */
  public top(n: number) {
    const elements = [];
    for (let i = 0; i < n; i++) {
      elements.push(this.elements[i]);
    }

    return new Vector(elements);
  }

  /**
   * Returns a new vector with the provided `elements` concatenated on the end.
   * @diagram Vector.augment
   */
  public augment(elements: VectorOrList) {
    return new Vector(this.elements.concat(getElements(elements)));
  }

  /**
   * Returns the product of all elements in the vector.
   * @diagram Vector.product
   */
  public product() {
    let p = 1;
    this.each(v => {
      p *= v;
    });

    return p;
  }

  /**
   * Returns the scalar (dot) product of the vector with the argument.
   * @see https://en.wikipedia.org/wiki/Scalar_product
   * @throws A {@link DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @diagram Vector.dot
   */
  public dot(vector: VectorOrList) {
    const V = getElements(vector);
    let n = this.elements.length;
    if (n !== V.length) {
      throw new DimensionalityMismatchError(
        'Cannot compute the dot product of vectors with different dimensionality',
      );
    }

    let product = 0;
    while (n--) {
      product += this.elements[n] * V[n];
    }
    return product;
  }

  /**
   * Returns the vector product of the vector with the argument.
   * @throws A {@link DimensionalityMismatchError} if either this or the other vector
   *   is not three-dimensional.
   * @diagram Vector.cross
   */
  public cross(vector: VectorOrList) {
    const B = getElements(vector);
    if (this.elements.length !== 3 || B.length !== 3) {
      throw new DimensionalityMismatchError(
        `A cross-product can only be calculated between 3-dimensional vectors (got ${B.length} and ${this.elements.length})`,
      );
    }

    const A = this.elements;
    return new Vector([
      A[1] * B[2] - A[2] * B[1],
      A[2] * B[0] - A[0] * B[2],
      A[0] * B[1] - A[1] * B[0],
    ]);
  }

  /**
   * Returns the (absolute) largest element of the vector
   * @diagram Vector.max
   */
  public max() {
    let m = 0;
    let i = this.elements.length;
    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) {
        m = this.elements[i];
      }
    }
    return m;
  }

  /**
   * Returns the index of the absolute largest element of the vector.
   * @returns Will be -1 if the vector is empty
   * @diagram Vector.maxIndex
   */
  public maxIndex() {
    let m = -1;
    let i = this.elements.length;
    let maxIndex = -1;

    while (i--) {
      if (Math.abs(this.elements[i]) > Math.abs(m)) {
        m = this.elements[i];
        maxIndex = i + 1;
      }
    }

    return maxIndex;
  }

  /**
   * Returns the index of the first instance of the value in the vector, or -1.
   * @diagram Vector.indexOf
   */
  public indexOf(x: number) {
    for (let i = 0; this.elements.length; i++) {
      if (this.elements[i] === x) {
        return i + 1;
      }
    }

    return -1;
  }

  /**
   * Returns a diagonal matrix with the vector's elements as its diagonal elements
   */
  public toDiagonalMatrix() {
    return Matrix.Diagonal(this.elements);
  }

  /**
   * Returns the result of rounding the elements of the vector
   * @diagram Vector.round
   */
  public round() {
    return this.map(x => Math.round(x));
  }

  /**
   * Transpose a Vector, return a 1xn Matrix.
   * @diagram Vector.transpose
   */
  public transpose() {
    const rows = this.elements.length;
    const elements = [];

    for (let i = 0; i < rows; i++) {
      elements.push([this.elements[i]]);
    }
    return new Matrix(elements);
  }

  /**
   * Returns a copy of the vector with elements set to the given value if they
   * differ from it by less than the epislon.
   * @diagram Vector.snapTo
   */
  public snapTo(target: number, epsilon = Sylvester.precision) {
    return this.map(p => (Math.abs(p - target) <= epsilon ? target : p));
  }

  /**
   * Returns the vector's distance from the argument, when considered as a point in space
   * @diagram Vector.distanceFrom
   */
  public distanceFrom(obj: Geometry): number {
    if (!isVectorOrListLike(obj)) {
      return obj.distanceFrom(this);
    }

    const V = Vector.toElements(obj, this.elements.length);
    let sum = 0;
    let part;
    this.each((x, i) => {
      part = x - V[i - 1];
      sum += part * part;
    });

    return Math.sqrt(sum);
  }

  /**
   * Returns true if the vector is point on the given line
   * @diagram Vector.liesOn
   */
  public liesOn(line: Line) {
    return line.contains(this);
  }

  /**
   * Returns true if the vector is point on the given plane
   * @diagram Vector.liesIn
   */
  public liesIn(plane: Plane) {
    return plane.contains(this);
  }

  /**
   * Rotates the 2D vector about the given point.
   * @param t - Radians or rotation matrix to use
   * @diagram Vector.rotate2D
   */
  public rotate2D(t: number | Matrix, obj: VectorOrList) {
    const V = Vector.toElements(obj, 2);
    const R = t instanceof Matrix ? t.elements : Matrix.Rotation(t).elements;
    const x = this.elements[0] - V[0];
    const y = this.elements[1] - V[1];
    return new Vector([V[0] + R[0][0] * x + R[0][1] * y, V[1] + R[1][0] * x + R[1][1] * y]);
  }

  /**
   * Rotates the 3D vector about the given line. Be careful
   * with line directions!
   * @param t - Radians or rotation matrix to use
   */
  public rotate3D(t: number | Matrix, obj: Line) {
    const elements = this.to3D().elements;
    const pivot = obj.pointClosestTo(elements)!.elements;
    const rotation = t instanceof Matrix ? t.elements : Matrix.Rotation(t, obj.direction).elements;
    const x = elements[0] - pivot[0];
    const y = elements[1] - pivot[1];
    const z = elements[2] - pivot[2];
    return new Vector([
      pivot[0] + rotation[0][0] * x + rotation[0][1] * y + rotation[0][2] * z,
      pivot[1] + rotation[1][0] * x + rotation[1][1] * y + rotation[1][2] * z,
      pivot[2] + rotation[2][0] * x + rotation[2][1] * y + rotation[2][2] * z,
    ]);
  }

  /**
   * Returns the result of reflecting the point in the given point, line or plane.
   * @diagram Vector.reflectionIn
   */
  public reflectionIn(obj: VectorOrList | Line | Plane) {
    if (isPlaneLike(obj) || isLineLike(obj)) {
      const C = obj.pointClosestTo(this)!.elements;
      return new Vector(this.elements.map((p, i) => C[i] + (C[i] - p)));
    }

    // obj is a point
    const Q = getElements(obj);
    if (this.elements.length !== Q.length) {
      throw new DimensionalityMismatchError(
        `Cannot rotate a ${this.elements.length}D point around the given ${Q.length}D point`,
      );
    }
    return this.map((x, i) => {
      return Q[i - 1] + (Q[i - 1] - x);
    });
  }

  /**
   * Runs an element-wise logarithm on the vector.
   * @diagram Vector.log
   */
  public log(base = Math.E) {
    const logBase = Math.log(base); // change of base
    return this.map(x => Math.log(x) / logBase);
  }

  /**
   * Utility to make sure vectors are 3D. If they are 1/2D, a zero component is added.
   * @throws A {@link DimensionalityMismatchError} if the vector has greater than three elements
   */
  public to3D() {
    return this.toDimension(3);
  }

  /**
   * Pads the vector with zero's until it reaches the given dimension.
   * @throws A {@link DimensionalityMismatchError} if the vector has greater than n elements
   */
  public toDimension(n: number) {
    if (this.elements.length > n) {
      throw new DimensionalityMismatchError(
        `Cannot convert a ${this.elements.length}D vector to a ${n}D one`,
      );
    }

    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      next[i] = this.elements[i] || 0;
    }

    return new Vector(next);
  }

  /**
   * Returns a string representation of the vector
   */
  public toString() {
    return `Vector<[${this.elements.join(', ')}]>`;
  }

  /**
   * @inheritdoc
   */
  public toJSON() {
    return this.elements;
  }

  /**
   * Creates vector of the given size filled with random values in the range `[0, 1)`.
   */
  public static Random(size: number): Vector {
    const elements = [];
    while (size--) {
      elements.push(Math.random());
    }
    return new Vector(elements);
  }

  /**
   * Creates a vector filled with the given value.
   */
  public static Fill(size: number, value: number): Vector {
    const elements = [];
    while (size--) {
      elements.push(value);
    }
    return new Vector(elements);
  }

  /**
   * Creates an n-length vector filled with zeroes.
   */
  public static Zero(n: number): Vector {
    return Vector.Fill(n, 0);
  }

  /**
   * Creates an n-length vector filled with ones.
   */
  public static One(n: number): Vector {
    return Vector.Fill(n, 1);
  }
}
