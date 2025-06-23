-- Add isActive column to User table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'isActive') THEN
        ALTER TABLE "User" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Update existing users to be active by default
UPDATE "User" SET "isActive" = true WHERE "isActive" IS NULL;
