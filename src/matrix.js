import * as fs from 'fs';
import { Sylvester, OutOfRangeError, DimensionalityMismatchError } from './sylvester';
import { Vector } from './vector';

const lapack = (() => {
  try {
    return require('lapack');
  } catch (err) {
    return null;
  }
})();

function sign(x) {
  return x < 0 ? -1 : 1;
}

// augment a matrix M with identity rows/cols
function identSize(M, m, n, k) {
  const e = M.elements;
  let i = k - 1;

  while (i--) {
    const row = [];

    for (let j = 0; j < n; j++) {
      row.push(j === i ? 1 : 0);
    }

    e.unshift(row);
  }

  for (let i = k - 1; i < m; i++) {
    while (e[i].length < n) {
      e[i].unshift(0);
    }
  }

  return Matrix.create(e); // eslint-disable-line no-use-before-define
}

function pca(X) {
  const Sigma = X.transpose()
    .x(X)
    .x(1 / X.rows());
  const svd = Sigma.svd();
  return {
    U: svd.U,
    S: svd.S,
  };
}

const sizeStr = matrix => `${matrix.rows()}x${matrix.cols()} matrix`;

const extractElements = matrixOrRows => {
  const rows = matrixOrRows.elements || matrixOrRows;
  if (typeof rows[0][0] === 'undefined') {
    return Matrix.create(rows).elements;
  }

  return rows;
};

export class Matrix {
  // solve a system of linear equations (work in progress)
  solve(b) {
    const lu = this.lu();
    b = lu.P.x(b);
    const y = lu.L.forwardSubstitute(b);
    const x = lu.U.backSubstitute(y);
    return lu.P.x(x);
    // return this.inv().x(b);
  }

  // project a matrix onto a lower dim

  pcaProject(k, U = pca(this).U) {
    const Ureduce = U.slice(1, U.rows(), 1, k);
    return {
      Z: this.x(Ureduce),
      U,
    };
  }

  // recover a matrix to a higher dimension

  pcaRecover(U) {
    const k = this.cols();
    const Ureduce = U.slice(1, U.rows(), 1, k);
    return this.x(Ureduce.transpose());
  }

  // grab the upper triangular part of the matrix

  triu(k) {
    if (!k) {
      k = 0;
    }

    return this.map((x, i, j) => {
      return j - i >= k ? x : 0;
    });
  }

  // unroll a matrix into a vector

  unroll() {
    const v = [];

    for (let i = 1; i <= this.cols(); i++) {
      for (let j = 1; j <= this.rows(); j++) {
        v.push(this.e(j, i));
      }
    }

    return new Vector(v);
  }

  /**
   * Returns a sub-block of the matrix.
   * @param {Number} startRow Top-most starting row.
   * @param {Number} endRow Bottom-most ending row. If 0, takes the whole matrix.
   * @param {Number} startCol Left-most starting column.
   * @param {Number} endCol Right-most ending column. If 0, takes the whole matrix.
   * @return {Matrix}
   */
  slice(startRow, endRow, startCol, endCol) {
    const x = [];

    if (endRow === 0) {
      endRow = this.rows();
    }

    if (endCol === 0) {
      endCol = this.cols();
    }

    for (let i = Math.max(1, startRow); i <= endRow; i++) {
      const row = [];

      for (let j = Math.max(1, startCol); j <= endCol; j++) {
        row.push(this.e(i, j));
      }

      x.push(row);
    }

    return Matrix.create(x);
  }

  /**
   * Returns th element at (i, j) in the matrix.
   * @param {Number} i Matrix row
   * @param {Number} j Matrix column
   * @throws {OutOfRangeError} if (i, j) is out of range.
   * @return {Number}
   */
  e(i, j) {
    if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) {
      throw new OutOfRangeError(
        `The location (${i}, ${j}) is outside the bounds of this ${sizeStr(this)}`,
      );
    }

