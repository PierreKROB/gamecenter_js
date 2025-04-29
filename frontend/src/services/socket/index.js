import BaseSocketService from './BaseSocketService';
import GamesSocketService from './GamesSocketService';
import TicTacToeService from './TicTacToeService';

/**
 * Fonction pour nettoyer toutes les connexions socket
 */
const cleanupAllSocketConnections = () => {
  // Déconnexion des services instanciés
  GamesSocketService.disconnect();
};

export {
  BaseSocketService,
  GamesSocketService,
  TicTacToeService,
  cleanupAllSocketConnections
};
