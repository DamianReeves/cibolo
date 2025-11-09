import { Context, Effect } from "effect";
import type { StructuredDocument, DocumentProcessingError } from "./types.js";

/**
 * StructuredDocumentFilter interface
 * Defines the contract for transforming a single StructuredDocument into multiple StructuredDocuments
 * This enables 1-to-n transformations in document processing pipelines
 */
export interface StructuredDocumentFilter {
  /**
   * Transform a single StructuredDocument into an array of StructuredDocuments
   *
   * @param document - The StructuredDocument to transform
   * @returns An Effect that produces an array of StructuredDocument on success or a DocumentProcessingError on failure
   */
  transform(
    document: StructuredDocument
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never>;
}

/**
 * StructuredDocumentFilterService - Context Tag for the StructuredDocumentFilter service
 * Used for dependency injection in Effect programs
 */
export const StructuredDocumentFilterService =
  Context.GenericTag<StructuredDocumentFilter>(
    "StructuredDocumentFilterService"
  );

/**
 * Identity filter - A StructuredDocumentFilter that passes through the input document unchanged
 * Returns the input document as a single-element array
 *
 * This is a stateless, immutable filter that can be safely reused across multiple transformations.
 * The transform method is pure and does not mutate any state.
 */
export const identityFilter: StructuredDocumentFilter = {
  transform(
    document: StructuredDocument
  ): Effect.Effect<StructuredDocument[], DocumentProcessingError, never> {
    return Effect.succeed([document]);
  },
};
