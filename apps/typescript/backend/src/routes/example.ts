import { Elysia } from "elysia";
import { Effect } from "effect";

/**
 * Example route demonstrating Effect integration
 */
export const exampleRoutes = new Elysia({ prefix: "/api/examples" })
  .get(
    "/",
    () => ({
      message: "Example endpoint",
      examples: ["example1", "example2"],
    }),
    {
      detail: {
        tags: ["Examples"],
        summary: "List examples",
        description: "Returns a list of example items",
      },
    }
  )
  .get(
    "/:id",
    ({ params: { id } }) => ({
      id,
      message: `Example ${id}`,
    }),
    {
      detail: {
        tags: ["Examples"],
        summary: "Get example by ID",
        description: "Returns a specific example by its ID",
      },
    }
  );
