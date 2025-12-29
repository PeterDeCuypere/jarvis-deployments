# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install dependencies with npm cache optimization
RUN npm ci --prefer-offline --no-audit --no-fund

# Copy source files
COPY . .

# Build the application with increased memory for large bundles
RUN NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Production stage - use smaller nginx image
FROM nginx:stable-alpine-slim

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
