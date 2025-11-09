/**
 * ndoctrinate-core - Core types and interfaces for document processing
 */

// Export all types
export type {
  Source,
  StructuredDocument,
  DocumentProcessingError,
  Result,
} from "./types.js";

// Export interfaces and services
export type { DocumentProcessor } from "./document-processor.js";
export { DocumentProcessorService } from "./document-processor.js";
export type { StructuredDocumentFilter } from "./structured-document-filter.js";
export { StructuredDocumentFilterService } from "./structured-document-filter.js";
