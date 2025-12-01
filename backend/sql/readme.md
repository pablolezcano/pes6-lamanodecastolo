# Instrucciones:

- Para generar la imagen:
  docker build -t pes6-db .
- Para generar el contenedor:
  docker run -dp 3306:3306 --net=host  pes6-db
