/**
 * Integration tests for nbformat with .ipynb files
 */

import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { readFileSync } from "fs";
import { join } from "path";
import { parse, compile } from "../index.ts";
import { visit } from "unist-util-visit";
import type { NotebookRoot, CodeCell } from "../types.ts";
import { isCodeCell, isMarkdownCell } from "../utils.ts";

const fixturesDir = join(__dirname, "fixtures", "notebooks");

function loadNotebook(filename: string): string {
  return readFileSync(join(fixturesDir, filename), "utf-8");
}

describe("Integration tests with .ipynb files", () => {
  describe("reading .ipynb files", () => {
    it("should parse simple.ipynb", async () => {
      const content = loadNotebook("simple.ipynb");
      const tree = await Effect.runPromise(parse(content));

      expect(tree.type).toBe("notebook");
      expect(tree.children).toHaveLength(2);
    });

    it("should parse with-outputs.ipynb", async () => {
      const content = loadNotebook("with-outputs.ipynb");
      const tree = await Effect.runPromise(parse(content));

      expect(tree.type).toBe("notebook");
      expect(tree.children).toHaveLength(3);
    });

    it("should parse all-cell-types.ipynb", async () => {
      const content = loadNotebook("all-cell-types.ipynb");
      const tree = await Effect.runPromise(parse(content));

      expect(tree.type).toBe("notebook");
      expect(tree.children).toHaveLength(4);
    });
  });

  describe("notebook transformations", () => {
    it("should clear all outputs from code cells", async () => {
      const content = loadNotebook("with-outputs.ipynb");
      const tree = await Effect.runPromise(parse(content));

      // Clear all outputs
      visit(tree, "codeCell", (node: CodeCell) => {
        node.children = [];
        node.data.executionCount = null;
      });

      const result = await Effect.runPromise(compile(tree));
      const parsed = JSON.parse(result);

      // Verify all code cells have no outputs
      parsed.cells.forEach((cell: any) => {
        if (cell.cell_type === "code") {
          expect(cell.outputs).toHaveLength(0);
          expect(cell.execution_count).toBeNull();
        }
      });
    });

    it("should extract all code from notebook", async () => {
      const content = loadNotebook("simple.ipynb");
      const tree = await Effect.runPromise(parse(content));

      const codeBlocks: string[] = [];
      visit(tree, "codeCell", (node: CodeCell) => {
        codeBlocks.push(node.data.source);
      });

      expect(codeBlocks).toHaveLength(1);
      expect(codeBlocks[0]).toContain('print("Hello, World!")');
    });

    it("should count cell types", async () => {
      const content = loadNotebook("all-cell-types.ipynb");
      const tree = await Effect.runPromise(parse(content));

      let codeCells = 0;
      let markdownCells = 0;
      let rawCells = 0;

      tree.children.forEach((cell) => {
        if (isCodeCell(cell)) codeCells++;
        else if (isMarkdownCell(cell)) markdownCells++;
        else rawCells++;
      });

      expect(codeCells).toBe(1);
      expect(markdownCells).toBe(2);
      expect(rawCells).toBe(1);
    });

    it("should add tags to all markdown cells", async () => {
      const content = loadNotebook("simple.ipynb");
      const tree = await Effect.runPromise(parse(content));

      // Add tag to all markdown cells
      visit(tree, "markdownCell", (node) => {
        if (!node.data.metadata) {
          node.data.metadata = {};
        }
        if (!node.data.metadata.tags) {
          node.data.metadata.tags = [];
        }
        (node.data.metadata.tags as string[]).push("documentation");
      });

      const result = await Effect.runPromise(compile(tree));
      const parsed = JSON.parse(result);

      const markdownCell = parsed.cells.find(
        (c: any) => c.cell_type === "markdown"
      );
      expect(markdownCell.metadata.tags).toContain("documentation");
    });

    it("should renumber execution counts sequentially", async () => {
      const content = loadNotebook("with-outputs.ipynb");
      const tree = await Effect.runPromise(parse(content));

      let count = 1;
      visit(tree, "codeCell", (node: CodeCell) => {
        node.data.executionCount = count++;
      });

      const result = await Effect.runPromise(compile(tree));
      const parsed = JSON.parse(result);

      const codeCells = parsed.cells.filter((c: any) => c.cell_type === "code");
      expect(codeCells[0].execution_count).toBe(1);
      expect(codeCells[1].execution_count).toBe(2);
      expect(codeCells[2].execution_count).toBe(3);
    });
  });

  describe("round-trip integrity", () => {
    it("should preserve notebook through parse → compile cycle", async () => {
      const content = loadNotebook("simple.ipynb");
      const tree = await Effect.runPromise(parse(content));
      const result = await Effect.runPromise(compile(tree));

      const original = JSON.parse(content);
      const compiled = JSON.parse(result);

      expect(compiled.nbformat).toBe(original.nbformat);
      expect(compiled.cells.length).toBe(original.cells.length);
    });

    it("should preserve all metadata", async () => {
      const content = loadNotebook("simple.ipynb");
      const tree = await Effect.runPromise(parse(content));
      const result = await Effect.runPromise(compile(tree));

      const original = JSON.parse(content);
      const compiled = JSON.parse(result);

      expect(compiled.metadata).toEqual(original.metadata);
    });

    it("should preserve cell IDs", async () => {
      const content = loadNotebook("all-cell-types.ipynb");
      const tree = await Effect.runPromise(parse(content));
      const result = await Effect.runPromise(compile(tree));

      const original = JSON.parse(content);
      const compiled = JSON.parse(result);

      compiled.cells.forEach((cell: any, i: number) => {
        expect(cell.id).toBe(original.cells[i].id);
      });
    });
  });

  describe("error handling", () => {
    it("should handle invalid JSON gracefully", async () => {
      const invalidJson = "{ invalid json }";
      const result = parse(invalidJson);

      await expect(Effect.runPromise(result)).rejects.toThrow();
    });

    it("should handle missing cells array", async () => {
      const invalidNotebook = JSON.stringify({
        nbformat: 4,
        nbformat_minor: 5,
        metadata: {},
      });
      const result = parse(invalidNotebook);

      await expect(Effect.runPromise(result)).rejects.toThrow("cells");
    });
  });
});
