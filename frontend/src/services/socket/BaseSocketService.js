import { io } from 'socket.io-client';

/**
 * Service de base pour les connexions socket
 */
class BaseSocketService {
  constructor(namespace = '') {
    this.socket = null;
    this.namespace = namespace;
    this.isConnected = false;
    this.listeners = new Map();
    this.serverUrl = 'http://localhost:3002'; // Devrait être en configuration
  }

  /**
   * Connecter au serveur socket.io
   * @returns {Promise} Résolution lorsque connecté
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.socket) {
        return resolve(this.socket);
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        return reject(new Error('No authentication token available'));
      }

      const url = this.namespace ? `${this.serverUrl}/${this.namespace}` : this.serverUrl;
      
      this.socket = io(url, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve(this.socket);
      });

      this.socket.on('connect_error', (error) => {
        console.error(`Socket connection error to ${this.namespace || 'main'} namespace:`, error);
        this.isConnected = false;
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
      });
    });
  }

  /**
   * Déconnecter du serveur socket.io
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Émettre un événement
   * @param {string} eventName - Nom de l'événement
   * @param {Object} data - Données à envoyer
   * @returns {Promise} - Promise qui se résout quand l'événement est envoyé
   */
  emit(eventName, data = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        // S'assurer que le socket est connecté
        if (!this.isConnected || !this.socket) {
          console.warn(`Socket not connected for event '${eventName}'. Attempting to connect...`);
          try {
            await this.connect();
          } catch (error) {
            console.error(`Failed to connect for emitting event '${eventName}':`, error);
            return reject(error);
          }
        }
        
        // Nettoyer et vérifier les données
        const cleanData = {};
        
        if (data && typeof data === 'object') {
          // Vérifier chaque propriété et ne garder que celles qui sont valides
          Object.entries(data).forEach(([key, value]) => {
            // Éviter les undefined et les valeurs vides là où c'est important
            if (value !== undefined) {
              if (typeof value === 'string') {
                // Nettoyer les chaînes de caractères
                cleanData[key] = value.trim();
              } else {
                cleanData[key] = value;
              }
            }
          });
        }
        
        // Émission de l'événement avec les données nettoyées
        this.socket.emit(eventName, cleanData);
        resolve();
      } catch (error) {
        console.error(`Error emitting event '${eventName}':`, error);
        reject(error);
      }
    });
  }

  /**
   * Ajouter un écouteur d'événement avec gestion d'erreur
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de rappel
   * @returns {Promise} - Promise qui se résout quand l'écouteur est ajouté
   */
  async on(eventName, callback) {
    try {
      // S'assurer que le socket est connecté
      if (!this.isConnected || !this.socket) {
        console.warn(`Socket not connected for adding listener '${eventName}'. Attempting to connect...`);
        try {
          await this.connect();
        } catch (error) {
          console.error(`Failed to connect for adding listener '${eventName}':`, error);
          throw error;
        }
      }

      // Créer un wrapper pour le callback qui gère les erreurs
      const safeCallback = (...args) => {
        try {
          
          // Exécuter le callback original avec ses arguments
          callback(...args);
        } catch (error) {
          console.error(`Error in callback for event '${eventName}':`, error);
        }
      };

      // Stocker la référence du callback pour pouvoir le supprimer plus tard
      if (!this.listeners.has(eventName)) {
        this.listeners.set(eventName, []);
      }
      // Stocker le callback original et son wrapper
      this.listeners.get(eventName).push({ original: callback, wrapper: safeCallback });

      this.socket.on(eventName, safeCallback);
      return true;
    } catch (error) {
      console.error(`Error adding listener for event '${eventName}':`, error);
      throw error;
    }
  }

  /**
   * Supprimer un écouteur d'événement spécifique
   * @param {string} eventName - Nom de l'événement
   * @param {Function} callback - Fonction de rappel à supprimer
   */
  off(eventName, callback) {
    if (!this.socket || !this.listeners.has(eventName)) {
      return;
    }

    const callbacks = this.listeners.get(eventName);
    
    if (callback) {
      // Trouver le callback et son wrapper
      const callbackIndex = callbacks.findIndex(item => item.original === callback);
      
      if (callbackIndex !== -1) {
        // Récupérer le wrapper pour le désabonnement
        const wrapper = callbacks[callbackIndex].wrapper;
        this.socket.off(eventName, wrapper);
        
        // Retirer de la liste des callbacks
        callbacks.splice(callbackIndex, 1);
        
      }
    } else {
      // Supprimer tous les callbacks pour cet événement
      this.clearListeners(eventName);
    }
  }

  /**
   * Supprimer tous les écouteurs d'un événement
   * @param {string} eventName - Nom de l'événement
   */
  clearListeners(eventName) {
    if (!this.socket || !this.listeners.has(eventName)) {
      return;
    }
    
    
    const callbacks = this.listeners.get(eventName);
    callbacks.forEach(callbackObj => {
      // Utiliser le wrapper stocké pour désabonner
      if (callbackObj && callbackObj.wrapper) {
        this.socket.off(eventName, callbackObj.wrapper);
      }
    });
    
    this.listeners.delete(eventName);
  }

  /**
   * Supprimer tous les écouteurs d'événements
   */
  clearAllListeners() {
    if (this.socket) {

      for (const [eventName, callbacks] of this.listeners.entries()) {
        
        callbacks.forEach(callbackObj => {
          // Utiliser le wrapper stocké pour désabonner
          if (callbackObj && callbackObj.wrapper) {
            this.socket.off(eventName, callbackObj.wrapper);
          }
        });
      }
      
      this.listeners.clear();
    }
  }
}

export default BaseSocketService;
