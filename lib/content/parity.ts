type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectObjectPaths(value: unknown, prefix = ""): string[] {
  if (!isRecord(value)) {
    return [prefix];
  }

  return Object.keys(value).flatMap((key) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return collectObjectPaths(value[key], nextPrefix);
  });
}

export function getMissingPaths(reference: unknown, candidate: unknown): string[] {
  const candidatePaths = new Set(collectObjectPaths(candidate));
  return collectObjectPaths(reference).filter((path) => !candidatePaths.has(path));
}
