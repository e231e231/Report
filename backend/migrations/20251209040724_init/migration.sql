-- CreateTable
CREATE TABLE "employee" (
    "id" VARCHAR(20) NOT NULL,
    "user_name" VARCHAR(20) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "employee_name" VARCHAR(20) NOT NULL,
    "role" INTEGER NOT NULL,
    "color" VARCHAR(7),
    "is_deleted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_role" (
    "role_number" INTEGER NOT NULL,
    "role_name" VARCHAR(50),

    CONSTRAINT "employee_role_pkey" PRIMARY KEY ("role_number")
);

-- CreateTable
CREATE TABLE "daily_report" (
    "id" VARCHAR(20) NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calendar" TIMESTAMP(3) NOT NULL,
    "content" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "edit_check" INTEGER NOT NULL DEFAULT 0,
    "week_flag" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "daily_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" VARCHAR(20) NOT NULL,
    "daily_report_id" VARCHAR(20) NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "to_reply_fbid" VARCHAR(20),
    "edit_check" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reaction" (
    "id" VARCHAR(20) NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "daily_report_id" VARCHAR(20),
    "feedback_id" VARCHAR(20),
    "emoji_id" VARCHAR(20) NOT NULL,

    CONSTRAINT "reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emoji" (
    "id" VARCHAR(20) NOT NULL,
    "emoji_content" VARCHAR(50),

    CONSTRAINT "emoji_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "information" (
    "id" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "information_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail" (
    "id" VARCHAR(20) NOT NULL,
    "employee_id" VARCHAR(20) NOT NULL,
    "employee_name" VARCHAR(20) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "state" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "mail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_user_name_idx" ON "employee"("user_name");

-- CreateIndex
CREATE INDEX "daily_report_employee_id_idx" ON "daily_report"("employee_id");

-- CreateIndex
CREATE INDEX "daily_report_calendar_idx" ON "daily_report"("calendar");

-- CreateIndex
CREATE INDEX "daily_report_year_idx" ON "daily_report"("year");

-- CreateIndex
CREATE INDEX "daily_report_calendar_employee_id_idx" ON "daily_report"("calendar", "employee_id");

-- CreateIndex
CREATE INDEX "feedback_daily_report_id_idx" ON "feedback"("daily_report_id");

-- CreateIndex
CREATE INDEX "feedback_employee_id_idx" ON "feedback"("employee_id");

-- CreateIndex
CREATE INDEX "feedback_to_reply_fbid_idx" ON "feedback"("to_reply_fbid");

-- CreateIndex
CREATE INDEX "reaction_daily_report_id_idx" ON "reaction"("daily_report_id");

-- CreateIndex
CREATE INDEX "reaction_feedback_id_idx" ON "reaction"("feedback_id");

-- CreateIndex
CREATE INDEX "reaction_employee_id_idx" ON "reaction"("employee_id");

-- CreateIndex
CREATE INDEX "reaction_daily_report_id_emoji_id_idx" ON "reaction"("daily_report_id", "emoji_id");

-- CreateIndex
CREATE INDEX "reaction_feedback_id_emoji_id_idx" ON "reaction"("feedback_id", "emoji_id");

-- CreateIndex
CREATE INDEX "mail_state_idx" ON "mail"("state");

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_role_fkey" FOREIGN KEY ("role") REFERENCES "employee_role"("role_number") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_report" ADD CONSTRAINT "daily_report_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_daily_report_id_fkey" FOREIGN KEY ("daily_report_id") REFERENCES "daily_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_to_reply_fbid_fkey" FOREIGN KEY ("to_reply_fbid") REFERENCES "feedback"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_daily_report_id_fkey" FOREIGN KEY ("daily_report_id") REFERENCES "daily_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_feedback_id_fkey" FOREIGN KEY ("feedback_id") REFERENCES "feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaction" ADD CONSTRAINT "reaction_emoji_id_fkey" FOREIGN KEY ("emoji_id") REFERENCES "emoji"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail" ADD CONSTRAINT "mail_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
