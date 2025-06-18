# ConstructPro - Construction Project Management System

## Authentication with NextAuth.js

This project uses [NextAuth.js](https://next-auth.js.org/) for authentication and user management.

### Setup Instructions

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your environment variables in `.env.local`:
   \`\`\`
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random
   DATABASE_URL="postgresql://username:password@localhost:5432/constructpro?schema=public"
   \`\`\`

3. Set up the database:
   \`\`\`bash
   npx prisma migrate dev --name init
   npx prisma generate
   node scripts/seed.js
   \`\`\`

### Authentication Features

- **Credentials-based authentication**: Users can sign in with email and password
- **Role-based access control**: Support for Admin, Project Manager, and Employee roles
- **Secure password hashing**: Uses bcryptjs for password security
- **Session management**: JWT-based sessions with NextAuth.js
- **Protected routes**: Server-side and client-side route protection

### Available Routes

- `/auth/login` - Sign in page
- `/auth/register` - Sign up page
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset form
- `/profile` - User profile management
- `/unauthorized` - Access denied page

### User Roles

- **Admin**: Full access to all features including user management
- **Project Manager**: Access to project management features and fuel approval
- **Employee**: Limited access to basic features and fuel requests

### Default Users (from seed data)

After running the seed script, you can log in with:

- **Admin**: admin@example.com / password123
- **Project Manager**: pm@example.com / password123  
- **Employee**: john@example.com / password123

### Authentication Flow

1. Users register at `/auth/register` or sign in at `/auth/login`
2. Passwords are hashed using bcryptjs before storage
3. JWT tokens are used for session management
4. Protected routes check authentication status
5. Role-based access control restricts certain features

## Database Setup with Prisma

This project uses [Prisma](https://www.prisma.io/) as an ORM to interact with the database.

### Local Development Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up your database connection in `.env.local`:
   \`\`\`
   DATABASE_URL="postgresql://username:password@localhost:5432/constructpro?schema=public"
   \`\`\`

3. Create and apply migrations:
   \`\`\`bash
   npx prisma migrate dev --name init
   \`\`\`

4. Seed the database with initial data:
   \`\`\`bash
   npx prisma db seed
   \`\`\`
   
   Alternatively, you can run the seed script directly:
   \`\`\`bash
   node scripts/seed.js
   \`\`\`

5. Generate Prisma Client:
   \`\`\`bash
   npx prisma generate
   \`\`\`

### Database Deployment Options

#### Option 1: Vercel Postgres

1. Create a Postgres database in your Vercel project
2. Vercel will automatically add the `DATABASE_URL` to your environment variables
3. Run migrations during the build process by adding this to your `package.json`:
   \`\`\`json
   "scripts": {
     "postinstall": "prisma generate",
     "vercel-build": "prisma migrate deploy && next build"
   }
   \`\`\`

#### Option 2: Supabase

1. Create a Supabase project
2. Get your connection string from Supabase dashboard
3. Add it to your `.env` file:
   \`\`\`
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   \`\`\`

#### Option 3: Railway

1. Create a PostgreSQL database on Railway
2. Railway will provide a connection string
3. Add it to your environment variables

#### Option 4: Neon

1. Create a Neon PostgreSQL database
2. Get your connection string from the Neon dashboard
3. Add it to your environment variables:
   \`\`\`
   DATABASE_URL="postgres://[USER]:[PASSWORD]@[ENDPOINT]/[DB_NAME]?sslmode=require"
   \`\`\`

### Running Migrations in Production

Before deploying to production, make sure to run:

\`\`\`bash
npx prisma migrate deploy
\`\`\`

This command applies all pending migrations to your production database without prompting for confirmation.

### Accessing the Database from the Frontend

#### Server Components

In Next.js server components, you can directly import and use the Prisma client:

\`\`\`tsx
// app/projects/page.tsx
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      client: true,
    },
  })

  return (
    <div>
      <h1>Projects</h1>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  )
}
\`\`\`

#### API Routes

For API routes, create a singleton instance of PrismaClient:

\`\`\`tsx
// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
\`\`\`

Then use it in your API routes:

\`\`\`tsx
// app/api/projects/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const projects = await prisma.project.findMany()
    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const project = await prisma.project.create({
      data: body,
    })
    return NextResponse.json(project, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 })
  }
}
\`\`\`

#### Server Actions

For server actions in Next.js, you can use Prisma directly:

\`\`\`tsx
// app/actions/project-actions.ts
"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"

export async function createProject(formData: FormData) {
  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const location = formData.get("location") as string
  const budget = parseFloat(formData.get("budget") as string)
  const clientId = parseInt(formData.get("clientId") as string)

  try {
    await prisma.project.create({
      data: {
        name,
        description,
        location,
        budget,
        clientId,
        startDate: new Date(),
        status: "PLANNING",
        projectCode: `PRJ-${Date.now()}`,
      },
    })
    
    revalidatePath("/projects")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to create project" }
  }
}
\`\`\`

#### Client Components

For client components, you should never access Prisma directly. Instead, use API routes or server actions:

\`\`\`tsx
// components/create-project-form.tsx
"use client"

import { useState } from "react"
import { createProject } from "@/app/actions/project-actions"

export function CreateProjectForm() {
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsPending(true)
    
    const formData = new FormData(event.currentTarget)
    const result = await createProject(formData)
    
    setIsPending(false)
    
    if (result.success) {
      // Handle success
    } else {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create Project"}
      </button>
    </form>
  )
}
\`\`\`

### Best Practices

1. **Use a singleton pattern** for PrismaClient to prevent too many connections
2. **Never expose Prisma directly to the client** - always use server components, API routes, or server actions
3. **Handle errors properly** and provide meaningful error messages
4. **Use transactions** for operations that require multiple database changes
5. **Optimize queries** by selecting only the fields you need
6. **Use connection pooling** in production for better performance
7. **Set up proper indexes** on frequently queried fields

### Database Schema Management

The database schema is defined in `prisma/schema.prisma`. When you need to make changes:

1. Update the schema file
2. Run `npx prisma migrate dev --name your_migration_name`
3. Prisma will generate SQL migration files in `prisma/migrations`
4. Commit these files to version control

### Troubleshooting

If you encounter issues with Prisma:

1. **Database connection errors**: Check your DATABASE_URL and ensure your database is running
2. **Migration conflicts**: Run `npx prisma migrate reset` (caution: this will delete all data)
3. **Prisma Client not generating**: Run `npx prisma generate` manually
4. **Type errors**: Make sure your Prisma schema and TypeScript types are in sync

For more information, refer to the [Prisma documentation](https://www.prisma.io/docs/).
