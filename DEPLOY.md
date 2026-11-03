# Despliegue de DASI V.02 en el servidor institucional

DASI V.02 se publica en:

- Aplicación: `https://dasi.uroosevelt.edu.pe/dasi/`
- API: `https://dasi.uroosevelt.edu.pe/dasi/api/`
- Catálogo central: `https://dasi.uroosevelt.edu.pe/` (proyecto independiente)

Caddy central es el único que publica `80` y `443`. DASI no publica puertos al host. El Nginx interno de DASI atiende `/` y `/api/`; Caddy retira el prefijo `/dasi` antes de enviar la solicitud.

## 1. Requisitos del servidor

- Docker Engine y Docker Compose v2.
- Red externa `ur_apps_proxy` creada por la infraestructura central.
- Caddy central conectado a `ur_apps_proxy`.
- Dominio `dasi.uroosevelt.edu.pe` apuntando al servidor.
- Proyecto Firebase `dasi-4a687`.
- Acceso a `https://dasi.uroosevelt.edu.pe` y al repositorio Git.

No se debe instalar ni publicar PostgreSQL fuera de Docker.

## 2. Estructura de directorios

```text
/opt/dasi/
├── docker-compose.yml
├── .env
├── Dockerfile
├── nginx.conf
├── DEPLOY.md
├── deploy/Caddyfile.example
├── api/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh
│   └── prisma/
│       ├── datos-despliegue.json
│       └── importar-despliegue.mjs
└── src/
```

## 3. Clonación del repositorio

```bash
sudo mkdir -p /opt/dasi
sudo chown "$USER":"$USER" /opt/dasi
git clone -b v02 <URL_DEL_REPOSITORIO> /opt/dasi
cd /opt/dasi
```

Si el repositorio ya existe:

```bash
cd /opt/dasi
git fetch origin
git switch v02
git pull --ff-only
```

## 4. Preparación del archivo .env

```bash
cp .env.example .env
nano .env
```

Valores mínimos:

```env
POSTGRES_DB=dasi
POSTGRES_USER=dasi
POSTGRES_PASSWORD=UnaClaveLargaYUnica
DATABASE_URL=postgresql://dasi:UnaClaveLargaYUnica@db:5432/dasi?schema=public
FIREBASE_PROJECT_ID=dasi-4a687
CORS_ORIGIN=https://dasi.uroosevelt.edu.pe
IMPORTAR_DATOS=true
```

`POSTGRES_PASSWORD`, `POSTGRES_USER` y `POSTGRES_DB` deben coincidir con `DATABASE_URL`. Si la contraseña contiene caracteres reservados de URL (`@`, `:`, `/`, `?`), codifícala o usa una contraseña alfanumérica.

Nunca subir `.env` a Git. Ya está en `.gitignore`.

## 5. Creación de la red externa

La red se crea una sola vez en el servidor:

```bash
docker network inspect ur_apps_proxy >/dev/null 2>&1 || docker network create ur_apps_proxy
```

Comprobar:

```bash
docker network inspect ur_apps_proxy --format '{{.Name}}'
```

El contenedor de Caddy central también debe estar conectado a esa red. DASI solo conecta el servicio `web` a `ur_apps_proxy`; `api` y `db` quedan en la red interna del proyecto.

## 6. Construcción de imágenes

```bash
cd /opt/dasi
docker compose build --no-cache
```

Servicios:

- `web`: Angular compilado con `baseHref=/dasi/`, servido por Nginx.
- `api`: NestJS en el puerto interno `3000`.
- `db`: PostgreSQL con volumen persistente.

## 7. Inicio de contenedores

```bash
docker compose up -d
docker compose ps
```

No se publica `80`, `443`, `3000` ni `5432`. Caddy alcanza `dasi-web:80` mediante `ur_apps_proxy`.

Al iniciar la API, el entrypoint:

1. Ejecuta `npx prisma migrate deploy`.
2. Importa datos si `IMPORTAR_DATOS=true`.
3. Inicia NestJS.

## 8. Ejecución de migraciones

Se ejecutan automáticamente. Para ejecutarlas manualmente:

```bash
docker compose exec api npx prisma migrate deploy
```

Nunca usar en producción:

```text
prisma migrate reset
prisma db push
```

## 9. Importación inicial

El archivo de datos es:

```text
api/prisma/datos-despliegue.json
```

