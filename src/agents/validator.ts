export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateOutput(
  output: Record<string, unknown> | null,
  schema: Record<string, unknown> | undefined,
): ValidationResult {
  if (schema === undefined) {
    return { valid: true, errors: [] };
  }

  if (output === null) {
    return { valid: false, errors: ['No structured output found'] };
  }

  const errors: string[] = [];

  // Check required fields
  const required = schema.required;
  if (Array.isArray(required)) {
    for (const field of required) {
      if (typeof field === 'string' && !(field in output)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  // Check top-level property types
  const properties = schema.properties;
  if (properties !== null && typeof properties === 'object' && !Array.isArray(properties)) {
    const props = properties as Record<string, unknown>;
    for (const [field, fieldSchema] of Object.entries(props)) {
      if (!(field in output)) {
        // Field is absent — only required fields are reported above; skip optional missing ones
        continue;
      }

      if (fieldSchema === null || typeof fieldSchema !== 'object' || Array.isArray(fieldSchema)) {
        continue;
      }

      const schemaDef = fieldSchema as Record<string, unknown>;
      const expectedType = schemaDef.type;
      if (typeof expectedType !== 'string') {
        continue;
      }

      const actualValue = output[field];
      const actualType = Array.isArray(actualValue) ? 'array' : typeof actualValue;

      if (actualType !== expectedType) {
        errors.push(`Field '${field}' expected ${expectedType} but got ${actualType}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
