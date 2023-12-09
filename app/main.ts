import process from "node:process";
import util from "node:util";

function decodeInteger(value) {
  if (value.at(-1) !== "e") {
    throw new Error("Invalid encoded integer");
  }

  const integerString = value.substring(1, value.length - 1);

  const result = parseInt(integerString, 10);
  if (!Number.isFinite(result)) {
    throw new Error("Invalid encoded integer");
  }

  return result;
}

function decodeString(value) {
  const firstColonIndex = value.indexOf(":");
  if (firstColonIndex < 0) {
    throw new Error("Invalid encoded value");
  }

  const prefix = value.substr(0, firstColonIndex);

  // string?
  const length = parseInt(prefix, 10);
  if (Number.isFinite(length) && length > 0) {
    return value.substr(firstColonIndex + 1, length);
  }
}

// Examples:
// - decodeBencode("5:hello") -> "hello"
// - decodeBencode("10:hello12345") -> "hello12345"
function decodeBencode(bencodedValue) {
  if (bencodedValue.at(0) === "i") {
    return decodeInteger(bencodedValue);
  }

  return decodeString(bencodedValue);
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
