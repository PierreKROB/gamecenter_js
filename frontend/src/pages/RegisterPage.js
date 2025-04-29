import authService from '../services/authService.js';

/**
 * Composant pour la page d'inscription
 */
class RegisterPage {
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
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const errorElement = document.getElementById('error-message');
    const submitButton = document.getElementById('submit-btn');
    const spinner = document.getElementById('spinner');
    
    // Validation basique
    if (!userName || !email || !password) {
      errorElement.textContent = 'Veuillez remplir tous les champs';
      return;
    }
    
    if (password !== confirmPassword) {
      errorElement.textContent = 'Les mots de passe ne correspondent pas';
      return;
    }
    
    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorElement.textContent = 'Veuillez entrer une adresse email valide';
      return;
    }
    
    // Validation du mot de passe
    if (password.length < 6) {
      errorElement.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
      return;
    }
    
    // Afficher le spinner et désactiver le bouton
    submitButton.disabled = true;
    spinner.style.display = 'inline-block';
    errorElement.textContent = '';
    
    try {
      await authService.register({ userName, email, password });
      // Redirection vers la page d'accueil
      window.location.hash = '/welcome';
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      errorElement.textContent = error.errors ? 
        error.errors.map(err => err.message).join(', ') : 
        'Erreur d\'inscription. Veuillez réessayer.';
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
      <h2 class="auth-title">Inscription</h2>
      <form id="register-form">
        <div class="form-group">
          <label for="userName">Nom d'utilisateur</label>
          <input type="text" id="userName" name="userName" required>
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
        </div>
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input type="password" id="password" name="password" required>
        </div>
        <div class="form-group">
          <label for="confirmPassword">Confirmer le mot de passe</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required>
        </div>
        <div id="error-message" class="error-message"></div>
        <button id="submit-btn" type="submit" class="form-submit">
          S'inscrire
          <span id="spinner" class="spinner" style="display: none;"></span>
        </button>
      </form>
      <a href="#/login" class="auth-link">Déjà inscrit ? Se connecter</a>
    `;
    
    // Ajouter les écouteurs d'événements
    const form = this.container.querySelector('#register-form');
    if (form) {
      form.addEventListener('submit', this.handleSubmit);
    }
    
    return this.container;
  }
}

export default RegisterPage;
