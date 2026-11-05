export type ConfigSchema = Record<string, "number" | "string" | "boolean">;

export function validateConfig(
  config: Record<string, unknown>,
  schema: ConfigSchema,
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  for (const [key, type] of Object.entries(schema)) {
    if (!(key in config)) {
      errors.push(`missing ${key}`);
      continue;
    }
    if (typeof config[key] !== type) {
      errors.push(`${key} expected ${type}, got ${typeof config[key]}`);
    }
  }
  return { ok: errors.length === 0, errors };
}
