# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy only package files first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# ✅ Ensure .env is copied (you may also copy prisma separately if needed)
# If you want to be explicit:
COPY prisma ./prisma
COPY .env ./
COPY .env.local ./

# ✅ Generate Prisma Client
# RUN npx prisma generate

# ❗️❌ Remove `migrate dev` and `db seed` from the Dockerfile for production
# These should be handled **outside** the Dockerfile (or in `docker-entrypoint.sh`)
# because:
#  - `migrate dev` is for development only
#  - `db seed` can cause issues if the database isn't available at build time

# ✅ Use `migrate deploy` for production **during container startup**
# If you must run them here (not recommended), ensure DB is accessible during build
# RUN npx prisma migrate deploy
# RUN npx prisma db seed

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the Next.js application
CMD ["npm", "start"]
