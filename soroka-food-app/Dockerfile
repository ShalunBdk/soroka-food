FROM node:20-alpine AS builder

WORKDIR /app

# Configure npm for better reliability
ENV npm_config_fetch_retries=5
ENV npm_config_fetch_retry_mintimeout=20000
ENV npm_config_fetch_retry_maxtimeout=120000

COPY package*.json ./

# Install dependencies with retry logic
RUN npm ci || npm ci || npm ci

COPY . .

# Build arguments for Vite environment variables
# These are available ONLY during build, not at runtime
ARG VITE_API_URL=/api
ARG VITE_APP_ENV=production

# Set as environment variables for Vite build process
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

# Build with environment variables embedded
RUN npm run build

# Nginx stage for serving static files
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
