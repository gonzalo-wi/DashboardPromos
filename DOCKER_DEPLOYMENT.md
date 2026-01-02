# Despliegue con Docker

## Configuración para servidor remoto 192.168.0.250:5175

### Opción 1: Usando Docker Compose (Recomendado)

#### En tu máquina local:

1. **Construir y probar localmente (opcional):**
```bash
docker-compose up --build
```
Visita http://localhost:5175 para verificar

2. **Guardar la imagen para transferir:**
```bash
docker save material-dashboard-react:latest | gzip > material-dashboard-react.tar.gz
```

#### En el servidor remoto (192.168.0.250):

1. **Transferir archivos al servidor:**
```bash
# Desde tu máquina local
scp docker-compose.yml usuario@192.168.0.250:/ruta/destino/
scp Dockerfile usuario@192.168.0.250:/ruta/destino/
scp nginx.conf usuario@192.168.0.250:/ruta/destino/
scp .dockerignore usuario@192.168.0.250:/ruta/destino/

# O transferir todo el proyecto
scp -r . usuario@192.168.0.250:/ruta/destino/
```

2. **En el servidor, construir y ejecutar:**
```bash
cd /ruta/destino
docker-compose up -d --build
```

3. **Verificar que está corriendo:**
```bash
docker-compose ps
docker-compose logs -f
```

4. **Acceder a la aplicación:**
Abre http://192.168.0.250:5175

### Opción 2: Usando Docker directamente

#### En el servidor:

1. **Construir la imagen:**
```bash
docker build -t material-dashboard-react .
```

2. **Ejecutar el contenedor:**
```bash
docker run -d \
  --name material-dashboard-react \
  -p 5175:80 \
  --restart unless-stopped \
  material-dashboard-react
```

3. **Ver logs:**
```bash
docker logs -f material-dashboard-react
```

### Comandos útiles

**Detener la aplicación:**
```bash
docker-compose down
# o
docker stop material-dashboard-react
```

**Reiniciar:**
```bash
docker-compose restart
# o
docker restart material-dashboard-react
```

**Ver logs:**
```bash
docker-compose logs -f
# o
docker logs -f material-dashboard-react
```

**Reconstruir después de cambios:**
```bash
docker-compose up -d --build
# o
docker stop material-dashboard-react
docker rm material-dashboard-react
docker rmi material-dashboard-react
docker build -t material-dashboard-react .
docker run -d --name material-dashboard-react -p 5175:80 --restart unless-stopped material-dashboard-react
```

### Notas importantes

1. **Variables de entorno:** Si tu aplicación usa variables de entorno (como configuración de Firebase), crea un archivo `.env` y modifica el `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5175:80"
    environment:
      - REACT_APP_API_KEY=tu_api_key
      - REACT_APP_AUTH_DOMAIN=tu_domain
    # O usa un archivo .env
    env_file:
      - .env
    restart: unless-stopped
```

2. **Firewall:** Asegúrate de que el puerto 5175 esté abierto en el firewall del servidor:
```bash
# En sistemas Linux con ufw
sudo ufw allow 5175/tcp
```

3. **HTTPS:** Para producción, considera usar un proxy reverso como Nginx o Traefik con certificados SSL.

4. **Actualizaciones:** Para actualizar la aplicación, haz `git pull` en el servidor y luego:
```bash
docker-compose down
docker-compose up -d --build
```
