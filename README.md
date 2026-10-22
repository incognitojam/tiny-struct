# tiny-struct

A minimal TypeScript library for parsing and building binary data structures.

## Installation

tiny-struct is published to [npm](https://www.npmjs.com/package/@incognitojam/tiny-struct) and [JSR](https://jsr.io/@incognitojam/tiny-struct).

```sh
npm install @incognitojam/tiny-struct
# or
bun add @incognitojam/tiny-struct
# or, with Deno
deno add jsr:@incognitojam/tiny-struct
```

## Usage

```typescript
import { struct, bytes, uint32, uint64 } from "@incognitojam/tiny-struct";

// Define a struct
const GPTHeader = struct("GPTHeader", {
  signature: bytes(8),
  revision: uint32(),
  headerSize: uint32(),
  currentLba: uint64(),
  // more fields...
}, {
  littleEndian: true
});

// Parse binary data
const header = GPTHeader.from(buffer);
console.log("Signature:", new TextDecoder().decode(header.signature));

// Modify it
header.revision = 0x00020000;
const modifiedBuffer = header.$toBuffer();

// Or create new data
const newBuffer = GPTHeader.to({
  signature: new TextEncoder().encode("EFI PART"),
  revision: 0x00010000,
  headerSize: 92,
  currentLba: 1n,
  // more fields...
});
```

## License

MIT
