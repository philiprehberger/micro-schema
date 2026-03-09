export interface ValidationIssue {
  path: (string | number)[];
  message: string;
}

export class ValidationError extends Error {
  public readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    const msg = issues.map((i) => {
      const path = i.path.length > 0 ? `${i.path.join('.')}: ` : '';
      return `${path}${i.message}`;
    }).join('; ');
    super(`Validation failed: ${msg}`);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationIssue[] };
