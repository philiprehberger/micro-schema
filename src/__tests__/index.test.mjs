import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { s, ValidationError } = await import('../../dist/index.js');

describe('string schema', () => {
  it('parses valid string', () => {
    assert.equal(s.string().parse('hello'), 'hello');
  });

  it('rejects non-string', () => {
    assert.throws(() => s.string().parse(123), (e) => e instanceof ValidationError);
  });

  it('min length', () => {
    assert.throws(() => s.string().min(3).parse('ab'));
    assert.equal(s.string().min(3).parse('abc'), 'abc');
  });

  it('max length', () => {
    assert.throws(() => s.string().max(3).parse('abcd'));
    assert.equal(s.string().max(3).parse('abc'), 'abc');
  });

  it('email validation', () => {
    assert.equal(s.string().email().parse('a@b.com'), 'a@b.com');
    assert.throws(() => s.string().email().parse('invalid'));
  });

  it('url validation', () => {
    assert.equal(s.string().url().parse('https://example.com'), 'https://example.com');
    assert.throws(() => s.string().url().parse('not-url'));
  });

  it('regex validation', () => {
    assert.equal(s.string().regex(/^[A-Z]+$/).parse('ABC'), 'ABC');
    assert.throws(() => s.string().regex(/^[A-Z]+$/).parse('abc'));
  });

  it('trim', () => {
    assert.equal(s.string().trim().parse('  hello  '), 'hello');
  });
});

describe('number schema', () => {
  it('parses valid number', () => {
    assert.equal(s.number().parse(42), 42);
  });

  it('rejects non-number', () => {
    assert.throws(() => s.number().parse('42'));
  });

  it('rejects NaN', () => {
    assert.throws(() => s.number().parse(NaN));
  });

  it('min', () => {
    assert.throws(() => s.number().min(5).parse(3));
    assert.equal(s.number().min(5).parse(5), 5);
  });

  it('max', () => {
    assert.throws(() => s.number().max(10).parse(11));
  });

  it('int', () => {
    assert.throws(() => s.number().int().parse(3.5));
    assert.equal(s.number().int().parse(3), 3);
  });

  it('positive', () => {
    assert.throws(() => s.number().positive().parse(0));
    assert.equal(s.number().positive().parse(1), 1);
  });

  it('negative', () => {
    assert.throws(() => s.number().negative().parse(0));
    assert.equal(s.number().negative().parse(-1), -1);
  });
});

describe('boolean schema', () => {
  it('parses true', () => assert.equal(s.boolean().parse(true), true));
  it('parses false', () => assert.equal(s.boolean().parse(false), false));
  it('rejects non-boolean', () => {
    assert.throws(() => s.boolean().parse('true'));
  });
});

describe('date schema', () => {
  it('parses Date object', () => {
    const d = new Date();
    assert.ok(s.date().parse(d) instanceof Date);
  });

  it('parses date string', () => {
    const d = s.date().parse('2026-01-01');
    assert.ok(d instanceof Date);
  });

  it('rejects invalid date', () => {
    assert.throws(() => s.date().parse('not-a-date'));
  });
});

describe('literal schema', () => {
  it('accepts exact match', () => {
    assert.equal(s.literal('hello').parse('hello'), 'hello');
  });

  it('rejects mismatch', () => {
    assert.throws(() => s.literal('hello').parse('world'));
  });
});

describe('enum schema', () => {
  it('accepts valid value', () => {
    assert.equal(s.enum(['a', 'b', 'c']).parse('b'), 'b');
  });

  it('rejects invalid value', () => {
    assert.throws(() => s.enum(['a', 'b']).parse('c'));
  });
});

describe('object schema', () => {
  it('parses valid object', () => {
    const schema = s.object({ name: s.string(), age: s.number() });
    const result = schema.parse({ name: 'Alice', age: 30 });
    assert.equal(result.name, 'Alice');
    assert.equal(result.age, 30);
  });

  it('rejects non-object', () => {
    assert.throws(() => s.object({ name: s.string() }).parse('string'));
  });

  it('nested validation errors have paths', () => {
    const schema = s.object({ user: s.object({ email: s.string().email() }) });
    const result = schema.safeParse({ user: { email: 'bad' } });
    assert.equal(result.success, false);
    assert.ok(result.errors[0].path.includes('user'));
    assert.ok(result.errors[0].path.includes('email'));
  });
});

describe('array schema', () => {
  it('parses valid array', () => {
    const result = s.array(s.number()).parse([1, 2, 3]);
    assert.deepEqual(result, [1, 2, 3]);
  });

  it('rejects non-array', () => {
    assert.throws(() => s.array(s.number()).parse('string'));
  });

  it('validates elements', () => {
    assert.throws(() => s.array(s.number()).parse([1, 'two', 3]));
  });

  it('min length', () => {
    assert.throws(() => s.array(s.number()).min(2).parse([1]));
  });

  it('max length', () => {
    assert.throws(() => s.array(s.number()).max(2).parse([1, 2, 3]));
  });
});

describe('union schema', () => {
  it('matches first valid type', () => {
    const schema = s.union([s.string(), s.number()]);
    assert.equal(schema.parse('hello'), 'hello');
    assert.equal(schema.parse(42), 42);
  });

  it('rejects when no type matches', () => {
    assert.throws(() => s.union([s.string(), s.number()]).parse(true));
  });
});

describe('record schema', () => {
  it('parses valid record', () => {
    const result = s.record(s.number()).parse({ a: 1, b: 2 });
    assert.deepEqual(result, { a: 1, b: 2 });
  });

  it('validates values', () => {
    assert.throws(() => s.record(s.number()).parse({ a: 'nope' }));
  });
});

describe('modifiers', () => {
  it('optional allows undefined', () => {
    const result = s.string().optional().safeParse(undefined);
    assert.equal(result.success, true);
    assert.equal(result.data, undefined);
  });

  it('nullable allows null', () => {
    const result = s.string().nullable().safeParse(null);
    assert.equal(result.success, true);
    assert.equal(result.data, null);
  });

  it('default provides value when undefined', () => {
    assert.equal(s.string().default('fallback').parse(undefined), 'fallback');
  });

  it('transform modifies output', () => {
    assert.equal(s.string().transform((s) => s.toUpperCase()).parse('hello'), 'HELLO');
  });

  it('refine adds custom validation', () => {
    assert.throws(() =>
      s.number().refine((n) => n % 2 === 0, 'Must be even').parse(3)
    );
    assert.equal(
      s.number().refine((n) => n % 2 === 0, 'Must be even').parse(4), 4
    );
  });
});

describe('safeParse', () => {
  it('returns success result on valid input', () => {
    const result = s.string().safeParse('hello');
    assert.equal(result.success, true);
    assert.equal(result.data, 'hello');
  });

  it('returns error result on invalid input', () => {
    const result = s.string().safeParse(123);
    assert.equal(result.success, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].message);
  });
});
