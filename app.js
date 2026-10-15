const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const BYTE_CHUNK_SIZE = 0x8000;

/**
 * Convert UTF-8 bytes to a Base64 string without using string encoding helpers
 * that would corrupt non-ASCII characters.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBase64(bytes) {
  let binary = "";

  for (let index = 0; index < bytes.length; index += BYTE_CHUNK_SIZE) {
    const chunk = bytes.subarray(index, index + BYTE_CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Convert a syntactically valid Base64 value into its raw bytes.
 *
 * @param {string} value
 * @returns {Uint8Array}
 */
function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

/**
 * Validate Base64 structure and padding before attempting to decode it.
 * Empty input is valid Base64 and represents an empty byte sequence.
 *
 * @param {unknown} value
 * @returns {{valid: boolean, error: string}}
 */
export function validateBase64(value) {
  if (typeof value !== "string") {
    return { valid: false, error: "Base64 input must be text." };
  }

  if (value.length === 0) {
    return { valid: true, error: "" };
  }

  if (value.length % 4 !== 0) {
    return {
      valid: false,
      error: "Invalid Base64 length. The value must contain complete 4-character groups.",
    };
  }

  if (!BASE64_PATTERN.test(value)) {
    return {
      valid: false,
      error:
        "Invalid Base64 format. Use letters, numbers, +, /, and up to two = padding characters.",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Encode any JavaScript string as UTF-8 bytes and then Base64.
 *
 * @param {string} value
 * @returns {string}
 */
export function encodeBase64(value) {
  if (typeof value !== "string") {
    throw new TypeError("Text input must be a string.");
  }

  return bytesToBase64(new TextEncoder().encode(value));
}

/**
 * Decode Base64 into strict UTF-8 text. TextDecoder's fatal mode ensures bad
 * byte sequences are reported rather than silently replaced with � characters.
 *
 * @param {string} value
 * @returns {string}
 */
export function decodeBase64(value) {
  const validation = validateBase64(value);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const bytes = base64ToBytes(value);

  // Reject non-canonical padding bits such as "AB==" instead of silently
  // accepting a value that does not round-trip to the same Base64 text.
  if (bytesToBase64(bytes) !== value) {
    throw new Error("Invalid Base64 padding bits.");
  }

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Decoded bytes are not valid UTF-8 text.");
  }
}

const INITIAL_MESSAGE = "Choose Encode or Decode to get started.";
const EXAMPLE_TEXT = "Hello, नमस्ते! Café 👋\nBase64 keeps UTF-8 text intact.";

function countCharacters(value) {
  return Array.from(value).length;
}

function formatCount(value) {
  const count = countCharacters(value);
  return `${count.toLocaleString()} character${count === 1 ? "" : "s"}`;
}

function initApp() {
  const refs = {
    input: document.getElementById("input-text"),
    output: document.getElementById("output-text"),
    inputCount: document.getElementById("input-count"),
    outputCount: document.getElementById("output-count"),
    feedback: document.getElementById("feedback"),
    feedbackMessage: document.getElementById("feedback-message"),
    encode: document.getElementById("encode-button"),
    decode: document.getElementById("decode-button"),
    copy: document.getElementById("copy-button"),
    clear: document.getElementById("clear-button"),
    swap: document.getElementById("swap-button"),
    download: document.getElementById("download-button"),
    example: document.getElementById("example-button"),
  };

  function setFeedback(message, tone = "info") {
    refs.feedback.classList.remove("is-success", "is-error");

    if (tone === "success") {
      refs.feedback.classList.add("is-success");
      refs.feedback.querySelector(".feedback-icon").textContent = "✓";
    } else if (tone === "error") {
      refs.feedback.classList.add("is-error");
      refs.feedback.querySelector(".feedback-icon").textContent = "!";
    } else {
      refs.feedback.querySelector(".feedback-icon").textContent = "i";
    }

    refs.feedbackMessage.textContent = message;
  }

  function updateCountsAndControls() {
    refs.inputCount.textContent = formatCount(refs.input.value);
    refs.outputCount.textContent = formatCount(refs.output.value);

    const hasInput = refs.input.value.length > 0;
    const hasOutput = refs.output.value.length > 0;
    const hasAnyContent = hasInput || hasOutput;

    refs.copy.disabled = !hasOutput;
    refs.download.disabled = !hasOutput;
    refs.swap.disabled = !hasAnyContent;
    refs.clear.disabled = !hasAnyContent && refs.feedbackMessage.textContent === INITIAL_MESSAGE;
  }

  function clearFeedbackOnEdit() {
    setFeedback(INITIAL_MESSAGE);
    updateCountsAndControls();
  }

  function handleEncode() {
    try {
      const input = refs.input.value;
      const output = encodeBase64(input);
      refs.output.value = output;
      setFeedback(`Encoded ${formatCount(input)} into ${formatCount(output)}.`, "success");
    } catch (error) {
      refs.output.value = "";
      setFeedback(error instanceof Error ? error.message : "Encoding failed.", "error");
    }

    updateCountsAndControls();
  }

  function handleDecode() {
    try {
      const input = refs.input.value;
      const output = decodeBase64(input);
      refs.output.value = output;
      setFeedback(`Decoded ${formatCount(input)} into ${formatCount(output)}.`, "success");
    } catch (error) {
      refs.output.value = "";
      setFeedback(error instanceof Error ? error.message : "Decoding failed.", "error");
    }

    updateCountsAndControls();
  }

  async function handleCopy() {
    if (!refs.output.value) {
      setFeedback("There is no output to copy.", "error");
      updateCountsAndControls();
      return;
    }

    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard access is unavailable.");
      }

      await navigator.clipboard.writeText(refs.output.value);
      setFeedback("Output copied to the clipboard.", "success");
    } catch {
      setFeedback(
        "Could not copy output. Clipboard permission was denied or is unavailable.",
        "error",
      );
    }
  }

  function handleDownload() {
    if (!refs.output.value) {
      setFeedback("There is no output to download.", "error");
      updateCountsAndControls();
      return;
    }

    try {
      const blob = new Blob([refs.output.value], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "base64-result.txt";
      link.click();
      URL.revokeObjectURL(url);
      setFeedback("Result downloaded as base64-result.txt.", "success");
    } catch {
      setFeedback("Could not download the result in this browser.", "error");
    }
  }

  function handleSwap() {
    if (!refs.input.value && !refs.output.value) {
      setFeedback("There is nothing to swap.", "error");
      updateCountsAndControls();
      return;
    }

    const input = refs.input.value;
    refs.input.value = refs.output.value;
    refs.output.value = input;
    setFeedback("Input and output swapped.", "success");
    updateCountsAndControls();
    refs.input.focus();
  }

  function handleClear() {
    refs.input.value = "";
    refs.output.value = "";
    setFeedback(INITIAL_MESSAGE);
    updateCountsAndControls();
    refs.input.focus();
  }

  function handleExample() {
    refs.input.value = EXAMPLE_TEXT;
    refs.output.value = "";
    setFeedback("Example loaded. Choose Encode to generate its Base64 value.");
    updateCountsAndControls();
    refs.input.focus();
  }

  refs.input.addEventListener("input", clearFeedbackOnEdit);
  refs.encode.addEventListener("click", handleEncode);
  refs.decode.addEventListener("click", handleDecode);
  refs.copy.addEventListener("click", handleCopy);
  refs.clear.addEventListener("click", handleClear);
  refs.swap.addEventListener("click", handleSwap);
  refs.download.addEventListener("click", handleDownload);
  refs.example.addEventListener("click", handleExample);

  updateCountsAndControls();
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", initApp);
}
