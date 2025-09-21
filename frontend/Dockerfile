# Stage 1: Build
FROM node:20-alpine AS builder

# Create non-root user with UID in 10000–20000 range
RUN addgroup -g 15000 appgroup && \
    adduser -u 15000 -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Switch to non-root user
USER appuser

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY --chown=appuser:appgroup . .

# Build the project
RUN npm run build-ignore-ts-errors

# Stage 2: Production image
FROM nginx:alpine

# Create non-root user with UID in 10000–20000 range
RUN addgroup -g 15000 appgroup && \
    adduser -u 15000 -S appuser -G appgroup

# Remove default Nginx content
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set ownership to non-root user
RUN chown -R appuser:appgroup /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
