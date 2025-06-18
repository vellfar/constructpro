#!/bin/bash
# Database setup script for ConstructPro

echo "🚀 Setting up ConstructPro database..."

# Step 1: Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Step 2: Create and apply migrations
echo "🔄 Creating and applying database migrations..."
npx prisma migrate dev --name init

# Step 3: Seed the database
echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Database setup complete!"
echo ""
echo "🔑 Demo Accounts:"
echo "Admin: admin@example.com / password123"
echo "Project Manager: pm@example.com / password123"
echo "Employee: john@example.com / password123"
echo "Employee: michael@example.com / password123"
