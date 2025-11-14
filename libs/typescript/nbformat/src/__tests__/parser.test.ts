/**
 * Tests for the nbformat parser
 */

import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { readFileSync } from "fs";
import { join } from "path";
import { NbformatParser, parse } from "../parser.ts";
import {
  isCodeCell,
  isMarkdownCell,
  isRawCell,
  isStreamOutput,
  isExecuteResultOutput,
  isErrorOutput,
  isDisplayDataOutput,
} from "../utils.ts";

const fixturesDir = join(__dirname, "fixtures", "notebooks");

function loadFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), "utf-8");
}

describe("NbformatParser", () => {
  describe("parse method", () => {
    it("should parse a simple notebook from string", async () => {
      const json = loadFixture("simple.json");
      const parser = new NbformatParser();
      const result = await Effect.runPromise(parser.parse(json));

      expect(result.type).toBe("notebook");
      expect(result.data?.nbformat).toBe(4);
      expect(result.data?.nbformat_minor).toBe(5);
      expect(result.children).toHaveLength(2);

      // Check first cell (markdown)
      const firstCell = result.children[0];
      expect(isMarkdownCell(firstCell)).toBe(true);
      if (isMarkdownCell(firstCell)) {
        expect(firstCell.data.id).toBe("intro-cell");
        expect(firstCell.value).toContain("Simple Notebook");
      }

      // Check second cell (code)
      const secondCell = result.children[1];
      expect(isCodeCell(secondCell)).toBe(true);
      if (isCodeCell(secondCell)) {
        expect(secondCell.data.id).toBe("hello-world");
        expect(secondCell.data.executionCount).toBe(1);
        expect(secondCell.data.source).toContain("print");
        expect(secondCell.children).toHaveLength(1);

        // Check output
        const output = secondCell.children[0];
        expect(isStreamOutput(output)).toBe(true);
        if (isStreamOutput(output)) {
          expect(output.data.name).toBe("stdout");
          expect(output.value).toContain("Hello, World!");
        }
      }
    });

    it("should parse a notebook from object", async () => {
      const json = loadFixture("simple.json");
      const notebook = JSON.parse(json);
      const parser = new NbformatParser();
      const result = await Effect.runPromise(parser.parse(notebook));

      expect(result.type).toBe("notebook");
      expect(result.children).toHaveLength(2);
    });

    it("should parse notebook with various output types", async () => {
      const json = loadFixture("with-outputs.json");
      const parser = new NbformatParser();
      const result = await Effect.runPromise(parser.parse(json));

      expect(result.children).toHaveLength(3);

      // First cell: execute_result
      const cell1 = result.children[0];
      if (isCodeCell(cell1)) {
        expect(cell1.children).toHaveLength(1);
        const output = cell1.children[0];
        expect(isExecuteResultOutput(output)).toBe(true);
        if (isExecuteResultOutput(output)) {
          expect(output.data.executionCount).toBe(1);
          expect(output.value).toBe("42");
        }
      }

      // Second cell: display_data
      const cell2 = result.children[1];
      if (isCodeCell(cell2)) {
        expect(cell2.children).toHaveLength(1);
        const output = cell2.children[0];
        expect(isDisplayDataOutput(output)).toBe(true);
        if (isDisplayDataOutput(output)) {
          expect(output.data.mimeBundle["text/plain"]).toBeDefined();
          expect(output.data.mimeBundle["image/png"]).toBeDefined();
        }
      }

      // Third cell: error
      const cell3 = result.children[2];
      if (isCodeCell(cell3)) {
        expect(cell3.children).toHaveLength(1);
        const output = cell3.children[0];
        expect(isErrorOutput(output)).toBe(true);
        if (isErrorOutput(output)) {
          expect(output.data.ename).toBe("NameError");
          expect(output.data.evalue).toContain("undefined_var");
          expect(output.children.length).toBeGreaterThan(0);
        }
      }
    });

    it("should parse notebook with all cell types", async () => {
      const json = loadFixture("all-cell-types.json");
      const parser = new NbformatParser();
      const result = await Effect.runPromise(parser.parse(json));

      expect(result.children).toHaveLength(4);

      expect(isMarkdownCell(result.children[0])).toBe(true);
      expect(isCodeCell(result.children[1])).toBe(true);
      expect(isRawCell(result.children[2])).toBe(true);
      expect(isMarkdownCell(result.children[3])).toBe(true);

      // Check raw cell format
      const rawCell = result.children[2];
      if (isRawCell(rawCell)) {
        expect(rawCell.data.format).toBe("text/restructuredtext");
      }

      // Check multiline markdown
      const multilineCell = result.children[3];
      if (isMarkdownCell(multilineCell)) {
        expect(multilineCell.value).toContain("Multiple Lines");
        expect(multilineCell.value).toContain("multiple lines in array format");
      }
    });

    it("should handle notebooks with metadata", async () => {
      const json = loadFixture("simple.json");
      const parser = new NbformatParser();
      const result = await Effect.runPromise(parser.parse(json));

      expect(result.data?.metadata).toBeDefined();
      expect(result.data?.metadata?.kernelspec).toBeDefined();
      expect(result.data?.metadata?.kernelspec?.name).toBe("python3");
      expect(result.data?.metadata?.language_info?.name).toBe("python");
    });

    it("should fail on invalid JSON", async () => {
      const parser = new NbformatParser();
      const result = parser.parse("not valid json");

      await expect(Effect.runPromise(result)).rejects.toThrow();
    });

    it("should fail on missing cells array", async () => {
      const parser = new NbformatParser();
      const result = parser.parse(JSON.stringify({ nbformat: 4 }));

      await expect(Effect.runPromise(result)).rejects.toThrow("cells");
    });

    it("should fail on missing nbformat version", async () => {
      const parser = new NbformatParser();
      const result = parser.parse(JSON.stringify({ cells: [] }));

      await expect(Effect.runPromise(result)).rejects.toThrow("nbformat");
    });
  });

  describe("convenience parse function", () => {
    it("should work the same as parser.parse", async () => {
      const json = loadFixture("simple.json");
      const result = await Effect.runPromise(parse(json));

      expect(result.type).toBe("notebook");
      expect(result.children).toHaveLength(2);
    });
  });
});
