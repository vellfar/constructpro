# Database Connection Troubleshooting

## Common Issues and Solutions

### 1. "Cannot fetch data from service: fetch failed" Error

This error typically indicates a database connection issue. Here are the steps to resolve it:

#### Check Database Connection String
1. Verify your `DATABASE_URL` in `.env.local` is correct
2. Ensure the database server is running and accessible
3. Check if your IP address is whitelisted (for cloud databases like Neon)

#### For Neon Database:
1. Go to your Neon dashboard
2. Check if your database is active
3. Verify the connection string format:
   \`\`\`
   postgresql://username:password@hostname:port/database?sslmode=require
   \`\`\`

#### Test Database Connection
Run the health check endpoint:
\`\`\`bash
curl http://localhost:3000/api/health/database
\`\`\`

### 2. Connection Timeout Issues

If you're experiencing timeouts:

1. Check your internet connection
2. Increase timeout settings in your database configuration
3. Consider using connection pooling

### 3. SSL/TLS Issues

For secure connections:
1. Ensure `sslmode=require` is in your connection string
2. Check if your database provider requires specific SSL settings

### 4. Environment Variables

Make sure these are set in your `.env.local`:
\`\`\`
DATABASE_URL=your_database_connection_string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
\`\`\`

### 5. Database Schema Issues

If tables don't exist:
1. Run the database setup scripts:
   \`\`\`bash
   npm run db:setup
   \`\`\`
2. Or manually run:
   \`\`\`bash
   npx prisma db push
   npx prisma db seed
   \`\`\`

## Getting Help

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Check the server logs in your terminal
3. Verify your database provider's status page
4. Contact your database provider's support if needed
