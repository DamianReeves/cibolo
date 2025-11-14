/**
 * Tests for the nbformat compiler
 */

import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { readFileSync } from "fs";
import { join } from "path";
import { NbformatCompiler, compile } from "../compiler.ts";
import { parse } from "../parser.ts";
import type { NotebookRoot } from "../types.ts";
import {
  notebook,
  codeCell,
  markdownCell,
  rawCell,
  streamOutput,
  executeResultOutput,
  errorOutput,
  displayDataOutput,
} from "../builders.ts";

const fixturesDir = join(__dirname, "fixtures", "notebooks");

function loadFixture(filename: string): string {
  return readFileSync(join(fixturesDir, filename), "utf-8");
}

describe("NbformatCompiler", () => {
  describe("compile method", () => {
    it("should compile a simple nbast tree to JSON", async () => {
      const tree = notebook([
        markdownCell("# Test Notebook", { id: "cell-1" }),
        codeCell('print("Hello")', [streamOutput("Hello\n")], {
          id: "cell-2",
          executionCount: 1,
        }),
      ]);

      const compiler = new NbformatCompiler();
      const json = await Effect.runPromise(compiler.compile(tree));
      const parsed = JSON.parse(json);

      expect(parsed.nbformat).toBe(4);
      expect(parsed.cells).toHaveLength(2);
      expect(parsed.cells[0].cell_type).toBe("markdown");
      expect(parsed.cells[1].cell_type).toBe("code");
      expect(parsed.cells[1].outputs).toHaveLength(1);
    });

    it("should preserve all output types", async () => {
      const tree = notebook([
        codeCell(
          "test",
          [
            streamOutput("stdout text\n", "stdout"),
            executeResultOutput(1, { "text/plain": "42" }),
            displayDataOutput({
              "text/plain": "<Figure>",
              "image/png": "base64data",
            }),
            errorOutput("ValueError", "invalid value", [
              "Traceback line 1",
              "Traceback line 2",
            ]),
          ],
          { id: "test-cell", executionCount: 1 }
        ),
      ]);

      const compiler = new NbformatCompiler();
      const json = await Effect.runPromise(compiler.compile(tree));
      const parsed = JSON.parse(json);

      const outputs = parsed.cells[0].outputs;
      expect(outputs).toHaveLength(4);
      expect(outputs[0].output_type).toBe("stream");
      expect(outputs[1].output_type).toBe("execute_result");
      expect(outputs[2].output_type).toBe("display_data");
      expect(outputs[3].output_type).toBe("error");
    });

    it("should handle raw cells with format metadata", async () => {
      const tree = notebook([
        rawCell(".. note::\n   Raw text", {
          id: "raw-1",
          format: "text/restructuredtext",
        }),
      ]);

      const compiler = new NbformatCompiler();
      const json = await Effect.runPromise(compiler.compile(tree));
      const parsed = JSON.parse(json);

      expect(parsed.cells[0].cell_type).toBe("raw");
      expect(parsed.cells[0].metadata.format).toBe("text/restructuredtext");
    });

    it("should support multiline source option", async () => {
      const tree = notebook([
        markdownCell("Line 1\nLine 2\nLine 3", { id: "cell-1" }),
      ]);

      const compiler = new NbformatCompiler({ multilineSource: true });
      const json = await Effect.runPromise(compiler.compile(tree));
      const parsed = JSON.parse(json);

      expect(Array.isArray(parsed.cells[0].source)).toBe(true);
      expect(parsed.cells[0].source).toEqual([
        "Line 1\n",
        "Line 2\n",
        "Line 3",
      ]);
    });

    it("should support non-pretty printing", async () => {
      const tree = notebook([markdownCell("Test", { id: "cell-1" })]);

      const compiler = new NbformatCompiler({ pretty: false });
      const json = await Effect.runPromise(compiler.compile(tree));

      expect(json).not.toContain("\n  ");
      expect(JSON.parse(json)).toBeDefined();
    });

    it("should support custom indentation", async () => {
      const tree = notebook([markdownCell("Test", { id: "cell-1" })]);

      const compiler = new NbformatCompiler({ indent: 4 });
      const json = await Effect.runPromise(compiler.compile(tree));

      expect(json).toContain("\n    ");
    });

    it("should fail on invalid root type", async () => {
      const invalidTree = { type: "invalid", children: [] } as any;
      const compiler = new NbformatCompiler();
      const result = compiler.compile(invalidTree);

      await expect(Effect.runPromise(result)).rejects.toThrow("notebook");
    });

    it("should fail on missing nbformat data", async () => {
      const invalidTree = {
        type: "notebook",
        children: [],
      } as any;
      const compiler = new NbformatCompiler();
      const result = compiler.compile(invalidTree);

      await expect(Effect.runPromise(result)).rejects.toThrow();
    });
  });

  describe("round-trip conversion", () => {
    it("should preserve simple notebook structure", async () => {
      const originalJson = loadFixture("simple.json");
      const tree = await Effect.runPromise(parse(originalJson));
      const compiledJson = await Effect.runPromise(compile(tree));

      const original = JSON.parse(originalJson);
      const compiled = JSON.parse(compiledJson);

      expect(compiled.nbformat).toBe(original.nbformat);
      expect(compiled.cells.length).toBe(original.cells.length);
      expect(compiled.cells[0].cell_type).toBe(original.cells[0].cell_type);
      expect(compiled.cells[1].outputs.length).toBe(
        original.cells[1].outputs.length
      );
    });

    it("should preserve all cell types", async () => {
      const originalJson = loadFixture("all-cell-types.json");
      const tree = await Effect.runPromise(parse(originalJson));
      const compiledJson = await Effect.runPromise(compile(tree));

      const original = JSON.parse(originalJson);
      const compiled = JSON.parse(compiledJson);

      expect(compiled.cells.length).toBe(original.cells.length);
      compiled.cells.forEach((cell: any, i: number) => {
        expect(cell.cell_type).toBe(original.cells[i].cell_type);
        expect(cell.id).toBe(original.cells[i].id);
      });
    });

    it("should preserve all output types", async () => {
      const originalJson = loadFixture("with-outputs.json");
      const tree = await Effect.runPromise(parse(originalJson));
      const compiledJson = await Effect.runPromise(compile(tree));

      const original = JSON.parse(originalJson);
      const compiled = JSON.parse(compiledJson);

      // Check each cell's outputs
      compiled.cells.forEach((cell: any, i: number) => {
        if (cell.cell_type === "code") {
          expect(cell.outputs.length).toBe(original.cells[i].outputs.length);
          cell.outputs.forEach((output: any, j: number) => {
            expect(output.output_type).toBe(
              original.cells[i].outputs[j].output_type
            );
          });
        }
      });
    });

    it("should preserve metadata", async () => {
      const originalJson = loadFixture("simple.json");
      const tree = await Effect.runPromise(parse(originalJson));
      const compiledJson = await Effect.runPromise(compile(tree));

      const original = JSON.parse(originalJson);
      const compiled = JSON.parse(compiledJson);

      expect(compiled.metadata.kernelspec?.name).toBe(
        original.metadata.kernelspec?.name
      );
      expect(compiled.metadata.language_info?.name).toBe(
        original.metadata.language_info?.name
      );
    });
  });

  describe("convenience compile function", () => {
    it("should work the same as compiler.compile", async () => {
      const tree = notebook([markdownCell("Test", { id: "cell-1" })]);
      const json = await Effect.runPromise(compile(tree));

      const parsed = JSON.parse(json);
      expect(parsed.nbformat).toBe(4);
      expect(parsed.cells).toHaveLength(1);
    });

    it("should accept options", async () => {
      const tree = notebook([markdownCell("Test", { id: "cell-1" })]);
      const json = await Effect.runPromise(compile(tree, { pretty: false }));

      expect(json).not.toContain("\n  ");
    });
  });
});
