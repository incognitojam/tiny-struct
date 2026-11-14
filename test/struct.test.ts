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

  describe("Uint8Array with a non-zero byteOffset", () => {
    const Rec = struct("Rec", { tag: uint8(), name: string(5) });
    const buf = new Uint8Array([
      0x58, 0x58, 0x58, 0x58, 0x58, 0x58, 0x58, 0x58,
      7, ...new TextEncoder().encode("hello"),
    ]);

    test("subarray parses the same as ArrayBuffer with an offset", () => {
      const fromView = Rec.from(buf.subarray(8));
      const fromBuffer = Rec.from(buf.buffer, 8);
      expect([fromView.tag, fromView.name]).toEqual([7, "hello"]);
      expect([fromBuffer.tag, fromBuffer.name]).toEqual([7, "hello"]);
    });

    test("offset argument is relative to the view", () => {
      const parsed = Rec.from(buf.subarray(4), 4);
      expect([parsed.tag, parsed.name]).toEqual([7, "hello"]);
    });

    test("every field type reads relative to the view", () => {
      const All = struct("All", {
        a: uint8(),
        b: uint16(),
        c: uint32(),
        d: uint64(),
        e: bytes(2),
        f: cstring(4),
        g: string(3),
      }, { littleEndian: true });
      const values = {
        a: 1,
        b: 0x0203,
        c: 0x04050607,
        d: 0x08090a0b0c0d0e0fn,
        e: new Uint8Array([0x10, 0x11]),
        f: "abc",
        g: "xyz",
      };
      const encoded = new Uint8Array(All.to(values));
      const padded = new Uint8Array(3 + encoded.length).fill(0xff);
      padded.set(encoded, 3);

      const parsed = All.from(padded.subarray(3));
      expect(parsed.a).toBe(values.a);
      expect(parsed.b).toBe(values.b);
      expect(parsed.c).toBe(values.c);
      expect(parsed.d).toBe(values.d);
      expect([...parsed.e]).toEqual([...values.e]);
      expect(parsed.f).toBe(values.f);
      expect(parsed.g).toBe(values.g);
    });

    test("string field past the end of the view throws", () => {
      const Name = struct("Name", { name: string(5) });
      expect(() => Name.from(buf.subarray(0, 2))).toThrow(RangeError);
      expect(() => Name.from(buf.subarray(8, 12))).toThrow(RangeError);
    });

    test("string field coerces offsets like the DataView getters", () => {
      const view = new DataView(buf.buffer, 8, 2);
      const field = string(1);
      for (const offset of [NaN, 0.5, -0.5]) {
        expect(field.parse(view, offset, false)).toBe(String.fromCharCode(view.getUint8(offset)));
      }
      expect(() => field.parse(view, -1, false)).toThrow(RangeError);
      expect(() => field.parse(view, Infinity, false)).toThrow(RangeError);
    });
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
