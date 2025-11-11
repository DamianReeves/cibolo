import { Context, Effect } from "effect";
import type {
  Source,
  StructuredDocument,
  DocumentProcessingError,
} from "./types.js";

/**
 * DocumentProcessor interface
 * Defines the contract for processing documents from various formats
 */
export interface DocumentProcessor {
  /**
   * Process a document source into structured documents
   *
   * @param source - The document source (string or JSON)
   * @returns An Effect that produces an array of StructuredDocument on success or a DocumentProcessingError on failure
   */
  process(
    source: Source
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never>;
}

/**
 * DocumentProcessorService - Context Tag for the DocumentProcessor service
 * Used for dependency injection in Effect programs
 */
export const DocumentProcessorService = Context.GenericTag<DocumentProcessor>(
  "DocumentProcessorService"
);
