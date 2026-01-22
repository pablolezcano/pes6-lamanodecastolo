## En desarrollo. 22/1/2026

# Servidor PES6/WE2007

Este repositorio contiene un servidor independiente para Pro Evolution Soccer 6 y Winning Eleven 2007, basado en Fiveserver.

## 📋 Prerrequisitos

- Docker instalado
- Puertos disponibles: 3306 (MySQL), 8190 (HTTP), 8191 (HTTPS), 10881 (PES6)

## 🚀 Despliegue

### 1. Base de datos MySQL

**Construir la imagen de la base de datos:**
```bash
cd sql
docker build -t pes6-db .
```

**Desplegar el contenedor de la base de datos:**
```bash
docker run -dp 3306:3306 --net=host --name=pes6-mysql pes6-db
```

### 2. Servidor PES6

**Construir la imagen del servidor:**
```bash
docker build -f Dockerfile -t fiveserver .
```

**Desplegar el contenedor del servidor:**
```bash
docker run -d --net=host --name=sixserver --restart=always fiveserver
```

## 🔧 Gestión del Servidor

### Comandos útiles

**Ver logs en tiempo real:**
```bash
# Logs de la base de datos
docker logs -f pes6-mysql

# Logs del servidor
docker logs -f sixserver
```

**Detener servicios:**
```bash
docker stop sixserver pes6-mysql
```

**Iniciar servicios:**
```bash
docker start pes6-mysql
docker start sixserver
```

**Reiniciar todo el stack:**
```bash
# Detener y eliminar contenedores
docker stop sixserver pes6-mysql
docker rm sixserver pes6-mysql

# Reconstruir y redesplegar
cd sql
docker build -t pes6-db .
docker run -dp 3306:3306 --net=host --name=pes6-mysql pes6-db

cd ..
docker build -f Dockerfile -t fiveserver .
docker run -d --net=host --name=sixserver --restart=always fiveserver
```

## 🌐 URLs de Acceso

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Registro de usuarios** | http://localhost:8190 | - |
| **Panel de administración** | https://localhost:8191 | Usuario: `fives`<br>Password: `fives` |
| **Juego PES6** | Puerto 10881 | - |
| **Base de datos MySQL** | localhost:3306 | Usuario: `sixserver`<br>Password: `proevo` |

## 🎮 Configuración del Juego

1. Inicia PES6/WE2007
2. Ve a "Network" → "Network Settings"
3. Configura la IP del servidor: `<tu-ip-servidor>`
4. Registra un usuario en: http://localhost:8190
5. ¡Conecta y juega!

## 📊 Características

- ✅ Soporte completo para PES6 y WE2007
- ✅ Partidas multijugador 1v1 y 2v2
- ✅ Sistema de estadísticas persistente
- ✅ Rankings y clasificaciones
- ✅ Chat en el lobby
- ✅ Panel de administración web
- ✅ Base de datos MySQL integrada

## ⚠️ Notas Importantes

- **Orden de despliegue**: Primero la base de datos, luego el servidor
- El servidor usa `--net=host` para compatibilidad con el protocolo del juego
- Los datos se almacenan en la base de datos MySQL
- El panel de administración usa HTTPS con certificado autofirmado

## 🐛 Solución de Problemas

**El servidor no inicia:**
- Verifica que la base de datos esté corriendo
- Revisa los logs: `docker logs sixserver`

**No puedo conectarme desde el juego:**
- Verifica que el puerto 10881 esté abierto
- Confirma la IP del servidor en la configuración del juego

**Error en la interfaz web:**
- Asegúrate de que los puertos 8190 y 8191 no estén ocupados
- Prueba acceder desde localhost primero
