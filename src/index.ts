import { StringSchema, NumberSchema, BooleanSchema, DateSchema, LiteralSchema, EnumSchema } from './primitives.js';
import { ObjectSchema, ArraySchema, UnionSchema, RecordSchema } from './composites.js';
import { Schema } from './base.js';

export const s = {
  string: () => new StringSchema(),
  number: () => new NumberSchema(),
  boolean: () => new BooleanSchema(),
  date: () => new DateSchema(),
  literal: <T extends string | number | boolean>(value: T) => new LiteralSchema(value),
  enum: <T extends string>(values: readonly T[]) => new EnumSchema(values),
  object: <T extends Record<string, Schema<unknown>>>(shape: T) => new ObjectSchema(shape),
  array: <T>(schema: Schema<T>) => new ArraySchema(schema),
  union: <T extends Schema<unknown>[]>(schemas: [...T]) => new UnionSchema(schemas),
  record: <V extends Schema<unknown>>(valueSchema: V) => new RecordSchema(new StringSchema(), valueSchema),
};

export type Infer<T extends Schema<unknown>> = T extends Schema<infer U> ? U : never;

export { Schema } from './base.js';
export { ValidationError } from './errors.js';
export type { ValidationIssue, SafeParseResult } from './errors.js';
export { StringSchema, NumberSchema, BooleanSchema, DateSchema, LiteralSchema, EnumSchema } from './primitives.js';
export { ObjectSchema, ArraySchema, UnionSchema, RecordSchema } from './composites.js';
