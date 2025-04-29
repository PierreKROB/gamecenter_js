import GamesSocketService from './GamesSocketService';

/**
 * Service spécifique pour le jeu de Morpion
 */
class TicTacToeService {
  constructor() {
    this.gamesSocket = GamesSocketService;
    this.gameType = 'ticTacToe';
  }

  /**
   * Se connecter au serveur de jeux
   * @returns {Promise} Résolution lorsque connecté
   */
  async connect() {
    return await this.gamesSocket.connect();
  }

  /**
   * Rejoindre le lobby du morpion
   */
  async joinLobby() {
    try {
      await this.gamesSocket.joinLobby(this.gameType);
    } catch (error) {
      console.error('Error joining TicTacToe lobby:', error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle partie
   * @param {number} betAmount - Montant de la mise (optionnel)
   */
  async createGame(betAmount = 50) {
    try {
      // S'assurer que le montant est un nombre valide
      const validBetAmount = parseInt(betAmount, 10) || 50;
      
      await this.gamesSocket.createGame(this.gameType, { betAmount: validBetAmount });
    } catch (error) {
      console.error('Error creating TicTacToe game:', error);
      throw error;
    }
  }

  /**
   * Rejoindre une partie existante
   * @param {string} gameId - ID de la partie
   */
  async joinGame(gameId) {
    try {
      if (!gameId || typeof gameId !== 'string') {
        throw new Error(`Invalid gameId: ${gameId}`);
      }

      // Vérifier que gameId est bien une chaîne non vide
      if (!gameId || typeof gameId !== 'string' || gameId.trim() === '') {
        throw new Error('Game ID must be a non-empty string');
      }

      await this.gamesSocket.joinGame(this.gameType, gameId.trim());
    } catch (error) {
      console.error(`Error joining TicTacToe game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Jouer un coup
   * @param {string} gameId - ID de la partie
   * @param {number} position - Position sur le plateau (0-8)
   */
  async playMove(gameId, position) {
    try {
      if (!gameId) {
        console.error('Cannot play move: gameId is undefined or null');
        throw new Error('Game ID is required to play a move');
      }

      await this.gamesSocket.playMove(this.gameType, gameId, { position });
    } catch (error) {
      console.error(`Error playing move in game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Quitter une partie
   * @param {string} gameId - ID de la partie
   */
  async leaveGame(gameId) {
    try {
      await this.gamesSocket.leaveGame(this.gameType, gameId);
    } catch (error) {
      console.error(`Error leaving game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Écouter les mises à jour du lobby
   * @param {Function} callback - Fonction de rappel
   */
  onLobbyUpdate(callback) {
    this.gamesSocket.on('lobbyUpdate', callback);
  }

  /**
   * Écouter les nouvelles parties disponibles
   * @param {Function} callback - Fonction de rappel
   */
  onNewGameAvailable(callback) {
    this.gamesSocket.on('newGameAvailable', callback);
  }

  /**
   * Écouter les parties qui ont été retirées
   * @param {Function} callback - Fonction de rappel
   */
  onGameRemoved(callback) {
    this.gamesSocket.on('gameRemoved', callback);
  }

  /**
   * Écouter la liste des parties disponibles à l'entrée du lobby
   * @param {Function} callback - Fonction de rappel
   */
  onAvailableGames(callback) {
    this.gamesSocket.on('availableGames', callback);
  }

  /**
   * Écouter la création d'une partie
   * @param {Function} callback - Fonction de rappel
   */
  onGameCreated(callback) {
    this.gamesSocket.on('gameCreated', callback);
  }

  /**
   * Écouter le démarrage d'une partie
   * @param {Function} callback - Fonction de rappel
   */
  onGameStarted(callback) {
    this.gamesSocket.on('gameStarted', callback);
  }

  /**
   * Écouter les mises à jour du plateau
   * @param {Function} callback - Fonction de rappel
   */
  onBoardUpdated(callback) {
    this.gamesSocket.on('boardUpdated', callback);
  }

  /**
   * Écouter les victoires
   * @param {Function} callback - Fonction de rappel
   */
  onGameWon(callback) {
    this.gamesSocket.on('gameWon', callback);
  }

  /**
   * Écouter les matchs nuls
   * @param {Function} callback - Fonction de rappel
   */
  onGameDraw(callback) {
    this.gamesSocket.on('gameDraw', callback);
  }

  /**
   * Écouter le départ d'un joueur
   * @param {Function} callback - Fonction de rappel
   */
  onPlayerLeft(callback) {
    this.gamesSocket.on('playerLeft', callback);
  }

  /**
   * Écouter les erreurs de jeu
   * @param {Function} callback - Fonction de rappel
   */
  onGameError(callback) {
    this.gamesSocket.on('gameError', callback);
  }

  /**
   * Nettoyer tous les écouteurs spécifiques au jeu
   */
  clearListeners() {
    this.gamesSocket.clearGameListeners(this.gameType);
  }

  /**
   * Se déconnecter du serveur de jeux
   */
  disconnect() {
    this.clearListeners();
  }
}

// Exporter une instance unique
export default new TicTacToeService();
