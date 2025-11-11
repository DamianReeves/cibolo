import { describe, it, expect } from "bun:test";
import { Effect } from "effect";
import { identityFilter } from "./structured-document-filter.js";
import type { StructuredDocument } from "./types.js";

describe("StructuredDocumentFilter - Identity Filter", () => {
  it("should return the input document as a single-element array", async () => {
    const filter = identityFilter;
    const inputDocument: StructuredDocument = {
      content: "Test content",
      metadata: { format: "markdown" },
    };

    const result = await Effect.runPromise(filter.transform(inputDocument));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(inputDocument);
    expect(result[0].content).toBe("Test content");
    expect(result[0].metadata).toEqual({ format: "markdown" });
  });

  it("should preserve document with no metadata", async () => {
    const filter = identityFilter;
    const inputDocument: StructuredDocument = {
      content: "Simple content",
    };

    const result = await Effect.runPromise(filter.transform(inputDocument));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(inputDocument);
    expect(result[0].content).toBe("Simple content");
    expect(result[0].metadata).toBeUndefined();
  });

  it("should preserve complex metadata", async () => {
    const filter = identityFilter;
    const inputDocument: StructuredDocument = {
      content: "Complex document",
      metadata: {
        format: "markdown",
        author: "Test Author",
        tags: ["test", "example"],
        nested: {
          key: "value",
        },
      },
    };

    const result = await Effect.runPromise(filter.transform(inputDocument));

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(inputDocument);
    expect(result[0].metadata).toEqual(inputDocument.metadata);
  });

  it("should return an Effect that succeeds", async () => {
    const filter = identityFilter;
    const inputDocument: StructuredDocument = {
      content: "Test",
    };

    const effect = filter.transform(inputDocument);
    const result = await Effect.runPromise(effect);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });
});
