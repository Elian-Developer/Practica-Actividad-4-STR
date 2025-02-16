const express = require('express');
const http = require('http');
const socketIO = require('socket.io');

 // Importamos el Mutex desde la librería 'async-mutex' para manejar el patrón semáforo
const { Mutex } = require('async-mutex');

// Creamos una nueva instancia del Mutex, que se utilizará para controlar el acceso
const mutex = new Mutex();

//Conexion a Base de Datos
const mongoose = require('mongoose');
const { type } = require('os');

mongoose
  .connect(
    'mongodb+srv://leondev523:nYmvy5Jgxj2oGYTP@dbchat.ws0t7.mongodb.net/?retryWrites=true&w=majority&appName=DBCHAT',
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log('conectado a Base de datos Mongo'))
  .catch((err) => console.error('Error al conectar a MongoDB', err));

const mensajeSchemme = new mongoose.Schema({
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
}, {timestamps: true});

const Mensaje = mongoose.model('Mensaje', mensajeSchemme);

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

  socket.on('mensaje', async (mensaje) => {
    console.log('Mensaje recibido:', mensaje);
    
    const mensajeTexto = typeof mensaje == 'string' ? mensaje : mensaje.mensaje

    if (!mensajeTexto) {
      console.error('⚠️ Error: El mensaje está vacío:', mensaje);
      return;
    }

    // ------------------ Uso del Semaforo -----------------------------------
    // Usamos el semáforo (mutex) para bloquear el acceso y evitar concurrencia
    // Adquirimos el semáforo. Por tanto la ejecución se detendrá aquí hasta que el semáforo esté libre.
    const release = await mutex.acquire(); // bloqueamos el acceso

    try {
      // Creamos una instancia para guardar el mensaje enviado en la Base de Datos
      const nuevoMensaje = new Mensaje({ mensaje: mensajeTexto });

      // Guardamos el mensaje en la DB
      await nuevoMensaje.save();

      io.emit('mensaje', mensaje);
    } catch (err) {
      console.error('Error al guardar el mensaje:', err);
    } finally {
      // -------------------- Liberando el semaforo ----------------------------------
      release(); // liberamos el semáforo para permitir que otras operaciones accedan a esta parte del código.
    }
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
