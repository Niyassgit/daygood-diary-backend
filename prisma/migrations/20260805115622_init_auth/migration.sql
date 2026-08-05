/*
  Warnings:

  - The values [INACTIVE] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CUSTOMER');

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('PENDING_VERIFICATION', 'ACTIVE', 'BLOCKED');
ALTER TABLE "public"."User" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "public"."UserStatus_old";
ALTER TABLE "User" ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
COMMIT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT NOT NULL,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';
