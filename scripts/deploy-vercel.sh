#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# Check for Vercel CLI
if ! command -v vercel &> /dev/null
then
    echo "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Build the project first to ensure everything is generated
echo "--- Step 1: Running local build verification ---"
pnpm build

# Deploy to Vercel
echo "--- Step 2: Deploying to Vercel ---"
vercel --prod
