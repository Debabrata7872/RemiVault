FROM php:8.2-cli-alpine

# Install system dependencies and required PHP extensions
RUN apk add --no-cache \
    git \
    curl \
    bash \
    ca-certificates \
    libpng-dev \
    libxml2-dev \
    libzip-dev \
    oniguruma-dev \
    mysql-client \
    && update-ca-certificates \
    && docker-php-ext-install pdo_mysql mbstring pcntl bcmath zip

# Copy Composer from official image
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy application files
COPY . /app

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Ensure permissions for Laravel storage and bootstrap cache
RUN chmod -R 777 storage bootstrap/cache

# Render injects $PORT environment variable dynamically
ENV PORT=8000
EXPOSE 8000

# Run migrations if DB is reachable, clear config cache, and start Laravel server
CMD (php artisan migrate --force || true) && php artisan config:clear && php artisan serve --host=0.0.0.0 --port=${PORT}
