FROM node:18-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source
COPY . .

EXPOSE 3001

# Default start — docker-compose overrides this with setup + start
CMD ["node", "server.js"]
