-- Firebase Authentication: identificador del usuario de Firebase vinculado a un usuario DASI.
-- Aditiva: no elimina ni modifica datos existentes.
ALTER TABLE "Usuario" ADD COLUMN "firebase_uid" TEXT;

CREATE UNIQUE INDEX "Usuario_firebase_uid_key" ON "Usuario"("firebase_uid");
