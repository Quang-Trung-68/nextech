# ================================
# Stage 1: Builder
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the Vite React app
# All VITE_* vars must be declared as ARG + ENV to be embedded at build time
ARG VITE_API_URL
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_SOKETI_ENABLED=true
ARG VITE_SOKETI_APP_KEY
ARG VITE_SOKETI_HOST
ARG VITE_SOKETI_PORT
ARG VITE_SOKETI_FORCE_TLS

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_SOKETI_ENABLED=$VITE_SOKETI_ENABLED
ENV VITE_SOKETI_APP_KEY=$VITE_SOKETI_APP_KEY
ENV VITE_SOKETI_HOST=$VITE_SOKETI_HOST
ENV VITE_SOKETI_PORT=$VITE_SOKETI_PORT
ENV VITE_SOKETI_FORCE_TLS=$VITE_SOKETI_FORCE_TLS

RUN npm run build

# ================================
# Stage 2: Serve with Nginx
# ================================
FROM nginx:1.27-alpine AS runner

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config for the SPA
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf

# Copy the built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
