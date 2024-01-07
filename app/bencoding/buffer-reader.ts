export abstract class BufferReader {
  #buffer: Buffer;
  #position: number = 0;

  constructor(buffer: Buffer) {
    this.#buffer = buffer;
  }

  protected get current(): number | undefined {
    return this.#buffer.at(this.#position);
  }

  protected indexOf(value: number | Buffer): number {
    return this.#buffer.indexOf(value, this.#position);
  }

  protected skip(offset: number): this {
    this.#position += offset;
    return this;
  }

  protected read(length: number): Buffer {
    return this.skip(length).#buffer.subarray(
      this.#position - length,
      this.#position
    );
  }

  protected readTo(end: number): Buffer {
    const value = this.#buffer.subarray(this.#position, end);
    this.#position = end;
    return value;
  }

  protected readUntil(value: number | Buffer): Buffer {
    const endIndex = this.indexOf(value);
    if (endIndex < 0) {
      throw new Error("Failed to find end token");
    }

    if (endIndex === this.#position) {
      throw new Error("Failed to decode value (no value before end token)");
    }

    return this.readTo(endIndex);
  }
}
