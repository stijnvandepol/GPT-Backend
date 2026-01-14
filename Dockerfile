FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY api/package.json ./
RUN npm install --omit=dev

# Copy all application files
COPY api/ ./

EXPOSE 3000
CMD ["node", "server.cjs"]
