import { DimensionalityMismatchError, Sylvester } from './sylvester';
import { Matrix } from './matrix';

/**
 * The Vector class is designed to model vectors in any number of dimensions.
 * All the elements of a vector must be real numbers. Depending on what you’re
 * using them for, it can be helpful to think of a vector either as a point
 * in n-dimensional space, or as a line connecting
 * the origin to that same point.
 */
export class Vector {

  /**
   * Creates a new vector, initializing it with the provided elements.
   *
   * @param  {Number[]} elements
   */
  constructor(elements) {
    this.elements = elements;
  }

  /**
   * Returns the magnitude (also: euclidean norm, magnitude) of the vector.
   *
   * $example Vector.magnitude
   * @see https://en.wikipedia.org/wiki/Euclidean_distance
   * @return {Number}
   */
  magnitude() {
    let sum = 0;
    for (let i = 0; i < this.elements.length; i++) {
      sum += this.elements[i] * this.elements[i];
    }

    return Math.sqrt(sum);
  }

  /**
   * Returns the `ith` element if the vector. Returns null if `i` is out
   * of bounds, indexing starts from 1.
   *
   * $example Vector.e
   * @param  {Number} i
   * @return {Number}
   */
  e(i) {
    return (i < 1 || i > this.elements.length) ? null : this.elements[i - 1];
  }

  /**
   * Returns the number of rows and columns the vector has.
   *
   * $example Vector.dimensions
   * @return {IDimensions} the "rows" will always equal zero
   */
  dimensions() {
    return {
      rows: 1,
      cols: this.elements.length
    };
  }

  /**
   * Returns the number of rows the vector has.
   *
   * $example Vector.rows
   * @return {Number} always `1`
   */
  rows() {
    return 1;
  }

  /**
   * Returns the number of columns the vector has.
   *
   * $example Vector.cols
   * @return {Number}
   */
  cols() {
    return this.elements.length;
  }

