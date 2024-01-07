export const stringifyBendecoded = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Buffer.isBuffer(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((one) => stringifyBendecoded(one));
  }

  if (typeof value === "object") {
    const tmp: Record<string, unknown> = {};
    for (const [key, objectValue] of Object.entries(value)) {
      tmp[key] = stringifyBendecoded(objectValue);
    }

    return tmp;
  }

  return value;
};
