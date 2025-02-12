const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

const aplication = express();
const servidor = http.createServer(aplication);

const io = socketIO(servidor);

const puerto = 8081;

aplication.use(express.static(__dirname));

aplication.get('/', (req, res) => {
  res.sendFile(__dirname + 'index.html');
});

io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');

  socket.on('mensaje', (mensaje) => {
    io.emit('mensaje', mensaje);
  });

  socket.on('escribiendo', (usuario) => {
    socket.broadcast.emit('escribiendo', usuario);
  });

  socket.on('disconnect', () => {
    console.log('Un clinete se ha desconectado.');
  });
});

servidor.listen(puerto, () => {
  console.log(`servidor escuchando en puerto ${puerto}`);
});
