---
"@incognitojam/tiny-struct": patch
---

`string()` fields now parse correctly when `from()` is given a `Uint8Array` with a non-zero `byteOffset`, such as a `subarray()` or a pooled Node.js `Buffer`. They previously read from the start of the underlying `ArrayBuffer` and returned the wrong bytes. A `string()` field that extends past the end of the view now throws a `RangeError`, like the other field types, instead of reading bytes outside the view.
