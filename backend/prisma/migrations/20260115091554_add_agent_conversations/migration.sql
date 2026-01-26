-- CreateTable
CREATE TABLE "core"."agent_conversations" (
    "uuid" UUID NOT NULL,
    "user_uuid" UUID NOT NULL,
    "title" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_conversations_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "core"."agent_messages" (
    "uuid" UUID NOT NULL,
    "conversation_uuid" UUID NOT NULL,
    "role" VARCHAR(20) NOT NULL,
    "content" TEXT,
    "tool_calls" JSONB,
    "tool_call_id" VARCHAR(100),
    "tool_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("uuid")
);

-- CreateIndex
CREATE INDEX "agent_conversations_user_uuid_idx" ON "core"."agent_conversations"("user_uuid");

-- CreateIndex
CREATE INDEX "agent_messages_conversation_uuid_idx" ON "core"."agent_messages"("conversation_uuid");

-- AddForeignKey
ALTER TABLE "core"."agent_conversations" ADD CONSTRAINT "agent_conversations_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "configuration"."persons"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "core"."agent_messages" ADD CONSTRAINT "agent_messages_conversation_uuid_fkey" FOREIGN KEY ("conversation_uuid") REFERENCES "core"."agent_conversations"("uuid") ON DELETE CASCADE ON UPDATE CASCADE;
