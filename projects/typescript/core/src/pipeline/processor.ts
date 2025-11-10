/**
 * Processor class - orchestrates the unified-like pipeline
 *
 * Pipeline flow:
 *   Input -> Parser -> SyntaxTree -> Transformers -> SyntaxTree -> Compiler -> Output
 *
 * Similar to unified's:
 *   process = parse | run | stringify
 */

import { Effect, pipe } from "effect";
import type { VFile } from "vfile";
import type {
  Node,
  Root,
  Input,
  Output,
  Parser,
  Transformer,
  Compiler,
  PipelineError,
} from "./types.js";
import { createVFile } from "./file.js";

/**
 * Processor class for orchestrating the content processing pipeline
 *
 * @template InputType - The type of input this processor accepts
 * @template OutputType - The type of output this processor produces
 * @template TreeType - The type of syntax tree used internally
 */
export class Processor<
  InputType extends Input = Input,
  OutputType extends Output = string,
  TreeType extends Node = Root,
> {
  private readonly parser: Parser<InputType, TreeType>;
  private readonly transformers: Transformer<TreeType, TreeType>[] = [];
  private readonly compiler: Compiler<TreeType, OutputType>;

  /**
   * Create a new Processor
   *
   * @param parser - The parser to use for converting input to syntax tree
   * @param compiler - The compiler to use for converting syntax tree to output
   */
  constructor(
    parser: Parser<InputType, TreeType>,
    compiler: Compiler<TreeType, OutputType>
  ) {
    this.parser = parser;
    this.compiler = compiler;
  }

  /**
   * Add a transformer to the pipeline
   * Transformers are applied in the order they are added
   *
   * @param transformer - The transformer to add
   * @returns This processor instance for method chaining
   */
  use(transformer: Transformer<TreeType, TreeType>): this {
    this.transformers.push(transformer);
    return this;
  }

  /**
   * Process input through the pipeline
   *
   * Pipeline: parse |> run (transform) |> stringify
   *
   * @param input - The input to process
   * @param file - Optional VFile for metadata and messages
   * @returns An Effect that produces output on success or a PipelineError on failure
   */
  process(
    input: InputType,
    file?: VFile
  ): Effect.Effect<OutputType, PipelineError, never> {
    const vfile = file ?? createVFile(input);

    return pipe(
      // Parse phase: Input -> SyntaxTree
      this.parser.parse(input, vfile),

      // Run phase: Apply all transformers sequentially
      Effect.flatMap((tree) => this.run(tree, vfile)),

      // Stringify phase: SyntaxTree -> Output
      Effect.flatMap((tree) => this.compiler.compile(tree, vfile))
    );
  }

  /**
   * Process input and return both the output and the syntax tree
   * Useful for inspection and debugging
   *
   * @param input - The input to process
   * @param file - Optional VFile for metadata and messages
   * @returns An Effect that produces a tuple of [output, tree] on success or a PipelineError on failure
   */
  processWithTree(
    input: InputType,
    file?: VFile
  ): Effect.Effect<[OutputType, TreeType], PipelineError, never> {
    const vfile = file ?? createVFile(input);

    return pipe(
      this.parser.parse(input, vfile),
      Effect.flatMap((tree) =>
        pipe(
          this.run(tree, vfile),
          Effect.flatMap((transformedTree) =>
            pipe(
              this.compiler.compile(transformedTree, vfile),
              Effect.map((output) => [output, transformedTree] as const)
            )
          )
        )
      )
    );
  }

  /**
   * Run phase: Apply all transformers to the syntax tree
   * Transformers are composed sequentially using Effect.flatMap
   *
   * @param tree - The syntax tree to transform
   * @param file - VFile for metadata and messages
   * @returns An Effect that produces the transformed tree on success or a PipelineError on failure
   */
  private run(
    tree: TreeType,
    file: VFile
  ): Effect.Effect<TreeType, PipelineError, never> {
    if (this.transformers.length === 0) {
      return Effect.succeed(tree);
    }

    // Sequentially apply all transformers
    let effect: Effect.Effect<TreeType, PipelineError, never> =
      Effect.succeed(tree);

    for (const transformer of this.transformers) {
      effect = pipe(
        effect,
        Effect.flatMap((currentTree) =>
          pipe(
            transformer.transform(currentTree, file),
            Effect.mapError(
              (error): PipelineError => ({
                _tag: "TransformError",
                message: error.message,
                cause: error.cause,
              })
            )
          )
        )
      );
    }

    return effect;
  }
}
