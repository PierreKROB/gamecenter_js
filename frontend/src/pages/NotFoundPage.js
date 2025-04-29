/**
 * Composant pour la page 404 (non trouvée)
 */
class NotFoundPage {
  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'welcome-container';
  }

  /**
   * Rendu du composant
   * @returns {HTMLElement} - Élément HTML du composant
   */
  render() {
    this.container.innerHTML = `
      <h1 class="welcome-title">404 - Page non trouvée</h1>
      <p class="welcome-subtitle">La page que vous recherchez n'existe pas.</p>
      <div class="card">
        <p>Désolé, nous n'avons pas pu trouver la page que vous recherchiez.</p>
        <a href="#/" class="auth-link">Retour à l'accueil</a>
      </div>
    `;

    return this.container;
  }
}

export default NotFoundPage;
