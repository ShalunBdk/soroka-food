FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache openssl

# Configure npm for better reliability
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Configure Prisma mirrors for reliable installation
ENV PRISMA_ENGINES_MIRROR=https://github.com/prisma/prisma-engines/releases
ENV PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with retry logic
RUN npm ci || npm ci || npm ci

# Generate Prisma Client after installation
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl

# Configure npm for better reliability
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true

# Configure Prisma mirrors for reliable installation
ENV PRISMA_ENGINES_MIRROR=https://github.com/prisma/prisma-engines/releases
ENV PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies with retry logic
RUN npm ci --only=production || npm ci --only=production || npm ci --only=production

# Generate Prisma Client in production stage
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Create directory for uploads
RUN mkdir -p public/uploads

EXPOSE 3000

# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]