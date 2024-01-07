import {
  TokenColon,
  TokenDictionary,
  TokenEnd,
  TokenInteger,
  TokenList,
} from "./tokens";

const string = (value: string | Buffer): Buffer => {
  if (!Buffer.isBuffer(value)) {
    value = Buffer.from(value);
  }

  return Buffer.concat([Buffer.from(String(value.length)), TokenColon, value]);
};

const integer = (value: number): Buffer =>
  Buffer.concat([TokenInteger, Buffer.from(String(value)), TokenEnd]);

const list = (value: unknown[]): Buffer => {
  const buffers: Buffer[] = [];

  for (const element of value) {
    buffers.push(write(element));
  }

  return Buffer.concat([TokenList, ...buffers, TokenEnd]);
};

const dictionary = (value: Record<string, unknown>): Buffer => {
  const keys = Object.keys(value).sort();
  const buffers: Buffer[] = [];

  for (const key of keys) {
    buffers.push(Buffer.concat([string(key), write(value[key])]));
  }

  return Buffer.concat([TokenDictionary, ...buffers, TokenEnd]);
};

export const write = (value: unknown): Buffer => {
  if (value === undefined || value === null) {
    throw new Error(`${value} is not supported`);
  }

  if (Buffer.isBuffer(value) || typeof value === "string") {
    return string(value);
  }

  if (Number.isInteger(value)) {
    return integer(value as number);
  }

  if (Array.isArray(value)) {
    return list(value);
  }

  if (typeof value === "object") {
    return dictionary(value as Record<string, unknown>);
  }

  throw new Error("Value type is not supported");
};
