/**
 * Tests for Processor class
 */

import { describe, it, expect } from "bun:test";
import { Effect, Exit } from "effect";
import { VFile } from "vfile";
import type {
  Root,
  Node,
  Parser,
  Transformer,
  Compiler,
  ParseError,
  CompileError,
  TransformError,
} from "./types.js";
import { Processor } from "./processor.js";
import { createTransformError } from "./errors.js";

describe("Processor", () => {
  // Simple test parser
  const testParser: Parser<string, Root> = {
    parse(input: string): Effect.Effect<Root, ParseError, never> {
      return Effect.succeed({
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [{ type: "text", value: input }],
          } as Node,
        ],
      });
    },
  };

  // Simple test compiler
  const testCompiler: Compiler<Root, string> = {
    compile(tree: Root): Effect.Effect<string, CompileError, never> {
      const textNode = (
        tree as unknown as {
          children: Array<{ children: Array<{ value: string }> }>;
        }
      ).children[0] as { children: Array<{ value: string }> };
      return Effect.succeed(textNode.children[0].value);
    },
  };

  it("should process input through pipeline without transformers", async () => {
    const processor = new Processor(testParser, testCompiler);
    const result = await Effect.runPromise(processor.process("Hello World"));
    expect(result).toBe("Hello World");
  });

  it("should apply transformers in order", async () => {
    const transformer1: Transformer<Root, Root> = {
      transform(tree: Root): Effect.Effect<Root, TransformError, never> {
        return Effect.succeed({
          ...tree,
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Transformed 1" }],
            } as Node,
          ],
        });
      },
    };

    const transformer2: Transformer<Root, Root> = {
      transform(tree: Root): Effect.Effect<Root, TransformError, never> {
        return Effect.succeed({
          ...tree,
          children: [
            {
              type: "paragraph",
              children: [{ type: "text", value: "Transformed 2" }],
            } as Node,
          ],
        });
      },
    };

    const processor = new Processor(testParser, testCompiler)
      .use(transformer1)
      .use(transformer2);

    const result = await Effect.runPromise(processor.process("Hello"));
    expect(result).toBe("Transformed 2");
  });

  it("should support method chaining", () => {
    const transformer: Transformer<Root, Root> = {
      transform(tree: Root): Effect.Effect<Root, TransformError, never> {
        return Effect.succeed(tree);
      },
    };

    const processor = new Processor(testParser, testCompiler)
      .use(transformer)
      .use(transformer)
      .use(transformer);

    expect(processor).toBeInstanceOf(Processor);
  });

  it("should propagate transform errors", async () => {
    const errorTransformer: Transformer<Root, Root> = {
      transform(): Effect.Effect<
        Root,
        import("./types.js").TransformError,
        never
      > {
        return Effect.fail(createTransformError("Transform failed"));
      },
    };

    const processor = new Processor(testParser, testCompiler).use(
      errorTransformer
    );

    const result = await Effect.runPromiseExit(processor.process("Hello"));
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(result.cause).toMatchObject({
        _tag: "Fail",
        error: {
          _tag: "TransformError",
          message: "Transform failed",
        },
      });
    }
  });

  it("should propagate parse errors", async () => {
    const errorParser: Parser<string, Root> = {
      parse(): Effect.Effect<Root, ParseError, never> {
        return Effect.fail({
          _tag: "ParseError",
          message: "Parse failed",
        });
      },
    };

    const processor = new Processor(errorParser, testCompiler);

    const result = await Effect.runPromiseExit(processor.process("Hello"));
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(result.cause).toMatchObject({
        _tag: "Fail",
        error: {
          _tag: "ParseError",
          message: "Parse failed",
        },
      });
    }
  });

  it("should propagate compile errors", async () => {
    const errorCompiler: Compiler<Root, string> = {
      compile(): Effect.Effect<string, CompileError, never> {
        return Effect.fail({
          _tag: "CompileError",
          message: "Compile failed",
        });
      },
    };

    const processor = new Processor(testParser, errorCompiler);

    const result = await Effect.runPromiseExit(processor.process("Hello"));
    expect(Exit.isFailure(result)).toBe(true);
    if (Exit.isFailure(result)) {
      expect(result.cause).toMatchObject({
        _tag: "Fail",
        error: {
          _tag: "CompileError",
          message: "Compile failed",
        },
      });
    }
  });

  it("should return both output and tree with processWithTree", async () => {
    const processor = new Processor(testParser, testCompiler);
    const [output, tree] = await Effect.runPromise(
      processor.processWithTree("Hello World")
    );

    expect(output).toBe("Hello World");
    expect(tree).toMatchObject({
      type: "root",
      children: expect.any(Array),
    });
  });

  it("should use provided VFile", async () => {
    const file = new VFile({ path: "test.md", value: "Hello" });
    const processor = new Processor(testParser, testCompiler);

    const result = await Effect.runPromise(processor.process("Hello", file));
    expect(result).toBe("Hello");
  });

  it("should create VFile from input if not provided", async () => {
    const processor = new Processor(testParser, testCompiler);
    const result = await Effect.runPromise(processor.process("Hello"));
    expect(result).toBe("Hello");
  });
});