  /**
   * Returns if the Vector is equal to the input vector.
   *
   * $example Vector.eql
   * @param  {Vector} vector
   * @return {Boolean}
   */
  eql(vector) {
    let n = this.elements.length;
    const V = vector.elements || vector;
    if (n !== V.length) {
      return false;
    }
    while (n--) {
      if (Math.abs(this.elements[n] - V[n]) > Sylvester.precision) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns a new function created by calling the iterator on all values of this vector.
   *
   * @param  {Function} fn
   * @return {Vector}
   */
  map(fn) {
    const n = this.elements.length;
    const elements = new Array(n);
    for (let i = 0; i < n; i++) {
      elements[i] = fn(this.elements[i], i + 1);
    }

    return new Vector(elements);
  }

  /**
   * Iterates through the elements of the vector
   *
   * @param {Function} fn called with the `(element, index)`
   */
  each(fn) {
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      fn(this.elements[i], i + 1);
    }
  }

  /**
   * Returns a new vector created by normalizing this one to a have a
   * magnitude of `1`. If the vector is the zero vector, it will not be modified.
   *
   * $example Vector.toUnitVector
   * @return {Vector}
   */
  toUnitVector() {
    const r = this.modulus();
    if (r === 0) {
      return this.dup();
    }

    return this.map(x => x / r);
  }

  /**
   * Returns the angle between this vector the argument in radians. If the
   * vectors are mirrored across their axes this will return `NaN`.
   *
   * $example Vector.angleFrom
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param  {Vector} vector
   * @return {Number}
   */
  angleFrom(vector) {
    const V = vector.elements || vector;
    const n = this.elements.length;
    if (n !== V.length) {
      throw new DimensionalityMismatchError(
        'Cannot compute the angle between vectors with different dimensionality'
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
   *
   * $example Vector.isParallelTo
   * @return {Boolean}
   */
  isParallelTo(vector) {
    const angle = this.angleFrom(vector);
    return angle === null ? false : (angle <= Sylvester.precision);
  }

  /**
   * Returns whether the vectors are antiparallel to each other.
   *
   * $example Vector.isAntiparallelTo
   * @return {Boolean}
   */
  isAntiparallelTo(vector) {
    const angle = this.angleFrom(vector);
    return angle === null ? false : (Math.abs(angle - Math.PI) <= Sylvester.precision);
  }

  /**
   * Returns whether the vectors are perpendicular to each other.
   *
   * $example Vector.isPerpendicularTo
   * @return {Boolean}
   */
  isPerpendicularTo(vector) {
    return Math.abs(this.dot(vector)) <= Sylvester.precision;
  }

  _runBinaryOp(value, operator) {
    if (typeof value === 'number') {
      return this.map(v => operator(v, value));
    }

    const values = value.elements || value;
    if (this.elements.length !== values.length) {
      throw new DimensionalityMismatchError('Cannot add vectors with different dimensions.');
    }

    return this.map((x, i) => operator(x, values[i - 1]));
  }

  /**
   * When the input is a constant, this returns the result of adding it to
   * all cevtor elements. When it's a vector, the vectors will be added.
   *
   * $example Vector.add
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param {Number|Number[]|Vector} value
   * @return {Vector}
   */
  add(value) {
    return this._runBinaryOp(value, (a, b) => a + b);
  }

  /**
   * When the input is a constant, this returns the result of subtracting it
   * from all vector elements. When it's a vector, the vectors will be subtracted.
   *
   * $example Vector.subtract
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param {Number|Number[]|Vector} value
   * @return {Vector}
   */
  subtract(value) {
    return this._runBinaryOp(value, (a, b) => a - b);
  }

  /**
   * When the input is a constant, this returns the result of multiplying it
   * with all vector elements. When it's a vector, the vectors will be
   * element-wise multiplied.
   *
   * $example Vector.multiply
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param {Number|Number[]|Vector} value
   * @return {Vector}
   */
  multiply(value) {
    return this._runBinaryOp(value, (a, b) => a * b);
  }

  /**
   * Returns the sum of all elements in the Vector.
   *
   * $example Vector.sum
   * @return {Number}
   */
  sum() {
    let sum = 0;
    this.each(x => {
      sum += x;
    });
    return sum;
  }

  /**
   * Returns a new vector with the first `n` elements removed from the beginning.
   *
   * $example Vector.chomp
   * @param  {Number} n
   * @return {Vector}
   */
  chomp(n) {
    const elements = [];
    for (let i = n; i < this.elements.length; i++) {
      elements.push(this.elements[i]);
    }

    return Vector.create(elements);
  }

  /**
   * Returns a new vector consisting only of the first `n` elements.
   *
   * $example Vector.chomp
   * @param  {Number} n
   * @return {Vector}
   */
  top(n) {
    const elements = [];
    for (let i = 0; i < n; i++) {
      elements.push(this.elements[i]);
    }

    return Vector.create(elements);
  }

  /**
   * Returns a new vector with the provided `elements` concatenated on the end.
   *
   * $example Vector.augment
   * @param  {Number[]|Vector} elements
   * @return {Vector}
   */
  augment(elements) {
    return Vector.create(this.elements.concat(elements.elements || elements));
  }

  /**
   * Alias for {@link Vector#multiply}
   *
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param {Number|Number[]|Vector} value
   * @return {Vector}
   */
  x(value) {
    return this.multiply(value);
  }

  /**
   * Returns a vector made up the base `base` logarithm of this vector's values.
   *
   * $example Vector.log
   * @param {Number} [base=Math.E]
   * @return {Vector}
   */
  log(base = Math.E) {
    return Vector.log(this, base);
  }

  /**
   * Returns the product of all elements in the vector.
   * $example Vector.product
   * @return {Number}
   */
  product() {
    let p = 1;
    this.each(v => {
      p *= v;
    });

    return p;
  }

  /**
   * Returns the scalar (dot) product of the vector with the argument.
   *
   * $example Vector.dot
   * @see https://en.wikipedia.org/wiki/Scalar_product
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param  {Vector|Number[]} vector
   * @return {Number}
   */
  dot(vector) {
    const V = vector.elements || vector;
    let n = this.elements.length;
    if (n !== V.length) {
      throw new DimensionalityMismatchError(
        'Cannot compute the dot product of vectors with different dimensionality'
      );
    }

    let product = 0;
    while (n--) {
      product += this.elements[n] * V[n];
    }
    return product;
  }

  /**
   * Returns the cross product of this vector with the other one. Both vectors
   * must have a dimensionality of three.
   *
   * $example Vector.cross
   * @see https://en.wikipedia.org/wiki/Cross_product
   * @param  {Vector|Number[]} vector
   * @return {Vector}
   * @throws {DimensionalityMismatchError} If either this vector or the other
   *     is not three-dimensional.
   */
  cross(vector) {
    const B = vector.elements || vector;
    if (this.elements.length !== 3 || B.length !== 3) {
      throw new DimensionalityMismatchError(
        'Cannot compute the cross product of vectors that aren\'t three-dimensional'
      );
    }
    const A = this.elements;
    return Vector.create([
      (A[1] * B[2]) - (A[2] * B[1]),
      (A[2] * B[0]) - (A[0] * B[2]),
      (A[0] * B[1]) - (A[1] * B[0])
    ]);
  }

  /**
   * Returns the absolute largest element in this vector.
   *
   * $example Vector.max
   * @return {Number}
   */
  max() {
    return this.elements[this.maxIndex() - 1];
  }

  /**
   * Returns the index of the absolute largest item in this vector.
   *
   * $example Vector.maxIndex
   * @return {Number}
   */
  maxIndex() {
    let i = this.elements.length;
    let maxValue = 0;
    let maxIndex = 0;

    while (i--) {
      if (Math.abs(this.elements[i]) >= maxValue) {
        maxValue = Math.abs(this.elements[i]);
        maxIndex = i + 1;
      }
    }

    return maxIndex;
  }

  /**
   * Returns the index of the first occurrence of x in the vector,
   * or -1 if it wasn't found.
   *
   * $example Vector.indexOf
   * @return {Number}
   */
  indexOf(x) {
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      if (this.elements[i] === x) {
        return i + 1;
      }
    }

    return -1;
  }

  /**
   * Returns a diagonal matrix with the vector's elements
   * as its diagonal elements.
   *
   * $example Vector.toDiagonalMatrix
   * @return {Matrix}
   */
  toDiagonalMatrix() {
    return Matrix.Diagonal(this.elements);
  }

  /**
   * Returns the result of rounding the elements of the vector.
   *
   * $example Vector.round
   * @return {Vector}
   */
  round() {
    return this.map(x => Math.round(x));
  }

  /**
   * Transpose the vector into a 1xN matrix.
   *
   * $example Vector.transpose
   * @return {Matrix}
   */
  transpose() {
    const rows = this.elements.length;
    const elements = [];

    for (let i = 0; i < rows; i++) {
      elements.push([this.elements[i]]);
    }
    return Matrix.create(elements);
  }

  /**
   * Returns a copy of the vector with elements set to the given value if
   * they differ from it by less than Sylvester.precision
   *
   * @param {Number} x
   * @return {Vector}
   */
  snapTo(x) {
    return this.map(y => {
      return (Math.abs(y - x) <= Sylvester.precision) ? x : y;
    });
  }

  /**
   * Returns the vector's distance from the argument,
   *  when considered as a point in space.
   *
   * @throws {DimensionalityMismatchError} If the dimensionality differs.
   * @param {Vector|Line|Plane} obj
   * @return {Vector}
   */
  distanceFrom(obj) {
    if (obj.anchor || (obj.start && obj.end)) {
      return obj.distanceFrom(this);
    }
    const V = obj.elements || obj;
    if (V.length !== this.elements.length) {
      throw new DimensionalityMismatchError(
        'Cannot compute the distance between objects in different dimensions'
      );
    }

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
   *
   * @param {Line} line
   * @return {Boolean}
   */
  liesOn(line) {
    return line.contains(this);
  }

  /**
   * Return true iff the vector is a point in the given plane
   *
   * @param {Line} x
   * @return {Boolean}
   */
  liesIn(plane) {
    return plane.contains(this);
  }

  /**
   * Rotates the vector about the given object. The object should be a
   * point if the vector is 2D, and a line if it is 3D
   * Be careful with line directions!
   *
   * @throws {DimensionalityMismatchError} If the dimensionality differs.
   * @param {Number|Matrix} t the radians to rotate, or a rotation matrix
   * @param {Line|Vector} obj the object to rotate around
   * @return {Boolean}
   */
  rotate(t, obj) {
    let X;
    let R = null;
    let x;
    let y;
    let z;
    if (t.determinant) {
      R = t.elements;
    }
    switch (this.elements.length) {
      case 2:
        X = obj.elements || obj;
        if (X.length !== 2) {
          throw new DimensionalityMismatchError(
            `Two-dimensional vectors cannot be rotated around ${X.length}-dimensional objects`
          );
        }

        if (!R) {
          R = Matrix.Rotation(t).elements;
        }
        x = this.elements[0] - X[0];
        y = this.elements[1] - X[1];
        return Vector.create([
          X[0] + (R[0][0] * x) + (R[0][1] * y),
          X[1] + (R[1][0] * x) + (R[1][1] * y)
        ]);
      case 3:
        if (!obj.direction) {
          throw new DimensionalityMismatchError(
            `Three-dimensional vectors can only be rotated around lines.`
          );
        }
        X = obj.pointClosestTo(this).elements;
        if (!R) {
          R = Matrix.Rotation(t, obj.direction).elements;
        }
        x = this.elements[0] - X[0];
        y = this.elements[1] - X[1];
        z = this.elements[2] - X[2];
        return Vector.create([
          X[0] + (R[0][0] * x) + (R[0][1] * y) + (R[0][2] * z),
          X[1] + (R[1][0] * x) + (R[1][1] * y) + (R[1][2] * z),
          X[2] + (R[2][0] * x) + (R[2][1] * y) + (R[2][2] * z)
        ]);
      default:
        throw new DimensionalityMismatchError(
          `${this.elements.length}-dimensional vectors cannot be rotated.`
        );
    }
  }

  // Returns the result of reflecting the point in the given point, line or plane

  reflectionIn(obj) {
    if (obj.anchor) {
      // obj is a plane or line
      const P = this.elements.slice();
      const C = obj.pointClosestTo(P).elements;
      return Vector.create([
        C[0] + (C[0] - P[0]),
        C[1] + (C[1] - P[1]),
        C[2] + (C[2] - (P[2] || 0))
      ]);
    }

    // obj is a point
    const Q = obj.elements || obj;
    if (this.elements.length !== Q.length) {
      return null;
    }
    return this.map((x, i) => {
      return Q[i - 1] + (Q[i - 1] - x);
    });
  }

  // Utility to make sure vectors are 3D. If they are 2D, a zero z-component is added

  to3D() {
    const V = this.dup();
    switch (V.elements.length) {
      case 3:
        break;
      case 2:
        V.elements.push(0);
        break;
      default:
        return null;
    }
    return V;
  }

  // Returns a string representation of the vector

  inspect() {
    return `Vector<[${this.elements.join(', ')}]>`;
  }

  // Set vector's elements from an array

  setElements(els) {
    this.elements = (els.elements || els).slice();
    return this;
  }

  toJSON() {
    return this.elements;
  }

  // Constructor function
  static create(elements) {
    const V = new Vector();
    return V.setElements(elements);
  }

  // Random vector of size n
  static Random(n) {
    const elements = [];
    while (n--) {
      elements.push(Math.random());
    }
    return Vector.create(elements);
  }

  static Fill(n, v) {
    const elements = [];
    while (n--) {
      elements.push(v);
    }
    return Vector.create(elements);
  }

  // Vector filled with zeros
  static Zero(n) {
    return Vector.Fill(n, 0);
  }

  static One(n) {
    return Vector.Fill(n, 1);
  }

  /**
   * Taks the base `base` logathim of all elements of the provided vector, and
   * return the new one.
   * @param  {Vector} v
   * @param  {Number} [base=Math.E]
   * @return {Vector}
   */
  static log(v, base = Math.E) {
    const logBase = Math.log(base);
    return v.map(x => Math.log(x) / logBase);
  }
}

// i, j, k unit vectors
Vector.i = Vector.create([1, 0, 0]);
Vector.j = Vector.create([0, 1, 0]);
Vector.k = Vector.create([0, 0, 1]);

// The following are shims for deprecated methods removed in 1.0.0
Vector.prototype.modulus = Vector.prototype.magnitude;
Vector.prototype.norm = Vector.prototype.magnitude;
Vector.prototype.dup = function () {
  return this.map(x => x);
};
