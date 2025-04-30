import authService from '../services/authService.js';

/**
 * Composant pour la page de connexion
 */
class LoginPage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'auth-container';
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  /**
   * Gérer la soumission du formulaire
   * @param {Event} e - Événement de soumission
   */
  async handleSubmit(e) {
    e.preventDefault();

    const userName = document.getElementById('userName').value;
    const password = document.getElementById('password').value;
    const errorElement = document.getElementById('error-message');
    const submitButton = document.getElementById('submit-btn');
    const spinner = document.getElementById('spinner');

    // Validation basique
    if (!userName || !password) {
      errorElement.textContent = 'Veuillez remplir tous les champs';
      return;
    }

    // Afficher le spinner et désactiver le bouton
    submitButton.disabled = true;
    spinner.style.display = 'inline-block';
    errorElement.textContent = '';

    try {
      await authService.login({ userName, password });
      // Redirection vers la page d'accueil
      window.location.hash = '/home';
    } catch (error) {
      console.error('Erreur de connexion:', error);
      errorElement.textContent = error.errors ?
        error.errors.map(err => err.message).join(', ') :
        'Erreur de connexion. Veuillez réessayer.';
    } finally {
      // Masquer le spinner et réactiver le bouton
      submitButton.disabled = false;
      spinner.style.display = 'none';
    }
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    this.container.innerHTML = `
      <h2 class="auth-title">Connexion</h2>
      <form id="login-form">
        <div class="form-group">
          <label for="userName">Nom d'utilisateur</label>
          <input type="text" id="userName" name="userName" required>
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div id="error-message" class="error-message"></div>
        <button id="submit-btn" type="submit" class="form-submit">
          Se connecter
          <span id="spinner" class="spinner" style="display: none;"></span>
        </button>
      </form>
      <a href="#/register" class="auth-link">Pas encore inscrit ? Créer un compte</a>
    `;

    // Ajouter les écouteurs d'événements
    const form = this.container.querySelector('#login-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }

    return this.container;
  }
}

export default LoginPage;
