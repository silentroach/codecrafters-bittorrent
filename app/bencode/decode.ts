import {
  TokenIntegerCode,
  TokenListCode,
  TokenDictionaryCode,
  TokenEnd,
  TokenEndCode,
  TokenColon,
} from "./tokens";

class Reader {
  private index: number = 0;
  constructor(
    private readonly value: Buffer,
    private readonly stringsAsBuffer = true
  ) {}

  private get current() {
    return this.value.at(this.index);
  }

  public read(): unknown {
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

  public dictionary(): Record<string, unknown> {
    ++this.index;
    const result: Record<string, unknown> = {};

    while (this.current !== TokenEndCode) {
      const key = this.string();
      const value = this.read();

      result[String(key)] = value;
    }

    return result;
  }

  public list(): readonly unknown[] {
    ++this.index;
    const result: unknown[] = [];

    while (!(this.current === TokenEndCode)) {
      result.push(this.read());
    }

    ++this.index;

    return result;
  }

  public integer(): number {
    const endIndex = this.value.indexOf(TokenEnd, this.index + 1);
    const rawValue = this.value.subarray(this.index + 1, endIndex);
    const value = parseInt(rawValue.toString(), 10);

    if (!Number.isFinite(value)) {
      throw new Error("Failed to decode integer");
    }

    this.index = endIndex + 1;

    return value;
  }

  public string(): Buffer | string {
    const colonIndex = this.value.indexOf(TokenColon, this.index);
    if (colonIndex < 0) {
      throw new Error("Failed to decode string (can't find colon)");
    }

    const prefix = this.value.subarray(this.index, colonIndex);
    const length = parseInt(prefix.toString(), 10);

    if (!Number.isFinite(length) || length === 0) {
      throw new Error("Failed to decode string length");
    }

    this.index = colonIndex + 1 + length;

    const string = this.value.subarray(this.index - length, this.index);
    return this.stringsAsBuffer ? string : String(string);
  }
}

export const decode = (data: Buffer | string): unknown => {
  if (Buffer.isBuffer(data)) {
    return new Reader(data, true).read();
  }

  return new Reader(Buffer.from(data), false).read();
};
