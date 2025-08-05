# Use the official Node.js image as the base image
FROM node:lts-slim

# Set the working directory inside the container
WORKDIR /app

# Install make and python for any Python dependencies
RUN apt-get update && apt-get install -y build-essential make python3 && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files to the working directory
COPY . .

# Set the environment variable for production
ENV NODE_ENV=testing

# Start the bot
CMD ["npm", "run", "start"]
