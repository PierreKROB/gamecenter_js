import { io } from 'socket.io-client';

/**
 * Service pour gérer les connexions WebSocket
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.gamesSocket = null;
    this.isConnected = false;
    this.isGamesConnected = false;
    this.gameListeners = new Map();
  }

  /**
   * Connecter au serveur socket.io principal
   * @returns {Promise} Résolution lorsque connecté
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        return resolve(this.socket);
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        return reject(new Error('No authentication token available'));
      }

      this.socket = io('http://localhost:3002', {
        auth: { token }
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });
    });
  }

  /**
   * Connecter au namespace des jeux
   * @returns {Promise} Résolution lorsque connecté
   */
  connectToGames() {
    return new Promise((resolve, reject) => {
      if (this.isGamesConnected) {
        return resolve(this.gamesSocket);
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        return reject(new Error('No authentication token available'));
      }

      this.gamesSocket = io('http://localhost:3002/games', {
        auth: { token }
      });

      this.gamesSocket.on('connect', () => {
        this.isGamesConnected = true;
        resolve(this.gamesSocket);
      });

      this.gamesSocket.on('connect_error', (error) => {
        console.error('Games socket connection error:', error);
        reject(error);
      });

      this.gamesSocket.on('disconnect', () => {
        this.isGamesConnected = false;
      });
    });
  }

  /**
   * Déconnecter tous les sockets
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    if (this.gamesSocket) {
      this.gamesSocket.disconnect();
      this.gamesSocket = null;
      this.isGamesConnected = false;
    }
  }

  /**
   * Rejoindre le lobby de morpion
   */
  joinTicTacToeLobby() {
    if (!this.isGamesConnected) {
      return Promise.reject(new Error('Not connected to games namespace'));
    }
    this.gamesSocket.emit('joinTicTacToeLobby');
  }

  /**
   * Créer une nouvelle partie de morpion
   */
  createTicTacToeGame() {
    if (!this.isGamesConnected) {
      return Promise.reject(new Error('Not connected to games namespace'));
    }
    this.gamesSocket.emit('createTicTacToeGame');
  }

  /**
   * Rejoindre une partie existante
   * @param {string} gameId - ID de la partie à rejoindre
   */
  joinTicTacToeGame(gameId) {
    if (!this.isGamesConnected) {
      return Promise.reject(new Error('Not connected to games namespace'));
    }
    this.gamesSocket.emit('joinTicTacToeGame', { gameId });
  }

  /**
   * Jouer un coup dans une partie de morpion
   * @param {string} gameId - ID de la partie
   * @param {number} position - Position sur le plateau (0-8)
   */
  playTicTacToeMove(gameId, position) {
    if (!this.isGamesConnected) {
      return Promise.reject(new Error('Not connected to games namespace'));
    }
    this.gamesSocket.emit('playTicTacToeMove', { gameId, position });
  }

  /**
   * Quitter une partie de morpion
   * @param {string} gameId - ID de la partie à quitter
   */
  leaveTicTacToeGame(gameId) {
    if (!this.isGamesConnected) {
      return Promise.reject(new Error('Not connected to games namespace'));
    }
    this.gamesSocket.emit('leaveTicTacToeGame', { gameId });
  }

  /**
   * Ajouter un écouteur d'événement pour le socket des jeux
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de rappel
   */
  onGameEvent(event, callback) {
    if (!this.isGamesConnected) {
      return;
    }

    // Stocker la référence du callback pour pouvoir le supprimer plus tard
    if (!this.gameListeners.has(event)) {
      this.gameListeners.set(event, []);
    }
    this.gameListeners.get(event).push(callback);

    this.gamesSocket.on(event, callback);
  }

  /**
   * Supprimer tous les écouteurs d'un événement
   * @param {string} event - Nom de l'événement
   */
  offGameEvent(event) {
    if (!this.isGamesConnected || !this.gameListeners.has(event)) {
      return;
    }
    
    const callbacks = this.gameListeners.get(event);
    callbacks.forEach(callback => {
      this.gamesSocket.off(event, callback);
    });
    
    this.gameListeners.delete(event);
  }

  /**
   * Supprimer tous les écouteurs d'événements
   */
  clearAllListeners() {
    if (this.gamesSocket) {
      for (const [event, callbacks] of this.gameListeners.entries()) {
        callbacks.forEach(callback => {
          this.gamesSocket.off(event, callback);
        });
      }
      this.gameListeners.clear();
    }
  }
}

// Exporter une instance unique du service
export default new SocketService();
