#!/bin/sh
set -e

echo "DASI API: aplicando migraciones..."
npx prisma migrate deploy

if [ "${IMPORTAR_DATOS:-false}" = "true" ]; then
  echo "DASI API: importando datos institucionales..."
  node prisma/importar-despliegue.mjs
fi

echo "DASI API: iniciando servidor..."
exec node dist/main.js
