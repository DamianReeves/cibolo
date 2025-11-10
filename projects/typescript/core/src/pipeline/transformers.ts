/**
 * Transformer utilities for the pipeline
 */

import { Effect } from "effect";
import type { VFile } from "vfile";
import type { Node, Root, Transformer, TransformError } from "./types.js";
import { createTransformError } from "./errors.js";

/**
 * Identity transformer - passes through the tree unchanged
 */
export function identityTransformer<
  TreeType extends Node = Root,
>(): Transformer<TreeType, TreeType> {
  return {
    transform(
      tree: TreeType,
      _file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      return Effect.succeed(tree);
    },
  };
}

/**
 * Compose multiple transformers into a single transformer
 * Transformers are applied sequentially in the order provided
 */
export function composeTransformers<TreeType extends Node = Root>(
  ...transformers: Transformer<TreeType, TreeType>[]
): Transformer<TreeType, TreeType> {
  return {
    transform(
      tree: TreeType,
      file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      if (transformers.length === 0) {
        return Effect.succeed(tree);
      }

      // Sequentially apply all transformers
      let effect: Effect.Effect<TreeType, TransformError, never> =
        Effect.succeed(tree);

      for (const transformer of transformers) {
        effect = Effect.flatMap(effect, (currentTree) =>
          transformer.transform(currentTree, file)
        );
      }

      return effect;
    },
  };
}

/**
 * Create a transformer from a pure function
 */
export function createTransformer<TreeType extends Node = Root>(
  fn: (tree: TreeType, file: VFile) => TreeType
): Transformer<TreeType, TreeType> {
  return {
    transform(
      tree: TreeType,
      file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      return Effect.try({
        try: () => fn(tree, file),
        catch: (error) =>
          createTransformError(
            "Transformer function threw an error",
            error instanceof Error ? error : new Error(String(error))
          ),
      });
    },
  };
}

/**
 * Create an async transformer from an async function
 */
export function createAsyncTransformer<TreeType extends Node = Root>(
  fn: (tree: TreeType, file: VFile) => Promise<TreeType>
): Transformer<TreeType, TreeType> {
  return {
    transform(
      tree: TreeType,
      file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      return Effect.tryPromise({
        try: () => fn(tree, file),
        catch: (error) =>
          createTransformError(
            "Async transformer function threw an error",
            error instanceof Error ? error : new Error(String(error))
          ),
      });
    },
  };
}

/**
 * Create a transformer that maps over tree nodes
 * This is a helper for simple node-level transformations
 */
export function mapTransformer<TreeType extends Node = Root>(
  fn: (node: Node) => Node
): Transformer<TreeType, TreeType> {
  return {
    transform(
      tree: TreeType,
      _file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      return Effect.try({
        try: () => {
          // Simple recursive map - for more complex cases, users should use unist-util-visit
          function mapNode(node: Node): Node {
            const mapped = fn(node);
            if ("children" in mapped && Array.isArray(mapped.children)) {
              return {
                ...mapped,
                children: (mapped.children as Node[]).map(mapNode),
              } as Node;
            }
            return mapped;
          }
          return mapNode(tree) as TreeType;
        },
        catch: (error) =>
          createTransformError(
            "Map transformer function threw an error",
            error instanceof Error ? error : new Error(String(error))
          ),
      });
    },
  };
}
