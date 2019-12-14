/**
 * Default Sylvester configurations.
 * @type {Object}
 */
export const Sylvester = {
  precision: 1e-6,
  approxPrecision: 1e-5,
};

/**
 * Base type for all intentionally-thrown errors.
 */
export class SylvesterError extends Error {}

/**
 * Thrown when an operation tries to access a value out of range.
 */
export class OutOfRangeError extends SylvesterError {}

/**
 * A DimensionalityMismatchError is thrown when an operation is run on two
 * units which should share a certain dimensional relationship, but fail it.
 */
export class DimensionalityMismatchError extends SylvesterError {}

/**
 * Thrown on an invalid Sylvester operation.
 */
export class InvalidOperationError extends SylvesterError {}
