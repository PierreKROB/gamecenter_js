import http from 'http';
import app from './app'; // Application Express
import mongooseConnect from './config/mongoose'; // Fonction de connexion MongoDB
import logger from './config/logger'; // Logger Winston
import config from './config/config'; // Configuration (PORT, etc.)
import initialData from './config/initialData'; // Fonction pour initialiser les données
import { initializeSocketServer } from './socket'; // Initialisation du serveur Socket.io

logger.info("🚀 Server is starting...");

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.io avec le serveur HTTP
initializeSocketServer(server);

// Normaliser le port
const normalizePort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
};

const port = normalizePort(config.PORT || '3000');
app.set('port', port);

// Gestionnaire d'erreurs du serveur
const errorHandler = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : 'port: ' + port;
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges.`);
      process.exit(1);
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use.`);
      process.exit(1);
    default:
      throw error;
  }
};

// Gestion des événements du serveur
server.on('error', errorHandler);
server.on('listening', () => {
  const address = server.address();
  const bind = typeof address === 'string' ? 'pipe ' + address : `port ${port}`;
  logger.info(`🚀 Server is running on ${bind}`);
});

mongooseConnect();
initialData();

server.listen(port);
