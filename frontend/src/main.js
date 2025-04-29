import './style.css';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import WelcomePage from './pages/WelcomePage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import authService from './services/authService.js';

/**
 * Application principale simplifiée
 */
class App {
  constructor() {
    this.appElement = document.getElementById('app');
    this.currentPage = null;
    this.init();
  }

  /**
   * Initialisation de l'application
   */
  init() {
    // Rendu initial de l'interface
    this.renderApp();
    
    // Configuration des écouteurs d'événements pour le routage
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Routage initial
    this.handleRouting();
  }

  /**
   * Rendu de la structure de base de l'application
   */
  renderApp() {
    this.appElement.innerHTML = `
      <nav class="navbar">
        <div class="container nav-container">
          <a href="#/" class="nav-brand">GameCenter JS</a>
          <div class="nav-links" id="nav-links">
            <!-- Les liens de navigation seront injectés ici -->
          </div>
        </div>
      </nav>
      <div id="page-container" class="container">
        <!-- Le contenu de la page courante sera injecté ici -->
      </div>
    `;
    
    // Mettre à jour les liens de navigation en fonction de l'état d'authentification
    this.updateNavLinks();
  }

  /**
   * Mise à jour des liens de navigation
   */
  updateNavLinks() {
    const navLinksContainer = document.getElementById('nav-links');
    const isAuthenticated = authService.isAuthenticated();
    
    if (navLinksContainer) {
      navLinksContainer.innerHTML = isAuthenticated 
        ? `
            <a href="#/welcome" class="nav-link">Accueil</a>
            <button id="nav-logout-btn" class="nav-link" style="background: none; border: none; color: white; cursor: pointer;">Déconnexion</button>
          `
        : `
            <a href="#/login" class="nav-link">Connexion</a>
            <a href="#/register" class="nav-link">Inscription</a>
          `;
      
      // Ajouter l'écouteur d'événement pour le bouton de déconnexion
      const logoutButton = document.getElementById('nav-logout-btn');
      if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
          await authService.logout();
          this.updateNavLinks();
          window.location.hash = '/login';
        });
      }
    }
  }

  /**
   * Gestion du routage
   */
  handleRouting() {
    const url = window.location.hash.slice(1) || '/';
    const isAuthenticated = authService.isAuthenticated();
    
    // Routage en fonction de l'URL et de l'état d'authentification
    let pageComponent = null;
    
    switch (url) {
      case '/':
      case '/login':
        pageComponent = isAuthenticated ? new WelcomePage() : new LoginPage();
        if (isAuthenticated) {
          window.location.hash = '/welcome';
          return;
        }
        break;
      case '/register':
        pageComponent = isAuthenticated ? new WelcomePage() : new RegisterPage();
        if (isAuthenticated) {
          window.location.hash = '/welcome';
          return;
        }
        break;
      case '/welcome':
        if (!isAuthenticated) {
          window.location.hash = '/login';
          return;
        }
        pageComponent = new WelcomePage();
        break;
      default:
        pageComponent = new NotFoundPage();
    }
    
    // Rendu de la page
    if (pageComponent) {
      this.renderPage(pageComponent);
    }
    
    // Mise à jour des liens de navigation
    this.updateNavLinks();
  }

  /**
   * Rendu d'une page
   * @param {Object} pageComponent - Instance de la page à rendre
   */
  renderPage(pageComponent) {
    const pageContainer = document.getElementById('page-container');
    if (pageContainer) {
      // Vider le conteneur et ajouter la nouvelle page
      pageContainer.innerHTML = '';
      const pageElement = pageComponent.render();
      pageContainer.appendChild(pageElement);
      
      // Si la page a une méthode afterRender, l'appeler
      if (typeof pageComponent.afterRender === 'function') {
        setTimeout(() => {
          pageComponent.afterRender();
        }, 0);
      }
    }
  }
}

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
