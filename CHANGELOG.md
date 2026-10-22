# @incognitojam/tiny-struct

## 0.1.3

### Patch Changes

- d57d038: Export the `Struct` and `StructInstanceMethods` types. Projects that emit declaration files can now export a struct definition, such as `export const Header = struct(...)`, without TypeScript failing with TS2742.
- d57d038: Publish to npm as well as JSR. The npm package contains compiled JavaScript and type declarations, so it works with any bundler or TypeScript setup without depending on the npm.jsr.io compatibility registry.
