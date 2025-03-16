/**
 * Core functionality for the binary struct library
 * @module
 */

import type { Simplify } from "type-fest";
import type { FieldType } from "./field-types.ts";

/**
 * Options for struct parsing
 */
export interface StructOptions {
  littleEndian?: boolean;
}

/**
 * Type that extracts the TypeScript type from a field definition
 */
export type ExtractType<F> = F extends FieldType<infer T> ? T : never;

/**
 * Type that converts a struct field definition to its corresponding TypeScript type
 */
export type StructType<T> = {
  [K in keyof T]: ExtractType<T[K]>;
};

export type Struct<N extends string, F extends Record<string, FieldType<any>>> = {
  name: N;
  size: number;
  fields: F;

  /**
   * Parse a buffer into a struct instance
   * @param buffer Buffer to parse
   */
  from(buffer: ArrayBuffer | Uint8Array): Simplify<StructType<F>>;

  /**
   * Parse a buffer into a struct instance
   * @param buffer Buffer to parse
   * @param offset Starting offset in the buffer
   */
  from(buffer: ArrayBuffer | Uint8Array, offset: number | undefined): Simplify<StructType<F>>;

  /**
   * Create a buffer from struct values
   * @param values Values to write to the buffer
   */
  to(values: Simplify<StructType<F>>): ArrayBuffer;
}

/**
 * Creates a struct definition
 * @param name Name of the struct
 * @param fields Field definitions
 * @param options Struct options
 */
export function struct<N extends string, F extends Record<string, FieldType<any>>>(
  name: N,
  fields: F,
  options: StructOptions = {},
): Simplify<Struct<N, F>> {
  // Default options
  const littleEndian = options.littleEndian ?? false;

  // Calculate total size
  let totalSize = 0;
  const fieldOffsets: Record<string, number> = {};

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    fieldOffsets[fieldName] = totalSize;
    totalSize += fieldType.size;
  }

  return {
    name,
    size: totalSize,
    fields,
    from(buffer, offset: number | undefined = 0): StructType<F> {
      const dataView = buffer instanceof ArrayBuffer
        ? new DataView(buffer)
        : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

      const result: Record<string, any> = {};

      for (const [fieldName, fieldType] of Object.entries(fields)) {
        const fieldOffset = fieldOffsets[fieldName];
        result[fieldName] = fieldType.parse(dataView, offset + fieldOffset, littleEndian);
      }

      return result as StructType<F>;
    },
    to(values): ArrayBuffer {
      const buffer = new ArrayBuffer(totalSize);
      const dataView = new DataView(buffer);

      for (const [fieldName, fieldType] of Object.entries(fields)) {
        const fieldOffset = fieldOffsets[fieldName];
        fieldType.write(dataView, fieldOffset, values[fieldName as keyof F], littleEndian);
      }

      return buffer;
    },
  };
}