Contiene oficinas, roles, permisos, módulos, cargos y usuarios actuales. No contiene contraseñas, `firebase_uid` ni fotos. Es idempotente y no elimina registros.

La primera importación ocurre automáticamente con `IMPORTAR_DATOS=true`. Al terminar, cambiar en `.env`:

```env
IMPORTAR_DATOS=false
```

Aplicar:

```bash
docker compose up -d
```

Importación manual:

```bash
docker compose exec api node prisma/importar-despliegue.mjs
```

Si se modifica el JSON, reconstruir la API antes de importar:

```bash
docker compose build api
docker compose up -d api
docker compose exec api node prisma/importar-despliegue.mjs
```

## 10. Configuración del proxy Caddy

Caddy central es independiente. Integrar este bloque en su configuración:

```caddyfile
dasi.uroosevelt.edu.pe {
	encode zstd gzip

	redir /dasi /dasi/ 308

	handle_path /dasi/* {
		reverse_proxy dasi-web:80
	}

	# Catálogo central; ajustar al contenedor real del catálogo.
	handle {
		reverse_proxy catalogo:80
	}
}
```

Referencia incluida en `deploy/Caddyfile.example`.

Puntos importantes:

- `handle_path /dasi/*` retira `/dasi` antes de enviar a DASI.
- DASI recibe `/` para Angular y `/api/...` para NestJS.
- El servicio `web` tiene el alias de red `dasi-web`.
- Caddy central publica `80` y `443`; DASI no.
- No configurar HTTPS dentro del Nginx de DASI.

Validar y recargar Caddy según su instalación:

```bash
caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## 11. Configuración de Firebase

En Firebase Console, proyecto `dasi-4a687`:

1. Activar `Authentication > Sign-in method > Google`.
2. Agregar `dasi.uroosevelt.edu.pe` en `Authentication > Settings > Authorized domains`.
3. Mantener `FIREBASE_PROJECT_ID=dasi-4a687` en `.env`.
4. No colocar claves privadas en Angular. La `apiKey` web es pública.

Los usuarios se vinculan a Google en su primer inicio de sesión por correo.

## 12. Comprobación de salud

Desde el servidor:

```bash
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 web
docker compose exec web wget -qO- http://localhost/api/health
```

Desde fuera:

```bash
curl -i https://dasi.uroosevelt.edu.pe/dasi/api/health
```

Respuesta esperada:

```json
{"status":"ok","service":"DASI API"}
```

Comprobar frontend:

```bash
curl -I https://dasi.uroosevelt.edu.pe/dasi/
```

## 13. Respaldo de PostgreSQL

Antes de cada actualización:

```bash
mkdir -p /opt/dasi/backups
docker compose exec -T db pg_dump -U dasi -d dasi > /opt/dasi/backups/dasi_$(date +%Y%m%d_%H%M).sql
```

Los respaldos no se suben a Git.

## 14. Actualización de versión

```bash
cd /opt/dasi
docker compose exec -T db pg_dump -U dasi -d dasi > /opt/dasi/backups/dasi_$(date +%Y%m%d_%H%M).sql
git fetch origin
git switch v02
git pull --ff-only
docker compose build
docker compose up -d
docker compose logs --tail=100 api
```

Las migraciones se aplican solas al iniciar la API.

## 15. Recuperación ante errores

1. Revisar contenedores:
   ```bash
   docker compose ps
   ```
2. Revisar logs:
   ```bash
   docker compose logs --tail=200 api
   docker compose logs --tail=200 web
   ```
3. Revisar salud interna:
   ```bash
   docker compose exec web wget -qO- http://localhost/api/health
   ```
4. Revisar base:
   ```bash
   docker compose exec db psql -U dasi -d dasi -c "select count(*) from \"Dependencia\";"
   ```
5. Revisar red del proxy:
   ```bash
   docker network inspect ur_apps_proxy
   ```
6. Revisar que Caddy resuelva `dasi-web`:
   ```bash
   docker compose exec web hostname
   ```
7. Si se perdió el volumen, restaurar el respaldo con `psql` antes de iniciar la API.
8. No usar comandos destructivos ni `git reset --hard`.

## Seguridad

- No subir `.env`, respaldos, `node_modules`, `dist` ni credenciales.
- No publicar PostgreSQL.
- No publicar NestJS.
- No publicar `80`/`443` desde DASI; solo Caddy central.
- Mantener `ur_apps_proxy` como red externa.
- Revisar usuarios de prueba como `admin@dasi.com` antes de producción.
