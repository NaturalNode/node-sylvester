import { Vector } from './vector';
import { Plane } from './plane';
import { Line, Segment } from './line';
import { Matrix } from './matrix';

// Helpers to check whether objects are something else, to avoid cyclic dependencies.

export type Geometry = Plane | Vector | Line | Segment | ReadonlyArray<number>;

/**
 * Gets whether the object is any recognizable geometry object.
 * @param {*} obj
 * @returns {Boolean}
 */
export const isGeometry = (obj: any): obj is Geometry =>
  obj && !!(obj.direction || obj.normal || obj.start || obj.to3D || obj instanceof Array);

/**
 * Gets whether the object looks like a line.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isLineLike = (obj: unknown): obj is Line =>
  typeof obj === 'object' && !!obj && 'direction' in obj;

/**
 * Gets whether the object looks like a plane.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isPlaneLike = (obj: unknown): obj is Plane =>
  typeof obj === 'object' && !!obj && 'normal' in obj;

/**
 * Gets whether the object looks like a line segment.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isSegmentLike = (obj: unknown): obj is Segment =>
  typeof obj === 'object' && !!obj && 'start' in obj;

/**
 * A vector or list of numbers (automatically converted to a vector when
 * passed to methods).
 */
export type VectorOrList = Vector | ReadonlyArray<number>;

/**
 * Gets whether the object looks like a vector.
 * @private
 */
export const isVectorLike = (obj: unknown): obj is Vector =>
  typeof obj === 'object' && !!obj && 'to3D' in obj;

/**
 * Gets whether the object looks like a vector or a list of numbers.
 * @private
 */
export const isVectorOrListLike = (obj: unknown): obj is VectorOrList =>
  Array.isArray(obj) || isVectorLike(obj);

export type MatrixLike = Matrix | ReadonlyArray<ReadonlyArray<number>>;

/**
 * Gets whether the object is {@link MatrixLike}.
 * @private
 */
export const isMatrixLike = (obj: unknown): obj is MatrixLike =>
  typeof obj === 'object' &&
  !!obj &&
  ((obj instanceof Array && obj[0] instanceof Array) || 'toRightTriangular' in obj);
