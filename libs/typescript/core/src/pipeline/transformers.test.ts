/**
 * Tests for transformer utilities
 */

import { describe, it, expect } from "bun:test";
import { Effect, Exit } from "effect";
import { VFile } from "vfile";
import type { Root, Node } from "./types.js";
import {
  identityTransformer,
  composeTransformers,
  createTransformer,
  createAsyncTransformer,
  mapTransformer,
} from "./transformers.js";

describe("transformers", () => {
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

  describe("identityTransformer", () => {
    it("should pass through tree unchanged", async () => {
      const transformer = identityTransformer<Root>();
      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );
      expect(result).toEqual(testTree);
    });
  });

  describe("composeTransformers", () => {
    it("should compose multiple transformers", async () => {
      const transformer1 = createTransformer<Root>((tree) => ({
        ...tree,
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Transformed 1" }],
          } as Node,
        ],
      }));

      const transformer2 = createTransformer<Root>((tree) => ({
        ...tree,
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Transformed 2" }],
          } as Node,
        ],
      }));

      const composed = composeTransformers(transformer1, transformer2);
      const result = await Effect.runPromise(
        composed.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Transformed 2" }],
      });
    });

    it("should handle empty transformer list", async () => {
      const composed = composeTransformers<Root>();
      const result = await Effect.runPromise(
        composed.transform(testTree, testFile)
      );
      expect(result).toEqual(testTree);
    });
  });

  describe("createTransformer", () => {
    it("should create transformer from pure function", async () => {
      const transformer = createTransformer<Root>((tree) => ({
        ...tree,
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: "Transformed" }],
          } as Node,
        ],
      }));

      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Transformed" }],
      });
    });

    it("should handle errors in transformer function", async () => {
      const transformer = createTransformer<Root>(() => {
        throw new Error("Transformer error");
      });

      const result = await Effect.runPromiseExit(
        transformer.transform(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "TransformError",
            message: "Transformer function threw an error",
          },
        });
      }
    });
  });

  describe("createAsyncTransformer", () => {
    it("should create transformer from async function", async () => {
      const transformer = createAsyncTransformer<Root>(async (tree) => {
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
      });

      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      expect(result.children[0]).toMatchObject({
        children: [{ value: "Async Transformed" }],
      });
    });

    it("should handle errors in async transformer function", async () => {
      const transformer = createAsyncTransformer<Root>(async () => {
        throw new Error("Async transformer error");
      });

      const result = await Effect.runPromiseExit(
        transformer.transform(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "TransformError",
            message: "Async transformer function threw an error",
          },
        });
      }
    });
  });

  describe("mapTransformer", () => {
    it("should map over tree nodes", async () => {
      const transformer = mapTransformer<Root>((node) => {
        if (node.type === "text") {
          return {
            ...node,
            value: (node as unknown as { value: string }).value.toUpperCase(),
          };
        }
        return node;
      });

      const result = await Effect.runPromise(
        transformer.transform(testTree, testFile)
      );

      const textNode = (
        (
          result as unknown as {
            children: Array<{ children: Array<{ value: string }> }>;
          }
        ).children[0] as { children: Array<{ value: string }> }
      ).children[0];
      expect(textNode.value).toBe("HELLO");
    });

    it("should handle errors in map function", async () => {
      const transformer = mapTransformer<Root>(() => {
        throw new Error("Map error");
      });

      const result = await Effect.runPromiseExit(
        transformer.transform(testTree, testFile)
      );
      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        expect(result.cause).toMatchObject({
          _tag: "Fail",
          error: {
            _tag: "TransformError",
            message: "Map transformer function threw an error",
          },
        });
      }
    });
  });
});
