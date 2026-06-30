-- AlterTable
ALTER TABLE "CricketMatch" ADD COLUMN     "wicketKeeperId" TEXT;

-- AlterTable
ALTER TABLE "HostedGame" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Innings" ADD COLUMN     "isFollowOn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSuperOver" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MatchBall" ADD COLUMN     "isDeadBall" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isOverthrow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "obstructionMode" TEXT,
ADD COLUMN     "overthrowRuns" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OwnerProfile" ADD COLUMN     "promotionalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "playingRole" TEXT NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "TournamentTeam" ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "withdrawnAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "battingStyle" TEXT,
ADD COLUMN     "bowlingStyle" TEXT;

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "promotionalBalance" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DynamicQRCode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "fallbackUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicQRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuickLink" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "targetUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuickLink_pkey" PRIMARY KEY ("id")
);
