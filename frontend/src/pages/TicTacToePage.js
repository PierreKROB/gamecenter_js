import { TicTacToeService } from '../services/socket';
import authService from '../services/authService.js';
import walletService from '../services/walletService.js';

/**
 * Page du jeu de morpion (Tic Tac Toe)
 */
class TicTacToePage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'game-container';
    this.gameId = null;
    this.gameState = null;
    this.playerSymbol = null;
    this.isMyTurn = false;
    this.userId = authService.getStoredUser()?.id;
    this.betAmount = 50;
    this.customBetAmount = null;
    this.hasBet = false;
    this.winAmount = null; // Nouveau : stocke le montant des gains reçus

    this.setupEventListeners = this.setupEventListeners.bind(this);
    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleCreateGame = this.handleCreateGame.bind(this);
    this.handleCreateGameWithBet = this.handleCreateGameWithBet.bind(this);
    this.handleJoinGame = this.handleJoinGame.bind(this);
    this.handleLeaveGame = this.handleLeaveGame.bind(this);
    this.handleBackToLobby = this.handleBackToLobby.bind(this);
    // handlePlaceBet a été supprimé car les paris sont automatiques
    this.handleBetAmountChange = this.handleBetAmountChange.bind(this);
    this.handleBetNumberChange = this.handleBetNumberChange.bind(this);
  }

  /**
   * Configuration des écouteurs d'événements socket.io
   */
  async setupEventListeners() {
    // Se connecter au service de jeu
    try {
      await TicTacToeService.connect();

      // Écouteurs pour le lobby
      TicTacToeService.onLobbyUpdate((data) => {
        const lobbyPlayersElement = document.getElementById('lobby-players');
        if (lobbyPlayersElement) {
          lobbyPlayersElement.textContent = `Joueurs en attente: ${data.players}`;
        }
      });

      TicTacToeService.onNewGameAvailable((data) => {
        this.addGameToList(data.gameId, data.creator, data.betAmount);
      });

      TicTacToeService.onGameRemoved((data) => {
        const gameElement = document.getElementById(`game-${data.gameId}`);
        if (gameElement) {
          gameElement.remove();
        }
      });

      // Nouvelle fonction pour gérer la liste des parties disponibles
      TicTacToeService.onAvailableGames((data) => {
        const gamesList = document.getElementById('games-list');
        if (!gamesList) return;

        // Nettoyer la liste existante et garder uniquement le message "Aucune partie disponible"
        const noGamesMessage = gamesList.querySelector('.no-games');
        gamesList.innerHTML = '';

        // Si aucune partie disponible, afficher le message
        if (data.games.length === 0) {
          gamesList.innerHTML = '<p class="no-games">Aucune partie disponible. Créez-en une!</p>';
          return;
        }

        // Ajouter chaque partie disponible à la liste
        data.games.forEach(game => {
          this.addGameToList(game.gameId, game.creator, game.betAmount);
        });
      });

      // Écouteurs pour la partie
      TicTacToeService.onGameCreated((data) => {
        this.gameId = data.gameId;
        this.gameState = data.game;
        this.playerSymbol = 'X'; // Le créateur joue toujours avec X
        this.renderGame();
      });

      TicTacToeService.onGameStarted((data) => {
        this.gameState = data.game;
        this.gameId = data.game.id; // S'assurer que l'ID de jeu est correctement stocké

        this.playerSymbol = this.gameState.players.find(p => p.id === this.userId)?.symbol;
        this.isMyTurn = this.gameState.currentTurn === this.userId;
        this.renderGame();
      });

      TicTacToeService.onBoardUpdated((data) => {
        this.gameState = data.game;

        // S'assurer que l'ID du jeu est maintenu
        if (data.game && data.game.id) {
          if (this.gameId !== data.game.id) {
            this.gameId = data.game.id;
          }
        }

        this.isMyTurn = this.gameState.currentTurn === this.userId;
        this.renderGame();

        // Afficher une notification du dernier coup joué
        this.showNotification(`${data.lastMove.player} a joué en position ${data.lastMove.position + 1}`);
      });

      TicTacToeService.onGameWon((data) => {
        this.gameState = data.game;

        // S'assurer que l'ID du jeu est maintenu
        if (data.game && data.game.id && this.gameId !== data.game.id) {
          this.gameId = data.game.id;
        }

        this.renderGame();

        const message = data.byForfeit
          ? `${data.winner} a gagné par forfait!`
          : `${data.winner} a gagné avec les ${data.winnerSymbol}!`;

        // Afficher les gains avec le montant si spécifié
        const betAmount = this.gameState.betAmount || this.betAmount;
        if (data.winAmount) {
          // Stocker le montant des gains pour l'affichage
          this.winAmount = data.winAmount;
          // Assurer que le montant des gains est bien celui reçu du serveur
          this.showNotification(`${message} Gains: ${this.winAmount} GameCoins!`, 'success');
        } else {
          this.showNotification(message, 'success');
        }
      });

      TicTacToeService.onGameDraw((data) => {
        this.gameState = data.game;

        // S'assurer que l'ID du jeu est maintenu
        if (data.game && data.game.id && this.gameId !== data.game.id) {
          this.gameId = data.game.id;
        }

        this.renderGame();
        this.showNotification('Match nul!', 'warning');
      });

      TicTacToeService.onPlayerLeft((data) => {
        this.showNotification(`${data.player} a quitté la partie`, 'error');
      });

      TicTacToeService.onGameError((data) => {
        this.showNotification(data.message, 'error');
      });

      // Rejoindre le lobby au démarrage
      TicTacToeService.joinLobby();

    } catch (error) {
      console.error('Failed to setup socket connections:', error);
      this.showNotification('Impossible de se connecter au serveur de jeu', 'error');
    }
  }

  /**
   * Gérer un clic sur une cellule du plateau
   * @param {Event} e - Événement de clic
   */
  async handleCellClick(e) {
    // Vérifier d'abord si l'ID de jeu est défini
    if (!this.gameId) {
      console.error('Cannot play move: gameId is not defined');
      this.showNotification('Erreur: Impossible de jouer. ID de jeu manquant.', 'error');
      return;
    }

    if (!this.gameState || this.gameState.status !== 'playing' || !this.isMyTurn) {
      console.warn('Cannot play: game not in correct state', {
        gameId: this.gameId,
        gameState: this.gameState ? this.gameState.status : 'null',
        isMyTurn: this.isMyTurn
      });
      return;
    }

    const cell = e.target;
    const position = parseInt(cell.dataset.index, 10);

    if (isNaN(position) || this.gameState.board[position] !== null) {
      console.warn(`Invalid position ${position} in game ${this.gameId}`);
      return;
    }

    try {
      await TicTacToeService.playMove(this.gameId, position);
    } catch (error) {
      console.error(`Error playing move at position ${position}:`, error);
      this.showNotification(`Erreur lors de la tentative de jouer: ${error.message}`, 'error');
    }
  }

  /**
   * Gérer les changements du champ numérique de mise
   * @param {Event} e - Événement de changement du champ numérique
   */
  handleBetNumberChange(e) {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      // Mettre à jour le slider
      const slider = document.getElementById('bet-amount-input');
      if (slider) {
        slider.value = value;
      }
    }
  }

  /**
   * Gérer les changements du slider de mise
   * @param {Event} e - Événement de changement du slider
   */
  handleBetAmountChange(e) {
    const value = e.target.value;
    
    // Mettre à jour le champ numérique
    const numberInput = document.getElementById('bet-amount-number');
    if (numberInput) {
      numberInput.value = value;
    }
  }

  /**
   * Gérer la création d'une partie avec mise personnalisée
   * @param {Event} e - Événement du formulaire
   */
  async handleCreateGameWithBet(e) {
    e.preventDefault();

    // Récupérer le montant de la mise depuis le champ numérique
    const betInput = document.getElementById('bet-amount-number');
    const betAmount = parseInt(betInput.value, 10);

    // Validation simple du montant
    if (isNaN(betAmount) || betAmount <= 0) {
      this.showNotification('Veuillez saisir un montant valide (supérieur à 0)', 'error');
      return;
    }

    // Vérifier si l'utilisateur a suffisamment de fonds
    try {
      const canBetResponse = await walletService.canPlaceBet(betAmount);

      if (!canBetResponse.success || !canBetResponse.data.canPlaceBet) {
        this.showNotification('Fonds insuffisants pour placer ce pari', 'error');
        return;
      }

      // Stocker le montant personnalisé
      this.customBetAmount = betAmount;

      // Fermer le modal
      const modal = document.getElementById('bet-modal');
      if (modal) {
        modal.style.display = 'none';
      }

      // Créer la partie avec le montant personnalisé
      await this.handleCreateGame();

    } catch (error) {
      console.error('Erreur lors de la vérification des fonds:', error);
      this.showNotification(`Erreur: ${error.message}`, 'error');
    }
  }

  /**
   * Gérer la création d'une nouvelle partie
   */
  async handleCreateGame() {
    try {
      // Si un montant personnalisé a été défini, l'utiliser
      const betAmount = this.customBetAmount || this.betAmount;

      // Créer la partie avec le montant de la mise
      await TicTacToeService.createGame(betAmount);

      // Réinitialiser le montant personnalisé après la création
      this.customBetAmount = null;
    } catch (error) {
      console.error('Error creating game:', error);
      this.showNotification(`Erreur lors de la création de la partie: ${error.message}`, 'error');
    }
  }

  /**
   * Gérer la participation à une partie existante
   * @param {string} gameId - ID de la partie à rejoindre
   */
  async handleJoinGame(gameId) {
    try {
      await TicTacToeService.joinGame(gameId);
    } catch (error) {
      console.error('Error joining game:', error);
      this.showNotification(`Erreur lors de la tentative de rejoindre la partie: ${error.message}`, 'error');
    }
  }

  /**
   * Gérer le retour au lobby
   */
  async handleBackToLobby() {
    // Nettoyer l'état de la partie
    this.gameId = null;
    this.gameState = null;
    this.playerSymbol = null;
    this.isMyTurn = false;
    this.hasBet = false;
    this.winAmount = null; // Réinitialiser le montant des gains

    try {
      // Rejoindre à nouveau le lobby
      await TicTacToeService.joinLobby();

      // Rendre le lobby
      this.renderLobby();
    } catch (error) {
      console.error('Error returning to lobby:', error);
      this.showNotification(`Erreur lors du retour au lobby: ${error.message}`, 'error');
    }
  }

  /**
   * Gérer le départ d'une partie
   */
  async handleLeaveGame() {
    if (this.gameId) {
      try {
        await TicTacToeService.leaveGame(this.gameId);
        await this.handleBackToLobby();
      } catch (error) {
        console.error(`Error leaving game ${this.gameId}:`, error);
        this.showNotification(`Erreur lors de la tentative de quitter la partie: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Ajouter une partie à la liste des parties disponibles
   * @param {string} gameId - ID de la partie
   * @param {string} creator - Nom du créateur
   * @param {number} betAmount - Montant de la mise (optionnel)
   */
  addGameToList(gameId, creator, betAmount = 50) {
    const gamesList = document.getElementById('games-list');
    if (!gamesList) return;

    const gameItem = document.createElement('div');
    gameItem.id = `game-${gameId}`;
    gameItem.className = 'game-item';
    gameItem.innerHTML = `
      <span>Partie créée par ${creator} - Mise: ${betAmount} GC</span>
      <button class="join-game-btn">Rejoindre</button>
    `;

    gamesList.appendChild(gameItem);

    // Ajouter l'écouteur d'événement au bouton de participation
    const joinButton = gameItem.querySelector('.join-game-btn');
    joinButton.addEventListener('click', () => this.handleJoinGame(gameId));
  }

  /**
   * Afficher une notification
   * @param {string} message - Message à afficher
   * @param {string} type - Type de notification (info, success, error, warning)
   */
  showNotification(message, type = 'info') {
    const notificationsContainer = document.getElementById('notifications');
    if (!notificationsContainer) return;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notificationsContainer.appendChild(notification);

    // Supprimer la notification après 5 secondes
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => {
        if (notification.parentNode === notificationsContainer) {
          notificationsContainer.removeChild(notification);
        }
      }, 500);
    }, 5000);
  }

  /**
   * Rendre le lobby du jeu
   */
  renderLobby() {
    this.container.innerHTML = `
      <div class="game-header">
        <h1>Morpion - Lobby</h1>
        <p id="lobby-players">Joueurs en attente: 0</p>
      </div>
      
      <div class="game-actions">
        <button id="create-custom-game-btn" class="primary-btn">Créer une partie</button>
      </div>
      
      <div class="available-games">
        <h2>Parties disponibles</h2>
        <div id="games-list" class="games-list">
          <p class="no-games">Aucune partie disponible. Créez-en une!</p>
        </div>
      </div>
      
      <!-- Modal pour la mise personnalisée -->
      <div id="bet-modal" class="modal">
        <div class="modal-content">
          <span class="close-modal">&times;</span>
          <h2>Définir votre mise</h2>
          <form id="bet-form">
            <div class="form-group">
              <label for="bet-amount-input">Montant de la mise (GameCoins)</label>
              <div class="bet-input-group">
                <input 
                  type="range" 
                  id="bet-amount-input" 
                  min="10" 
                  max="1000" 
                  step="10" 
                  value="50"
                >
                <input 
                  type="number" 
                  id="bet-amount-number" 
                  min="10" 
                  max="1000" 
                  value="50"
                >
              </div>
            </div>
            <p class="bet-info">Le gagnant remportera le total des mises des deux joueurs.</p>
            <button type="submit" class="primary-btn">Créer la partie</button>
          </form>
        </div>
      </div>
      
      <div id="notifications" class="notifications-container"></div>
    `;

    // Ajouter les écouteurs d'événements
    const createCustomGameBtn = this.container.querySelector('#create-custom-game-btn');
    if (createCustomGameBtn) {
      createCustomGameBtn.addEventListener('click', () => {
        const modal = document.getElementById('bet-modal');
        if (modal) {
          modal.style.display = 'block';
        }
      });
    }

    // Écouteur pour le formulaire de pari
    const betForm = this.container.querySelector('#bet-form');
    if (betForm) {
      betForm.addEventListener('submit', this.handleCreateGameWithBet);
    }

    // Écouteur pour le slider de montant
    const betAmountInput = this.container.querySelector('#bet-amount-input');
    if (betAmountInput) {
      betAmountInput.addEventListener('input', this.handleBetAmountChange);
    }

    // Écouteur pour le champ numérique
    const betAmountNumber = this.container.querySelector('#bet-amount-number');
    if (betAmountNumber) {
      betAmountNumber.addEventListener('input', this.handleBetNumberChange);
    }

    // Écouteur pour fermer le modal
    const closeModal = this.container.querySelector('.close-modal');
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        const modal = document.getElementById('bet-modal');
        if (modal) {
          modal.style.display = 'none';
        }
      });
    }
  }

  /**
   * Rendre le plateau de jeu
   */
  renderGame() {
    if (!this.gameState) return;

    // Déterminer le statut de la partie et le message à afficher
    let statusMessage = '';
    let gameStatus = this.gameState.status;
    let winMessage = '';

    if (gameStatus === 'waiting') {
      statusMessage = `En attente d'un autre joueur...`;
    } else if (gameStatus === 'playing') {
      const currentPlayer = this.gameState.players.find(p => p.id === this.gameState.currentTurn);
      statusMessage = this.isMyTurn
        ? `C'est votre tour (${this.playerSymbol})`
        : `C'est le tour de ${currentPlayer?.name} (${currentPlayer?.symbol})`;
    } else if (gameStatus === 'finished') {
      if (this.gameState.winner) {
        const winner = this.gameState.players.find(p => p.id === this.gameState.winner);
        if (this.gameState.winner === this.userId) {
          statusMessage = 'Vous avez gagné!';
          // Utiliser le montant des gains réel reçu de l'événement si disponible
          const winAmount = this.winAmount || (betAmount * 2);
          // Assurer que nous montrons le montant exact reçu du serveur
          winMessage = `Vous avez reçu ${winAmount} GameCoins de gains!`;
        } else {
          statusMessage = `${winner?.name} a gagné!`;
        }
      } else {
        statusMessage = 'Match nul!';
        // Ajouter un message sur le remboursement en cas de match nul
        winMessage = `Votre mise de ${betAmount} GameCoins a été remboursée.`;
      }
    }

    // Récupérer le montant de la mise depuis l'état du jeu
    const betAmount = this.gameState.betAmount || this.betAmount;

    // Générer le HTML du plateau
    const boardHTML = this.gameState.board.map((cell, index) => {
      const cellValue = cell || '';
      const cellClass = `ttt-cell ${cell ? `cell-${cell.toLowerCase()}` : ''} ${this.isMyTurn && !cell ? 'clickable' : ''}`;

      return `<div class="${cellClass}" data-index="${index}">${cellValue}</div>`;
    }).join('');

    // Rendre le contenu
    this.container.innerHTML = `
      <div class="game-header">
        <h1>Morpion</h1>
        <p class="game-status">${statusMessage}</p>
        ${winMessage ? `<p class="game-win-message">${winMessage}</p>` : ''}
        <p class="game-bet">Mise: ${betAmount} GameCoins par joueur (pot: ${betAmount * 2} GC)</p>
      </div>
      
      <div class="ttt-board">${boardHTML}</div>
      
      <div class="game-info">
        ${this.gameState.players.map(player => `
          <div class="player-info ${player.id === this.gameState.currentTurn ? 'current-player' : ''}">
            <span class="player-name">${player.name}</span>
            <span class="player-symbol">(${player.symbol})</span>
            ${player.id === this.userId ? '<span class="you-tag">Vous</span>' : ''}
          </div>
        `).join('')}
      </div>
      
      <div class="game-actions">
        ${gameStatus === 'finished'
        ? '<button id="back-to-lobby-btn" class="secondary-btn">Retour au lobby</button>'
        : `
            <button id="leave-game-btn" class="danger-btn">Quitter la partie</button>
          `
      }
      </div>
      
      <div id="notifications" class="notifications-container"></div>
    `;

    // Ajouter les écouteurs d'événements
    if (gameStatus === 'finished') {
      const backToLobbyBtn = this.container.querySelector('#back-to-lobby-btn');
      if (backToLobbyBtn) {
        backToLobbyBtn.addEventListener('click', this.handleBackToLobby);
      }
    } else {
      const leaveGameBtn = this.container.querySelector('#leave-game-btn');
      if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', this.handleLeaveGame);
      }
    }

    // Ajouter les écouteurs pour les cellules clickables
    if (gameStatus === 'playing' && this.isMyTurn) {
      const cells = this.container.querySelectorAll('.ttt-cell.clickable');
      cells.forEach(cell => {
        cell.addEventListener('click', this.handleCellClick);
      });
    }
  }

  /**
   * Méthode appelée après le rendu initial
   */
  async afterRender() {
    try {
      await this.setupEventListeners();

      // Rendre le lobby initialement
      this.renderLobby();
    } catch (error) {
      console.error('Error setting up TicTacToe page:', error);
      this.showNotification('Erreur lors de l\'initialisation du jeu. Veuillez rafraîchir la page.', 'error');
    }
  }

  // La méthode handlePlaceBet est supprimée car les paris sont désormais automatiquement traités côté serveur

  /**
   * Méthode appelée lors de la destruction du composant
   */
  async destroy() {
    try {
      // Nettoyer les écouteurs d'événements
      TicTacToeService.clearListeners();

      // Si dans une partie, la quitter proprement
      if (this.gameId) {
        await TicTacToeService.leaveGame(this.gameId);
      }
    } catch (error) {
      console.error('Error cleaning up TicTacToe component:', error);
    }
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    // Le contenu sera rempli par afterRender
    this.container.innerHTML = `
      <div class="game-loading">
        <h1>Chargement du jeu...</h1>
        <div class="spinner"></div>
      </div>
    `;

    return this.container;
  }
}

export default TicTacToePage;