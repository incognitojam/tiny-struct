# @incognitojam/tiny-struct

## 0.1.5

### Patch Changes

- cb85bd9: tiny-struct no longer depends on `type-fest`, so installing it pulls in no other packages. Struct types are unchanged.
- 1b3cd33: `string()` fields now parse correctly when `from()` is given a `Uint8Array` with a non-zero `byteOffset`, such as a `subarray()` or a pooled Node.js `Buffer`. They previously read from the start of the underlying `ArrayBuffer` and returned the wrong bytes. A `string()` field that extends past the end of the view now throws a `RangeError`, like the other field types, instead of reading bytes outside the view.

## 0.1.4

### Patch Changes

- c9d3df5: The README now shows how to install from npm or JSR, and its usage example imports from `@incognitojam/tiny-struct` instead of `tiny-struct`, which is not a published package.

## 0.1.3

### Patch Changes

- d57d038: Export the `Struct` and `StructInstanceMethods` types. Projects that emit declaration files can now export a struct definition, such as `export const Header = struct(...)`, without TypeScript failing with TS2742.
- d57d038: Publish to npm as well as JSR. The npm package contains compiled JavaScript and type declarations, so it works with any bundler or TypeScript setup without depending on the npm.jsr.io compatibility registry.
