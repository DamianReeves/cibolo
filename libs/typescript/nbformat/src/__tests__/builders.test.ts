/**
 * Tests for builder functions
 */

import { describe, it, expect } from "bun:test";
import {
  notebook,
  codeCell,
  markdownCell,
  rawCell,
  streamOutput,
  displayDataOutput,
  executeResultOutput,
  errorOutput,
  tracebackLine,
  simpleNotebook,
  pythonNotebook,
  codeCellWithOutput,
  codeCellWithResult,
  codeCellWithError,
} from "../builders.ts";
import {
  isNotebookRoot,
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  isStreamOutput,
  isDisplayDataOutput,
  isExecuteResultOutput,
  isErrorOutput,
  isValidCellId,
} from "../utils.ts";

describe("Builder Functions", () => {
  describe("notebook", () => {
    it("should create a notebook with default version", () => {
      const nb = notebook([]);
      expect(isNotebookRoot(nb)).toBe(true);
      expect(nb.data?.nbformat).toBe(4);
      expect(nb.data?.nbformat_minor).toBe(5);
    });

    it("should accept custom version", () => {
      const nb = notebook([], { nbformat: 4, nbformat_minor: 4 });
      expect(nb.data?.nbformat).toBe(4);
      expect(nb.data?.nbformat_minor).toBe(4);
    });

    it("should accept metadata", () => {
      const metadata = {
        kernelspec: {
          name: "python3",
          display_name: "Python 3",
        },
      };
      const nb = notebook([], { metadata });
      expect(nb.data?.metadata).toEqual(metadata);
    });

    it("should accept cells", () => {
      const cells = [markdownCell("test"), codeCell("code")];
      const nb = notebook(cells);
      expect(nb.children).toHaveLength(2);
    });
  });

  describe("codeCell", () => {
    it("should create a code cell with auto-generated ID", () => {
      const cell = codeCell("print('test')");
      expect(isCodeCell(cell)).toBe(true);
      expect(cell.data.source).toBe("print('test')");
      expect(isValidCellId(cell.data.id)).toBe(true);
      expect(cell.data.executionCount).toBeNull();
      expect(cell.children).toHaveLength(0);
    });

    it("should accept custom ID", () => {
      const cell = codeCell("test", [], { id: "custom-id" });
      expect(cell.data.id).toBe("custom-id");
    });

    it("should accept execution count", () => {
      const cell = codeCell("test", [], { executionCount: 5 });
      expect(cell.data.executionCount).toBe(5);
    });

    it("should accept outputs", () => {
      const outputs = [streamOutput("output")];
      const cell = codeCell("test", outputs);
      expect(cell.children).toEqual(outputs);
    });

    it("should accept metadata", () => {
      const metadata = { tags: ["test"], collapsed: true };
      const cell = codeCell("test", [], { metadata });
      expect(cell.data.metadata).toEqual(metadata);
    });
  });

  describe("markdownCell", () => {
    it("should create a markdown cell with auto-generated ID", () => {
      const cell = markdownCell("# Title");
      expect(isMarkdownCell(cell)).toBe(true);
      expect(cell.value).toBe("# Title");
      expect(cell.data.source).toBe("# Title");
      expect(isValidCellId(cell.data.id)).toBe(true);
    });

    it("should accept custom ID", () => {
      const cell = markdownCell("test", { id: "md-1" });
      expect(cell.data.id).toBe("md-1");
    });

    it("should accept metadata", () => {
      const metadata = { tags: ["intro"] };
      const cell = markdownCell("test", { metadata });
      expect(cell.data.metadata).toEqual(metadata);
    });
  });

  describe("rawCell", () => {
    it("should create a raw cell with auto-generated ID", () => {
      const cell = rawCell("raw content");
      expect(isRawCell(cell)).toBe(true);
      expect(cell.value).toBe("raw content");
      expect(cell.data.source).toBe("raw content");
      expect(isValidCellId(cell.data.id)).toBe(true);
    });

    it("should accept format", () => {
      const cell = rawCell("test", { format: "text/restructuredtext" });
      expect(cell.data.format).toBe("text/restructuredtext");
    });

    it("should accept metadata", () => {
      const metadata = { custom: "value" };
      const cell = rawCell("test", { metadata });
      expect(cell.data.metadata).toEqual(metadata);
    });
  });

  describe("streamOutput", () => {
    it("should create stdout stream by default", () => {
      const output = streamOutput("text");
      expect(isStreamOutput(output)).toBe(true);
      expect(output.value).toBe("text");
      expect(output.data.name).toBe("stdout");
    });

    it("should accept stderr stream", () => {
      const output = streamOutput("error", "stderr");
      expect(output.data.name).toBe("stderr");
    });
  });

  describe("displayDataOutput", () => {
    it("should create display data with text/plain", () => {
      const output = displayDataOutput({ "text/plain": "display text" });
      expect(isDisplayDataOutput(output)).toBe(true);
      expect(output.value).toBe("display text");
      expect(output.data.mimeBundle["text/plain"]).toBe("display text");
    });

    it("should handle array text/plain", () => {
      const output = displayDataOutput({
        "text/plain": ["line1\n", "line2"],
      });
      expect(output.value).toBe("line1\nline2");
    });

    it("should fallback to JSON for missing text/plain", () => {
      const bundle = { "image/png": "base64" };
      const output = displayDataOutput(bundle);
      expect(output.value).toContain("image/png");
    });

    it("should accept metadata", () => {
      const metadata = { isolated: true };
      const output = displayDataOutput({ "text/plain": "test" }, { metadata });
      expect(output.data.metadata).toEqual(metadata);
    });
  });

  describe("executeResultOutput", () => {
    it("should create execute result", () => {
      const output = executeResultOutput(5, { "text/plain": "result" });
      expect(isExecuteResultOutput(output)).toBe(true);
      expect(output.value).toBe("result");
      expect(output.data.executionCount).toBe(5);
    });

    it("should handle multiple MIME types", () => {
      const bundle = {
        "text/plain": "42",
        "text/html": "<b>42</b>",
      };
      const output = executeResultOutput(1, bundle);
      expect(output.data.mimeBundle).toEqual(bundle);
    });
  });

  describe("errorOutput", () => {
    it("should create error with traceback", () => {
      const traceback = ["Traceback line 1", "Traceback line 2"];
      const output = errorOutput("ValueError", "invalid value", traceback);
      expect(isErrorOutput(output)).toBe(true);
      expect(output.data.ename).toBe("ValueError");
      expect(output.data.evalue).toBe("invalid value");
      expect(output.children).toHaveLength(2);
      expect(output.children[0].value).toBe("Traceback line 1");
    });

    it("should handle empty traceback", () => {
      const output = errorOutput("Error", "message", []);
      expect(output.children).toHaveLength(0);
    });
  });

  describe("tracebackLine", () => {
    it("should create traceback line", () => {
      const line = tracebackLine("  File test.py, line 1");
      expect(line.type).toBe("tracebackLine");
      expect(line.value).toBe("  File test.py, line 1");
    });
  });

  describe("simpleNotebook", () => {
    it("should create notebook from cell descriptions", () => {
      const nb = simpleNotebook([
        { type: "markdown", source: "# Title" },
        { type: "code", source: "print('test')" },
        { type: "raw", source: "raw text" },
      ]);

      expect(isNotebookRoot(nb)).toBe(true);
      expect(nb.children).toHaveLength(3);
      expect(isMarkdownCell(nb.children[0])).toBe(true);
      expect(isCodeCell(nb.children[1])).toBe(true);
      expect(isRawCell(nb.children[2])).toBe(true);
    });

    it("should handle code cells with outputs", () => {
      const nb = simpleNotebook([
        {
          type: "code",
          source: "print('test')",
          outputs: [streamOutput("test\n")],
        },
      ]);

      const cell = nb.children[0];
      if (isCodeCell(cell)) {
        expect(cell.children).toHaveLength(1);
      }
    });
  });

  describe("pythonNotebook", () => {
    it("should create Python notebook with default metadata", () => {
      const nb = pythonNotebook([markdownCell("test")]);
      expect(nb.data?.metadata?.kernelspec?.name).toBe("python3");
      expect(nb.data?.metadata?.language_info?.name).toBe("python");
    });

    it("should accept custom Python version", () => {
      const nb = pythonNotebook([markdownCell("test")], {
        pythonVersion: "3.12.0",
      });
      expect(nb.data?.metadata?.language_info?.version).toBe("3.12.0");
    });

    it("should accept custom kernel name", () => {
      const nb = pythonNotebook([markdownCell("test")], {
        kernelName: "python3.12",
      });
      expect(nb.data?.metadata?.kernelspec?.name).toBe("python3.12");
    });
  });

  describe("codeCellWithOutput", () => {
    it("should create code cell with stream output", () => {
      const cell = codeCellWithOutput("print('test')", "test\n");
      expect(isCodeCell(cell)).toBe(true);
      expect(cell.children).toHaveLength(1);
      expect(isStreamOutput(cell.children[0])).toBe(true);
    });

    it("should accept execution count", () => {
      const cell = codeCellWithOutput("test", "output", { executionCount: 3 });
      expect(cell.data.executionCount).toBe(3);
    });
  });

  describe("codeCellWithResult", () => {
    it("should create code cell with execute result", () => {
      const cell = codeCellWithResult("2 + 2", "4");
      expect(isCodeCell(cell)).toBe(true);
      expect(cell.children).toHaveLength(1);
      expect(isExecuteResultOutput(cell.children[0])).toBe(true);
    });

    it("should use execution count for both cell and output", () => {
      const cell = codeCellWithResult("test", "result", { executionCount: 5 });
      expect(cell.data.executionCount).toBe(5);
      const output = cell.children[0];
      if (isExecuteResultOutput(output)) {
        expect(output.data.executionCount).toBe(5);
      }
    });

    it("should default to execution count 1", () => {
      const cell = codeCellWithResult("test", "result");
      expect(cell.data.executionCount).toBe(1);
    });
  });

  describe("codeCellWithError", () => {
    it("should create code cell with error", () => {
      const traceback = ["Traceback line"];
      const cell = codeCellWithError(
        "bad_code",
        "NameError",
        "undefined",
        traceback
      );
      expect(isCodeCell(cell)).toBe(true);
      expect(cell.children).toHaveLength(1);
      expect(isErrorOutput(cell.children[0])).toBe(true);
    });

    it("should accept options", () => {
      const cell = codeCellWithError("test", "Error", "msg", [], {
        id: "error-cell",
        executionCount: 2,
      });
      expect(cell.data.id).toBe("error-cell");
      expect(cell.data.executionCount).toBe(2);
    });
  });
});
