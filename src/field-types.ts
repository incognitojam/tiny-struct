/**
 * Field type definitions for binary structs
 */

/**
 * Represents a field type in a binary struct
 */
export interface FieldType<T> {
  /** Size of the field in bytes */
  size: number;
  /** Parse bytes into the field's type */
  parse: (buffer: DataView, offset: number, littleEndian: boolean) => T;
  /** Write the field's value to a buffer */
  write: (buffer: DataView, offset: number, value: T, littleEndian: boolean) => void;
}

/**
 * Creates a field type for a fixed-size byte array
 * @param length Number of bytes
 */
export function bytes(length: number): FieldType<Uint8Array> {
  return {
    size: length,
    parse: (buffer, offset) => {
      const result = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        result[i] = buffer.getUint8(offset + i);
      }
      return result;
    },
    write: (buffer, offset, value) => {
      for (let i = 0; i < length; i++) {
        buffer.setUint8(offset + i, value[i] || 0);
      }
    },
  };
}

/**
 * Creates a field type for an 8-bit unsigned integer
 */
export function uint8(): FieldType<number> {
  return {
    size: 1,
    parse: (buffer, offset) => buffer.getUint8(offset),
    write: (buffer, offset, value) => buffer.setUint8(offset, value),
  };
}

/**
 * Creates a field type for a 16-bit unsigned integer
 */
export function uint16(): FieldType<number> {
  return {
    size: 2,
    parse: (buffer, offset, littleEndian) => buffer.getUint16(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setUint16(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for a 32-bit unsigned integer
 */
export function uint32(): FieldType<number> {
  return {
    size: 4,
    parse: (buffer, offset, littleEndian) => buffer.getUint32(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setUint32(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for a 64-bit unsigned integer
 */
export function uint64(): FieldType<bigint> {
  return {
    size: 8,
    parse: (buffer, offset, littleEndian) => buffer.getBigUint64(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setBigUint64(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for an 8-bit signed integer
 */
export function int8(): FieldType<number> {
  return {
    size: 1,
    parse: (buffer, offset) => buffer.getInt8(offset),
    write: (buffer, offset, value) => buffer.setInt8(offset, value),
  };
}

/**
 * Creates a field type for a 16-bit signed integer
 */
export function int16(): FieldType<number> {
  return {
    size: 2,
    parse: (buffer, offset, littleEndian) => buffer.getInt16(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setInt16(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for a 32-bit signed integer
 */
export function int32(): FieldType<number> {
  return {
    size: 4,
    parse: (buffer, offset, littleEndian) => buffer.getInt32(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setInt32(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for a 64-bit signed integer
 */
export function int64(): FieldType<bigint> {
  return {
    size: 8,
    parse: (buffer, offset, littleEndian) => buffer.getBigInt64(offset, littleEndian),
    write: (buffer, offset, value, littleEndian) => buffer.setBigInt64(offset, value, littleEndian),
  };
}

/**
 * Creates a field type for a null-terminated string
 * @param maxLength Maximum length of the string in bytes
 */
export function cstring(maxLength: number): FieldType<string> {
  return {
    size: maxLength,
    parse: (buffer, offset) => {
      const bytes = new Uint8Array(maxLength);
      let length = 0;

      for (let i = 0; i < maxLength; i++) {
        const byte = buffer.getUint8(offset + i);
        if (byte === 0) break;
        bytes[i] = byte;
        length++;
      }

      return new TextDecoder().decode(bytes.subarray(0, length));
    },
    write: (buffer, offset, value) => {
      const encoded = new TextEncoder().encode(value);
      const length = Math.min(encoded.length, maxLength - 1);

      for (let i = 0; i < length; i++) {
        buffer.setUint8(offset + i, encoded[i]);
      }

      // Null-terminate
      buffer.setUint8(offset + length, 0);
    },
  };
}

/**
 * Creates a field type for a fixed-length string
 * @param length Length of the string in bytes
 */
export function string(length: number): FieldType<string> {
  return {
    size: length,
    parse: (buffer, offset) => {
      return new TextDecoder().decode(new Uint8Array(buffer.buffer, offset, length));
    },
    write: (buffer, offset, value) => {
      const encoded = new TextEncoder().encode(value);
      const bytesToWrite = Math.min(encoded.length, length);

      for (let i = 0; i < bytesToWrite; i++) {
        buffer.setUint8(offset + i, encoded[i]);
      }

      // Pad with zeros if needed
      for (let i = bytesToWrite; i < length; i++) {
        buffer.setUint8(offset + i, 0);
      }
    },
  };
}

/**
 * Creates a custom field type with a custom parser and writer
 */
export function custom<T>(
  size: number,
  parse: (buffer: DataView, offset: number, littleEndian: boolean) => T,
  write: (buffer: DataView, offset: number, value: T, littleEndian: boolean) => void,
): FieldType<T> {
  return { size, parse, write };
}
