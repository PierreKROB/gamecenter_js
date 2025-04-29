import authService from '../services/authService.js';
import walletService from '../services/walletService.js';

/**
 * Composant pour la page d'accueil
 */
class HomePage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'home-container';
    this.user = null;
    this.wallet = null;
    
    // Lier les méthodes
    this.handleLogout = this.handleLogout.bind(this);
    this.handleCollectBonus = this.handleCollectBonus.bind(this);
    this.loadGameCenter = this.loadGameCenter.bind(this);
  }

  /**
   * Gérer la déconnexion
   */
  async handleLogout() {
    try {
      await authService.logout();
      window.location.hash = '/login';
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      this.showNotification('Erreur lors de la déconnexion.', 'error');
    }
  }

  /**
   * Gérer la collecte du bonus quotidien
   */
  async handleCollectBonus() {
    const bonusButton = document.getElementById('collect-bonus-btn');
    
    if (bonusButton) {
      bonusButton.disabled = true;
      bonusButton.innerHTML = 'Collecte en cours... <div class="spinner"></div>';
    }
    
    try {
      const response = await walletService.collectDailyBonus();
      
      if (response.success) {
        this.wallet.balance = response.data.newBalance;
        this.updateWalletInfo();
        this.showNotification(`${response.data.message}`, 'success');
        
        // Désactiver le bouton après la collecte
        if (bonusButton) {
          bonusButton.innerHTML = 'Bonus collecté aujourd\'hui';
          bonusButton.classList.add('disabled-btn');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la collecte du bonus:', error);
      this.showNotification(error.errors ? 
        error.errors[0].message : 
        'Erreur lors de la collecte du bonus.', 'error');
      
      // Réactiver le bouton en cas d'erreur
      if (bonusButton) {
        bonusButton.disabled = false;
        bonusButton.innerHTML = 'Collecter le bonus quotidien';
      }
    }
  }

  /**
   * Charger la section de jeu
   * @param {string} gameType - Type de jeu
   */
  loadGameCenter(gameType) {
    if (gameType === 'tic-tac-toe') {
      window.location.hash = '/tic-tac-toe';
    }
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
   * Charger les données utilisateur
   */
  async loadUserData() {
    try {
      const response = await authService.getCurrentUser();
      if (response.success) {
        this.user = response.data;
        this.updateUserInfo();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données utilisateur:', error);
      this.showNotification('Erreur lors du chargement des données utilisateur.', 'error');
    }
  }

  /**
   * Charger les données du portefeuille
   */
  async loadWalletData() {
    try {
      const response = await walletService.getMyWallet();
      if (response.success) {
        this.wallet = response.data;
        this.updateWalletInfo();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille:', error);
      this.showNotification('Erreur lors du chargement des données du portefeuille.', 'error');
    }
  }

  /**
   * Mettre à jour les informations utilisateur dans le DOM
   */
  updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement && this.user) {
      userInfoElement.innerHTML = `
        <p><strong>Nom d'utilisateur:</strong> ${this.user.userName}</p>
        ${this.user.email ? `<p><strong>Email:</strong> ${this.user.email}</p>` : ''}
        ${this.user.roles && this.user.roles.length ? 
          `<p><strong>Rôles:</strong> ${this.user.roles.map(role => role.name).join(', ')}</p>` : ''}
      `;
    }
  }

  /**
   * Mettre à jour les informations du portefeuille dans le DOM
   */
  updateWalletInfo() {
    const walletInfoElement = document.getElementById('wallet-info');
    if (walletInfoElement && this.wallet) {
      walletInfoElement.innerHTML = `
        <h3 class="wallet-title">Votre Portefeuille</h3>
        <div class="wallet-balance">
          <span class="balance-amount">${this.wallet.balance}</span>
          <span class="balance-currency">GameCoins</span>
        </div>
      `;
    }
  }

  /**
   * Vérifier le statut du bonus quotidien
   */
  async checkDailyBonusStatus() {
    try {
      const response = await walletService.checkDailyBonusStatus();
      
      if (response.success && response.data.hasCollectedToday) {
        const bonusButton = document.getElementById('collect-bonus-btn');
        if (bonusButton) {
          bonusButton.innerHTML = 'Bonus collecté aujourd\'hui';
          bonusButton.disabled = true;
          bonusButton.classList.add('disabled-btn');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du bonus:', error);
    }
  }
  
  /**
   * Initialisation après le rendu
   */
  async afterRender() {
    // Récupérer l'utilisateur stocké localement
    this.user = authService.getStoredUser();
    this.updateUserInfo();
    
    // Charger les données fraîches depuis le serveur
    await Promise.all([
      this.loadUserData(),
      this.loadWalletData()
    ]);
    
    // Vérifier si l'utilisateur a déjà collecté son bonus quotidien
    await this.checkDailyBonusStatus();
    
    // Ajouter les écouteurs d'événements
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', this.handleLogout);
    }
    
    // Ajouter un écouteur pour le bouton de bonus
    const bonusButton = document.getElementById('collect-bonus-btn');
    if (bonusButton) {
      bonusButton.addEventListener('click', this.handleCollectBonus);
    }
    
    // Ajouter un écouteur pour le bouton de jeu
    const ticTacToeButton = document.getElementById('tic-tac-toe-btn');
    if (ticTacToeButton) {
      ticTacToeButton.addEventListener('click', () => this.loadGameCenter('tic-tac-toe'));
    }
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    this.container.innerHTML = `
      <h1 class="home-title">GameCenter <span class="accent-text">JS</span></h1>
      <p class="home-subtitle">Votre plateforme de jeux multijoueur avec paris virtuels</p>
      
      <div class="profile-section">
        <div class="card user-card">
          <h3 class="card-title">Profil</h3>
          <div id="user-info" class="user-info">
            <div class="spinner"></div>
            <p>Chargement des informations utilisateur...</p>
          </div>
        </div>
        
        <div class="card wallet-card">
          <div id="wallet-info" class="wallet-info">
            <div class="spinner"></div>
            <p>Chargement du portefeuille...</p>
          </div>
          <div class="wallet-actions">
            <button id="collect-bonus-btn" class="bonus-btn">Collecter le bonus quotidien</button>
          </div>
        </div>
      </div>
      
      <div class="games-section">
        <h2 class="section-title">Nos jeux</h2>
        <div class="games-grid">
          <div class="game-card">
            <div class="game-icon">🎮</div>
            <h3 class="game-title">Morpion</h3>
            <p class="game-description">Affrontez d'autres joueurs dans ce classique du jeu à deux!</p>
            <div class="game-details">
              <span class="game-price">Mise: 50 - 200 GameCoins</span>
              <span class="game-reward">Gain: Double ou rien</span>
            </div>
            <button id="tic-tac-toe-btn" class="primary-btn">Jouer maintenant</button>
          </div>
          
          <div class="game-card coming-soon">
            <div class="game-icon">🎲</div>
            <h3 class="game-title">Dés</h3>
            <p class="game-description">Tentez votre chance avec ce jeu de dés simple et addictif.</p>
            <div class="game-details">
              <span class="game-price">Mise: 10 - 100 GameCoins</span>
              <span class="game-reward">Gains: jusqu'à x6</span>
            </div>
            <button disabled class="disabled-btn">Bientôt disponible</button>
          </div>
          
          <div class="game-card coming-soon">
            <div class="game-icon">🃏</div>
            <h3 class="game-title">Blackjack</h3>
            <p class="game-description">Le célèbre jeu de cartes où il faut s'approcher de 21 sans le dépasser.</p>
            <div class="game-details">
              <span class="game-price">Mise: 50 - 500 GameCoins</span>
              <span class="game-reward">Gains: x1.5 à x2</span>
            </div>
            <button disabled class="disabled-btn">Bientôt disponible</button>
          </div>
        </div>
      </div>
      
      <div class="home-actions">
        <button id="logout-btn" class="danger-btn">Se déconnecter</button>
      </div>
      
      <div id="notifications" class="notifications-container"></div>
    `;
    
    return this.container;
  }
}

export default HomePage;