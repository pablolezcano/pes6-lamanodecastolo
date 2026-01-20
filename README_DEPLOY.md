# Despliegue en EC2 (resumen)

Pasos rápidos (resumen):

- Asegúrate de que en Cloudflare los registros A para `lamanodecastolo.com` y `admin.lamanodecastolo.com` apuntan a `34.234.161.91` y que el proxy (nube naranja) está DESACTIVADO (grey cloud) para la validación HTTP ACME.
- Security Group: abre puertos 80 y 443 (0.0.0.0/0). Restringe SSH (22) a tu IP si es posible.
- Copia `.env.prod.example` a `.env` y rellena valores.
- En la instancia EC2: clona el repo en `/opt/app` (o usa `GIT_REPO` con `scripts/provision_ec2.sh`).
- Ejecuta `sudo GIT_REPO=git@github.com:usuario/repo.git APP_DIR=/opt/app bash scripts/provision_ec2.sh`.
- Verifica certificados y acceso HTTPS:

```bash
curl -I https://lamanodecastolo.com
docker compose -f docker-compose.prod.yml logs -f traefik
```

Configurar GitHub Actions:
- Añadir secretos en el repo: `SSH_PRIVATE_KEY`, `DEPLOY_HOST` (34.234.161.91), `DEPLOY_USER` (ej. ubuntu), `DEPLOY_PORT` (22), `REMOTE_APP_DIR` (/opt/app).
- El workflow `.github/workflows/deploy.yml` ya ejecutará `git reset` y `docker compose up -d --build` en `main`.

Notas de seguridad:
- No dejes la nube de Cloudflare en naranja mientras uses HTTP challenge (desactívala) o Traefik no podrá obtener el certificado.
- No expongas `mysql` (3306) públicamente; el `docker-compose.prod.yml` lo deja sólo en la red interna por defecto.
- El panel de Traefik está ligado a `127.0.0.1:8080` en el host; no público.
