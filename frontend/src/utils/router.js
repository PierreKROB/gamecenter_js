/**
 * Gestionnaire de routage simple pour une SPA
 */
class Router {
  constructor(routes, notFoundCallback) {
    this.routes = routes;
    this.notFoundCallback = notFoundCallback;
    this.init();
  }

  /**
   * Initialisation du routeur
   */
  init() {
    // Gérer les événements de changement de hash
    window.addEventListener('hashchange', () => this.handleRouting());
    
    // Gérer le routage initial
    this.handleRouting();
  }

  /**
   * Traitement du routage
   */
  handleRouting() {
    const url = window.location.hash.slice(1) || '/';
    const route = this.findRoute(url);
    
    if (route) {
      route.callback();
    } else if (this.notFoundCallback) {
      this.notFoundCallback();
    }
  }

  /**
   * Trouver une route correspondant à l'URL
   * @param {string} url - URL à rechercher
   * @returns {Object|null} - Route trouvée ou null
   */
  findRoute(url) {
    return this.routes.find(route => {
      if (route.path === url) {
        return true;
      }
      
      // Gestion des routes avec paramètres
      if (route.path.includes(':')) {
        const routeParts = route.path.split('/');
        const urlParts = url.split('/');
        
        if (routeParts.length !== urlParts.length) {
          return false;
        }
        
        const params = {};
        const isMatch = routeParts.every((part, i) => {
          if (part.startsWith(':')) {
            const paramName = part.slice(1);
            params[paramName] = urlParts[i];
            return true;
          }
          return part === urlParts[i];
        });
        
        if (isMatch) {
          route.params = params;
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Naviguer vers une route
   * @param {string} path - Chemin de la route
   */
  navigateTo(path) {
    window.location.hash = path;
  }
}

export default Router;
