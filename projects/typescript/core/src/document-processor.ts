import type {
  Source,
  StructuredDocument,
  DocumentProcessingError,
  Result,
} from "./types.js";

/**
 * DocumentProcessor interface
 * Defines the contract for processing documents from various formats
 */
export interface DocumentProcessor {
  /**
   * Process a document source into a structured document
   *
   * @param source - The document source (string or JSON)
   * @returns A Result containing either a StructuredDocument on success or a DocumentProcessingError on failure
   */
  process(source: Source): Result<StructuredDocument, DocumentProcessingError>;
}
