import { decode as originalDecoder } from "./reader";

const decode = (value: string): any => originalDecoder(Buffer.from(value));

describe("strings", () => {
  it("checks current value is integer", () => {
    const value = decode("4:test");
    expect(Buffer.isBuffer(value)).toBe(true);
    expect(value.toString()).toBe("test");
  });

  it("throws on wrong length", () => {
    expect(() => decode("0:")).toThrow();
  });
});

describe("integer", () => {
  it("decodes integer", () => {
    expect(decode("i43e")).toBe(43);
  });

  it("throws if end token is not found", () => {
    expect(() => decode("i0")).toThrow();
  });

  it("throws if no value before end token", () => {
    expect(() => decode("ie")).toThrow();
  });

  it("throws on values with leading zeros", () => {
    expect(() => decode("i05e")).toThrow();
  });

  it("but decodes zero correctly", () => {
    expect(decode("i0e")).toBe(0);
  });

  it("throws on invalid integer value", () => {
    expect(() => decode("iprevete")).toThrow();
  });

  it("minus zero is invalid value", () => {
    expect(() => decode("i-0e")).toThrow();
  });
});

describe("list", () => {
  it("decodes array", () => {
    expect(decode("li1ei2ei3ee")).toEqual([1, 2, 3]);
  });

  it("decodes empty array", () => {
    expect(decode("le")).toEqual([]);
  });
});

describe("dictionary", () => {
  it("decodes simple dictionary", () => {
    expect(decode("d3:key5:valuee")).toEqual({ key: Buffer.from("value") });
  });

  it("decodes empty dictionary", () => {
    // @todo check if it is ok with doc
    expect(decode("de")).toEqual({});
  });
});
