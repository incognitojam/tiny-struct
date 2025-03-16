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
 * Common methods available on every struct instance
 */
export interface StructInstanceMethods<N extends string, T> {
  /** The struct definition this instance belongs to */
  readonly $struct: Struct<N, any>;

  /**
   * Convert this struct instance back to a binary buffer
   */
  $toBuffer(): ArrayBuffer;

  /**
   * Create a clone of this struct instance
   */
  $clone(): T;
}

/**
 * Type that converts a struct field definition to its corresponding TypeScript type
 * and adds struct instance methods
 */
export type StructType<N extends string, F> = Simplify<{
  [K in keyof F]: ExtractType<F[K]>;
} & StructInstanceMethods<N, Simplify<{
  [K in keyof F]: ExtractType<F[K]>;
} & StructInstanceMethods<N, any>>>>;

export type Struct<N extends string, F extends Record<string, FieldType<any>>> = {
  /** Name of the struct */
  name: N;

  /** Total size of the struct in bytes */
  size: number;

  /** Field definitions */
  fields: F;

  /**
   * Parse a buffer into a struct instance
   * @param buffer Buffer to parse
   */
  from(buffer: ArrayBuffer | Uint8Array): StructType<N, F>;

  /**
   * Parse a buffer into a struct instance
   * @param buffer Buffer to parse
   * @param offset Starting offset in the buffer
   */
  from(buffer: ArrayBuffer | Uint8Array, offset: number): StructType<N, F>;

  /**
   * Create a buffer from struct values
   * @param values Values to write to the buffer
   */
  to(values: Omit<StructType<N, F>, keyof StructInstanceMethods<N, any>>): ArrayBuffer;
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
): Struct<N, F> {
  // Default options
  const littleEndian = options.littleEndian ?? false;

  // Calculate total size
  let totalSize = 0;
  const fieldOffsets: Record<string, number> = {};

  for (const [fieldName, fieldType] of Object.entries(fields)) {
    fieldOffsets[fieldName] = totalSize;
    totalSize += fieldType.size;
  }

  // Create the struct definition
  const structDef: Struct<N, F> = {
    name,
    size: totalSize,
    fields,

    from(buffer, offset: number | undefined = 0): StructType<N, F> {
      const dataView = buffer instanceof ArrayBuffer
        ? new DataView(buffer)
        : new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

      const result: Record<string, any> = {};

      // Parse all fields
      for (const [fieldName, fieldType] of Object.entries(fields)) {
        const fieldOffset = fieldOffsets[fieldName];
        result[fieldName] = fieldType.parse(dataView, offset + fieldOffset, littleEndian);
      }

      // Add struct instance methods
      Object.defineProperties(result, {
        $struct: {
          value: structDef,
          enumerable: false,
          writable: false,
        },
        $toBuffer: {
          value: function () {
            return structDef.to(this);
          },
          enumerable: false,
          writable: false,
        },
        $clone: {
          value: function () {
            // Create a deep copy of this struct instance
            const clone = { ...this };

            // Deep copy any Uint8Array fields
            for (const [key, value] of Object.entries(this)) {
              if (value instanceof Uint8Array) {
                clone[key] = new Uint8Array(value);
              }
            }

            // Add instance methods to the clone
            Object.defineProperties(clone, {
              $struct: {
                value: this.$struct,
                enumerable: false,
                writable: false,
              },
              $toBuffer: {
                value: this.$toBuffer,
                enumerable: false,
                writable: false,
              },
              $clone: {
                value: this.$clone,
                enumerable: false,
                writable: false,
              },
            });

            return clone;
          },
          enumerable: false,
          writable: false,
        },
      });

      return result as StructType<N, F>;
    },

    to(values): ArrayBuffer {
      const buffer = new ArrayBuffer(totalSize);
      const dataView = new DataView(buffer);

      for (const [fieldName, fieldType] of Object.entries(fields)) {
        const fieldOffset = fieldOffsets[fieldName];
        const value = values[fieldName as keyof typeof values];
        fieldType.write(dataView, fieldOffset, value, littleEndian);
      }

      return buffer;
    },
  };

  return structDef;
}
