import { Effect, Layer } from "effect";
import {
  DocumentProcessorService,
  type DocumentProcessor,
  type Source,
  type StructuredDocument,
  type DocumentProcessingError,
} from "ndoctrinate-core";

/**
 * Markdown document processor
 * Stub implementation for processing Markdown documents
 */
class MarkdownProcessor implements DocumentProcessor {
  process(
    source: Source
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never> {
    // For now, handle string input
    if (typeof source === "string") {
      return Effect.succeed([
        {
          content: source,
          metadata: {
            format: "markdown",
          },
        },
      ]);
    }

    // Handle JSON input
    if (typeof source === "object" && source !== null) {
      const jsonString = JSON.stringify(source);
      return Effect.succeed([
        {
          content: jsonString,
          metadata: {
            format: "markdown",
            source: "json",
          },
        },
      ]);
    }

    return Effect.fail(
      "Unsupported source type for markdown processor" as DocumentProcessingError
    );
  }
}

/**
 * MarkdownProcessorLayer - Provides MarkdownProcessor as DocumentProcessorService
 */
export const MarkdownProcessorLayer = Layer.succeed(
  DocumentProcessorService,
  new MarkdownProcessor()
);
