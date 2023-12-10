import process from "node:process";

class Reader {
  private index: number = 0;
  constructor(private readonly value: string) {}

  private get current() {
    return this.value.at(this.index);
  }

  public read(): unknown {
    switch (this.current) {
      case "i":
        return this.integer();
      case "l":
        return this.list();
      case "d":
        return this.dictionary();
    }

    return this.string();
  }

  public dictionary(): Record<string, unknown> {
    ++this.index;
    const result: Record<string, unknown> = {};

    while (!(this.current === "e")) {
      const key = this.string();
      const value = this.read();

      result[key] = value;
    }

    return result;
  }

  public list(): readonly unknown[] {
    ++this.index;
    const result: unknown[] = [];

    while (!(this.current === "e")) {
      result.push(this.read());
    }

    ++this.index;

    return result;
  }

  public integer(): number {
    const endIndex = this.value.indexOf("e", this.index + 1);
    const rawValue = this.value.substring(this.index + 1, endIndex);
    const value = parseInt(rawValue, 10);

    if (!Number.isFinite(value)) {
      throw new Error("Failed to decode integer");
    }

    this.index = endIndex + 1;

    return value;
  }

  public string(): string {
    const colonIndex = this.value.indexOf(":", this.index);
    if (colonIndex < 0) {
      throw new Error("Failed to decode string");
    }

    const prefix = this.value.substring(this.index, colonIndex);
    const length = parseInt(prefix, 10);

    if (!Number.isFinite(length) || length === 0) {
      throw new Error("Failed to decode string length");
    }

    this.index = colonIndex + 1 + length;

    return this.value.substring(this.index - length, this.index);
  }
}

// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue: string) {
  return new Reader(bencodedValue).read();
}

function main() {
  const command = process.argv[2];

  if (command === "decode") {
    const bencodedValue = process.argv[3];

    // In JavaScript, there's no need to manually convert bytes to string for printing
    // because JS doesn't distinguish between bytes and strings in the same way Python does.
    console.log(JSON.stringify(decodeBencode(bencodedValue)));
  } else {
    throw new Error(`Unknown command ${command}`);
  }
}

main();
