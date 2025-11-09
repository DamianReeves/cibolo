import { Effect, Layer } from "effect";
import {
  DocumentProcessorService,
  type DocumentProcessor,
  type Source,
  type StructuredDocument,
  type DocumentProcessingError,
} from "cibolo-core";

/**
 * DOCX document processor
 * Stub implementation for processing DOCX documents
 */
class DocxProcessor implements DocumentProcessor {
  process(
    source: Source
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never> {
    // For now, handle string input (could be file path or content)
    if (typeof source === "string") {
      return Effect.succeed([
        {
          content: source,
          metadata: {
            format: "docx",
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
            format: "docx",
            source: "json",
          },
        },
      ]);
    }

    return Effect.fail(
      "Unsupported source type for docx processor" as DocumentProcessingError
    );
  }
}

/**
 * DocxProcessorLayer - Provides DocxProcessor as DocumentProcessorService
 */
export const DocxProcessorLayer = Layer.succeed(
  DocumentProcessorService,
  new DocxProcessor()
);
