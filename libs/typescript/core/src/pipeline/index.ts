/**
 * Unified-like processing pipeline built with Effect
 *
 * Pipeline architecture:
 *
 *   | ........................ process ........................... |
 *   | .......... parse ... | ... run ... | ... stringify ..........|
 *
 *           +--------+                     +----------+
 *   Input ->- | Parser | ->- Syntax Tree ->- | Compiler | ->- Output
 *           +--------+          |          +----------+
 *                               X
 *                               |
 *                        +--------------+
 *                        | Transformers |
 *                        +--------------+
 *
 * Usage:
 * ```ts
 * const processor = new Processor(parser, compiler)
 *   .use(transformer1)
 *   .use(transformer2);
 *
 * const result = await Effect.runPromise(
 *   processor.process(input)
 * );
 * ```
 */

// Re-export all types
export type {
  Node,
  Parent,
  Literal,
  Root,
  Input,
  Output,
  Position,
  ParseError,
  TransformError,
  CompileError,
  PipelineError,
  Parser,
  Transformer,
  Compiler,
  MdastRoot,
  HastRoot,
} from "./types.js";

// Export Processor class
export { Processor } from "./processor.js";

// Export transformer utilities
export {
  identityTransformer,
  composeTransformers,
  createTransformer,
  createAsyncTransformer,
  mapTransformer,
} from "./transformers.js";

// Export unified adapters
export {
  adaptUnifiedPlugin,
  adaptUnifiedParser,
  adaptUnifiedCompiler,
} from "./adapters.js";

// Export file utilities
export {
  createVFile,
  getVFileContent,
  setVFileContent,
  getVFileMessages,
  addVFileMessage,
  readVFile,
  writeVFile,
} from "./file.js";

// Export error utilities
export {
  createParseError,
  createTransformError,
  createCompileError,
  isParseError,
  isTransformError,
  isCompileError,
  formatPipelineError,
} from "./errors.js";
