import './styles/index.css';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import HomePage from './pages/HomePage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import TicTacToePage from './pages/TicTacToePage.js';
import authService from './services/authService.js';
import Navbar from './components/Navbar.js';
import { cleanupAllSocketConnections } from './services/socket';

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
    // Vider l'élément app
    this.appElement.innerHTML = '';
    
    // Créer et ajouter la navbar comme composant
    const navbar = new Navbar();
    this.appElement.appendChild(navbar.render());
    
    // Créer le conteneur de page
    const pageContainer = document.createElement('div');
    pageContainer.id = 'page-container';
    pageContainer.className = 'container';
    this.appElement.appendChild(pageContainer);
  }

  /**
   * Nettoyage de la page courante
   */
  cleanupCurrentPage() {
    if (this.currentPage && typeof this.currentPage.destroy === 'function') {
      this.currentPage.destroy();
    }
  }

  /**
   * Gestion du routage
   */
  handleRouting() {
    const url = window.location.hash.slice(1) || '/';
    const isAuthenticated = authService.isAuthenticated();
    
    // Nettoyer la page courante
    this.cleanupCurrentPage();
    
    // Routage en fonction de l'URL et de l'état d'authentification
    let pageComponent = null;
    
    switch (url) {
      case '/':
      case '/login':
        pageComponent = isAuthenticated ? new HomePage() : new LoginPage();
        if (isAuthenticated) {
          window.location.hash = '/home';
          return;
        }
        break;
      case '/register':
        pageComponent = isAuthenticated ? new HomePage() : new RegisterPage();
        if (isAuthenticated) {
          window.location.hash = '/home';
          return;
        }
        break;
      case '/home':
        if (!isAuthenticated) {
          window.location.hash = '/login';
          return;
        }
        pageComponent = new HomePage();
        break;
      case '/tic-tac-toe':
        if (!isAuthenticated) {
          window.location.hash = '/login';
          return;
        }
        pageComponent = new TicTacToePage();
        break;
      default:
        pageComponent = new NotFoundPage();
    }
    
    // Rendu de la page
    if (pageComponent) {
      this.currentPage = pageComponent;
      this.renderPage(pageComponent);
    }
    
    // Forcer la mise à jour de la navbar lors d'un changement de route
    const navbar = new Navbar();
    const oldNavbar = document.querySelector('.navbar');
    if (oldNavbar) {
      this.appElement.replaceChild(navbar.render(), oldNavbar);
    }
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

// Au moment de quitter l'application, nettoyer les connexions
window.addEventListener('beforeunload', () => {
  cleanupAllSocketConnections();
});

// Initialiser l'application au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
