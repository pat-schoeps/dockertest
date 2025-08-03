FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port
EXPOSE 3001

# Default command
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]