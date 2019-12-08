# 1.0.0 (Unreleased)

Initial stable release. Notable changes from 0.x:

 - **breaking** **refactor**: `dup` methods have been removed, all data structures are now immutable.
 - **breaking** **refactor**:methods which previously returned `null` when given invalid arguments will generally now throw.
 - **breaking** **refactor**:`Vector.norm` and `Vector.modulus` were two implementations of the same function. They've been combined into the more commonly-known `Vector.magnitude` method; aliases have been added but usage is deprecated.
 - **breaking** **refactor**: `is*` methods which previously could return `null` now always return `true` or `false`.
 - **breaking** **feat**: Previously some Vector methods took both constant and Vectors for element-wise operations. Now, specific element-wise operations have been removed in favor of all basic operations being capable of element-wise operations.
 - **breaking** **fix**: previously `Matrix.diagonal()` could return odd results if a square matrix was not used; a `DimensionalityMismatchError` is now thrown if it's called on a non-square matrix.
 - **feat**: Several methods have been optimized, both in terms of their implementation and underlying algorithms.
