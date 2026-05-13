# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite build — outputs to /app/dist
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Drop in the built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Drop in our nginx config (handles SPA routing + /api proxy to backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
