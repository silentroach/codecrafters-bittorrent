import { argv } from "node:process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const getCodeAndBuffer = (char: string): [Buffer, number] => [
  Buffer.from(char),
  char.charCodeAt(0),
];

const [TokenInteger, TokenIntegerCode] = getCodeAndBuffer("i");
const [TokenList, TokenListCode] = getCodeAndBuffer("l");
const [TokenDictionary, TokenDictionaryCode] = getCodeAndBuffer("d");
const [TokenEnd, TokenEndCode] = getCodeAndBuffer("e");
const [TokenColon, TokenColonCode] = getCodeAndBuffer(":");

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

class Reader {
  private index: number = 0;
  constructor(private readonly value: Buffer) {}

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

  public string(): Buffer {
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

    return this.value.subarray(this.index - length, this.index);
  }
}

function main() {
  const command = argv[2];

  switch (command) {
    case "decode":
      const bencodedValue = argv[3];

      // In JavaScript, there's no need to manually convert bytes to string for printing
      // because JS doesn't distinguish between bytes and strings in the same way Python does.
      console.log(
        JSON.stringify(new Reader(Buffer.from(bencodedValue)).read())
      );

      break;
    case "info":
      const filename = argv[3];
      const data = readFileSync(filename);

      const { announce, info } = new Reader(data).read();

      const hash = createHash("sha-1");
      const digest = hash.update(Writer.write(info)).end().digest("hex");

      console.log(`Tracker URL: ${announce}
Length: ${info.length}
Info Hash: ${digest}`);

      break;
    default:
      throw new Error(`Unknown command ${command}`);
  }
}

main();
