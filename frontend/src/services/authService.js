import api from './api.js';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur (userName, email, password)
   * @returns {Promise} - Promesse contenant les données de l'utilisateur et les tokens
   */
  async register(userData) {
    try {
      const response = await api.post('/auth/signup', userData);
      
      if (response.success) {
        // Stocker les tokens
        localStorage.setItem('accessToken', response.data.tokens.accessToken.token);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  /**
   * Connexion utilisateur
   * @param {Object} credentials - Identifiants (userName, password)
   * @returns {Promise} - Promesse contenant les données de l'utilisateur et les tokens
   */
  async login(credentials) {
    try {
      const response = await api.post('/auth/signin', credentials);
      
      if (response.success) {
        // Stocker les tokens
        localStorage.setItem('accessToken', response.data.tokens.accessToken.token);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  /**
   * Déconnexion utilisateur
   * @returns {Promise} - Promesse de déconnexion
   */
  async logout() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/signout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Supprimer les données locales même si l'API échoue
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Récupérer les informations de l'utilisateur courant
   * @returns {Promise} - Promesse contenant les données de l'utilisateur
   */
  async getCurrentUser() {
    return api.get('/auth/me');
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {Boolean} - true si l'utilisateur est connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  },

  /**
   * Récupérer l'utilisateur stocké localement
   * @returns {Object|null} - Données utilisateur ou null
   */
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authService;
