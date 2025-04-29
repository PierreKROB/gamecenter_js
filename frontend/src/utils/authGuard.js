import authService from '../services/authService.js';

/**
 * Utilitaire pour protéger les routes qui nécessitent une authentification
 */
const authGuard = {
  /**
   * Vérifier si l'utilisateur est authentifié, sinon rediriger vers la page de connexion
   * @returns {boolean} - true si authentifié
   */
  checkAuth() {
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      window.location.hash = '/login';
      return false;
    }
    
    return true;
  },

  /**
   * Vérifier si l'utilisateur est déjà authentifié, si oui rediriger vers la page d'accueil
   * @returns {boolean} - true si non authentifié
   */
  checkNotAuth() {
    const isAuthenticated = authService.isAuthenticated();
    
    if (isAuthenticated) {
      window.location.hash = '/welcome';
      return false;
    }
    
    return true;
  }
};

export default authGuard;
