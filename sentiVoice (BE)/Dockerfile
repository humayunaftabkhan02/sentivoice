# Use official Node.js LTS image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Expose the port (default: 3000)
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV=production

# Start the server
CMD ["node", "index.js"] 