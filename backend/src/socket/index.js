import { Server } from 'socket.io';
import logger from '~/config/logger';
import config from '~/config/config';
import { setupAuthMiddleware } from './middleware/auth';
import { setupGamesNamespace } from './games';

// Instances des serveurs socket
let io;
let gamesNamespace;

/**
 * Initialiser le serveur Socket.io
 * @param {http.Server} httpServer - Serveur HTTP Express
 */
const initializeSocketServer = (httpServer) => {
  // Création de l'instance Socket.io
  io = new Server(httpServer, {
    cors: {
      origin: config.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    // Options pour améliorer la fiabilité de la connexion
    pingTimeout: 30000, // 30 secondes sans réponse avant déconnexion
    pingInterval: 5000, // Envoyer un ping toutes les 5 secondes
    connectTimeout: 10000, // 10 secondes pour établir la connexion
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  // Configuration du middleware d'authentification globale
  setupAuthMiddleware(io);

  // Création et configuration du namespace des jeux
  gamesNamespace = io.of('/games');
  setupGamesNamespace(gamesNamespace);

  // Écouteurs d'événements pour tracer les connexions/déconnexions
  io.on('connection', (socket) => {
    logger.info(`New socket connection: ${socket.id}`);
    
    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('🎮 Socket.io server initialized');

  return { io, gamesNamespace };
};

/**
 * Obtenir l'instance Socket.io
 * @returns {SocketIO.Server} - Instance Socket.io
 */
const getIo = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Obtenir le namespace des jeux
 * @returns {SocketIO.Namespace} - Namespace des jeux
 */
const getGamesNamespace = () => {
  if (!gamesNamespace) {
    throw new Error('Games namespace not initialized');
  }
  return gamesNamespace;
};

export {
  initializeSocketServer,
  getIo,
  getGamesNamespace
};
