import swaggerJSDoc from "swagger-jsdoc";

export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "PantryFrugalAI Backend API",
      version: "1.0.0",
      description: "AI-powered grocery assistant backend with GPT and QuickCommerce MCP integration."
    },
    servers: [{ url: "/api" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
            error: { type: "string" }
          }
        }
      }
    },
    paths: {
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register a user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "email", "password"],
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { "201": { description: "Registered" } }
        }
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" }
                  }
                }
              }
            }
          },
          responses: { "200": { description: "Authenticated" } }
        }
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Current user",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Current user" } }
        }
      },
      "/preferences": {
        get: {
          tags: ["Preferences"],
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "User preferences" } }
        },
        put: {
          tags: ["Preferences"],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    monthlyBudget: { type: "number", nullable: true },
                    dietaryPreferences: { type: "array", items: { type: "string" } },
                    familySize: { type: "integer", minimum: 1 },
                    favoriteBrands: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          },
          responses: { "200": { description: "Updated preferences" } }
        }
      },
      "/conversations": {
        get: {
          tags: ["Conversations"],
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "Conversation list" } }
        }
      },
      "/conversations/{id}": {
        get: {
          tags: ["Conversations"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "200": { description: "Conversation" } }
        },
        delete: {
          tags: ["Conversations"],
          security: [{ bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: { "204": { description: "Deleted" } }
        }
      },
      "/chat": {
        post: {
          tags: ["Chat"],
          summary: "Send an AI grocery assistant message",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: { type: "string" },
                    conversationId: { type: "string", format: "uuid" }
                  }
                },
                example: {
                  message: "Find a week's worth of high-protein vegetarian groceries under ₹2000"
                }
              }
            }
          },
          responses: { "200": { description: "AI response with MCP tool call metadata" } }
        }
      }
    }
  },
  apis: []
});
