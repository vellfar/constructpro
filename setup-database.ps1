Write-Host "🚀 Setting up Construction Management Database..." -ForegroundColor Green

# Generate Prisma client
Write-Host "📦 Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate

# Create and apply migration
Write-Host "🔄 Creating database migration..." -ForegroundColor Yellow
npx prisma migrate dev --name init

Write-Host "✅ Database setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔑 You can now login with these demo accounts:" -ForegroundColor Cyan
Write-Host "┌─────────────────┬─────────────────────────┬──────────────┐"
Write-Host "│ Role            │ Email                   │ Password     │"
Write-Host "├─────────────────┼─────────────────────────┼──────────────┤"
Write-Host "│ Admin           │ admin@example.com       │ password123  │"
Write-Host "│ Project Manager │ pm@example.com          │ password123  │"
Write-Host "│ Store Manager   │ store@example.com       │ password123  │"
Write-Host "│ Employee        │ john@example.com        │ password123  │"
Write-Host "│ Employee        │ michael@example.com     │ password123  │"
Write-Host "└─────────────────┴─────────────────────────┴──────────────┘"
Write-Host ""
Write-Host "🚀 Start the development server with: npm run dev" -ForegroundColor Green
