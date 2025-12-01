# Usa la imagen de MySQL 8.0.35-debian como base
FROM mysql:8.0

# Copia el archivo schema6.sql a la carpeta /docker-entrypoint-initdb.d/ en el contenedor
COPY schema6.sql /docker-entrypoint-initdb.d/

# Variables de entorno para la creación de la base de datos y el usuario
ENV MYSQL_DATABASE=sixserver \
    MYSQL_USER=sixserver \
    MYSQL_PASSWORD=proevo \
    MYSQL_ROOT_PASSWORD=rootpassword

# Comandos para ejecutar dentro del contenedor MySQL
# Estos comandos se ejecutarán automáticamente cuando se inicie el contenedor
RUN echo 'CREATE DATABASE IF NOT EXISTS `sixserver`;' >> /docker-entrypoint-initdb.d/init.sql && \
    echo 'CREATE USER IF NOT EXISTS `sixserver`@`%` IDENTIFIED BY "proevo";' >> /docker-entrypoint-initdb.d/init.sql && \
    echo 'GRANT SELECT, INSERT, UPDATE ON `sixserver`.* TO `sixserver`@`%`;' >> /docker-entrypoint-initdb.d/init.sql && \
    echo 'USE `sixserver`;' >> /docker-entrypoint-initdb.d/init.sql && \
    echo 'source /docker-entrypoint-initdb.d/schema6.sql;' >> /docker-entrypoint-initdb.d/init.sql
