# tiny-struct

A minimal TypeScript library for parsing and building binary data structures.

## Usage

```typescript
import { struct, bytes, uint32, uint64 } from "tiny-struct";

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

// Create binary data
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
