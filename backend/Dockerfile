# Stage 1: Dependency builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
# Install only production dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Stage 2: Hardened, minimal production runtime
FROM node:20-alpine

# Security: Set working directory and non-root ownership
WORKDIR /app

# Install dumb-init for proper signal handling (PID 1 zombie reaper)
RUN apk add --no-cache dumb-init

# Copy node_modules from builder stage
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node . .

# Security: Run as non-privileged user 'node' (UID 1000) instead of root (UID 0)
USER node

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Use dumb-init to handle process signals gracefully
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
