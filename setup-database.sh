#!/bin/bash

echo "🚀 Setting up Construction Management Database..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Create and apply migration
echo "🔄 Creating database migration..."
npx prisma migrate dev --name init

echo "✅ Database setup completed successfully!"
echo ""
echo "🔑 You can now login with these demo accounts:"
echo "┌─────────────────┬─────────────────────────┬──────────────┐"
echo "│ Role            │ Email                   │ Password     │"
echo "├─────────────────┼─────────────────────────┼──────────────┤"
echo "│ Admin           │ admin@example.com       │ password123  │"
echo "│ Project Manager │ pm@example.com          │ password123  │"
echo "│ Store Manager   │ store@example.com       │ password123  │"
echo "│ Employee        │ john@example.com        │ password123  │"
echo "│ Employee        │ michael@example.com     │ password123  │"
echo "└─────────────────┴─────────────────────────┴──────────────┘"
echo ""
echo "🚀 Start the development server with: npm run dev"
