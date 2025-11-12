/**
 * Tests for utility functions
 */

import { describe, it, expect } from "bun:test";
import {
  isNotebookRoot,
  isCell,
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  isOutput,
  isStreamOutput,
  isDisplayDataOutput,
  isExecuteResultOutput,
  isErrorOutput,
  isTracebackLine,
  getPrimaryText,
  hasMimeType,
  getMimeTypes,
  getMimeData,
  normalizeSource,
  splitSource,
  getCellSource,
  getCellId,
  getCellMetadata,
  hasOutputs,
  getOutputs,
  isValidCellId,
  generateCellId,
  isValidNbformatVersion,
} from "../utils.ts";
import {
  notebook,
  codeCell,
  markdownCell,
  rawCell,
  streamOutput,
  displayDataOutput,
  executeResultOutput,
  errorOutput,
} from "../builders.ts";

describe("Type Guards", () => {
  describe("Node type guards", () => {
    it("should identify notebook roots", () => {
      const nb = notebook([]);
      expect(isNotebookRoot(nb)).toBe(true);
      expect(isNotebookRoot(markdownCell("test"))).toBe(false);
    });

    it("should identify cells", () => {
      const code = codeCell("test");
      const md = markdownCell("test");
      const raw = rawCell("test");

      expect(isCell(code)).toBe(true);
      expect(isCell(md)).toBe(true);
      expect(isCell(raw)).toBe(true);
      expect(isCell(streamOutput("test"))).toBe(false);
    });

    it("should identify code cells", () => {
      const code = codeCell("test");
      expect(isCodeCell(code)).toBe(true);
      expect(isCodeCell(markdownCell("test"))).toBe(false);
    });

    it("should identify markdown cells", () => {
      const md = markdownCell("test");
      expect(isMarkdownCell(md)).toBe(true);
      expect(isMarkdownCell(codeCell("test"))).toBe(false);
    });

    it("should identify raw cells", () => {
      const raw = rawCell("test");
      expect(isRawCell(raw)).toBe(true);
      expect(isRawCell(markdownCell("test"))).toBe(false);
    });

    it("should identify outputs", () => {
      const stream = streamOutput("test");
      const display = displayDataOutput({ "text/plain": "test" });
      const result = executeResultOutput(1, { "text/plain": "test" });
      const error = errorOutput("Error", "message", []);

      expect(isOutput(stream)).toBe(true);
      expect(isOutput(display)).toBe(true);
      expect(isOutput(result)).toBe(true);
      expect(isOutput(error)).toBe(true);
      expect(isOutput(markdownCell("test"))).toBe(false);
    });

    it("should identify specific output types", () => {
      const stream = streamOutput("test");
      const display = displayDataOutput({ "text/plain": "test" });
      const result = executeResultOutput(1, { "text/plain": "test" });
      const error = errorOutput("Error", "message", ["trace"]);

      expect(isStreamOutput(stream)).toBe(true);
      expect(isStreamOutput(display)).toBe(false);

      expect(isDisplayDataOutput(display)).toBe(true);
      expect(isDisplayDataOutput(stream)).toBe(false);

      expect(isExecuteResultOutput(result)).toBe(true);
      expect(isExecuteResultOutput(stream)).toBe(false);

      expect(isErrorOutput(error)).toBe(true);
      expect(isErrorOutput(stream)).toBe(false);
    });

    it("should identify traceback lines", () => {
      const error = errorOutput("Error", "message", ["trace line"]);
      const traceback = error.children[0];

      expect(isTracebackLine(traceback)).toBe(true);
      expect(isTracebackLine(streamOutput("test"))).toBe(false);
    });
  });
});

