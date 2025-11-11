/**
 * Tests for unified compatibility adapters
 */

import { describe, it, expect } from "bun:test";
import { Effect, Exit } from "effect";
import { VFile } from "vfile";
import type { Root, Node } from "./types.js";
import {
  adaptUnifiedPlugin,
  adaptUnifiedParser,
  adaptUnifiedCompiler,
} from "./adapters.js";

describe("adapters", () => {
  const testTree: Root = {
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [{ type: "text", value: "Hello" }],
      } as Node,
    ],
  };

  const testFile = new VFile({ value: "test" });

  describe("adaptUnifiedPlugin", () => {
    it("should adapt sync plugin", async () => {
      const syncPlugin = (tree: Root, _file: VFile) => ({
        ...tree,
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Transformed" }],
          } as Node,
        ],
      });

      const transformer = adaptUnifiedPlugin(syncPlugin);
      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Transformed" }],
      });
    });

    it("should adapt async plugin", async () => {
      const asyncPlugin = async (tree: Root, _file: VFile) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          ...tree,
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Async Transformed" }],
            } as Node,
          ],
        };
      };

      const transformer = adaptUnifiedPlugin(asyncPlugin);
      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Async Transformed" }],
      });
    });

    it("should adapt callback-based plugin", async () => {
      const callbackPlugin = (
        tree: Root,
        _file: VFile,
        next?: (error?: Error | null, tree?: Root) => void
      ) => {
        if (next) {
          setTimeout(() => {
            next(null, {
              ...tree,
              children: [
                {
                  type: "paragraph",
                  children: [{ type: "text", value: "Callback Transformed" }],
                } as Node,
              ],
            });
          }, 10);
        }
      };

      const transformer = adaptUnifiedPlugin(callbackPlugin);
      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Callback Transformed" }],
      });
    });

    it("should handle plugin factory with options", async () => {
      const pluginFactory: (options: {
        prefix: string;
      }) => (tree: Root, file: VFile) => Root =
        (options: { prefix: string }) => (tree: Root, _file: VFile) => ({
          ...tree,
          children: [
            {
              type: "paragraph",
              children: [
                { type: "text", value: `${options.prefix} Transformed` },
              ],
            } as Node,
          ],
        });

      const transformer = adaptUnifiedPlugin(pluginFactory as any, {
        prefix: "PREFIX",
      });
      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect((result as Root).children[0]).toMatchObject({
        children: [{ value: "PREFIX Transformed" }],
      });
    });

    it("should handle plugin errors", async () => {
      const errorPlugin = (_tree: Root) => {
        throw new Error("Plugin error");
      };

      const transformer = adaptUnifiedPlugin(errorPlugin);
      const result = await Effect.runPromiseExit(
        transformer.transform(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "TransformError",
          },
        });
      }
    });

    it("should handle callback plugin errors", async () => {
      const errorPlugin = (
        _tree: Root,
        _file: VFile,
        next?: (error?: Error | null) => void
      ) => {
        if (next) {
          next(new Error("Callback error"));
        }
      };

      const transformer = adaptUnifiedPlugin(errorPlugin);
      const result = await Effect.runPromiseExit(
        transformer.transform(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "TransformError",
          },
        });
      }
    });
  });

  describe("adaptUnifiedParser", () => {
    it("should adapt sync parser", async () => {
      const syncParser = (input: string | VFile): Root => ({
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                value: typeof input === "string" ? input : String(input),
              },
            ],
          } as Node,
        ],
      });

      const parser = adaptUnifiedParser(syncParser);
      const result = await Effect.runPromise(parser.parse("Hello"));

      expect(result).toMatchObject({
        type: "root",
        children: [{ children: [{ value: "Hello" }] }],
      });
    });

    it("should adapt async parser", async () => {
      const asyncParser = async (input: string | VFile): Promise<Root> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          type: "root",
          children: [
            {
              type: "paragraph",
              children: [
                {
                  type: "text",
                  value: typeof input === "string" ? input : String(input),
                },
              ],
            } as Node,
          ],
        };
      };

      const parser = adaptUnifiedParser(asyncParser);
      const result = await Effect.runPromise(parser.parse("Hello"));

      expect(result).toMatchObject({
        type: "root",
        children: [{ children: [{ value: "Hello" }] }],
      });
    });

    it("should handle parser errors", async () => {
      const errorParser = () => {
        throw new Error("Parser error");
      };

      const parser = adaptUnifiedParser(errorParser);
      const result = await Effect.runPromiseExit(parser.parse("Hello"));
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "ParseError",
          },
        });
      }
    });
  });

  describe("adaptUnifiedCompiler", () => {
    it("should adapt sync compiler", async () => {
      const syncCompiler = (tree: Node, _file?: VFile): string => {
        const textNode = (
          (
            tree as unknown as {
              children: Array<{ children: Array<{ value: string }> }>;
            }
          ).children[0] as { children: Array<{ value: string }> }
        ).children[0];
        return textNode.value;
      };

      const compiler = adaptUnifiedCompiler(syncCompiler);
      const result = await Effect.runPromise(
        compiler.compile(testTree, testFile)
      );

      expect(result).toBe("Hello");
    });

    it("should adapt async compiler", async () => {
      const asyncCompiler = async (
        tree: Node,
        _file?: VFile
      ): Promise<string> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        const textNode = (
          (
            tree as unknown as {
              children: Array<{ children: Array<{ value: string }> }>;
            }
          ).children[0] as { children: Array<{ value: string }> }
        ).children[0];
        return textNode.value;
      };

      const compiler = adaptUnifiedCompiler(asyncCompiler);
      const result = await Effect.runPromise(
        compiler.compile(testTree, testFile)
      );

      expect(result).toBe("Hello");
    });

    it("should handle compiler errors", async () => {
      const errorCompiler = () => {
        throw new Error("Compiler error");
      };

      const compiler = adaptUnifiedCompiler(errorCompiler);
      const result = await Effect.runPromiseExit(
        compiler.compile(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "CompileError",
          },
        });
      }
    });
  });
});
