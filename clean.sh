#!/usr/bin/env bash

# Exit immediately on error
set -e

echo "🧹 Cleaning build artifacts and dependencies..."

# Remove root level folders if they exist
rm -rf node_modules .turbo .next

# Find and remove node_modules, .next and .turbo in all subdirectories (packages/apps)
find . -type d -name "node_modules" -prune -exec rm -rf '{}' +
find . -type d -name ".next" -prune -exec rm -rf '{}' +
find . -type d -name ".turbo" -prune -exec rm -rf '{}' +

echo "✅ Cleanup complete."
