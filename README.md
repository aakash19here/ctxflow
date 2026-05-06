![ctxflow header](./media/ctxflow.webp)

# CtxFlow

CtxFlow is a context manager for RAG applications. It gives teams one place to
collect knowledge sources, index them into a vector store, and expose that
context through multiple assistant surfaces: a dashboard, embeddable chat
widget, full chat app, API server, and WhatsApp bot.

The project is built as a Bun/Turborepo monorepo with Next.js apps, a Hono API,
tRPC routers, Drizzle/PostgreSQL persistence, Redis-backed rate limiting and
WhatsApp session state, and Upstash Vector for retrieval.

## What Is Included

- **Context/source manager**: add, list, and delete knowledge sources from the
  dashboard.
- **Website ingestion**: scrape website content with Firecrawl, split it into
  chunks, and upsert it into the vector index.
- **Document ingestion**: upload PDF, DOC, and DOCX files, parse them, chunk
  them, and store their embeddings/searchable content.
- **RAG middleware**: rewrites user questions into standalone retrieval queries,
  finds relevant chunks, and injects them into model context.
- **Chat widget**: a Next.js chat UI designed to run inside an iframe.
- **Embeddable script**: a Vite-built `widget.js` that can mount the chat as a
  floating bubble or inline section on another site.
- **Chat app**: authenticated AI chat with streaming responses, saved chat
  history, attachments, RAG search, and optional web search tool output.
- **WhatsApp bot**: webhook verification, email OTP auth, Redis chat history,
  `/clear` support, RAG/web-search enabled replies, and unsupported message type
  handling.
- **Admin dashboard**: source management, user chat review, WhatsApp
  conversation review, basic analytics, and country breakdown cards.
- **Shared UI system**: shadcn/Radix-based components plus AI chat primitives.
- **Auth and email**: Better Auth integration with React Email/Resend templates.
- **Observability hooks**: Sentry, PostHog, Databuddy, structured logging, and
  rate limiting support are wired into the app packages.

## Apps

| App | Path | Purpose |
| --- | --- | --- |
| `web` | `apps/web` | Admin dashboard for sources, analytics, chat review, and widget embed code. Runs on port `3001`. |
| `widget` | `apps/widget` | User-facing chat application with streaming AI responses, chat persistence, uploads, RAG middleware, and web search. Runs on port `3002`. |
| `server` | `apps/server` | Hono API server for auth, tRPC, uploads, health checks, and WhatsApp webhooks. Runs on port `3000`. |
| `embed` | `apps/embed` | Vite package that builds the embeddable widget script for external sites. |

## Packages

| Package | Path | Purpose |
| --- | --- | --- |
| `@repo/auth` | `packages/auth` | Better Auth setup, auth client exports, and email-based auth helpers. |
| `@repo/db` | `packages/db` | Drizzle schema, PostgreSQL client, and database migration scripts. |
| `@repo/rpc` | `packages/rpc` | tRPC routers for source management and analytics. Also owns Firecrawl, document parsing, and vector-store helpers. |
| `@repo/ui` | `packages/ui` | Shared UI components, Tailwind globals, hooks, and AI chat UI primitives. |
| `@repo/email` | `packages/email` | React Email templates for magic links and OTP email. |
| `@repo/ratelimit` | `packages/ratelimit` | Upstash Redis and rate limiter utilities. |
| `@repo/typescript-config` | `packages/typescript-config` | Shared TypeScript configs for apps and libraries. |

## Core Stack

- **Runtime and workspace**: Bun, Turborepo, TypeScript
- **Web apps**: Next.js 15, React 19, Tailwind CSS, shadcn/ui, Radix UI
- **API**: Hono, tRPC, Zod
- **AI**: Vercel AI SDK, OpenAI, Groq, Anthropic, Voyage AI
- **RAG**: Firecrawl, LangChain text splitters/loaders, Upstash Vector
- **Storage**: PostgreSQL, Drizzle ORM, Redis, Vercel Blob
- **Auth/email**: Better Auth, Resend, React Email
- **Analytics/observability**: PostHog, Databuddy, Sentry, Pino

## Project Structure

```txt
ctxflow/
├── apps/
│   ├── web/       # Admin dashboard and widget embed-code screen
│   ├── widget/    # Chat app that can run standalone or in an iframe
│   ├── server/    # Hono API, tRPC server, uploads, WhatsApp bot
│   └── embed/     # External widget loader script
├── packages/
│   ├── auth/      # Better Auth and email auth helpers
│   ├── db/        # Drizzle schema, client, and migrations
│   ├── email/     # React Email templates
│   ├── ratelimit/ # Redis and rate limiting
│   ├── rpc/       # tRPC routers, ingestion, vector-store helpers
│   ├── ui/        # Shared design system and AI components
│   └── typescript-config/
├── docker-compose.yml
├── package.json
└── turbo.json
```

## Getting Started

Install dependencies:

```bash
bun install
```

Start local infrastructure:

```bash
docker compose up -d
```

Create environment files from the examples:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

At minimum, configure PostgreSQL, Better Auth, model provider keys, Redis,
Upstash Vector, and any integrations you plan to use. The local Docker setup
starts PostgreSQL on `5432`, Redis on `6379`, a serverless Redis HTTP bridge on
`8079`, and RedisInsight on `5540`.

Push or run database migrations:

```bash
bun run db:push
```

Run the monorepo in development:

```bash
bun run dev
```

Default local URLs:

- Web dashboard: `http://localhost:3001`
- Widget chat app: `http://localhost:3002`
- API server: `http://localhost:3000`

## Available Scripts

- `bun run dev`: start all apps through Turborepo
- `bun run build`: build all apps/packages
- `bun run check-types`: run TypeScript checks across the workspace
- `bun run dev:web`: start only the dashboard app
- `bun run dev:widget`: start only the widget/chat app
- `bun run dev:server`: start only the Hono API server
- `bun run db:push`: push the Drizzle schema to the database
- `bun run db:generate`: generate Drizzle migrations
- `bun run db:migrate`: generate and run Drizzle migrations
- `bun run db:studio`: open Drizzle Studio

## Embedding The Chat Widget

The dashboard's Code page shows the embed snippet. The current embed loader
supports a floating bubble by default:

```html
<script type="module" src="https://your-widget-host/widget.js" async></script>
```

It can also be configured as an inline section by setting script attributes used
by `apps/embed/src/embed.ts`, such as `data-type="section"`,
`data-target="#chat"`, and `data-height="600px"`.

## Notes

- The README intentionally describes the current codebase. Some integrations
  require environment variables that are not fully listed in the checked-in
  `.env.example` files yet.
- Document ingestion currently supports PDF, DOC, and DOCX from the dashboard.
  The RPC layer rejects duplicate file names, OCR-only PDFs, and PDFs over 20
  pages.
- WhatsApp chat history and OTP state are stored in Redis. Web chat history,
  users, messages, sessions, and sources are stored in PostgreSQL.
