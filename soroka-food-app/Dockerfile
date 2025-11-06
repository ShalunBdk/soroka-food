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
RUN npm run build

# Nginx stage for serving static files
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
