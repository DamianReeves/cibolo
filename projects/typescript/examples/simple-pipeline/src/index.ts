/**
 * Simple Pipeline Example
 *
 * This example demonstrates how to use the Effect-based processing pipeline
 * to process content through parsers, transformers, and compilers.
 */

import { Effect } from "effect";
import type { Root } from "@types/unist";
import {
  Processor,
  createTransformer,
  type Parser,
  type Compiler,
} from "ndoctrinate-core";

/**
 * Simple parser that creates a basic syntax tree from markdown-like input
 */
const simpleParser: Parser<string, Root> = {
  parse(input: string): Effect.Effect<Root, never, never> {
    // Parse input into a simple tree structure
    const lines = input.split("\n");
    const children = lines
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // Simple heading detection
        if (line.startsWith("# ")) {
          return {
            type: "heading",
            depth: 1,
            children: [{ type: "text", value: line.slice(2) }],
          };
        }
        // Simple paragraph
        return {
          type: "paragraph",
          children: [{ type: "text", value: line }],
        };
      });

    return Effect.succeed({
      type: "root",
      children,
    });
  },
};

/**
 * Simple compiler that converts the tree back to text
 */
const simpleCompiler: Compiler<Root, string> = {
  compile(tree: Root): Effect.Effect<string, never, never> {
    const lines = tree.children.map((node) => {
      if (node.type === "heading") {
        const heading = node as { depth: number; children: Array<{ value: string }> };
        const text = heading.children[0]?.value ?? "";
        return `# ${text}`;
      }
      if (node.type === "paragraph") {
        const paragraph = node as { children: Array<{ value: string }> };
        return paragraph.children[0]?.value ?? "";
      }
      return "";
    });

    return Effect.succeed(lines.join("\n"));
  },
};

/**
 * Transformer that uppercases all text content
 */
const uppercaseTransformer = createTransformer<Root>((tree) => {
  function transformNode(node: any): any {
    if (node.type === "text") {
      return {
        ...node,
        value: node.value.toUpperCase(),
      };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(transformNode),
      };
    }
    return node;
  }

  return {
    ...tree,
    children: tree.children.map(transformNode),
  };
});

/**
 * Transformer that adds a prefix to headings
 */
const prefixHeadingTransformer = createTransformer<Root>((tree) => {
  function transformNode(node: any): any {
    if (node.type === "heading") {
      const heading = node as { children: Array<{ value: string }> };
      return {
        ...node,
        children: [
          {
            type: "text",
            value: `[IMPORTANT] ${heading.children[0]?.value ?? ""}`,
          },
        ],
      };
    }
    if (node.children) {
      return {
        ...node,
        children: node.children.map(transformNode),
      };
    }
    return node;
  }

  return {
    ...tree,
    children: tree.children.map(transformNode),
  };
});

/**
 * Main example function
 */
async function main() {
  const input = `# Hello World

This is a simple paragraph.

# Another Heading

More content here.`;

  console.log("Input:");
  console.log(input);
  console.log("\n" + "=".repeat(50) + "\n");

  // Create processor with parser and compiler
  const processor = new Processor(simpleParser, simpleCompiler)
    .use(uppercaseTransformer)
    .use(prefixHeadingTransformer);

  // Process the input
  const result = await Effect.runPromise(processor.process(input));

  console.log("Output:");
  console.log(result);
  console.log("\n" + "=".repeat(50) + "\n");

  // Process with tree to inspect the AST
  const [output, tree] = await Effect.runPromise(
    processor.processWithTree(input)
  );

  console.log("Final AST:");
  console.log(JSON.stringify(tree, null, 2));
}

// Run the example
main().catch(console.error);

