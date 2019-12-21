# 1.0.0 (Unreleased)

Initial stable release. Notable changes from 0.x:

 - `dup` methods have been removed, all data structures are now immutable.
 - methods which previously returned `null` when given invalid arguments will generally now throw.
 - `Vector.norm` and `Vector.modulus` were two implementations of the same function. They've been combined into the more commonly-known `Vector.magnitude` method; aliases have been added but usage is deprecated.
 - `is*` methods which previously count return `null` now always return `true` or `false`.
 - Previously some Vector methods took both constant and Vectors for element-wise operations. Now, specific element-wise operations have been removed in favor of all basic operations being capable of element-wise operations.
 - Vector.indexOf now returns `-1` instead of null if an index is not found, for consistency with native JavaScript methods.
 - Several methods have been optimized, both in terms of their implementation and underlying algorithms.
 - Allowed Vector.log to take a custom log base.
 - Fixed a bux in Vector.maxIndex wherein it would return -1 on the zero vector.
