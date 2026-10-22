---
"@incognitojam/tiny-struct": patch
---

Export the `Struct` and `StructInstanceMethods` types. Projects that emit declaration files can now export a struct definition, such as `export const Header = struct(...)`, without TypeScript failing with TS2742.
