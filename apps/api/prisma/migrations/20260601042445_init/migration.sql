-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topology" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "nodesJson" JSONB NOT NULL,
    "edgesJson" JSONB NOT NULL,
    "thumbnail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Topology_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "nodesJson" JSONB NOT NULL,
    "edgesJson" JSONB NOT NULL,
    "chaosScript" JSONB NOT NULL,
    "walkthroughScript" JSONB NOT NULL,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topologyId" TEXT,
    "scenarioId" TEXT,
    "durationSecs" INTEGER NOT NULL DEFAULT 0,
    "chaosEvents" JSONB NOT NULL,
    "maxErrorRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nodesKilled" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Topology" ADD CONSTRAINT "Topology_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimSession" ADD CONSTRAINT "SimSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimSession" ADD CONSTRAINT "SimSession_topologyId_fkey" FOREIGN KEY ("topologyId") REFERENCES "Topology"("id") ON DELETE SET NULL ON UPDATE CASCADE;
