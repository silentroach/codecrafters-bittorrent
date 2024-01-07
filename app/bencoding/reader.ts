import { BufferReader } from "./buffer-reader";
import {
  TokenColon,
  TokenDictionaryCode,
  TokenEndCode,
  TokenIntegerCode,
  TokenListCode,
  TokenZeroCode,
} from "./tokens";

class Reader extends BufferReader {
  public decode(): unknown {
    switch (this.current) {
      case TokenIntegerCode:
        return this.integer();
      case TokenListCode:
        return this.list();
      case TokenDictionaryCode:
        return this.dictionary();
    }

    return this.string();
  }

  private dictionary(): Record<string, unknown> {
    this.skip(1); // skipping dictionary start token

    const result: Record<string, unknown> = {};

    while (this.current !== TokenEndCode) {
      const key = this.string();
      const value = this.decode();

      result[String(key)] = value;
    }

    this.skip(1); // skipping end token

    return result;
  }

  private list(): unknown[] {
    this.skip(1); // skipping list token

    const result: unknown[] = [];
    while (this.current !== TokenEndCode) {
      result.push(this.decode());
    }

    this.skip(1); // skipping end token

    return result;
  }

  private integer(): number {
    this.skip(1); // skipping start token

    const raw = this.readUntil(TokenEndCode);
    if (raw.at(0) === TokenZeroCode && raw.length > 1) {
      throw new Error("Failed to decode integer (leading zero)");
    }

    const value = parseInt(raw.toString(), 10);
    if (value === 0 && Object.is(value, -0)) {
      throw new Error("Failed to decode integer (-0 is invalid value)");
    }

    if (!Number.isFinite(value)) {
      throw new Error("Failed to decode integer (number is not finite)");
    }

    this.skip(1); // skipping end token

    return value;
  }

  private string(): Buffer {
    const prefix = this.readUntil(TokenColon);
    const length = parseInt(prefix.toString(), 10);

    if (!Number.isFinite(length) || length === 0) {
      throw new Error("Failed to decode string length");
    }

    return this.skip(1).read(length);
  }
}

export const decode = (value: Buffer | string): unknown =>
  new Reader(Buffer.isBuffer(value) ? value : Buffer.from(value)).decode();
