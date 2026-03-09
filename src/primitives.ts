import { Schema } from './base.js';
import type { ValidationIssue } from './errors.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class StringSchema extends Schema<string> {
  private _min?: number;
  private _max?: number;
  private _pattern?: RegExp;
  private _isEmail = false;
  private _isUrl = false;
  private _isUuid = false;
  private _shouldTrim = false;

  _parse(input: unknown, path: (string | number)[]): { value: string; issues: ValidationIssue[] } {
    let val = input;
    if (this._shouldTrim && typeof val === 'string') val = val.trim();

    if (typeof val !== 'string') {
      return { value: '' as string, issues: [{ path, message: 'Expected string' }] };
    }

    const issues: ValidationIssue[] = [];
    if (this._min !== undefined && val.length < this._min) {
      issues.push({ path, message: `String must be at least ${this._min} characters` });
    }
    if (this._max !== undefined && val.length > this._max) {
      issues.push({ path, message: `String must be at most ${this._max} characters` });
    }
    if (this._isEmail && !EMAIL_RE.test(val)) {
      issues.push({ path, message: 'Invalid email address' });
    }
    if (this._isUrl) {
      try { new URL(val); } catch { issues.push({ path, message: 'Invalid URL' }); }
    }
    if (this._isUuid && !UUID_RE.test(val)) {
      issues.push({ path, message: 'Invalid UUID' });
    }
    if (this._pattern && !this._pattern.test(val)) {
      issues.push({ path, message: `String does not match pattern ${this._pattern}` });
    }

    return { value: val, issues };
  }

  min(n: number): StringSchema { const c = this._clone() as StringSchema; c._min = n; return c; }
  max(n: number): StringSchema { const c = this._clone() as StringSchema; c._max = n; return c; }
  email(): StringSchema { const c = this._clone() as StringSchema; c._isEmail = true; return c; }
  url(): StringSchema { const c = this._clone() as StringSchema; c._isUrl = true; return c; }
  uuid(): StringSchema { const c = this._clone() as StringSchema; c._isUuid = true; return c; }
  regex(pattern: RegExp): StringSchema { const c = this._clone() as StringSchema; c._pattern = pattern; return c; }
  trim(): StringSchema { const c = this._clone() as StringSchema; c._shouldTrim = true; return c; }
}

export class NumberSchema extends Schema<number> {
  private _min?: number;
  private _max?: number;
  private _isInt = false;
  private _isPositive = false;
  private _isNegative = false;

  _parse(input: unknown, path: (string | number)[]): { value: number; issues: ValidationIssue[] } {
    if (typeof input !== 'number' || isNaN(input)) {
      return { value: 0, issues: [{ path, message: 'Expected number' }] };
    }

    const issues: ValidationIssue[] = [];
    if (this._min !== undefined && input < this._min) {
      issues.push({ path, message: `Number must be >= ${this._min}` });
    }
    if (this._max !== undefined && input > this._max) {
      issues.push({ path, message: `Number must be <= ${this._max}` });
    }
    if (this._isInt && !Number.isInteger(input)) {
      issues.push({ path, message: 'Expected integer' });
    }
    if (this._isPositive && input <= 0) {
      issues.push({ path, message: 'Expected positive number' });
    }
    if (this._isNegative && input >= 0) {
      issues.push({ path, message: 'Expected negative number' });
    }

    return { value: input, issues };
  }

  min(n: number): NumberSchema { const c = this._clone() as NumberSchema; c._min = n; return c; }
  max(n: number): NumberSchema { const c = this._clone() as NumberSchema; c._max = n; return c; }
  int(): NumberSchema { const c = this._clone() as NumberSchema; c._isInt = true; return c; }
  positive(): NumberSchema { const c = this._clone() as NumberSchema; c._isPositive = true; return c; }
  negative(): NumberSchema { const c = this._clone() as NumberSchema; c._isNegative = true; return c; }
}

export class BooleanSchema extends Schema<boolean> {
  _parse(input: unknown, path: (string | number)[]): { value: boolean; issues: ValidationIssue[] } {
    if (typeof input !== 'boolean') {
      return { value: false, issues: [{ path, message: 'Expected boolean' }] };
    }
    return { value: input, issues: [] };
  }
}

export class DateSchema extends Schema<Date> {
  _parse(input: unknown, path: (string | number)[]): { value: Date; issues: ValidationIssue[] } {
    if (input instanceof Date && !isNaN(input.getTime())) {
      return { value: input, issues: [] };
    }
    if (typeof input === 'string' || typeof input === 'number') {
      const date = new Date(input);
      if (!isNaN(date.getTime())) {
        return { value: date, issues: [] };
      }
    }
    return { value: new Date(0), issues: [{ path, message: 'Expected valid date' }] };
  }
}

export class LiteralSchema<T extends string | number | boolean> extends Schema<T> {
  constructor(private readonly _value: T) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): { value: T; issues: ValidationIssue[] } {
    if (input !== this._value) {
      return { value: this._value, issues: [{ path, message: `Expected ${JSON.stringify(this._value)}` }] };
    }
    return { value: input as T, issues: [] };
  }
}

export class EnumSchema<T extends string> extends Schema<T> {
  constructor(private readonly _values: readonly T[]) {
    super();
  }

  _parse(input: unknown, path: (string | number)[]): { value: T; issues: ValidationIssue[] } {
    if (typeof input !== 'string' || !this._values.includes(input as T)) {
      return {
        value: this._values[0],
        issues: [{ path, message: `Expected one of: ${this._values.join(', ')}` }],
      };
    }
    return { value: input as T, issues: [] };
  }
}
