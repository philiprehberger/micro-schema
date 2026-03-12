# @philiprehberger/micro-schema

Lightweight schema validation library with Zod-like API in under 3KB.

## Installation

```bash
npm install @philiprehberger/micro-schema
```

## Usage

### Define a Schema

```ts
import { s, type Infer } from '@philiprehberger/micro-schema';

const UserSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().positive().optional(),
  role: s.enum(['admin', 'user', 'guest']),
});

type User = Infer<typeof UserSchema>;
```

### Parse

```ts
// Throws ValidationError on failure
const user = UserSchema.parse(input);

// Safe parse — never throws
const result = UserSchema.safeParse(input);
if (result.success) {
  result.data; // User
} else {
  result.errors; // ValidationIssue[]
}
```

### Types

#### Primitives

```ts
s.string()       // string, with .min() .max() .email() .url() .uuid() .regex() .trim()
s.number()       // number, with .min() .max() .int() .positive() .negative()
s.boolean()      // boolean
s.date()         // Date (accepts Date, string, or number)
s.literal('foo') // exact value
s.enum(['a', 'b', 'c'])
```

#### Composites

```ts
s.object({ key: s.string() })   // object with shape
s.array(s.number())             // array, with .min() .max()
s.union([s.string(), s.number()])
s.record(s.number())            // Record<string, number>
```

### Modifiers

Available on all schema types:

```ts
s.string().optional()          // allows undefined
s.string().nullable()          // allows null
s.string().default('hello')    // default value if undefined
s.string().transform(s => s.toUpperCase())
s.number().refine(n => n % 2 === 0, 'Must be even')
```

### Nested Validation Errors

```ts
const schema = s.object({
  user: s.object({
    email: s.string().email(),
  }),
});

const result = schema.safeParse({ user: { email: 'bad' } });
// errors: [{ path: ['user', 'email'], message: 'Invalid email address' }]
```

### Type Inference

```ts
import { type Infer } from '@philiprehberger/micro-schema';

const Schema = s.object({
  name: s.string(),
  tags: s.array(s.string()),
  status: s.enum(['active', 'inactive']),
});

type MyType = Infer<typeof Schema>;
// { name: string; tags: string[]; status: 'active' | 'inactive' }
```

## API Reference

### Schema Builder (`s`)

| Method | Returns | Description |
|--------|---------|-------------|
| `s.string()` | `StringSchema` | String with `.min()` `.max()` `.email()` `.url()` `.uuid()` `.regex()` `.trim()` |
| `s.number()` | `NumberSchema` | Number with `.min()` `.max()` `.int()` `.positive()` `.negative()` |
| `s.boolean()` | `BooleanSchema` | Boolean. |
| `s.date()` | `DateSchema` | Date (accepts Date, string, or number). |
| `s.literal(value)` | `LiteralSchema` | Exact value match. |
| `s.enum(values)` | `EnumSchema` | One of specified string values. |
| `s.object(shape)` | `ObjectSchema` | Object with typed fields. |
| `s.array(schema)` | `ArraySchema` | Array with `.min()` `.max()`. |
| `s.union(schemas)` | `UnionSchema` | First matching schema wins. |
| `s.record(valueSchema)` | `RecordSchema` | `Record<string, T>`. |

### Schema Methods (all types)

| Method | Description |
|--------|-------------|
| `.parse(input)` | Returns validated value or throws `ValidationError`. |
| `.safeParse(input)` | Returns `{ success: true, data }` or `{ success: false, errors }`. |
| `.optional()` | Allows `undefined`. |
| `.nullable()` | Allows `null`. |
| `.default(value)` | Use default when `undefined`. |
| `.transform(fn)` | Transform the output value. |
| `.refine(check, message)` | Custom validation. |

### `ValidationError`

| Property | Type | Description |
|----------|------|-------------|
| `issues` | `ValidationIssue[]` | Array of `{ path: (string \| number)[], message: string }`. |

### `Infer<T>`

TypeScript utility type to extract the output type from any schema:
```ts
type User = Infer<typeof UserSchema>;
```

## License

MIT
