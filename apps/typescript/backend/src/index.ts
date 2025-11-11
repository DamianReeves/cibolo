import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { Effect } from "effect";

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: "Ndoctrinate API",
          version: "1.0.0",
          description: "API for Ndoctrinate document processing",
        },
        tags: [
          {
            name: "Health",
            description: "Health check endpoints",
          },
        ],
      },
    })
  )
  .use(
    cors({
      origin: ["http://localhost:5173"],
      credentials: true,
    })
  )
  .get("/", () => ({
    message: "Ndoctrinate API",
    version: "1.0.0",
  }))
  .get(
    "/health",
    () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: {
        tags: ["Health"],
        summary: "Health check endpoint",
        description: "Returns the health status of the API",
      },
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
console.log(
  `📚 Swagger documentation available at http://localhost:3000/swagger`
);
