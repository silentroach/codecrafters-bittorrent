import { write } from "./writer";

const encode = (value: unknown): string => write(value).toString();

it("encodes string", () => {
  expect(encode("test")).toMatchInlineSnapshot(`"4:test"`);
});

it("encodes buffer as string", () => {
  expect(encode(Buffer.from("test"))).toMatchInlineSnapshot(`"4:test"`);
});

it("encodes empty string", () => {
  expect(encode("")).toMatchInlineSnapshot(`"0:"`);
});

it("encodes integer", () => {
  expect(encode(10)).toMatchInlineSnapshot(`"i10e"`);
});

it("encodes -0 to 0", () => {
  expect(encode(-0)).toMatchInlineSnapshot(`"i0e"`);
});

it("encodes simple list", () => {
  expect(encode([1, "test"])).toMatchInlineSnapshot(`"li1e4:teste"`);
});

it("encodes empty list", () => {
  expect(encode([])).toMatchInlineSnapshot(`"le"`);
});

it("encodes simple dictionary", () => {
  expect(encode({ key: "value" })).toMatchInlineSnapshot(`"d3:key5:valuee"`);
});

it("encodes empty dictionary", () => {
  expect(encode({})).toMatchInlineSnapshot(`"de"`);
});

it("fails on attempt to write null", () => {
  expect(() => encode(null)).toThrow();
});

it("fails on attempt to write unsupported data", () => {
  expect(() => encode(BigInt(10))).toThrow();
});
