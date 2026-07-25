#!/bin/bash
# build.sh — Build script for Render deployment
# Detects PostgreSQL DATABASE_URL and swaps Prisma schema provider accordingly

set -e

echo "Starting build..."

# If DATABASE_URL is PostgreSQL, swap the schema provider
if [[ "$DATABASE_URL" == postgresql://* ]] || [[ "$DATABASE_URL" == postgres://* ]]; then
  echo "PostgreSQL detected — swapping Prisma schema provider..."
  sed -i 's/provider = "sqlite"/provider = "postgresql"/' server/prisma/schema.prisma
fi

echo "Generating Prisma Client..."
npx prisma generate --schema server/prisma/schema.prisma

echo "Pushing database schema..."
npx prisma db push --schema server/prisma/schema.prisma --skip-generate

echo "Build complete!"
