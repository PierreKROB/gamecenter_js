import authService from '../services/authService.js';

/**
 * Composant pour la barre de navigation
 */
class Navbar {
  constructor() {
    this.container = document.createElement('nav');
    this.container.className = 'navbar';
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
   * Initialisation après le rendu
   */
  afterRender() {
    const logoutButton = document.getElementById('nav-logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', this.handleLogout.bind(this));
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
                <a href="#/welcome" class="nav-link">Accueil</a>
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
