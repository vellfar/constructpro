# Database setup script for ConstructPro (PowerShell)

Write-Host "🚀 Setting up ConstructPro database..." -ForegroundColor Green

# Step 1: Generate Prisma Client
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Step 2: Create and apply migrations
Write-Host "🔄 Creating and applying database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init

# Step 3: Seed the database
Write-Host "🌱 Seeding database with initial data..." -ForegroundColor Yellow
npx prisma db seed

Write-Host "✅ Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 Demo Accounts:" -ForegroundColor Cyan
Write-Host "Admin: admin@example.com / password123"
Write-Host "Project Manager: pm@example.com / password123"
Write-Host "Employee: john@example.com / password123"
Write-Host "Employee: michael@example.com / password123"
