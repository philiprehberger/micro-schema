import { Schema } from './base.js';
import type { ValidationIssue } from './errors.js';

type ObjectShape = Record<string, Schema<unknown>>;
type InferShape<T extends ObjectShape> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

export class ObjectSchema<T extends ObjectShape> extends Schema<InferShape<T>> {
  private _isStrict = false;

  constructor(private readonly _shape: T) {
    super();
  }

  strict(): ObjectSchema<T> {
    const c = this._clone() as ObjectSchema<T>;
    c._isStrict = true;
    return c;
  }

  _parse(input: unknown, path: (string | number)[]): { value: InferShape<T>; issues: ValidationIssue[] } {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return { value: {} as InferShape<T>, issues: [{ path, message: 'Expected object' }] };
    }

    const result: Record<string, unknown> = {};
    const issues: ValidationIssue[] = [];
    const obj = input as Record<string, unknown>;

    for (const [key, schema] of Object.entries(this._shape)) {
      const fieldResult = schema.safeParse(obj[key]);
      if (fieldResult.success) {
        result[key] = fieldResult.data;
      } else {
        for (const issue of fieldResult.errors) {
          issues.push({
            path: [...path, key, ...issue.path],
            message: issue.message,
          });
        }
      }
    }

    if (this._isStrict) {
      const knownKeys = new Set(Object.keys(this._shape));
      for (const key of Object.keys(obj)) {
        if (!knownKeys.has(key)) {
          issues.push({ path: [...path, key], message: `Unknown key "${key}"` });
        }
      }
    }

    return { value: result as InferShape<T>, issues };
  }
}

export class ArraySchema<T> extends Schema<T[]> {
  private _min?: number;
  private _max?: number;

  constructor(private readonly _itemSchema: Schema<T>) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): { value: T[]; issues: ValidationIssue[] } {
    if (!Array.isArray(input)) {
      return { value: [], issues: [{ path, message: 'Expected array' }] };
    }

    const issues: ValidationIssue[] = [];
    if (this._min !== undefined && input.length < this._min) {
      issues.push({ path, message: `Array must have at least ${this._min} items` });
    }
    if (this._max !== undefined && input.length > this._max) {
      issues.push({ path, message: `Array must have at most ${this._max} items` });
    }

    const result: T[] = [];
    for (let i = 0; i < input.length; i++) {
      const itemResult = this._itemSchema.safeParse(input[i]);
      if (itemResult.success) {
        result.push(itemResult.data);
      } else {
        for (const issue of itemResult.errors) {
          issues.push({
            path: [...path, i, ...issue.path],
            message: issue.message,
          });
        }
      }
    }

    return { value: result, issues };
  }

  min(n: number): ArraySchema<T> { const c = this._clone() as ArraySchema<T>; c._min = n; return c; }
  max(n: number): ArraySchema<T> { const c = this._clone() as ArraySchema<T>; c._max = n; return c; }
}

type InferTuple<T extends Schema<unknown>[]> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

export class TupleSchema<T extends Schema<unknown>[]> extends Schema<InferTuple<T>> {
  constructor(private readonly _schemas: [...T]) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): { value: InferTuple<T>; issues: ValidationIssue[] } {
    if (!Array.isArray(input)) {
      return { value: [] as unknown as InferTuple<T>, issues: [{ path, message: 'Expected array' }] };
    }

    const issues: ValidationIssue[] = [];
    if (input.length !== this._schemas.length) {
      issues.push({ path, message: `Expected ${this._schemas.length} items, got ${input.length}` });
    }

    const result: unknown[] = [];
    for (let i = 0; i < this._schemas.length; i++) {
      const itemResult = this._schemas[i].safeParse(input[i]);
      if (itemResult.success) {
        result.push(itemResult.data);
      } else {
        for (const issue of itemResult.errors) {
          issues.push({ path: [...path, i, ...issue.path], message: issue.message });
        }
      }
    }

    return { value: result as InferTuple<T>, issues };
  }
}

export class UnionSchema<T extends Schema<unknown>[]> extends Schema<
  T[number] extends Schema<infer U> ? U : never
> {
  constructor(private readonly _schemas: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): {
    value: T[number] extends Schema<infer U> ? U : never;
    issues: ValidationIssue[];
  } {
    const allIssues: ValidationIssue[][] = [];

    for (const schema of this._schemas) {
      const result = schema.safeParse(input);
      if (result.success) {
        return { value: result.data as any, issues: [] };
      }
      allIssues.push(result.errors);
    }

    const details = allIssues
      .map((issues, i) => `  type ${i}: ${issues.map((iss) => iss.message).join(', ')}`)
      .join('; ');

    return {
      value: undefined as any,
      issues: [{ path, message: `Value does not match any type in union (${details})` }],
    };
  }
}

export class RecordSchema<K extends Schema<string>, V extends Schema<unknown>> extends Schema<
  Record<string, V extends Schema<infer U> ? U : never>
> {
  constructor(
    private readonly _keySchema: K,
    private readonly _valueSchema: V,
  ) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): {
    value: Record<string, V extends Schema<infer U> ? U : never>;
    issues: ValidationIssue[];
  } {
    if (typeof input !== 'object' || input === null || Array.isArray(input)) {
      return { value: {} as any, issues: [{ path, message: 'Expected object' }] };
    }

    const result: Record<string, unknown> = {};
    const issues: ValidationIssue[] = [];
    const obj = input as Record<string, unknown>;

    for (const [key, value] of Object.entries(obj)) {
      const keyResult = this._keySchema.safeParse(key);
      if (!keyResult.success) {
        for (const issue of keyResult.errors) {
          issues.push({ path: [...path, key], message: `Invalid key: ${issue.message}` });
        }
        continue;
      }

      const valueResult = this._valueSchema.safeParse(value);
      if (valueResult.success) {
        result[key] = valueResult.data;
      } else {
        for (const issue of valueResult.errors) {
          issues.push({ path: [...path, key, ...issue.path], message: issue.message });
        }
      }
    }

    return { value: result as any, issues };
  }
}
