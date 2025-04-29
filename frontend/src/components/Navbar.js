import authService from '../services/authService.js';
import walletService from '../services/walletService.js';

/**
 * Composant pour la barre de navigation
 */
class Navbar {
  constructor() {
    this.container = document.createElement('nav');
    this.container.className = 'navbar';
    this.wallet = null;
    this.handleLogout = this.handleLogout.bind(this);
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
    }
  }

  /**
   * Charger les informations du portefeuille
   */
  async loadWalletData() {
    if (!authService.isAuthenticated()) {
      return;
    }

    try {
      const response = await walletService.getMyWallet();
      if (response.success) {
        this.wallet = response.data;
        this.updateWalletDisplay();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du portefeuille dans la navbar:', error);
    }
  }

  /**
   * Mettre à jour l'affichage du portefeuille
   */
  updateWalletDisplay() {
    const walletElement = document.getElementById('nav-wallet');
    if (walletElement && this.wallet) {
      walletElement.innerHTML = `
        <span class="nav-wallet-balance">${this.wallet.balance}</span>
        <span class="nav-wallet-currency">GC</span>
      `;
      walletElement.classList.remove('loading');
    }
  }

  /**
   * Initialisation après le rendu
   */
  afterRender() {
    const logoutButton = document.getElementById('nav-logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', this.handleLogout);
    }
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    const isAuthenticated = authService.isAuthenticated();
    
    this.container.innerHTML = `
      <div class="container nav-container">
        <a href="#/" class="nav-brand">GameCenter JS</a>
        <div class="nav-links">
          ${isAuthenticated 
            ? `
                <a href="#/tic-tac-toe" class="nav-link">Morpion</a>
                <button id="nav-logout-btn" class="nav-link" style="background: none; border: none; color: white; cursor: pointer;">Déconnexion</button>
              `
            : `
                <a href="#/login" class="nav-link">Connexion</a>
                <a href="#/register" class="nav-link">Inscription</a>
              `
          }
        </div>
      </div>
    `;
    
    // Initialiser après le rendu
    setTimeout(() => {
      this.afterRender();
    }, 0);
    
    return this.container;
  }
}

export default Navbar;
