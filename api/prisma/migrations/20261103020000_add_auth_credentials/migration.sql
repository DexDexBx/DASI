-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "password_hash" TEXT,
ADD COLUMN "google_sub" TEXT,
ADD COLUMN "last_login_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_google_sub_key" ON "Usuario"("google_sub");
