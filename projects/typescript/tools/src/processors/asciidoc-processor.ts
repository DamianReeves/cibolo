import { Effect, Layer } from "effect";
import {
  DocumentProcessorService,
  type DocumentProcessor,
  type Source,
  type StructuredDocument,
  type DocumentProcessingError,
} from "cibolo-core";

/**
 * AsciiDoc document processor
 * Stub implementation for processing AsciiDoc documents
 */
class AsciiDocProcessor implements DocumentProcessor {
  process(
    source: Source
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never> {
    // For now, handle string input
    if (typeof source === "string") {
      return Effect.succeed([
        {
          content: source,
          metadata: {
            format: "asciidoc",
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
            format: "asciidoc",
            source: "json",
          },
        },
      ]);
    }

    return Effect.fail(
      "Unsupported source type for asciidoc processor" as DocumentProcessingError
    );
  }
}

/**
 * AsciiDocProcessorLayer - Provides AsciiDocProcessor as DocumentProcessorService
 */
export const AsciiDocProcessorLayer = Layer.succeed(
  DocumentProcessorService,
  new AsciiDocProcessor()
);
