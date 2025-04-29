import logger from '../../config/logger';
import { setupTicTacToe } from './ticTacToe';

/**
 * Configuration du namespace des jeux
 * @param {SocketIO.Namespace} gamesNamespace - Namespace Socket.io des jeux
 */
const setupGamesNamespace = (gamesNamespace) => {
  gamesNamespace.on('connection', (socket) => {
    const user = socket.user;
    logger.info(`User connected to games namespace: ${user.userName} (${user.id}) - Socket ID: ${socket.id}`);

    // Configuration des gestionnaires d'événements spécifiques aux jeux
    setupTicTacToe(socket, gamesNamespace);

    // Écouter les erreurs dans la socket
    socket.on('error', (error) => {
      logger.error(`Socket error in games namespace for user ${user.userName} (${user.id}):`, error);
    });

    // Gérer la déconnexion
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected from games namespace: ${user.userName} (${user.id}) - Reason: ${reason}`);
    });
  });

  // Écouter les erreurs dans le namespace
  gamesNamespace.on('error', (error) => {
    logger.error('Error in games namespace:', error);
  });

  logger.info('Games namespace initialized');
};

export {
  setupGamesNamespace
};
