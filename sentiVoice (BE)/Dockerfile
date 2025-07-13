# Use Node.js 18 as base image
FROM node:18-slim

# Install Python and pip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy Python requirements and install Python dependencies
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/attachments uploads/profile-pictures

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"] 