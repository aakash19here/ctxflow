# Build stage
FROM oven/bun:1-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock turbo.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/ ./packages/

# Install dependencies
RUN bun install

# Copy source code
COPY apps/server/ ./apps/server/

# Production stage
FROM oven/bun:1-slim

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server ./apps/server
COPY --from=builder /app/packages ./packages

# Set environment variables (PORT provided by Render at runtime)
ENV NODE_ENV=production \
    BUN_ENV=production \
    LOG_LEVEL=info

# Expose port
EXPOSE 3000
# Start API
WORKDIR /app/apps/server
CMD ["bun", "run", "src/index.ts"]