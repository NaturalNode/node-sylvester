# 1.0.0 (Unreleased)

Initial stable release. Notable breaking changes from 0.x:

 - `dup` methods have been removed, all data structures are now immutable.
 - methods which previously returned `null` when given invalid arguments will generally now throw.
 - `Vector.norm` and `Vector.modulus` were two implementations of the same function. They've been combined into the more commonly-known `Vector.magnitude` method; aliases have been added but usage is deprecated
