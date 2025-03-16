/**
 * Example usage of the binary struct library
 */
import { struct, bytes, uint32, uint64 } from "../src";

// Define the GPT Header struct
const GPTHeader = struct("GPTHeader", {
  signature: bytes(8),
  revision: uint32(),
  headerSize: uint32(),
  crc32: uint32(),
  reserved: uint32(),
  currentLba: uint64(),
  backupLba: uint64(),
  firstUsableLba: uint64(),
  lastUsableLba: uint64(),
  diskGuid: bytes(16),
  partEntryStartLba: uint64(),
  numPartEntries: uint32(),
  partEntrySize: uint32(),
  crc32PartEntries: uint32(),
}, {
  littleEndian: true,
});

// Example usage
function parseGPTHeader(buffer: ArrayBuffer): void {
  const header = GPTHeader.from(buffer);
  console.debug("Signature:", new TextDecoder().decode(header.signature));  // "EFI PART"
  console.debug("Revision:", header.revision);
  console.debug("Header Size:", header.headerSize);
  console.debug("Current LBA:", header.currentLba);
  console.debug("Backup LBA:", header.backupLba);
  console.debug("First Usable LBA:", header.firstUsableLba);
  console.debug("Last Usable LBA:", header.lastUsableLba);
  console.debug("Number of Partition Entries:", header.numPartEntries);
  console.debug("Partition Entry Size:", header.partEntrySize);
}

// Create a sample GPT header buffer for testing
function createSampleGPTHeader(): ArrayBuffer {
  // The GPT header is 92 bytes in total
  const buffer = new ArrayBuffer(92);
  const view = new DataView(buffer);

  // "EFI PART" signature
  const signature = new TextEncoder().encode("EFI PART");
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, signature[i] || 0);
  }

  // Revision 1.0
  view.setUint32(8, 0x00010000, true);

  // Header size (92 bytes)
  view.setUint32(12, 92, true);

  // CRC32 (dummy value for example)
  view.setUint32(16, 0x12345678, true);

  // Reserved
  view.setUint32(20, 0, true);

  // Current LBA (typically 1)
  view.setBigUint64(24, 1n, true);

  // Backup LBA (example value)
  view.setBigUint64(32, 1000000n, true);

  // First usable LBA (typically 34)
  view.setBigUint64(40, 34n, true);

  // Last usable LBA (example value)
  view.setBigUint64(48, 999967n, true);

  // Disk GUID (dummy values)
  for (let i = 0; i < 16; i++) {
    view.setUint8(56 + i, i + 1);
  }

  // Partition entry start LBA (typically 2)
  view.setBigUint64(72, 2n, true);

  // Number of partition entries (typically 128)
  view.setUint32(80, 128, true);

  // Size of each partition entry (typically 128 bytes)
  view.setUint32(84, 128, true);

  // CRC32 of partition array (dummy value)
  view.setUint32(88, 0x87654321, true);

  return buffer;
}

// Test the GPT header parsing
function testGPTHeader() {
  const buffer = createSampleGPTHeader();
  parseGPTHeader(buffer);

  // Test roundtrip serialization
  const header = GPTHeader.from(buffer);
  const newBuffer = GPTHeader.to(header);
  const newHeader = GPTHeader.from(newBuffer);

  console.debug("\nAfter roundtrip serialization:");
  console.debug("Signature:", new TextDecoder().decode(newHeader.signature));
  console.debug("First Usable LBA:", newHeader.firstUsableLba);
}

testGPTHeader();
