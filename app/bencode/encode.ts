import {
  TokenDictionary,
  TokenEnd,
  TokenColon,
  TokenInteger,
  TokenList,
} from "./tokens";

class Writer {
  private buffers: Buffer[] = [];

  public static write(data: unknown): Buffer {
    const writer = new Writer();
    writer.write(data);
    return Buffer.concat(writer.buffers);
  }

  private write(value: unknown): void {
    if (value === null || value === undefined) {
      throw new Error(`Unsupported data type`);
    }

    if (Buffer.isBuffer(value) || typeof value === "string") {
      this.string(value);
    } else if (typeof value === "number") {
      this.integer(value);
    } else if (typeof value === "object") {
      if (Array.isArray(value)) {
        this.list(value);
      } else {
        this.dictionary(value as Record<string, unknown>);
      }
    } else throw new Error(`Unsupported data type ${typeof value}`);
  }

  private dictionary(value: Record<string, unknown>): void {
    const keys = Object.keys(value).sort();

    this.buffers.push(TokenDictionary);

    for (const key of keys) {
      this.string(key);
      this.write(value[key]);
    }

    this.buffers.push(TokenEnd);
  }

  private string(value: string | Buffer): void {
    if (!Buffer.isBuffer(value)) {
      value = Buffer.from(value);
    }

    this.buffers.push(Buffer.from(String(value.length)), TokenColon, value);
  }

  private integer(value: number): void {
    this.buffers.push(TokenInteger, Buffer.from(String(value)), TokenEnd);
  }

  private list(data: unknown[]): void {
    this.buffers.push(TokenList);

    for (const item of data) {
      this.write(item);
    }

    this.buffers.push(TokenEnd);
  }
}

export const encode = (data: unknown): Buffer => Writer.write(data);
