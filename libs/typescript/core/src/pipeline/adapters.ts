/**
 * Unified compatibility adapters
 * Allows unifiedjs processors and utilities to work with the Effect-based pipeline
 */

import { Effect } from "effect";
import type { VFile } from "vfile";
import type {
  Node,
  Root,
  Parser,
  Transformer,
  Compiler,
  ParseError,
  TransformError,
  CompileError,
} from "./types.js";
import {
  createParseError,
  createTransformError,
  createCompileError,
} from "./errors.js";

/**
 * Minimal type definitions for unified plugin signatures
 * Unified plugins can be:
 * - Sync functions: (tree, file) => Tree
 * - Async functions: (tree, file) => Promise<Tree>
 * - Callback-based: (tree, file, next) => void
 */
type UnifiedPluginFunction<Tree extends Node = Root> = (
  tree: Tree,
  file: VFile,
  next?: (error?: Error | null, tree?: Tree, file?: VFile) => void
) => Tree | Promise<Tree> | void;

type UnifiedPlugin<Tree extends Node = Root> =
  | UnifiedPluginFunction<Tree>
  | ((options?: unknown) => UnifiedPluginFunction<Tree>);

/**
 * Minimal type for unified parser
 * Unified parsers take input and return a tree
 */
type UnifiedParser = (
  input: string | VFile,
  file?: VFile
) => Node | Promise<Node>;

/**
 * Minimal type for unified compiler
 * Unified compilers take a tree and return output
 */
type UnifiedCompiler = (tree: Node, file?: VFile) => string | Promise<string>;

/**
 * Adapt a unified plugin to work as an Effect transformer
 *
 * Handles:
 * - Sync plugins: (tree, file) => Tree
 * - Async plugins: (tree, file) => Promise<Tree>
 * - Callback-based plugins: (tree, file, next) => void
 * - Plugin factories: (options) => plugin
 *
 * @param plugin - The unified plugin to adapt
 * @param options - Optional options to pass to the plugin (if it's a factory)
 * @returns An Effect transformer
 */
export function adaptUnifiedPlugin<TreeType extends Node = Root>(
  plugin: UnifiedPlugin<TreeType>,
  options?: unknown
): Transformer<TreeType, TreeType> {
  // Handle plugin factories: (options) => plugin
  let pluginFn: UnifiedPluginFunction<TreeType>;
  if (
    typeof plugin === "function" &&
    plugin.length === 1 &&
    options !== undefined
  ) {
    // This is a plugin factory function that takes options
    const factory = plugin as (
      options?: unknown
    ) => UnifiedPluginFunction<TreeType>;
    pluginFn = factory(options);
  } else {
    pluginFn = plugin as UnifiedPluginFunction<TreeType>;
  }

  return {
    transform(
      tree: TreeType,
      file: VFile
    ): Effect.Effect<TreeType, TransformError, never> {
      try {
        // For functions that accept a callback (3+ parameters), try callback-based first
        if (pluginFn.length >= 3) {
          let callbackInvoked = false;
          let callbackError: Error | undefined = undefined;
          let callbackTree: TreeType | undefined = undefined;

          // Call with callback to see if it's callback-based
          const result = pluginFn(tree, file, (error, transformedTree) => {
            callbackInvoked = true;
            callbackError = error ?? undefined;
            callbackTree = (transformedTree ?? tree) as TreeType;
          });

          // If callback was invoked synchronously, use the result
          if (callbackInvoked) {
            if (callbackError) {
              const error = callbackError as Error;
              return Effect.fail(
                createTransformError(
                  `Unified plugin error: ${error.message}`,
                  error
                )
              );
            }
            return Effect.succeed(callbackTree ?? tree);
          }

          // If result is undefined, it's an async callback-based plugin
          if (result === undefined) {
            return Effect.async((resume) => {
              pluginFn(tree, file, (error, transformedTree) => {
                if (error) {
                  resume(
                    Effect.fail(
                      createTransformError(
                        `Unified plugin error: ${error.message}`,
                        error
                      )
                    )
                  );
                } else {
                  const finalTree = (transformedTree ?? tree) as TreeType;
                  resume(Effect.succeed(finalTree));
                }
              });
            });
          }

          // If it returned something despite accepting callback, use the return value
          if (result instanceof Promise) {
            return Effect.tryPromise({
              try: async () => {
                const transformedTree = await result;
                return (transformedTree ?? tree) as TreeType;
              },
              catch: (error) =>
                createTransformError(
                  `Unified plugin error: ${error instanceof Error ? error.message : String(error)}`,
                  error instanceof Error ? error : new Error(String(error))
                ),
            });
          }

          return Effect.succeed((result ?? tree) as TreeType);
        }

        // For functions without callback parameter, handle normally
        const result = pluginFn(tree, file);

        // Handle async plugins
        if (result instanceof Promise) {
          return Effect.tryPromise({
            try: async () => {
              const transformedTree = await result;
              return (transformedTree ?? tree) as TreeType;
            },
            catch: (error) =>
              createTransformError(
                `Unified plugin error: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : new Error(String(error))
              ),
          });
        }

        // Handle sync plugins
        return Effect.succeed((result ?? tree) as TreeType);
      } catch (error) {
        return Effect.fail(
          createTransformError(
            `Unified plugin threw an error: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    },
  };
}

/**
 * Adapt a unified parser to work as an Effect parser
 *
 * @param parser - The unified parser to adapt
 * @returns An Effect parser
 */
export function adaptUnifiedParser<TreeType extends Node = Root>(
  parser: UnifiedParser
): Parser<string, TreeType> {
  return {
    parse(
      input: string,
      file?: VFile
    ): Effect.Effect<TreeType, ParseError, never> {
      try {
        const result = parser(input, file);

        // Handle async parsers
        if (result instanceof Promise) {
          return Effect.tryPromise({
            try: async () => {
              const tree = await result;
              return tree as TreeType;
            },
            catch: (error) =>
              createParseError(
                `Unified parser error: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : new Error(String(error))
              ),
          });
        }

        // Handle sync parsers
        return Effect.succeed(result as TreeType);
      } catch (error) {
        return Effect.fail(
          createParseError(
            `Unified parser threw an error: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    },
  };
}

/**
 * Adapt a unified compiler to work as an Effect compiler
 *
 * @param compiler - The unified compiler to adapt
 * @returns An Effect compiler
 */
export function adaptUnifiedCompiler<OutputType extends string = string>(
  compiler: UnifiedCompiler
): Compiler<Node, OutputType> {
  return {
    compile(
      tree: Node,
      file?: VFile
    ): Effect.Effect<OutputType, CompileError, never> {
      try {
        const result = compiler(tree, file);

        // Handle async compilers
        if (result instanceof Promise) {
          return Effect.tryPromise({
            try: async () => {
              const output = await result;
              return output as OutputType;
            },
            catch: (error) =>
              createCompileError(
                `Unified compiler error: ${error instanceof Error ? error.message : String(error)}`,
                error instanceof Error ? error : new Error(String(error))
              ),
          });
        }

        // Handle sync compilers
        return Effect.succeed(result as OutputType);
      } catch (error) {
        return Effect.fail(
          createCompileError(
            `Unified compiler threw an error: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error : new Error(String(error))
          )
        );
      }
    },
  };
}
