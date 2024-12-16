FROM node:16

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json tsconfig.json ./

RUN npm install

# Copy source files and build
COPY . .

# Run the application
CMD ["npm", "start"]