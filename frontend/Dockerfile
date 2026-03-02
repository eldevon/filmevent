FROM node:20-alpine AS build

# Accept build argument
ARG REACT_APP_API_URL
# Set environment variable for the build
ENV REACT_APP_API_URL=$REACT_APP_API_URL

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use install instead of ci)
RUN npm install

# Copy source code
COPY . .

# Debug: Print the environment variable during build
RUN echo "========================================="
RUN echo "Building with REACT_APP_API_URL: $REACT_APP_API_URL"
RUN echo "========================================="

# Build the app
RUN npm run build

# Debug: Check if the variable was injected
RUN echo "Checking for localhost in built files:"
RUN grep -r "localhost:5000" /app/build/static/js/ || echo "No localhost found - GOOD!"
RUN echo "Checking for Codespaces URL in built files:"
RUN grep -r "${REACT_APP_API_URL}" /app/build/static/js/ || echo "URL not found in build"

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
