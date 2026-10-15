import test from "node:test";
import assert from "node:assert/strict";

import { decodeBase64, encodeBase64, validateBase64 } from "../app.js";

test("encodes and decodes ordinary text", () => {
  const encoded = encodeBase64("Hello World!");

  assert.equal(encoded, "SGVsbG8gV29ybGQh");
  assert.equal(decodeBase64(encoded), "Hello World!");
});

test("round-trips Hindi text using UTF-8", () => {
  const value = "नमस्ते दुनिया";

  assert.equal(decodeBase64(encodeBase64(value)), value);
});

test("round-trips emoji and accented characters", () => {
  const value = "Café déjà vu 👋🚀";

  assert.equal(decodeBase64(encodeBase64(value)), value);
});

test("handles empty input", () => {
  assert.equal(encodeBase64(""), "");
  assert.equal(decodeBase64(""), "");
  assert.deepEqual(validateBase64(""), { valid: true, error: "" });
});

test("accepts valid Base64 syntax and padding", () => {
  assert.deepEqual(validateBase64("SGVsbG8="), { valid: true, error: "" });
  assert.deepEqual(validateBase64("SGVsbG8gV29ybGQh"), { valid: true, error: "" });
  assert.deepEqual(validateBase64("SGk="), { valid: true, error: "" });
});

test("rejects malformed Base64 input", () => {
  assert.equal(validateBase64("not base64! ").valid, false);
  assert.equal(validateBase64("SGVsbG8").valid, false);
  assert.equal(validateBase64("SGV=sbG8=").valid, false);

  assert.throws(() => decodeBase64("not base64! "), /Invalid Base64/);
  assert.throws(() => decodeBase64("SGVsbG8"), /Invalid Base64 length/);
});

test("rejects non-canonical Base64 padding bits", () => {
  assert.throws(() => decodeBase64("AB=="), /padding bits/);
});

test("rejects invalid UTF-8 byte sequences", () => {
  // /w== decodes to the byte 0xff, which is not valid UTF-8.
  assert.throws(() => decodeBase64("/w=="), /valid UTF-8/);
});

test("rejects non-string values with useful errors", () => {
  assert.throws(() => encodeBase64(null), /must be a string/);
  assert.equal(validateBase64(null).valid, false);
});
