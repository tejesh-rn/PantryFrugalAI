# PantryFrugalAI Backend

Production-ready Node.js, TypeScript, Express, PostgreSQL, Prisma backend for PantryFrugalAI.

It provides JWT authentication, user preferences, conversation persistence, GPT-powered chat, and a reusable MCP client layer connected to the hosted QuickCommerce MCP server at:

```text
https://api.quickcommerceapi.com/mcp
```

## Stack

- Node.js + TypeScript
- Express
- PostgreSQL + Prisma
- JWT + bcrypt
- OpenAI SDK
- Model Context Protocol SDK
- Zod validation
- Winston logging
- Helmet, CORS, rate limiting
- Swagger/OpenAPI at `/api/docs`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create and manage `.env` in the project root:

```text
PORT=
DATABASE_URL=
JWT_SECRET=
QUICKCOMMERCE_MCP_URL=https://api.quickcommerceapi.com/mcp
QUICKCOMMERCE_API_KEY=
AI_PROVIDER=openai
OPENAI_API_KEY=
```

`JWT_SECRET` must be at least 32 characters.

To use Gemini instead of OpenAI:

```text
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

3. Run migrations:

```bash
npm run setup:db
npx prisma migrate dev
```

`npm run setup:db` is for local Homebrew PostgreSQL setups. It creates the role and database from `DATABASE_URL`.

4. Start development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api` by default.

## Scripts

```bash
npm run dev              # Start TS dev server
npm run build            # Compile TypeScript
npm start                # Run compiled server
npm run setup:db         # Create local PostgreSQL role/database from DATABASE_URL
npm run lint             # Type-check without emitting
npx prisma migrate dev   # Apply migrations
npx prisma generate      # Generate Prisma Client
```

## API

Swagger UI:

```text
GET /api/docs
```

Health:

```text
GET /api/health
```

Auth:

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Preferences:

```text
GET /api/preferences
PUT /api/preferences
```

Conversations:

```text
GET    /api/conversations
GET    /api/conversations/:id
DELETE /api/conversations/:id
```

AI chat:

```text
POST /api/chat
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "message": "Find a week's worth of high-protein vegetarian groceries under ₹2000"
}
```

Response:

```json
{
  "success": true,
  "conversationId": "uuid",
  "response": "...",
  "toolCalls": [],
  "metadata": {}
}
```

## MCP Integration

The reusable MCP layer lives in `src/mcp`:

- `MCPClient.ts`: connects to MCP over Streamable HTTP with SSE fallback, attaches `X-API-Key`, retries operations, logs interactions.
- `MCPService.ts`: manages one or more MCP servers, discovers tools dynamically, caches tool definitions, maps MCP tools to OpenAI tool-calling definitions, and executes tool calls.
- `types.ts`: shared MCP types.

QuickCommerce is configured by default with:

```text
QUICKCOMMERCE_MCP_URL=https://api.quickcommerceapi.com/mcp
QUICKCOMMERCE_API_KEY=<your key>
```

To add future MCP servers, instantiate `MCPService` with additional `MCPServerConfig` entries.

## Error Format

Errors are returned in a consistent shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "error": "VALIDATION_ERROR"
}
```

## Notes

- GPT is instructed not to hallucinate prices or availability.
- Live grocery prices and availability must come from MCP tool calls.
- QuickCommerce MCP provides tools such as `search_products`, `group_search`, `check_delivery_eta`, `group_eta`, `check_credits`, and `list_platforms`.
- Supported platforms include BlinkIt, Zepto, Swiggy Instamart, BigBasket, DMart, JioMart, and Flipkart Minutes.
- The AI provider is configurable with `AI_PROVIDER=openai|gemini`.
- The default OpenAI model is configurable with `OPENAI_MODEL`; it defaults to `gpt-4o-mini`.
- The default Gemini model is configurable with `GEMINI_MODEL`; it defaults to `gemini-2.5-flash`.