    return this.elements[i - 1][j - 1];
  }

  /**
   * Returns a vector containing the values in row o.
   * @param {Number} i
   * @throws {OutOfRangeError} if o is out of range
   * @return {Vector}
   */
  row(i) {
    if (i < 1 || i > this.elements.length) {
      throw new OutOfRangeError(`Row ${i} is outside the bounds of this ${sizeStr(this)}`);
    }
    return new Vector(this.elements[i - 1]);
  }

  /**
   * Returns a vector containing the values in column j.
   * @param {Number} j
   * @throws {OutOfRangeError} if j is out of range
   * @return {Vector}
   */
  col(j) {
    if (j < 1 || j > this.elements[0].length) {
      throw new OutOfRangeError(`Column ${j} is outside the bounds of this ${sizeStr(this)}`);
    }
    const col = [];
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      col.push(this.elements[i][j - 1]);
    }
    return new Vector(col);
  }

  /**
   * Returns the dimensions of the matrix.
   * @return {{ rows: Number, columns: number }}
   */
  dimensions() {
    return {
      rows: this.elements.length,
      cols: this.elements[0].length,
    };
  }

  /**
   * Returns the number of rows in the matrix.
   * @return {Number}
   */
  rows() {
    return this.elements.length;
  }
  /**
   * Returns the number of columns in the matrix.
   * @return {Number}
   */
  cols() {
    return this.elements[0].length;
  }

  /**
   * Returns whether this matrix is approximately equal to the other one,
   * within the given precision.
   * @param {Matrix} matrix Matrix to compare
   * @param {Number} epsilon The precision to compare each number.
   * @return {Boolean} True if the matrices are equal, false if they are not
   * or a different size.
   */
  approxEql(matrix, epsilon = Sylvester.approxPrecision) {
    return this.eql(matrix, epsilon);
  }

  /**
   * Returns whether this matrix is approximately equal to the other one,
   * within the given precision.
   * @param {Matrix|Number[]} matrix Matrix or matrix values to compare
   * @param {Number} epsilon The precision to compare each number.
   * @return {Boolean} True if the matrices are equal, false if they are not
   * or a different size.
   */
  eql(matrix, epsilon = Sylvester.approxPrecision) {
    const M = extractElements(matrix);
    if (this.elements.length !== M.length || this.elements[0].length !== M[0].length) {
      return false;
    }
    let i = this.elements.length;
    const nj = this.elements[0].length;
    let j;
    while (i--) {
      j = nj;
      while (j--) {
        if (Math.abs(this.elements[i][j] - M[i][j]) > epsilon) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Creates a copy of the matrix.
   * @return {Matrix}
   */
  dup() {
    return Matrix.create(this.elements);
  }

  /**
   * Creates a new matrix by applying the mapping function
   * on all values in this one.
   * @param {function(value: Number, row: Number, column: Number): Number} fn
   * @return {Matrix}
   */
  map(fn) {
    const els = [];
    let i = this.elements.length;
    const nj = this.elements[0].length;
    let j;
    while (i--) {
      j = nj;
      els[i] = [];
      while (j--) {
        els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
      }
    }
    return Matrix.create(els);
  }

  /**
   * Returns whether this matrix is the same size as the other one.
   * @param {Matrix} matrix
   * @returns {Boolean}
   */
  isSameSizeAs(matrix) {
    const M = extractElements(matrix);

    return this.elements.length === M.length && this.elements[0].length === M[0].length;
  }

  /**
   * Adds the number or matrix to this matrix.
   * @param {Number|Matrix} matrix
   * @throws {DimensionalityMismatchError} If the matrix is a different size than this one
   * @returns {Matrix}
   */
  add(matrix) {
    if (typeof matrix === 'number') {
      return this.map(x => x + matrix);
    }

    const M = extractElements(matrix);

    if (!this.isSameSizeAs(M)) {
      throw new DimensionalityMismatchError(
        `Cannot add a ${sizeStr(matrix)} to this (sizeStr(matrix))`,
      );
    }
    return this.map((x, i, j) => x + M[i - 1][j - 1]);
  }

  /**
   * Subtracts the number or matrix to this matrix.
   * @param {Number|Matrix} matrix
   * @throws {DimensionalityMismatchError} If the matrix is a different size than this one
   * @returns {Matrix}
   */
  subtract(matrix) {
    if (typeof matrix === 'number') {
      return this.map(x => x - matrix);
    }

    const M = extractElements(matrix);
    if (!this.isSameSizeAs(M)) {
      throw new DimensionalityMismatchError(
        `Cannot add a ${sizeStr(matrix)} to this (sizeStr(matrix))`,
      );
    }
    return this.map((x, i, j) => x - M[i - 1][j - 1]);
  }

  /**
   * Returns true if the give matrix can multiply this one from the left.
   * @param {Matrix} matrix
   * @return {Boolean}
   */
  canMultiplyFromLeft(matrix) {
    const M = extractElements(matrix);
    // this.columns should equal matrix.rows
    return this.elements[0].length === M.length;
  }

  /**
   * Returns the result of a multiplication-style operation the matrix from the
   * right by the argument.
   *
   * If the argument is a scalar then just operate on  all the elements. If
   * the argument is a vector, a vector is returned, which saves you having
   * to remember calling col(1) on the result.
   *
   * @private
   * @param {Matrix|Vector|number} matrix
   * @param {function(left: number, right: number): number} op Operation to run,
   * taking the matrix value on the 'left' side and the provided multiplicand
   * on the right.
   * @return {Matrix|Vector}
   */
  mulOp(matrix, op) {
    if (typeof matrix === 'number') {
      return this.map(x => {
        return op(x, matrix);
      });
    }

    const returnVector = Boolean(matrix.modulus);
    const M = extractElements(matrix);
    if (!this.canMultiplyFromLeft(M)) {
      throw new DimensionalityMismatchError(
        `Cannot multiply a ${sizeStr(this)} by a ${sizeStr(
          matrix,
        )}, expected an ${this.cols()}xN matrix`,
      );
    }

    const e = this.elements;
    let rowThis;
    let rowElem;
    const elements = [];
    let sum;
    const m = e.length;
    const n = M[0].length;
    const o = e[0].length;
    let i = m;
    let j;
    let k;

    while (i--) {
      rowElem = [];
      rowThis = e[i];
      j = n;

      while (j--) {
        sum = 0;
        k = o;

        while (k--) {
          sum += op(rowThis[k], M[k][j]);
        }

        rowElem[j] = sum;
      }

      elements[i] = rowElem;
    }

    const output = Matrix.create(elements);
    return returnVector ? output.col(1) : output;
  }

  /**
   * Returns the result of dividing the matrix from the  right by the argument.
   *
   * If the argument is a scalar then just operate on  all the elements. If
   * the argument is a vector, a vector is returned, which saves you having
   * to remember calling col(1) on the result.
   *
   * @param {Matrix|Vector|number} divisor
   * @throws {DimensionalityMismatchError} If the divisor is an
   * inappropriately sized matrix
   * @return {Matrix|Vector}
   */
  div(divisor) {
    return this.mulOp(divisor, (x, y) => x / y);
  }

  /**
   * Returns the result of multiplying the matrix from the right by the argument.
   *
   * If the argument is a scalar then just operate on  all the elements. If
   * the argument is a vector, a vector is returned, which saves you having
   * to remember calling col(1) on the result.
   *
   * @param {Matrix|Vector|number} multiplicand
   * @throws {DimensionalityMismatchError} If the multiplicand is an
   * inappropriately sized matrix
   * @return {Matrix|Vector}
   */
  multiply(multiplicand) {
    return this.mulOp(multiplicand, (x, y) => x * y);
  }

  /**
   * Alias to {@link Matrix.multiply}
   */
  x(matrix) {
    return this.multiply(matrix);
  }

  /**
   * Multiplies matrix elements individually.
   * @param {Matrix} v
   * @throws {DimensionalityMismatchError} If v is not the same size as this matrix
   * @returns {Matrix}
   */
  elementMultiply(v) {
    if (!this.isSameSizeAs(v)) {
      throw new DimensionalityMismatchError(
        `Cannot element multiple a ${sizeStr(this)} by a ${sizeStr(v)}, expected the same size`,
      );
    }
    return this.map((k, i, j) => {
      return v.e(i, j) * k;
    });
  }

  /**
   * Sums all the elements of the matrix.
   * @returns {Number}
   */
  sum() {
    let sum = 0;
    this.map(x => {
      // eslint-disable-line array-callback-return
      sum += x;
    });
    return sum;
  }

  /**
   * Returns the arithmetic mean of each column.
   * @return {Vector}
   */
  mean() {
    const dim = this.dimensions();
    const r = [];
    for (let i = 1; i <= dim.cols; i++) {
      r.push(this.col(i).sum() / dim.rows);
    }
    return new Vector(r);
  }

  /**
   * Returns a Vector of each column's standard deviation
   * @return {Vector}
   */
  std() {
    const dim = this.dimensions();
    const mMean = this.mean();
    const r = [];
    for (let i = 1; i <= dim.cols; i++) {
      let meanDiff = this.col(i).subtract(mMean.e(i));
      meanDiff = meanDiff.multiply(meanDiff);
      r.push(Math.sqrt(meanDiff.sum() / dim.rows));
    }
    return new Vector(r);
  }

  /**
   * Alias for {@link Matrix.col}
   * @return {Vector}
   */
  column(n) {
    return this.col(n);
  }

  /**
   * Runs an element-wise logarithm on the matrix.
   * @param {Number} Log base
   * @return {Matrix}
   */
  log(base = Math.E) {
    const logBase = Math.log(base); // change of base
    return this.map(x => Math.log(x) / logBase);
  }

  /**
   * Returns a submatrix taken from the matrix. Element selection wraps if the
   * required index is outside the matrix's bounds, so you could use this to
   * perform row/column cycling or copy-augmenting.
   * @param {Number} startRow
   * @param {Number} startCol Columns to copy
   * @param {Number} nrows Rows to copy
   * @param {Number} ncols Columns to copy
   * @param {Matrix}
   */
  minor(startRow, startCol, nrows, ncols) {
    const elements = [];
    let ni = nrows;
    let i;
    let nj;
    let j;
    const rows = this.elements.length;
    const cols = this.elements[0].length;
    while (ni--) {
      i = nrows - ni - 1;
      elements[i] = [];
      nj = ncols;
      while (nj--) {
        j = ncols - nj - 1;
        elements[i][j] = this.elements[(startRow + i - 1) % rows][(startCol + j - 1) % cols];
      }
    }
    return Matrix.create(elements);
  }

  /**
   * Returns the transposition of the matrix.
   * @return {Matrix}
   */
  transpose() {
    const rows = this.elements.length;
    const cols = this.elements[0].length;
    const elements = [];
    let i = cols;
    let j;
    while (i--) {
      j = rows;
      elements[i] = [];
      while (j--) {
        elements[i][j] = this.elements[j][i];
      }
    }
    return Matrix.create(elements);
  }

  /**
   * Returns whether this is a square matrix.
   * @returns {Boolean}
   */
  isSquare() {
    return this.elements.length === this.elements[0].length;
  }

  /**
   * Returns the absolute largest element of the matrix
   * @returns {Number}
   */
  max() {
    let m = 0;
    let i = this.elements.length;
    const nj = this.elements[0].length;
    let j;
    while (i--) {
      j = nj;
      while (j--) {
        if (Math.abs(this.elements[i][j]) > Math.abs(m)) {
          m = this.elements[i][j];
        }
      }
    }

    return m;
  }

  /**
   * Returns the index of the first occurence of x found
   * by reading row-by-row from left to right, or null.
   * @param {Number} x
   * @returns {?({ i: number, j: number })}
   */
  indexOf(x) {
    const ni = this.elements.length;
    let i;
    const nj = this.elements[0].length;
    let j;
    for (i = 0; i < ni; i++) {
      for (j = 0; j < nj; j++) {
        if (this.elements[i][j] === x) {
          return {
            i: i + 1,
            j: j + 1,
          };
        }
      }
    }

    return null;
  }

  /**
   * If the matrix is square, returns the diagonal elements as a vector.
   * @throws {DimensionalityMismatchError} if the matrix is not square
   * @return {Vector}
   */
  diagonal() {
    if (!this.isSquare()) {
      throw new DimensionalityMismatchError(
        `Cannot get the diagonal of a ${sizeStr(this)} matrix, matrix must be square`,
      );
    }
    const els = [];
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      els.push(this.elements[i][i]);
    }
    return new Vector(els);
  }

  /**
   * Make the matrix upper (right) triangular by Gaussian elimination.
   * This method only adds multiples of rows to other rows. No rows are
   * scaled up or switched, and the determinant is preserved.
   * @return {Matrix}
   */
  toRightTriangular() {
    const M = this.dup();
    let els;
    const n = this.elements.length;
    let i;
    let j;
    const np = this.elements[0].length;
    let p;
    for (i = 0; i < n; i++) {
      if (M.elements[i][i] === 0) {
        for (j = i + 1; j < n; j++) {
          if (M.elements[j][i] !== 0) {
            els = [];
            for (p = 0; p < np; p++) {
              els.push(M.elements[i][p] + M.elements[j][p]);
            }
            M.elements[i] = els;
            break;
          }
        }
      }
      if (M.elements[i][i] !== 0) {
        for (j = i + 1; j < n; j++) {
          const multiplier = M.elements[j][i] / M.elements[i][i];
          els = [];
          for (p = 0; p < np; p++) {
            // Elements with column numbers up to an including the number
            // of the row that we're subtracting can safely be set straight to
            // zero, since that's the point of this routine and it avoids having
            // to loop over and correct rounding errors later
            els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
          }
          M.elements[j] = els;
        }
      }
    }
    return M;
  }

  /**
   * Alias for {@link Matrix.toRightTriangular}
   * @returns {Matrix}
   */
  toUpperTriangular() {
    return this.toRightTriangular();
  }

  /**
   * Returns the determinant of a square matrix.
   * @throws {DimensionalityMismatchError} If the matrix is not square
   * @returns {Number}
   */
  determinant() {
    if (!this.isSquare()) {
      throw new DimensionalityMismatchError(
        `A matrix must be square to have a determinant, this is a ${sizeStr(this)}`,
      );
    }
    if (this.cols === 0 && this.rows === 0) {
      return 1;
    }
    const M = this.toRightTriangular();
    let det = M.elements[0][0];
    const n = M.elements.length;
    for (let i = 1; i < n; i++) {
      det *= M.elements[i][i];
    }
    return det;
  }

  /**
   * Alias for {@link determinant}
   * @throws {DimensionalityMismatchError} If the matrix is not square
   * @returns {Number}
   */
  det() {
    return this.determinant();
  }

  /**
   * Returns true if the matrix is singular
   * @returns {Boolean}
   */
  isSingular() {
    return this.isSquare() && this.determinant() === 0;
  }

  /**
   * Returns the trace for square matrices
   * @throws {DimensionalityMismatchError} if the matrix is not square
   * @return {Number}
   */
  trace() {
    if (!this.isSquare()) {
      throw new DimensionalityMismatchError(
        `Can only get the trace of square matrices, got a ${sizeStr(this)}`,
      );
    }

    let tr = this.elements[0][0];
    const n = this.elements.length;
    for (let i = 1; i < n; i++) {
      tr += this.elements[i][i];
    }
    return tr;
  }

  /**
   * Alias for {@link Matrix.trace}.
   * @throws {DimensionalityMismatchError} if the matrix is not square
   * @return {Number}
   */
  tr() {
    return this.trace();
  }

  /**
   * Returns the rank of the matrix.
   * @param {Number} epsilon for comparison against 0
   * @returns {Number}
   */
  rank(epsilon = Sylvester.precision) {
    const M = this.toRightTriangular();
    let rank = 0;
    let i = this.elements.length;
    const nj = this.elements[0].length;
    let j;
    while (i--) {
      j = nj;
      while (j--) {
        if (Math.abs(M.elements[i][j]) > epsilon) {
          rank++;
          break;
        }
      }
    }
    return rank;
  }

  /**
   * Alias for {@link Matrix.rank}
   * @param {Number} epsilon for comparison against 0
   * @returns {Number}
   */
  rk(epsilon = Sylvester.precision) {
    return this.rank(epsilon);
  }

  /**
   * Returns the result of attaching the given argument to the right-hand side of the matrix
   * @param {Matrix|number[][]} matrix
   */
  augment(matrix) {
    const M = extractElements(matrix);
    const T = this.dup();
    const cols = T.elements[0].length;
    let i = T.elements.length;
    const nj = M[0].length;
    let j;
    if (i !== M.length) {
      throw new DimensionalityMismatchError(`Attached matrix must have ${i} rows, got ${M.length}`);
    }
    while (i--) {
      j = nj;
      while (j--) {
        T.elements[i][cols + j] = M[i][j];
      }
    }
    return T;
  }

  /**
   * Returns the inverse of the matrix.
   * @throws {DimensionalityMismatchError} if the matrix is not invertible
   * @return {Matrix}
   */
  inverse() {
    if (!this.isSquare()) {
      throw new DimensionalityMismatchError(
        `A matrix must be square to be inverted, provided a ${sizeStr(this)}`,
      );
    }
    if (this.isSingular()) {
      throw new DimensionalityMismatchError(`Cannot invert the current matrix (determinant=0)`);
    }

    const n = this.elements.length;
    let i = n;
    let j;
    const M = this.augment(Matrix.I(n)).toRightTriangular();
    const np = M.elements[0].length;
    let p;
    let els;
    let divisor;

    const inverseElements = [];
    // Matrix is non-singular so there will be no zeros on the diagonal
    // Cycle through rows from last to first

    let newElement;
    while (i--) {
      // First, normalise diagonal elements to 1
      els = [];
      inverseElements[i] = [];
      divisor = M.elements[i][i];
      for (p = 0; p < np; p++) {
        newElement = M.elements[i][p] / divisor;
        els.push(newElement);
        // Shuffle off the current row of the right hand side into the results
        // array as it will not be modified by later runs through this loop
        if (p >= n) {
          inverseElements[i].push(newElement);
        }
      }
      M.elements[i] = els;
      // Then, subtract this row from those above it to
      // give the identity matrix on the left hand side
      j = i;
      while (j--) {
        els = [];
        for (p = 0; p < np; p++) {
          els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
        }
        M.elements[j] = els;
      }
    }
    return Matrix.create(inverseElements);
  }

  /**
   * Alias of {@link Matrix.inverse}
   * @throws {DimensionalityMismatchError} if the matrix is not invertible
   * @return {Matrix}
   */
  inv() {
    return this.inverse();
  }

  /**
   * Rounds all values in the matrix.
   * @return {Matrix}
   */
  round() {
    return this.map(x => Math.round(x));
  }

  /**
   * Returns a copy of the matrix with elements set to the given value if they
   * differ from it by less than the epislon.
   * @param {Number} target
   * @param {Number} epsilon
   * @return {Matrix}
   */
  snapTo(target, epsilon = Sylvester.precision) {
    return this.map(p => (Math.abs(p - target) <= epsilon ? target : p));
  }

  /**
   * Returns a string representation of the matrix.
   * @return {String}
   */
  inspect() {
    const matrixRows = ['Matrix<'];
    for (let i = 0; i < this.elements.length; i++) {
      matrixRows.push(`  [${this.elements[i].join(', ')}]`);
    }
    matrixRows.push('>');
    return matrixRows.join('\n');
  }

  /**
   * Returns a array representation of the matrix
   * @return {Number[]}
   */
  toArray() {
    const matrixRows = [];
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      matrixRows.push(this.elements[i]);
    }
    return matrixRows;
  }

  /**
   * @private
   */
  setElements(els) {
    let i;
    let j;
    const elements = els.elements || els;
    if (typeof elements[0][0] !== 'undefined') {
      i = elements.length;
      this.elements = [];
      while (i--) {
        j = elements[i].length;
        this.elements[i] = [];
        while (j--) {
          this.elements[i][j] = elements[i][j];
        }
      }
      return this;
    }
    const n = elements.length;
    this.elements = [];
    for (i = 0; i < n; i++) {
      this.elements.push([elements[i]]);
    }
    return this;
  }

  /**
   * Return the indexes of the columns with the largest value for each row.
   * @returns {Vector}
   */
  maxColumnIndexes() {
    const maxes = [];

    for (let i = 1; i <= this.rows(); i++) {
      let max = null;
      let maxIndex = -1;

      for (let j = 1; j <= this.cols(); j++) {
        if (max === null || this.e(i, j) > max) {
          max = this.e(i, j);
          maxIndex = j;
        }
      }

      maxes.push(maxIndex);
    }

    return new Vector(maxes);
  }

  /**
   * Return the largest values in each row.
   * @returns {Vector}
   */
  maxColumns() {
    const maxes = [];

    for (let i = 1; i <= this.rows(); i++) {
      let max = null;

      for (let j = 1; j <= this.cols(); j++) {
        if (max === null || this.e(i, j) > max) {
          max = this.e(i, j);
        }
      }

      maxes.push(max);
    }

    return new Vector(maxes);
  }

  /**
   * Return the indexes of the columns with the smallest values for each row.
   * @returns {Vector}
   */
  minColumnIndexes() {
    const mins = [];

    for (let i = 1; i <= this.rows(); i++) {
      let min = null;
      let minIndex = -1;

      for (let j = 1; j <= this.cols(); j++) {
        if (min === null || this.e(i, j) < min) {
          min = this.e(i, j);
          minIndex = j;
        }
      }

      mins.push(minIndex);
    }

    return new Vector(mins);
  }

  // return the smallest values in each row

  /**
   * Return the smallest values in each row.
   * @returns {Vector}
   */
  minColumns() {
    const mins = [];

    for (let i = 1; i <= this.rows(); i++) {
      let min = null;

      for (let j = 1; j <= this.cols(); j++) {
        if (min === null || this.e(i, j) < min) {
          min = this.e(i, j);
        }
      }

      mins.push(min);
    }

    return new Vector(mins);
  }

  // perorm a partial pivot on the matrix. essentially move the largest
  // row below-or-including the pivot and replace the pivot's row with it.
  // a pivot matrix is returned so multiplication can perform the transform.
  /**
   * Perform a partial pivot on the matrix. essentially move the largest
   * row below-or-including the pivot and replace the pivot's row with it.
   * a pivot matrix is returned so multiplication can perform the transform.
   */
  partialPivot(k, j, P, A) {
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = k; i <= A.rows(); i++) {
      if (Math.abs(A.e(i, j)) > maxValue) {
        maxValue = Math.abs(A.e(k, j));
        maxIndex = i;
      }
    }

    if (maxIndex !== k) {
      const tmp = A.elements[k - 1];
      A.elements[k - 1] = A.elements[maxIndex - 1];
      A.elements[maxIndex - 1] = tmp;

      P.elements[k - 1][k - 1] = 0;
      P.elements[k - 1][maxIndex - 1] = 1;
      P.elements[maxIndex - 1][maxIndex - 1] = 0;
      P.elements[maxIndex - 1][k - 1] = 1;
    }

    return P;
  }

  /**
   * Solve lower-triangular matrix * x = b via forward substitution
   * @param {Number} b
   * @returns {Vector}
   */
  forwardSubstitute(b) {
    const xa = [];

    for (let i = 1; i <= this.rows(); i++) {
      let w = 0;

      for (let j = 1; j < i; j++) {
        w += this.e(i, j) * xa[j - 1];
      }

      xa.push((b.e(i) - w) / this.e(i, i));
    }

    return new Vector(xa);
  }

  /**
   * solve an upper-triangular matrix * x = b via back substitution
   * @param {Number} b
   * @return {Vector}
   */
  backSubstitute(b) {
    const xa = [];

    for (let i = this.rows(); i > 0; i--) {
      let w = 0;

      for (let j = this.cols(); j > i; j--) {
        w += this.e(i, j) * xa[this.rows() - j];
      }

      xa.push((b.e(i) - w) / this.e(i, i));
    }

    return new Vector(xa.reverse());
  }

  svdJs() {
    const A = this;
    let V = Matrix.I(A.rows());
    let S = A.transpose();
    let U = Matrix.I(A.cols());
    let err = Number.MAX_VALUE;
    let i = 0;
    const maxLoop = 100;

    while (err > 2.2737e-13 && i < maxLoop) {
      let qr = S.transpose().qrJs();
      S = qr.R;
      V = V.x(qr.Q);
      qr = S.transpose().qrJs();
      U = U.x(qr.Q);
      S = qr.R;

      const e = S.triu(1)
        .unroll()
        .norm();
      let f = S.diagonal().norm();

      if (f === 0) {
        f = 1;
      }

      err = e / f;

      i++;
    }

    const ss = S.diagonal();
    const s = [];

    for (let i = 1; i <= ss.cols(); i++) {
      const ssn = ss.e(i);
      s.push(Math.abs(ssn));

      if (ssn < 0) {
        for (let j = 0; j < U.rows(); j++) {
          V.elements[j][i - 1] = -V.elements[j][i - 1];
        }
      }
    }

    return {
      U,
      S: new Vector(s).toDiagonalMatrix(),
      V,
    };
  }

  // singular value decomposition using LAPACK
  svdPack() {
    const result = lapack.sgesvd('A', 'A', this.elements);

    return {
      U: Matrix.create(result.U),
      S: Matrix.create(result.S)
        .column(1)
        .toDiagonalMatrix(),
      V: Matrix.create(result.VT).transpose(),
    };
  }

  // QR decomposition in pure javascript
  qrJs() {
    const m = this.rows();
    const n = this.cols();
    let Q = Matrix.I(m);
    let A = this;

    for (let k = 1; k < Math.min(m, n); k++) {
      const ak = A.slice(k, 0, k, k).col(1);
      let oneZero = [1];

      while (oneZero.length <= m - k) {
        oneZero.push(0);
      }

      oneZero = new Vector(oneZero);
      const vk = ak.add(oneZero.x(ak.norm() * sign(ak.e(1))));
      const Vk = Matrix.create(vk);
      const Hk = Matrix.I(m - k + 1).subtract(
        Vk.x(2)
          .x(Vk.transpose())
          .div(
            Vk.transpose()
              .x(Vk)
              .e(1, 1),
          ),
      );
      const Qk = identSize(Hk, m, n, k);
      A = Qk.x(A);
      // slow way to compute Q
      Q = Q.x(Qk);
    }

    return {
      Q,
      R: A,
    };
  }

  // QR decomposition using LAPACK
  qrPack() {
    const qr = lapack.qr(this.elements);

    return {
      Q: Matrix.create(qr.Q),
      R: Matrix.create(qr.R),
    };
  }

  // LU factorization from LAPACK
  luPack() {
    const lu = lapack.lu(this.elements);
    return {
      L: Matrix.create(lu.L),
      U: Matrix.create(lu.U),
      P: Matrix.create(lu.P),
      // don't pass back IPIV
    };
  }

  // pure Javascript LU factorization
  luJs() {
    const A = this.dup();
    const L = Matrix.I(A.rows());
    let P = Matrix.I(A.rows());
    const U = Matrix.Zeros(A.rows(), A.cols());
    let p = 1;

    for (let k = 1; k <= Math.min(A.cols(), A.rows()); k++) {
      P = A.partialPivot(k, p, P, A, L);

      for (let i = k + 1; i <= A.rows(); i++) {
        const l = A.e(i, p) / A.e(k, p);
        L.elements[i - 1][k - 1] = l;

        for (let j = k + 1; j <= A.cols(); j++) {
          A.elements[i - 1][j - 1] -= A.e(k, j) * l;
        }
      }

      for (let j = k; j <= A.cols(); j++) {
        U.elements[k - 1][j - 1] = A.e(k, j);
      }

      if (p < A.cols()) {
        p++;
      }
    }

    return {
      L,
      U,
      P,
    };
  }

  // Constructor function
  static create(aElements) {
    const M = new Matrix().setElements(aElements);
    return M;
  }

  /**
   * Creates am identity matrix of the given size.
   * @param {Number} size
   */
  static I(size) {
    const elements = [];
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        row.push(x === y ? 1 : 0);
      }

      elements.push(row);
    }

    return Matrix.create(elements);
  }

  /**
   * Creates a diagonal matrix from the given elements.
   * @param {Number[]} elements
   * @returns {Matrix}}
   */
  static Diagonal(elements) {
    const rows = [];
    for (let y = 0; y < elements.length; y++) {
      const row = [];
      for (let x = 0; x < elements.length; x++) {
        row.push(x === y ? elements[x] : 0);
      }

      rows.push(row);
    }

    return Matrix.create(rows);
  }

  /**
   * Creates a rotation matrix around the given axis.
   * @param {Number} theta angle in radians
   * @param {?Vector} axis 3-element vector describing the axis to rotate
   * around. If not provided, creates a 2D rotation.
   * @return {Matrix}
   */
  static Rotation(theta, axis) {
    if (!axis) {
      return Matrix.create([
        [Math.cos(theta), -Math.sin(theta)],
        [Math.sin(theta), Math.cos(theta)],
      ]);
    }

    if (axis.elements.length !== 3) {
      throw new DimensionalityMismatchError(
        `A 3-element vector must be provided to Rotation, got ${axis.elements.length} elements`,
      );
    }
    const mod = axis.modulus();
    const x = axis.elements[0] / mod;
    const y = axis.elements[1] / mod;
    const z = axis.elements[2] / mod;

    const s = Math.sin(theta);
    // Formula derived here: https://web.archive.org/web/20060315070756/http://www.gamedev.net/reference/articles/article1199.asp
    // That proof rotates the co-ordinate system so theta
    // becomes -theta and sin becomes -sin here.

    const c = Math.cos(theta);
    const t = 1 - c;
    return Matrix.create([
      [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
      [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
      [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the x axis.
   * @param {Number} t angle in radians
   * @return {Matrix}
   */
  static RotationX(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return Matrix.create([
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the y axis.
   * @param {Number} t angle in radians
   * @return {Matrix}
   */
  static RotationY(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return Matrix.create([
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the z axis.
   * @param {Number} t angle in radians
   * @return {Matrix}
   */
  static RotationZ(t) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return Matrix.create([
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ]);
  }

  /**
   * Creates an `n` by `m` matrix filled with random values between 0 and 1.
   * @param {Number} n rows
   * @param {Number} m columns
   * @returns {Matrix}
   */
  static Random(n, m) {
    if (arguments.length === 1) {
      m = n;
    }
    return Matrix.Zero(n, m).map(() => {
      return Math.random();
    });
  }

  /**
   * Creates an `n` by `m` matrix filled with the given value.
   * @param {Number} n rows
   * @param {Number} m columns
   * @param {Number} value
   * @returns {Matrix}
   */
  static Fill(n, m, value) {
    if (arguments.length === 2) {
      value = m;
      m = n;
    }

    const els = [];
    let i = n;
    let j;

    while (i--) {
      j = m;
      els[i] = [];

      while (j--) {
        els[i][j] = value;
      }
    }

    return Matrix.create(els);
  }

  /**
   * Creates an `n` by `m` matrix filled with 0's.
   * @param {Number} n rows
   * @param {Number} m columns
   * @returns {Matrix}
   */
  static Zero(n, m) {
    return Matrix.Fill(n, m, 0);
  }

  /**
   * Creates an `n` by `m` matrix filled with 0's.
   * @param {Number} n rows
   * @param {Number} m columns
   * @returns {Matrix}
   */
  static Zeros(n, m) {
    return Matrix.Zero(n, m);
  }

  /**
   * Creates an `n` by `m` matrix filled with 1's.
   * @param {Number} n rows
   * @param {Number} m columns
   * @returns {Matrix}
   */
  static One(n, m) {
    return Matrix.Fill(n, m, 1);
  }

  /**
   * Creates an `n` by `m` matrix filled with 1's.
   * @param {Number} n rows
   * @param {Number} m columns
   * @returns {Matrix}
   */
  static Ones(n, m) {
    return Matrix.One(n, m);
  }
}

// if node-lapack is installed use the fast, native fortran routines
if (lapack) {
  Matrix.prototype.svd = Matrix.prototype.svdPack;
  Matrix.prototype.qr = Matrix.prototype.qrPack;
  Matrix.prototype.lu = Matrix.prototype.luPack;
} else {
  // otherwise use the slower pure Javascript versions
  Matrix.prototype.svd = Matrix.prototype.svdJs;
  Matrix.prototype.qr = Matrix.prototype.qrJs;
  Matrix.prototype.lu = Matrix.prototype.luJs;
}
