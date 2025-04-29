import BaseSocketService from './BaseSocketService';

/**
 * Service pour les sockets liés aux jeux
 */
class GamesSocketService extends BaseSocketService {
  constructor() {
    super('games');
    this.activeGame = null;
    this.activeGameType = null;
  }

  /**
   * Rejoindre le lobby d'un jeu
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   */
  async joinLobby(gameType) {
    try {
      const eventName = `join${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Lobby`;
      await this.emit(eventName);
      this.activeGameType = gameType;
    } catch (error) {
      console.error(`Error joining lobby for ${gameType}:`, error);
      throw error;
    }
  }

  /**
   * Créer une partie
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   * @param {Object} options - Options supplémentaires (ex: montant de mise)
   */
  async createGame(gameType, options = {}) {
    try {
      const eventName = `create${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Game`;
      await this.emit(eventName, options);
      this.activeGameType = gameType;
    } catch (error) {
      console.error(`Error creating game of type ${gameType}:`, error);
      throw error;
    }
  }

  /**
   * Rejoindre une partie
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   * @param {string} gameId - ID de la partie
   */
  async joinGame(gameType, gameId) {
    try {
      const eventName = `join${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Game`;
      await this.emit(eventName, { gameId });
      this.activeGame = gameId;
      this.activeGameType = gameType;
    } catch (error) {
      console.error(`Error joining game ${gameId} of type ${gameType}:`, error);
      throw error;
    }
  }

  /**
   * Jouer un coup
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   * @param {string} gameId - ID de la partie
   * @param {*} moveData - Données du coup (dépend du jeu)
   */
  async playMove(gameType, gameId, moveData) {
    try {
      const eventName = `play${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Move`;
      await this.emit(eventName, {
        gameId,
        ...moveData
      });
    } catch (error) {
      console.error(`Error playing move in game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Quitter une partie
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   * @param {string} gameId - ID de la partie
   */
  async leaveGame(gameType, gameId) {
    try {
      const eventName = `leave${gameType.charAt(0).toUpperCase() + gameType.slice(1)}Game`;
      await this.emit(eventName, { gameId });
      this.activeGame = null;
    } catch (error) {
      console.error(`Error leaving game ${gameId}:`, error);
      throw error;
    }
  }

  /**
   * Nettoyer les écouteurs spécifiques à un jeu
   * @param {string} gameType - Type de jeu (ex: 'ticTacToe')
   */
  clearGameListeners(gameType) {
    // Événements génériques pour tous les jeux
    const genericEvents = [
      'gameCreated',
      'gameStarted',
      'gameError'
    ];

    // Événements spécifiques au type de jeu
    const specificEvents = {
      ticTacToe: [
        'lobbyUpdate',
        'newGameAvailable',
        'gameRemoved',
        'boardUpdated',
        'gameWon',
        'gameDraw',
        'playerLeft',
        'availableGames'
      ]
    };

    // Nettoyer les écouteurs génériques
    genericEvents.forEach(event => this.clearListeners(event));

    // Nettoyer les écouteurs spécifiques au jeu
    if (specificEvents[gameType]) {
      specificEvents[gameType].forEach(event => this.clearListeners(event));
    }
  }
}

// Exporter une instance unique
export default new GamesSocketService();
