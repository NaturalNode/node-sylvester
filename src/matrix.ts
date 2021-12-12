import { Sylvester, OutOfRangeError, DimensionalityMismatchError } from './sylvester';
import { Vector } from './vector';
import { VectorOrList, isVectorLike, MatrixLike, isMatrixLike } from './likeness';

/**
 * @private
 */
function sign(x: number) {
  return x < 0 ? -1 : 1;
}

/**
 * Augment a matrix M with identity rows/cols
 * @private
 */
function identSize(e: number[][], m: number, n: number, k: number) {
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

  return new Matrix(e);
}

/**
 * @private
 */
function pca(X: Matrix) {
  const Sigma = X.transpose()
    .x(X)
    .x(1 / X.rows);
  const svd = Sigma.svd();
  return {
    U: svd.U,
    S: svd.S,
  };
}

/**
 * @private
 */
const sizeStr = (matrix: MatrixLike) =>
  matrix instanceof Matrix
    ? `${matrix.rows}x${matrix.cols} matrix`
    : `${matrix.length}x${matrix[0].length}`;

/**
 * @private
 */
const extractElements = (
  matrixOrRows: MatrixLike | VectorOrList,
): ReadonlyArray<ReadonlyArray<number>> => {
  const rows = (matrixOrRows as any).elements || matrixOrRows;
  if (typeof rows[0][0] === 'undefined') {
    return new Matrix(rows).elements;
  }

  return rows;
};

/**
 * Returns a mutable copy of the matrix elements. Used internally only to avoid
 * unnecessary duplication. Dangerous to expose.
 * @private
 */
const takeOwnership = (matrix: Matrix): number[][] => (matrix as any).elements;

export class Matrix {
  /**
   * Matrix elements.
   */
  public readonly elements: ReadonlyArray<ReadonlyArray<number>>;

  /**
   * Gets the number of rows in the matrix.
   */
  public readonly rows: number;

  /**
   * Gets the number of columns in the matrix.
   */
  public readonly cols: number;

  constructor(input: MatrixLike | VectorOrList) {
    if (input instanceof Matrix) {
      this.elements = input.elements;
    } else if (input instanceof Vector) {
      this.elements = input.elements.map((e) => [e]);
    } else if (input[0] instanceof Array) {
      this.elements = input as number[][];
    } else {
      this.elements = (input as number[]).map((e) => [e]);
    }

    this.rows = this.elements.length;
    this.cols = this.rows && this.elements[0].length;
  }

  // solve a system of linear equations (work in progress)
  solve(b: Vector) {
    const lu = this.lu();
    const y = lu.L.forwardSubstitute(lu.P.x(b));
    const x = lu.U.backSubstitute(y);
    return lu.P.x(x);
    // return this.inv().x(b);
  }

  // project a matrix onto a lower dim

  pcaProject(k: number, U = pca(this).U) {
    const Ureduce = U.slice(1, U.rows, 1, k);
    return {
      Z: this.x(Ureduce),
      U,
    };
  }

  /**
   * Recover a matrix to a higher dimension
   */
  public pcaRecover(U: Matrix): Matrix {
    const k = this.cols;
    const Ureduce = U.slice(1, U.rows, 1, k);
    return this.x(Ureduce.transpose());
  }

  /**
   * Grab the upper triangular part of the matrix
   * @diagram Matrix.triu
   */
  public triu(k: number = 0): Matrix {
    return this.map((x, i, j) => {
      return j - i >= k ? x : 0;
    });
  }

  /**
   * Unroll a matrix into a vector
   * @diagram Matrix.unroll
   */
  public unroll(): Vector {
    const v = [];

    for (let i = 1; i <= this.cols; i++) {
      for (let j = 1; j <= this.rows; j++) {
        v.push(this.e(j, i)!);
      }
    }

    return new Vector(v);
  }

  /**
   * Returns a sub-block of the matrix.
   * @param startRow - Top-most starting row.
   * @param endRow - Bottom-most ending row. If 0, takes the whole matrix.
   * @param startCol - Left-most starting column.
   * @param endCol - Right-most ending column. If 0, takes the whole matrix.
   * @return {Matrix}
   * @diagram Matrix.slice
   */
  public slice(startRow: number, endRow: number, startCol: number, endCol: number): Matrix {
    const x: number[][] = [];

    if (endRow === 0) {
      endRow = this.rows;
    }

    if (endCol === 0) {
      endCol = this.cols;
    }

    for (let i = Math.max(1, startRow); i <= endRow; i++) {
      const row: number[] = [];

      for (let j = Math.max(1, startCol); j <= endCol; j++) {
        row.push(this.e(i, j)!);
      }

      x.push(row);
    }

    return new Matrix(x);
  }

