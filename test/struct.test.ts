import { expect, test, describe } from "bun:test";
import { struct, bytes, uint8, uint16, uint32, uint64, cstring, string } from "../src";

describe("struct library", () => {
  test("basic struct operations", () => {
    const Header = struct("Header", {
      magic: bytes(4),
      version: uint16(),
      flags: uint8(),
      count: uint32(),
    }, { littleEndian: true });
    expect(Header.size).toBe(11);

    const data = {
      magic: new TextEncoder().encode("ABCD"),
      version: 123,
      flags: 7,
      count: 12345,
    };

    const buffer = Header.to(data);
    expect(buffer.byteLength).toBe(11);

    const view = new DataView(buffer);
    expect(view.getUint8(0)).toBe(65); // "A"
    expect(view.getUint8(1)).toBe(66); // "B"
    expect(view.getUint8(2)).toBe(67); // "C"
    expect(view.getUint8(3)).toBe(68); // "D"
    expect(view.getUint16(4, true)).toBe(123);
    expect(view.getUint8(6)).toBe(7);
    expect(view.getUint32(7, true)).toBe(12345);

    const parsed = Header.from(buffer);
    expect(new TextDecoder().decode(parsed.magic)).toBe("ABCD");
    expect(parsed.version).toBe(123);
    expect(parsed.flags).toBe(7);
    expect(parsed.count).toBe(12345);
  });

  test("64-bit integers and byte arrays", () => {
    const LargeData = struct("LargeData", {
      id: uint64(),
      timestamp: uint64(),
      guid: bytes(16),
    }, { littleEndian: true });

    const testData = {
      id: 123456789012345n,
      timestamp: 9876543210987n,
      guid: new Uint8Array(16).fill(0xFF),
    };

    const buffer = LargeData.to(testData);
    expect(buffer.byteLength).toBe(32);

    const parsed = LargeData.from(buffer);
    expect(parsed.id).toBe(123456789012345n);
    expect(parsed.timestamp).toBe(9876543210987n);
    expect([...parsed.guid]).toEqual(Array(16).fill(0xFF));
  });

  test("string fields", () => {
    const StringData = struct("StringData", {
      name: string(10),
      code: string(4),
    });
    const data = {
      name: "Test Name",
      code: "XYZ"
    };

    const buffer = StringData.to(data);
    expect(buffer.byteLength).toBe(14);

    // For fixed-length strings, we expect padding with null bytes for the full length
    const parsed = StringData.from(buffer);
    expect(parsed.name).toBe("Test Name\0");
    expect(parsed.code).toBe("XYZ\0");
  });

  test("cstring fields", () => {
    const CStringData = struct("CStringData", {
      name: cstring(10),
      code: cstring(5)
    });
    const data = {
      name: "Test Name",
      code: "XYZ"
    };

    const buffer = CStringData.to(data);
    expect(buffer.byteLength).toBe(15);

    // For cstrings, we expect the string to be terminated at the null byte
    // and not include any padding in the parsed result
    const parsed = CStringData.from(buffer);
    expect(parsed.name).toBe("Test Name");
    expect(parsed.code).toBe("XYZ");

    // Verify that the buffer actually contains null terminators
    // "Test Name" (9 chars) + null terminator at position 9
    // "XYZ" (3 chars) + null terminator at position 13
    const view = new DataView(buffer);
    expect(view.getUint8(9)).toBe(0);
    expect(view.getUint8(13)).toBe(0);
  });

  test("offset parsing", () => {
    const Simple = struct("Simple", {
      value: uint32(),
    }, { littleEndian: true });

    // Create a buffer with data at an offset
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setUint32(4, 0x12345678, true);

    // Parse with explicit offset
    const parsed = Simple.from(buffer, 4);
    expect(parsed.value).toBe(0x12345678);
  });

  test("instance methods work correctly", () => {
    const Header = struct("Header", {
      magic: bytes(4),
      version: uint16(),
      flags: uint8(),
      count: uint32(),
    }, { littleEndian: true });

    const initialData = {
      magic: new TextEncoder().encode("ABCD"),
      version: 123,
      flags: 7,
      count: 12345,
    };

    const buffer = Header.to(initialData);
    const header = Header.from(buffer);

    // Verify initial parsing worked
    expect(new TextDecoder().decode(header.magic)).toBe("ABCD");
    expect(header.version).toBe(123);

    // Test the $toBuffer method
    const newBuffer = header.$toBuffer();
    expect(newBuffer.byteLength).toBe(11);

    // Verify the new buffer has the same content
    const view = new DataView(newBuffer);
    expect(view.getUint8(0)).toBe(65); // "A"
    expect(view.getUint16(4, true)).toBe(123); // version

    // Test the $clone method
    const cloned = header.$clone();
    expect(cloned).not.toBe(header); // Different object reference
    expect(cloned.version).toBe(123);
    expect(new TextDecoder().decode(cloned.magic)).toBe("ABCD");

    // Modify the clone and make sure it doesn't affect the original
    cloned.version = 456;
    cloned.magic[0] = 88; // "X"

    // Verify original is unchanged
    expect(header.version).toBe(123);
    expect(header.magic[0]).toBe(65); // "A"

    // Convert modified clone to buffer
    const cloneBuffer = cloned.$toBuffer();
    const cloneView = new DataView(cloneBuffer);
    expect(cloneView.getUint16(4, true)).toBe(456); // Updated version
    expect(cloneView.getUint8(0)).toBe(88); // "X"

    // Check that $struct reference is correct
    expect(header.$struct).toBe(Header);
    expect(header.$struct.name).toBe("Header");
    expect(header.$struct.size).toBe(11);
  });
});
