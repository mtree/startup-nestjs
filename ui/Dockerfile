# Stage 1: Build the Angular application
FROM node:20-alpine as builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application in production mode
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy the build output from stage 1
COPY --from=builder /usr/src/app/dist/yeee/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