  /**
   * Returns the element at (i, j) in the matrix, or null if out of bounds.
   * @param {Number} i Matrix row
   * @param {Number} j Matrix column
   * @diagram Matrix.e
   */
  public e(i: number, j: number): number | null {
    if (i < 1 || i > this.elements.length || j < 1 || j > this.elements[0].length) {
      return null;
    }

    return this.elements[i - 1][j - 1];
  }

  /**
   * Returns a vector containing the values in row o.
   * @throws A {@link OutOfRangeError} if o is out of range
   * @diagram Matrix.row
   */
  public row(i: number): Vector {
    if (i < 1 || i > this.elements.length) {
      throw new OutOfRangeError(`Row ${i} is outside the bounds of this ${sizeStr(this)}`);
    }

    return new Vector(this.elements[i - 1]);
  }

  /**
   * Returns a vector containing the values in column j.
   * @throws A {@link OutOfRangeError} if j is out of range
   * @diagram Matrix.col
   */
  public col(j: number): Vector {
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
   * Returns whether this matrix is approximately equal to the other one,
   * within the given precision.
   * @param matrix - Matrix or matrix values to compare
   * @param epsilon - The precision to compare each number.
   * @return True if the matrices are equal, false if they are not or a different size.
   */
  public eql(matrix: unknown, epsilon = Sylvester.approxPrecision) {
    if (!isMatrixLike(matrix)) {
      return false;
    }

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
   * Creates a new matrix by applying the mapping function
   * on all values in this one.
   */
  public map(fn: (value: number, row: number, column: number) => number) {
    const els: number[][] = [];
    let i = this.elements.length;
    const nj = this.elements[0].length;
    while (i--) {
      let j = nj;
      els[i] = [];
      while (j--) {
        els[i][j] = fn(this.elements[i][j], i + 1, j + 1);
      }
    }
    return new Matrix(els);
  }

  /**
   * Returns whether this matrix is the same size as the other one.
   * @diagram Matrix.isSameSizeAs
   */
  public isSameSizeAs(matrix: MatrixLike) {
    const M = extractElements(matrix);
    return this.elements.length === M.length && this.elements[0].length === M[0].length;
  }

  /**
   * Adds the number or matrix to this matrix.
   * @throws A {@link DimensionalityMismatchError} If the matrix is a different size than this one
   * @diagram Matrix.add
   */
  public add(matrix: number | MatrixLike) {
    if (typeof matrix === 'number') {
      return this.map((x) => x + matrix);
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
   * @throws A {@link DimensionalityMismatchError} If the matrix is a different size than this one
   * @diagram Matrix.subtract
   */
  public subtract(matrix: number | MatrixLike) {
    if (typeof matrix === 'number') {
      return this.map((x) => x - matrix);
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
   */
  public canMultiplyFromLeft(matrix: MatrixLike) {
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
   * @param op - Operation to run, taking the matrix value on the 'left' side
   * and the provided multiplicand on the right.
   */
  public mulOp(matrix: VectorOrList, op: (left: number, right: number) => number): Vector;
  public mulOp(matrix: MatrixLike | number, op: (left: number, right: number) => number): Matrix;
  public mulOp(
    matrix: MatrixLike | VectorOrList | number,
    op: (left: number, right: number) => number,
  ) {
    if (typeof matrix === 'number') {
      return this.map((x) => {
        return op(x, matrix);
      });
    }

    const returnVector = isVectorLike(matrix);
    const M = extractElements(matrix);
    if (!this.canMultiplyFromLeft(M)) {
      throw new DimensionalityMismatchError(
        `Cannot multiply a ${sizeStr(this)} by a ${sizeStr(M)}, expected an ${this.cols}xN matrix`,
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

    const output = new Matrix(elements);
    return returnVector ? output.col(1) : output;
  }

  /**
   * Returns the result of dividing the matrix from the  right by the argument.
   *
   * If the argument is a scalar then just operate on  all the elements. If
   * the argument is a vector, a vector is returned, which saves you having
   * to remember calling col(1) on the result.
   *
   * @throws A {@link DimensionalityMismatchError} If the divisor is an
   * inappropriately sized matrix
   */
  public div(divisor: VectorOrList): Vector;
  public div(divisor: MatrixLike | number): Matrix;
  public div(divisor: MatrixLike | VectorOrList | number): Vector | Matrix {
    // Cast is needed here since TS gets confused with nested overloads like this
    return this.mulOp(divisor as MatrixLike, (x, y) => x / y);
  }

  /**
   * Returns the result of multiplying the matrix from the right by the argument.
   *
   * If the argument is a scalar then just operate on all the elements. If
   * the argument is a vector, a vector is returned, which saves you having
   * to remember calling col(1) on the result.
   *
   * @throws A {@link DimensionalityMismatchError} If the multiplicand is an
   * inappropriately sized matrix
   * @diagram Matrix.multiply
   */
  public multiply(multiplicand: VectorOrList): Vector;
  public multiply(multiplicand: MatrixLike | number): Matrix;
  public multiply(multiplicand: MatrixLike | VectorOrList | number): Vector | Matrix {
    // Cast is needed here since TS gets confused with nested overloads like this
    return this.mulOp(multiplicand as MatrixLike, (x, y) => x * y);
  }

  /**
   * Alias to {@link Matrix.multiply}
   */
  public x(multiplicand: VectorOrList): Vector;
  public x(multiplicand: MatrixLike | number): Matrix;
  public x(multiplicand: MatrixLike | VectorOrList | number): Vector | Matrix {
    // Cast is needed here since TS gets confused with nested overloads like this
    return this.mulOp(multiplicand as MatrixLike, (x, y) => x * y);
  }

  /**
   * Multiplies matrix elements individually.
   * @throws A {@link DimensionalityMismatchError} If v is not the same size as this matrix
   * @diagram Matrix.elementMultiply
   */
  public elementMultiply(v: Matrix) {
    if (!this.isSameSizeAs(v)) {
      throw new DimensionalityMismatchError(
        `Cannot element multiple a ${sizeStr(this)} by a ${sizeStr(v)}, expected the same size`,
      );
    }
    return this.map((k, i, j) => {
      return v.e(i, j)! * k;
    });
  }

  /**
   * Sums all the elements of the matrix.
   * @diagram Matrix.sum
   */
  public sum() {
    let sum = 0;
    for (let i = 0; i < this.rows; i++) {
      for (let k = 0; k < this.cols; k++) {
        sum += this.elements[i][k];
      }
    }

    return sum;
  }

  /**
   * Returns the arithmetic mean of each column.
   * @diagram Matrix.mean
   */
  mean() {
    const r = [];
    for (let i = 1; i <= this.cols; i++) {
      r.push(this.col(i).sum() / this.rows);
    }
    return new Vector(r);
  }

  /**
   * Returns a Vector of each column's standard deviation
   * @diagram Matrix.std
   */
  public std(): Vector {
    const mMean = this.mean();
    const r = [];
    for (let i = 1; i <= this.cols; i++) {
      let meanDiff = this.col(i).subtract(mMean.e(i)!);
      meanDiff = meanDiff.multiply(meanDiff);
      r.push(Math.sqrt(meanDiff.sum() / this.rows));
    }
    return new Vector(r);
  }

  /**
   * Runs an element-wise logarithm on the matrix.
   * @diagram Matrix.log
   */
  public log(base = Math.E): Matrix {
    const logBase = Math.log(base); // change of base
    return this.map((x) => Math.log(x) / logBase);
  }

  /**
   * Returns a submatrix taken from the matrix. Element selection wraps if the
   * required index is outside the matrix's bounds, so you could use this to
   * perform row/column cycling or copy-augmenting.
   * @param nrows - Rows to copy
   * @param ncols - Columns to copy
   * @diagram Matrix.minor
   */
  minor(startRow: number, startCol: number, nrows: number, ncols: number) {
    const elements: number[][] = [];
    let ni = nrows;
    let i: number;
    let nj: number;
    let j: number;
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
    return new Matrix(elements);
  }

  /**
   * Returns the transposition of the matrix.
   * @diagram Matrix.transpose
   */
  public transpose() {
    const rows = this.elements.length;
    const cols = this.elements[0].length;
    const elements: number[][] = [];
    let i = cols;
    let j: number;
    while (i--) {
      j = rows;
      elements[i] = [];
      while (j--) {
        elements[i][j] = this.elements[j][i];
      }
    }
    return new Matrix(elements);
  }

  /**
   * Returns whether this is a square matrix.
   * @diagram Matrix.isSquare
   */
  isSquare() {
    return this.elements.length === this.elements[0].length;
  }

  /**
   * Returns the absolute largest element of the matrix
   * @diagram Matrix.max
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
   * @diagram Matrix.indexOf
   */
  public indexOf(x: number) {
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
   * @throws A {@link DimensionalityMismatchError} if the matrix is not square
   * @diagram Matrix.diagonal
   */
  public diagonal() {
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
   * @diagram Matrix.toRightTriangular
   */
  public toRightTriangular(): Matrix {
    const m = this.toArray();
    let els;
    const n = this.elements.length;
    let i;
    let j;
    const np = this.elements[0].length;
    let p;
    for (i = 0; i < n; i++) {
      if (m[i][i] === 0) {
        for (j = i + 1; j < n; j++) {
          if (m[j][i] !== 0) {
            els = [];
            for (p = 0; p < np; p++) {
              els.push(m[i][p] + m[j][p]);
            }
            m[i] = els;
            break;
          }
        }
      }
      if (m[i][i] !== 0) {
        for (j = i + 1; j < n; j++) {
          const multiplier = m[j][i] / m[i][i];
          els = [];
          for (p = 0; p < np; p++) {
            // Elements with column numbers up to an including the number
            // of the row that we're subtracting can safely be set straight to
            // zero, since that's the point of this routine and it avoids having
            // to loop over and correct rounding errors later
            els.push(p <= i ? 0 : m[j][p] - m[i][p] * multiplier);
          }
          m[j] = els;
        }
      }
    }

    return new Matrix(m);
  }

  /**
   * Returns the determinant of a square matrix.
   * @throws A {@link DimensionalityMismatchError} If the matrix is not square
   * @diagram Matrix.determinant
   */
  public determinant(): number {
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
   * @throws A {@link DimensionalityMismatchError} If the matrix is not square
   * @diagram Matrix.determinant
   */
  public det(): number {
    return this.determinant();
  }

  /**
   * Returns true if the matrix is singular
   * @diagram Matrix.isSingular
   */
  public isSingular(): boolean {
    return this.isSquare() && this.determinant() === 0;
  }

  /**
   * Returns the trace for square matrices
   * @throws A {@link DimensionalityMismatchError} if the matrix is not square
   * @diagram Matrix.trace
   */
  public trace(): number {
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
   * Returns the rank of the matrix.
   * @param epsilon - for comparison against 0
   * @diagram Matrix.rank
   */
  public rank(epsilon = Sylvester.precision): number {
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
   * Returns the result of attaching the given argument to the
   * right-hand side of the matrix.
   * @diagram Matrix.augment
   */
  public augment(matrix: MatrixLike): Matrix {
    const M = extractElements(matrix);
    const T = this.toArray();
    const cols = T[0].length;
    let i = T.length;
    const nj = M[0].length;
    let j;
    if (i !== M.length) {
      throw new DimensionalityMismatchError(`Attached matrix must have ${i} rows, got ${M.length}`);
    }
    while (i--) {
      j = nj;
      while (j--) {
        T[i][cols + j] = M[i][j];
      }
    }
    return new Matrix(T);
  }

  /**
   * Returns the inverse of the matrix.
   * @throws A {@link DimensionalityMismatchError} if the matrix is not invertible
   * @diagram Matrix.inverse
   */
  public inverse() {
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
    const M = takeOwnership(this.augment(Matrix.I(n)).toRightTriangular());
    const np = M[0].length;
    let p;
    let els;
    let divisor;

    const inverseElements: number[][] = [];
    // Matrix is non-singular so there will be no zeros on the diagonal
    // Cycle through rows from last to first

    let newElement: number;
    while (i--) {
      // First, normalise diagonal elements to 1
      els = [];
      inverseElements[i] = [];
      divisor = M[i][i];
      for (p = 0; p < np; p++) {
        newElement = M[i][p] / divisor;
        els.push(newElement);
        // Shuffle off the current row of the right hand side into the results
        // array as it will not be modified by later runs through this loop
        if (p >= n) {
          inverseElements[i].push(newElement);
        }
      }
      M[i] = els;
      // Then, subtract this row from those above it to
      // give the identity matrix on the left hand side
      j = i;
      while (j--) {
        els = [];
        for (p = 0; p < np; p++) {
          els.push(M[j][p] - M[i][p] * M[j][i]);
        }
        M[j] = els;
      }
    }
    return new Matrix(inverseElements);
  }

  /**
   * Rounds all values in the matrix.
   * @diagram Matrix.inverse
   */
  public round() {
    return this.map((x) => Math.round(x));
  }

  /**
   * Returns a copy of the matrix with elements set to the given value if they
   * differ from it by less than the epsilon.
   * @diagram Matrix.snapTo
   */
  public snapTo(target: number, epsilon = Sylvester.precision) {
    return this.map((p) => (Math.abs(p - target) <= epsilon ? target : p));
  }

  /**
   * Returns a string representation of the matrix.
   */
  public toString(): string {
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
  public toArray(): number[][] {
    const matrixRows: number[][] = [];
    const n = this.elements.length;
    for (let i = 0; i < n; i++) {
      matrixRows.push(this.elements[i].slice());
    }

    return matrixRows;
  }

  /**
   * Return the indexes of the columns with the largest value for each row.
   * @diagram Matrix.maxColumnIndexes
   */
  public maxColumnIndexes(): Vector {
    const maxes = [];

    for (let i = 1; i <= this.rows; i++) {
      let max = null;
      let maxIndex = -1;

      for (let j = 1; j <= this.cols; j++) {
        if (max === null || this.e(i, j)! > max) {
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
   * @diagram Matrix.maxColumns
   */
  public maxColumns(): Vector {
    const maxes = [];

    for (let i = 1; i <= this.rows; i++) {
      let max = null;

      for (let j = 1; j <= this.cols; j++) {
        if (max === null || this.e(i, j)! > max) {
          max = this.e(i, j);
        }
      }

      maxes.push(max ?? 0);
    }

    return new Vector(maxes);
  }

  /**
   * Return the indexes of the columns with the smallest values for each row.
   * @diagram Matrix.minColumnIndexes
   */
  public minColumnIndexes(): Vector {
    const mins = [];

    for (let i = 1; i <= this.rows; i++) {
      let min = null;
      let minIndex = -1;

      for (let j = 1; j <= this.cols; j++) {
        if (min === null || this.e(i, j)! < min) {
          min = this.e(i, j);
          minIndex = j;
        }
      }

      mins.push(minIndex);
    }

    return new Vector(mins);
  }

  /**
   * Return the smallest values in each row.
   * @diagram Matrix.minColumns
   */
  public minColumns(): Vector {
    const mins: number[] = [];

    for (let i = 1; i <= this.rows; i++) {
      let min = null;

      for (let j = 1; j <= this.cols; j++) {
        if (min === null || this.e(i, j)! < min) {
          min = this.e(i, j);
        }
      }

      mins.push(min ?? 0);
    }

    return new Vector(mins);
  }

  /**
   * Solve lower-triangular matrix * x = b via forward substitution
   * @diagram Matrix.forwardSubstitute
   */
  public forwardSubstitute(b: Vector): Vector {
    const xa = [];

    for (let i = 1; i <= this.rows; i++) {
      let w = 0;

      for (let j = 1; j < i; j++) {
        w += this.e(i, j)! * xa[j - 1];
      }

      xa.push((b.e(i)! - w) / this.e(i, i)!);
    }

    return new Vector(xa);
  }

  /**
   * Solve an upper-triangular matrix * x = b via back substitution
   * @diagram Matrix.backSubstitute
   */
  public backSubstitute(b: Vector): Vector {
    const xa = [];

    for (let i = this.rows; i > 0; i--) {
      let w = 0;

      for (let j = this.cols; j > i; j--) {
        w += this.e(i, j)! * xa[this.rows - j];
      }

      xa.push((b.e(i)! - w) / this.e(i, i)!);
    }

    return new Vector(xa.reverse());
  }

  public svd() {
    let V = Matrix.I(this.rows);
    let S = this.transpose();
    let U = Matrix.I(this.cols);
    let err = Number.MAX_VALUE;
    let i = 0;
    const maxLoop = 100;

    while (err > 2.2737e-13 && i < maxLoop) {
      let qr = S.transpose().qr();
      S = qr.R;
      V = V.x(qr.Q);
      qr = S.transpose().qr();
      U = U.x(qr.Q);
      S = qr.R;

      const e = S.triu(1).unroll().magnitude();
      let f = S.diagonal().magnitude();

      if (f === 0) {
        f = 1;
      }

      err = e / f;

      i++;
    }

    const ss = S.diagonal();
    const s = [];

    for (let i = 1; i <= ss.cols(); i++) {
      const ssn = ss.e(i)!;
      s.push(Math.abs(ssn));

      const els = takeOwnership(V);
      if (ssn < 0) {
        for (let j = 0; j < U.rows; j++) {
          els[j][i - 1] = -els[j][i - 1];
        }
      }
    }

    return {
      U,
      S: new Vector(s).toDiagonalMatrix(),
      V,
    };
  }

  /**
   * Runs a QR decomposition (QR facorization) on the matrix.
   * @see https://en.wikipedia.org/wiki/QR_decomposition
   */
  qr() {
    const m = this.rows;
    const n = this.cols;
    let Q = Matrix.I(m);
    let A: Matrix = this;

    for (let k = 1; k < Math.min(m, n); k++) {
      const ak = A.slice(k, 0, k, k).col(1);
      const oneZero = [1];

      while (oneZero.length <= m - k) {
        oneZero.push(0);
      }

      const oneZeroVec = new Vector(oneZero);
      const vk = ak.add(oneZeroVec.x(ak.magnitude() * sign(ak.e(1)!)));
      const Vk = new Matrix(vk);
      const Hk = Matrix.I(m - k + 1).subtract(
        Vk.x(2).x(Vk.transpose()).div(Vk.transpose().x(Vk).e(1, 1)!),
      );
      const Qk = identSize(takeOwnership(Hk), m, n, k);
      A = Qk.x(A);
      // slow way to compute Q
      Q = Q.x(Qk);
    }

    return {
      Q,
      R: A,
    };
  }

  /**
   * LU factorization for the matrix.
   */
  lu() {
    const rows = this.rows;
    const cols = this.cols;
    const L = Matrix.I(rows).toArray();
    const A = this.toArray();
    const P = Matrix.I(rows).toArray();
    const U = Matrix.Zero(rows, this.cols).toArray();

    let p = 1;

    /**
     * Perform a partial pivot on the matrix. Essentially move the largest
     * row below-or-including the pivot and replace the pivot's row with it.
     * a pivot matrix is returned so multiplication can perform the transform.
     */
    const partialPivot = (k: number, j: number) => {
      let maxIndex = 0;
      let maxValue = 0;

      for (let i = k; i <= rows; i++) {
        if (Math.abs(A[i - 1][j - 1]) > maxValue) {
          maxValue = Math.abs(A[k - 1][j - 1]);
          maxIndex = i;
        }
      }

      if (maxIndex !== k) {
        const tmp = A[k - 1];
        A[k - 1] = A[maxIndex - 1];
        A[maxIndex - 1] = tmp;

        P[k - 1][k - 1] = 0;
        P[k - 1][maxIndex - 1] = 1;
        P[maxIndex - 1][maxIndex - 1] = 0;
        P[maxIndex - 1][k - 1] = 1;
      }

      return P;
    };

    for (let k = 1; k <= Math.min(cols, rows); k++) {
      partialPivot(k, p);

      for (let i = k + 1; i <= rows; i++) {
        const l = A[i - 1][p - 1] / A[k - 1][p - 1];
        L[i - 1][k - 1] = l;

        for (let j = k + 1; j <= cols; j++) {
          A[i - 1][j - 1] -= A[k - 1][j - 1] * l;
        }
      }

      for (let j = k; j <= cols; j++) {
        U[k - 1][j - 1] = A[k - 1][j - 1];
      }

      if (p < cols) {
        p++;
      }
    }

    return {
      L: new Matrix(L),
      U: new Matrix(U),
      P: new Matrix(P),
    };
  }

  /**
   * Creates am identity matrix of the given size.
   */
  static I(size: number) {
    const elements = [];
    for (let y = 0; y < size; y++) {
      const row = [];
      for (let x = 0; x < size; x++) {
        row.push(x === y ? 1 : 0);
      }

      elements.push(row);
    }

    return new Matrix(elements);
  }

  /**
   * Creates a diagonal matrix from the given elements.
   * @diagram Matrix.Diagonal
   */
  static Diagonal(vector: VectorOrList) {
    const elements = Vector.toElements(vector);
    const rows = [];
    for (let y = 0; y < elements.length; y++) {
      const row = [];
      for (let x = 0; x < elements.length; x++) {
        row.push(x === y ? elements[x] : 0);
      }

      rows.push(row);
    }

    return new Matrix(rows);
  }

  /**
   * Creates a rotation matrix around the given axis.
   * @param theta - angle in radians
   * @param axis - 3-element vector describing the axis to rotate
   * around. If not provided, creates a 2D rotation.
   * @diagram Matrix.Rotation
   */
  static Rotation(theta: number, axis?: Vector) {
    if (!axis) {
      return new Matrix([
        [Math.cos(theta), -Math.sin(theta)],
        [Math.sin(theta), Math.cos(theta)],
      ]);
    }

    if (axis.elements.length !== 3) {
      throw new DimensionalityMismatchError(
        `A 3-element vector must be provided to Rotation, got ${axis.elements.length} elements`,
      );
    }
    const mod = axis.magnitude();
    const x = axis.elements[0] / mod;
    const y = axis.elements[1] / mod;
    const z = axis.elements[2] / mod;

    const s = Math.sin(theta);
    // Formula derived here: https://web.archive.org/web/20060315070756/http://www.gamedev.net/reference/articles/article1199.asp
    // That proof rotates the co-ordinate system so theta
    // becomes -theta and sin becomes -sin here.

    const c = Math.cos(theta);
    const t = 1 - c;
    return new Matrix([
      [t * x * x + c, t * x * y - s * z, t * x * z + s * y],
      [t * x * y + s * z, t * y * y + c, t * y * z - s * x],
      [t * x * z - s * y, t * y * z + s * x, t * z * z + c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the x axis.
   * @param t - angle in radians
   * @diagram Matrix.RotationX
   */
  static RotationX(t: number) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return new Matrix([
      [1, 0, 0],
      [0, c, -s],
      [0, s, c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the y axis.
   * @param t - angle in radians
   * @diagram Matrix.RotationY
   */
  static RotationY(t: number) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return new Matrix([
      [c, 0, s],
      [0, 1, 0],
      [-s, 0, c],
    ]);
  }

  /**
   * Creates a three-dimensional rotation matrix that rotates around the z axis.
   * @param t - angle in radians
   * @diagram Matrix.RotationZ
   */
  static RotationZ(t: number) {
    const c = Math.cos(t);
    const s = Math.sin(t);
    return new Matrix([
      [c, -s, 0],
      [s, c, 0],
      [0, 0, 1],
    ]);
  }

  /**
   * Creates an `n` by `m` matrix filled with random values between 0 and 1.
   * @param n - rows
   * @param m - columns
   */
  static Random(n: number, m: number) {
    if (arguments.length === 1) {
      m = n;
    }
    return Matrix.Zero(n, m).map(() => Math.random());
  }

  /**
   * Creates an `n` by `m` matrix filled with the given value.
   * @param n - rows
   * @param m - columns
   * @diagram Matrix.Fill
   */
  static Fill(n: number, m: number, value: number) {
    if (arguments.length === 2) {
      value = m;
      m = n;
    }

    const els: number[][] = [];
    let i = n;
    let j;

    while (i--) {
      j = m;
      els[i] = [];

      while (j--) {
        els[i][j] = value;
      }
    }

    return new Matrix(els);
  }

  /**
   * Creates an `n` by `m` matrix filled with 0's.
   * @param n - rows
   * @param m - columns
   * @diagram Matrix.Zero
   */
  static Zero(n: number, m: number) {
    return Matrix.Fill(n, m, 0);
  }

  /**
   * Creates an `n` by `m` matrix filled with 1's.
   * @param n - rows
   * @param m - columns
   * @diagram Matrix.One
   */
  static One(n: number, m: number) {
    return Matrix.Fill(n, m, 1);
  }
}
