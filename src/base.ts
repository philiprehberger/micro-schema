import { ValidationError } from './errors.js';
import type { ValidationIssue, SafeParseResult } from './errors.js';

export abstract class Schema<T> {
  abstract _parse(input: unknown, path: (string | number)[]): { value: T; issues: ValidationIssue[] };

  protected _refinements: Array<{ check: (val: T) => boolean; message: string }> = [];
  protected _transforms: Array<(val: unknown) => unknown> = [];
  protected _default?: T;
  protected _isOptional = false;
  protected _isNullable = false;
  protected _hasDefault = false;

  parse(input: unknown): T {
    const result = this.safeParse(input);
    if (!result.success) {
      throw new ValidationError(result.errors);
    }
    return result.data;
  }

  safeParse(input: unknown): SafeParseResult<T> {
    if (input === undefined && this._hasDefault) {
      input = this._default;
    }
    if (input === undefined && this._isOptional) {
      return { success: true, data: undefined as T };
    }
    if (input === null && this._isNullable) {
      return { success: true, data: null as T };
    }

    const { value, issues } = this._parse(input, []);
    if (issues.length > 0) {
      return { success: false, errors: issues };
    }

    for (const refinement of this._refinements) {
      if (!refinement.check(value)) {
        return { success: false, errors: [{ path: [], message: refinement.message }] };
      }
    }

    let result: unknown = value;
    for (const transform of this._transforms) {
      result = transform(result);
    }

    return { success: true, data: result as T };
  }

  optional(): Schema<T | undefined> {
    const clone = this._clone();
    clone._isOptional = true;
    return clone as unknown as Schema<T | undefined>;
  }

  nullable(): Schema<T | null> {
    const clone = this._clone();
    clone._isNullable = true;
    return clone as unknown as Schema<T | null>;
  }

  default(value: T): Schema<T> {
    const clone = this._clone();
    clone._default = value;
    clone._hasDefault = true;
    return clone;
  }

  transform<U>(fn: (val: T) => U): Schema<U> {
    const clone = this._clone();
    clone._transforms.push(fn as (val: unknown) => unknown);
    return clone as unknown as Schema<U>;
  }

  refine(check: (val: T) => boolean, message: string): Schema<T> {
    const clone = this._clone();
    clone._refinements.push({ check, message });
    return clone;
  }

  protected _clone(): this {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._refinements = [...this._refinements];
    clone._transforms = [...this._transforms];
    return clone;
  }
}
