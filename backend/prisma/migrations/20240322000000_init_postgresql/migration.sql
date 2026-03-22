-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'meetup',
    "max_participants" INTEGER NOT NULL DEFAULT 50,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "organizer_id" TEXT NOT NULL,
    "organizer_name" TEXT NOT NULL DEFAULT '',
    "image_url" TEXT,
    "creator_type" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_participants" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "system_prompt" TEXT NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "is_third_party" BOOLEAN NOT NULL DEFAULT false,
    "source_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_base" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AgentSkills" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_EventTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE INDEX "events_category_idx" ON "events"("category");

-- CreateIndex
CREATE INDEX "events_date_idx" ON "events"("date");

-- CreateIndex
CREATE UNIQUE INDEX "tags_normalized_key" ON "tags"("normalized");

-- CreateIndex
CREATE INDEX "event_participants_user_id_idx" ON "event_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_participants_event_id_user_id_key" ON "event_participants"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_AgentSkills_AB_unique" ON "_AgentSkills"("A", "B");

-- CreateIndex
CREATE INDEX "_AgentSkills_B_index" ON "_AgentSkills"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EventTags_AB_unique" ON "_EventTags"("A", "B");

-- CreateIndex
CREATE INDEX "_EventTags_B_index" ON "_EventTags"("B");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentSkills" ADD CONSTRAINT "_AgentSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgentSkills" ADD CONSTRAINT "_AgentSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
