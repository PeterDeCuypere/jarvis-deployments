FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Verify database exists in build output
RUN ls -la /app/dist/data/ || echo "WARNING: data directory not in dist"

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Verify database is present in final image
RUN ls -la /usr/share/nginx/html/data/ || echo "WARNING: data directory missing"

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
