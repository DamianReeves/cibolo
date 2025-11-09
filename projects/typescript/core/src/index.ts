/**
 * cibolo-core - Core types and interfaces for document processing
 */

// Export all types
export type {
  Source,
  StructuredDocument,
  DocumentProcessingError,
  Result,
} from "./types.js";

// Export interfaces and service
export type { DocumentProcessor } from "./document-processor.js";
export { DocumentProcessorService } from "./document-processor.js";
