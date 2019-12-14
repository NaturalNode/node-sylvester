// Helpers to check whether objects are something else, to avoid cyclic dependencies.

/**
 * Gets whether the object is any recognizable geometry object.
 * @param {*} obj
 * @returns {Boolean}
 */
export const isGeometry = obj =>
  obj && !!(obj.direction || obj.normal || obj.start || obj.to3D || obj instanceof Array);

/**
 * Gets whether the object looks like a line.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isLineLike = obj => obj && !!obj.direction;

/**
 * Gets whether the object looks like a plane.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isPlaneLike = obj => obj && !!obj.normal;

/**
 * Gets whether the object looks like a line segment.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isSegmentLike = obj => obj && !!obj.start;

/**
 * Gets whether the object looks like a vector.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isVectorLike = obj => obj && !!obj.to3D;

/**
 * Gets whether the object looks like a vector or a list of numbers.
 * @private
 * @param {*} obj
 * @returns {Boolean}
 */
export const isVectorOrListLike = obj => obj && (!!obj.to3D || obj instanceof Array);
