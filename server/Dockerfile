FROM node:20-alpine

WORKDIR /app

# Copy package files from root
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm ci --only=development

# Copy TypeScript config
COPY tsconfig.json ./

# Copy server source code
COPY server ./server

# Build TypeScript
RUN npm run build:server

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
