import authService from '../services/authService.js';

/**
 * Composant pour la page d'accueil après connexion
 */
class WelcomePage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'welcome-container';
    this.user = null;
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
   * Initialisation après le rendu
   */
  async afterRender() {
    // Récupérer l'utilisateur stocké localement
    this.user = authService.getStoredUser();
    this.updateUserInfo();
    
    // Charger les données fraîches depuis le serveur
    await this.loadUserData();
    
    // Ajouter les écouteurs d'événements
    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
      logoutButton.addEventListener('click', this.handleLogout);
    }
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    this.container.innerHTML = `
      <h1 class="welcome-title">Bienvenue sur GameCenter JS</h1>
      <p class="welcome-subtitle">Votre plateforme de jeux multijoueur</p>
      
      <div class="card user-info" id="user-info">
        <div class="spinner"></div>
        <p>Chargement des informations utilisateur...</p>
      </div>
      
      <div>
        <p>Vous êtes maintenant connecté et prêt à jouer !</p>
        <p>Les jeux seront bientôt disponibles ici.</p>
        <button id="logout-btn" class="form-submit">Se déconnecter</button>
      </div>
    `;
    
    return this.container;
  }
}

export default WelcomePage;
