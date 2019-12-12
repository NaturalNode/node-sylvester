import { DimensionalityMismatchError, Sylvester } from './sylvester';
import { Matrix } from './matrix';
import { Line } from './line';

/**
 * Returns the elements from the given vector or number array.
 * @param {Vector|Number[]} vectorOrList
 * @returns {Number[]}
 */
const getElements = (vectorOrList) => vectorOrList.elements || vectorOrList;

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
   * @param {Vector|number} vectorOrElements
   * @param {number} Desired dimension of elements
   * @private
   */
  static toElements(vectorOrElements, requireDimension = undefined) {
    let elements = vectorOrElements.elements || vectorOrElements;

    if (!requireDimension || requireDimension === elements.length) {
      return elements;
    }

    if (elements.length > requireDimension) {
      throw new DimensionalityMismatchError(
        `Cannot convert a ${elements.length}D vector to a ${requireDimension}D one`,
      );
    }

    elements = elements.slice();
    while (elements.length < requireDimension) {
      elements.push(0)
    }

    return elements;
  }

  /**
   * Creates a new vector, initializing it with the provided elements.
   * @param  {Vector|Number[]} elements
   */
  constructor(elements) {
    this.elements = Vector.toElements(elements);
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
   * $example Vector.eql
   * @param {Vector} vector
   * @param {Number} epsilon The precision to compare each number.
   * @return {Boolean}
   */
  eql(vector, precision = Sylvester.approxPrecision) {
    let n = this.elements.length;
    const elements = getElements(vector);
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
   * $example Vector.angleFrom
   * @throws {DimensionalityMismatchError} If a vector is passed in with
   *     different dimensions
   * @param  {Vector|number[]} vector
   * @return {Number}
   */
  angleFrom(vector) {
    const V = getElements(vector);
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
   * $example Vector.isParallelTo
   * @param {Vector} vector
   * @param {Number} epsilon precision used for comparing angles
   * @return {Boolean}
   */
  isParallelTo(vector, epsilon = Sylvester.precision) {
    const angle = this.angleFrom(vector);
    return angle <= epsilon;
  }

  /**
   * Returns whether the vectors are antiparallel to each other.
   * $example Vector.isAntiparallelTo
   * @param {Vector} vector
   * @param {Number} epsilon precision used for comparing angles
   * @return {Boolean}
   */
  isAntiparallelTo(vector, epsilon = Sylvester.precision) {
    const angle = this.angleFrom(vector);
    return Math.abs(angle - Math.PI) <= epsilon;
  }

  /**
   * Returns whether the vectors are perpendicular to each other.
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
   * $example Vector.chomp
   * @param  {Number} n
   * @return {Vector}
   */
  chomp(n) {
    const elements = [];
    for (let i = n; i < this.elements.length; i++) {
      elements.push(this.elements[i]);
    }

    return new Vector(elements);
  }

  /**
   * Returns a new vector consisting only of the first `n` elements.
   * $example Vector.chomp
   * @param  {Number} n
   * @return {Vector}
   */
  top(n) {
    const elements = [];
    for (let i = 0; i < n; i++) {
      elements.push(this.elements[i]);
    }

    return new Vector(elements);
  }

  /**
   * Returns a new vector with the provided `elements` concatenated on the end.
   * $example Vector.augment
   * @param  {Number[]|Vector} elements
   * @return {Vector}
   */
  augment(elements) {
    return new Vector(this.elements.concat(elements.elements || elements));
  }

  /**
   * @alias Vector#multiply
   */
  x(k) {
    return this.multiply(k);
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
    const V = getElements(vector);
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
   * Returns the vector product of the vector with the argument.
   * @param {Vector|number[]} vector
   * @throws {DimensionalityMismatchError} if either this or the other vector
   * is not three-dimensional.
   * @returns {Vector}
   */
  cross(vector) {
    const B = getElements(vector);
    if (this.elements.length !== 3 || B.length !== 3) {
      throw new DimensionalityMismatchError(
        `A cross-product can only be calculated between 3-dimensional vectors (got ${B.length} and ${this.elements.length})`
      );
    }

    const A = this.elements;
    return new Vector([
      (A[1] * B[2]) - (A[2] * B[1]),
      (A[2] * B[0]) - (A[0] * B[2]),
      (A[0] * B[1]) - (A[1] * B[0])
    ]);
  }

  /**
   * Returns the (absolute) largest element of the vector
   * @returns {Number}
   */
  max() {
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
   * @returns {Number} Will be -1 if the vector is empty
   */
  maxIndex() {
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
   * @param {Number} x
   * @returns {Number}
   */
  indexOf(x) {
    for (let i = 0; this.elements.length; i++) {
      if (this.elements[i] === x) {
        return i + 1;
      }
    }

    return -1;
  }

  /**
   * Returns a diagonal matrix with the vector's elements as its diagonal elements
   * @returns {Matrix}
   */
  toDiagonalMatrix() {
    return Matrix.Diagonal(this.elements);
  }

  /**
   * Returns the result of rounding the elements of the vector
   * @returns {Vector}
   */
  round() {
    return this.map(x => Math.round(x));
  }

  /**
   * Transpose a Vector, return a 1xn Matrix.
   * @returns {Matrix}
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
   * Returns a copy of the vector with elements set to the given value if they
   * differ from it by less than the epislon.
   * @param {Number} target
   * @param {Number} epsilon
   * @return {Matrix}
   */
  snapTo(target, epsilon = Sylvester.precision) {
    return this.map(p => Math.abs(p - target) <= epsilon ? target : p);
  }

  /**
   * Returns the vector's distance from the argument, when considered as a point in space
   * @param {Vector|Line|Plane} obj
   */
  distanceFrom(obj) {
    if ('distanceFrom' in obj && !(obj instanceof Vector)) {
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
   * @param {Line} line
   * @returns {Boolean}
   */
  liesOn(line) {
    return line.contains(this);
  }

  /**
   * Returns true if the vector is point on the given plane
   * @param {Plane} plane
   * @returns {Boolean}
   */
  liesIn(plane) {
    return plane.contains(this);
  }

  /**
   * Rotates the vector about the given object. The object should be a point
   * if the vector is 2D, and a line if it is 3D. Be careful
   * with line directions!
   * @param {Number|Vector|Matrix} t
   * @param {Vector|Line} obj
   */
  rotate(t, obj) {
    let V;
    let R = null;
    let x;
    let y;
    let z;
    let C;
    if (t instanceof Matrix) {
      R = t.elements;
    }
    switch (this.elements.length) {
      case 2:
        V = Vector.toElements(obj, 2);
        if (!R) {
          R = Matrix.Rotation(t).elements;
        }
        x = this.elements[0] - V[0];
        y = this.elements[1] - V[1];
        return new Vector([
          V[0] + (R[0][0] * x) + (R[0][1] * y),
          V[1] + (R[1][0] * x) + (R[1][1] * y)
        ]);
      case 3:
        if (!(obj instanceof Line)) {
          throw new DimensionalityMismatchError('A line must be provided to rotate a 3D vector');
        }
        C = obj.pointClosestTo(this).elements;
        if (!R) {
          R = Matrix.Rotation(t, obj.direction).elements;
        }
        x = this.elements[0] - C[0];
        y = this.elements[1] - C[1];
        z = this.elements[2] - C[2];
        return new Vector([
          C[0] + (R[0][0] * x) + (R[0][1] * y) + (R[0][2] * z),
          C[1] + (R[1][0] * x) + (R[1][1] * y) + (R[1][2] * z),
          C[2] + (R[2][0] * x) + (R[2][1] * y) + (R[2][2] * z)
        ]);
      default:
        throw new DimensionalityMismatchError(`Cannot rotate a ${this.elements.length}D vector`);
    }
  }

  /**
   * Returns the result of reflecting the point in the given point, line or plane.
   * @param {Vector|Line|Plane} obj
   */
  reflectionIn(obj) {
    if (obj.anchor) {
      // obj is a plane or line
      const P = this.elements.slice();
      const C = obj.pointClosestTo(P).elements;
      return new Vector(P.map((p, i) => C[i] + (C[i] - p)));
    }

    // obj is a point
    const Q = getElements(obj);
    if (this.elements.length !== Q.length) {
      throw new DimensionalityMismatchError(
        `Cannot rotate a ${this.elements.dimensions}D point around the given ${Q.length}D point`
      );
    }
    return this.map((x, i) => {
      return Q[i - 1] + (Q[i - 1] - x);
    });
  }

  /**
   * Runs an element-wise logarithm on the vector.
   * @param {Number} Log base
   * @return {Matrix}
   */
  log(base = Math.E) {
    const logBase = Math.log(base); // change of base
    return this.map(x => Math.log(x) / logBase);
  }

  /**
   * Utility to make sure vectors are 3D. If they are 1/2D, a zero component is added.
   * @throws {DimensionalityMismatchError} if the vector has greater than three elements
   * @returns {Vector}
   */
  to3D() {
    return this.toDimension(3);
  }

  /**
   * Pads the vector with zero's until it reaches the given dimension.
   * @throws {DimensionalityMismatchError} if the vector has greater than n elements
   * @param {Number} n
   * @returns {Vector}
   */
  toDimension(n) {
    if (this.elements.length > n) {
      throw new DimensionalityMismatchError(`Cannot convert a ${this.elements.length}D vector to a ${n}D one`);
    }

    const next = new Array(n);
    for (let i = 0; i < n; i++) {
      next[i] = this.elements[i] || 0;
    }

    return new Vector(next);
  }

  /**
   * Returns a string representation of the vector
   * @returns {String}
   */
  inspect() {
    return `Vector<[${this.elements.join(', ')}]>`;
  }

  /**
   * @inheritdoc
   */
  toJSON() {
    return this.elements;
  }

  /**
   * Creates vector of the given size filled with random values in the range `[0, 1)`.
   * @param {Number} size
   * @returns {Vector}
   */
  static Random(size) {
    const elements = [];
    while (size--) {
      elements.push(Math.random());
    }
    return new Vector(elements);
  }

  /**
   * Creates a vector filled with the given value.
   * @param {Number} size
   * @param {Number} value
   * @returns {Vector}
   */
  static Fill(size, value) {
    const elements = [];
    while (size--) {
      elements.push(value);
    }
    return new Vector(elements);
  }

  /**
   * Creates an n-length vector filled with zeroes.
   * @param {Number} size
   * @returns {Vector}
   */
  static Zero(n) {
    return Vector.Fill(n, 0);
  }

  /**
   * Creates an n-length vector filled with ones.
   * @param {Number} size
   * @returns {Vector}
   */
  static One(n) {
    return Vector.Fill(n, 1);
  }
}

// i, j, k unit vectors
Vector.i = new Vector([1, 0, 0]);
Vector.j = new Vector([0, 1, 0]);
Vector.k = new Vector([0, 0, 1]);

// The following are shims for deprecated methods removed in 1.0.0
Vector.prototype.modulus = Vector.prototype.magnitude;
Vector.prototype.norm = Vector.prototype.magnitude;
Vector.prototype.dup = function () {
  return this.map(x => x);
};