describe("MIME Bundle Utilities", () => {
  it("should get primary text from string value", () => {
    const bundle = { "text/plain": "test value" };
    expect(getPrimaryText(bundle)).toBe("test value");
  });

  it("should get primary text from array value", () => {
    const bundle = { "text/plain": ["line1\n", "line2"] };
    expect(getPrimaryText(bundle)).toBe("line1\nline2");
  });

  it("should fallback to JSON for missing text/plain", () => {
    const bundle = { "image/png": "base64data" };
    const text = getPrimaryText(bundle);
    expect(text).toContain("image/png");
    expect(JSON.parse(text)).toEqual(bundle);
  });

  it("should check for MIME types", () => {
    const bundle = { "text/plain": "test", "image/png": "data" };
    expect(hasMimeType(bundle, "text/plain")).toBe(true);
    expect(hasMimeType(bundle, "image/png")).toBe(true);
    expect(hasMimeType(bundle, "text/html")).toBe(false);
  });

  it("should get all MIME types", () => {
    const bundle = { "text/plain": "test", "image/png": "data" };
    const types = getMimeTypes(bundle);
    expect(types).toContain("text/plain");
    expect(types).toContain("image/png");
    expect(types).toHaveLength(2);
  });

  it("should get MIME data", () => {
    const bundle = { "text/plain": "test value", "image/png": "base64" };
    expect(getMimeData(bundle, "text/plain")).toBe("test value");
    expect(getMimeData(bundle, "image/png")).toBe("base64");
    expect(getMimeData(bundle, "text/html")).toBeUndefined();
  });
});

describe("Source Text Utilities", () => {
  it("should normalize string source", () => {
    expect(normalizeSource("test")).toBe("test");
  });

  it("should normalize array source", () => {
    expect(normalizeSource(["line1\n", "line2"])).toBe("line1\nline2");
  });

  it("should split source into lines", () => {
    const lines = splitSource("line1\nline2\nline3");
    expect(lines).toEqual(["line1\n", "line2\n", "line3"]);
  });

  it("should handle single line source", () => {
    const lines = splitSource("single line");
    expect(lines).toEqual(["single line"]);
  });
});

describe("Cell Utilities", () => {
  it("should get source from code cell", () => {
    const cell = codeCell("print('test')");
    expect(getCellSource(cell)).toBe("print('test')");
  });

  it("should get source from markdown cell", () => {
    const cell = markdownCell("# Title");
    expect(getCellSource(cell)).toBe("# Title");
  });

  it("should get source from raw cell", () => {
    const cell = rawCell("raw content");
    expect(getCellSource(cell)).toBe("raw content");
  });

  it("should get cell ID", () => {
    const cell = codeCell("test", [], { id: "my-cell-id" });
    expect(getCellId(cell)).toBe("my-cell-id");
  });

  it("should get cell metadata", () => {
    const metadata = { tags: ["test"], collapsed: true };
    const cell = codeCell("test", [], { metadata });
    expect(getCellMetadata(cell)).toEqual(metadata);
  });

  it("should check if cell has outputs", () => {
    const withOutputs = codeCell("test", [streamOutput("output")]);
    const withoutOutputs = codeCell("test");
    const markdown = markdownCell("test");

    expect(hasOutputs(withOutputs)).toBe(true);
    expect(hasOutputs(withoutOutputs)).toBe(false);
    expect(hasOutputs(markdown)).toBe(false);
  });

  it("should get outputs from code cell", () => {
    const outputs = [streamOutput("test")];
    const cell = codeCell("test", outputs);
    expect(getOutputs(cell)).toEqual(outputs);
  });

  it("should return empty array for non-code cells", () => {
    const markdown = markdownCell("test");
    expect(getOutputs(markdown)).toEqual([]);
  });
});

describe("Validation Utilities", () => {
  it("should validate cell IDs", () => {
    expect(isValidCellId("abc123")).toBe(true);
    expect(isValidCellId("cell-with-hyphens")).toBe(true);
    expect(isValidCellId("cell_with_underscores")).toBe(true);
    expect(isValidCellId("a")).toBe(true);
    expect(isValidCellId("a".repeat(64))).toBe(true);

    expect(isValidCellId("")).toBe(false);
    expect(isValidCellId("a".repeat(65))).toBe(false);
    expect(isValidCellId("cell with spaces")).toBe(false);
    expect(isValidCellId("cell@invalid")).toBe(false);
  });

  it("should generate valid cell IDs", () => {
    const id = generateCellId();
    expect(isValidCellId(id)).toBe(true);
    expect(id.length).toBe(8);
  });

  it("should generate unique cell IDs", () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateCellId());
    }
    expect(ids.size).toBe(100);
  });

  it("should validate nbformat version", () => {
    expect(isValidNbformatVersion(4, 0)).toBe(true);
    expect(isValidNbformatVersion(4, 5)).toBe(true);
    expect(isValidNbformatVersion(4, 100)).toBe(true);

    expect(isValidNbformatVersion(3, 0)).toBe(false);
    expect(isValidNbformatVersion(5, 0)).toBe(false);
    expect(isValidNbformatVersion(4, -1)).toBe(false);
  });
});
