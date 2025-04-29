/**
 * Service de configuration de l'API
 */
const BASE_URL = 'http://localhost:3002/api';

// Configuration initiale
function getHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false;

// Méthodes d'API de base
async function get(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders()
    });

    const data = await response.json();
    
    if (!response.ok) {
      // Si le token est expiré et qu'on n'est pas déjà en train de rafraîchir
      if (response.status === 401 && !isRefreshing) {
        const refreshResult = await refreshToken();
        if (refreshResult) {
          // Réessayer la requête originale
          return await get(endpoint);
        }
      }
      throw data;
    }

    return data;
  } catch (error) {
    console.error(`Erreur lors de la requête GET ${endpoint}:`, error);
    throw error;
  }
}

async function post(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      // Si le token est expiré et qu'on n'est pas déjà en train de rafraîchir
      if (response.status === 401 && !isRefreshing) {
        const refreshResult = await refreshToken();
        if (refreshResult) {
          // Réessayer la requête originale
          return await post(endpoint, data);
        }
      }
      throw responseData;
    }

    return responseData;
  } catch (error) {
    console.error(`Erreur lors de la requête POST ${endpoint}:`, error);
    throw error;
  }
}

async function put(endpoint, data) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      // Si le token est expiré et qu'on n'est pas déjà en train de rafraîchir
      if (response.status === 401 && !isRefreshing) {
        const refreshResult = await refreshToken();
        if (refreshResult) {
          // Réessayer la requête originale
          return await put(endpoint, data);
        }
      }
      throw responseData;
    }

    return responseData;
  } catch (error) {
    console.error(`Erreur lors de la requête PUT ${endpoint}:`, error);
    throw error;
  }
}

// Fonction de gestion du refresh token
async function refreshToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    // Redirection vers la page de login si pas de refresh token
    window.location.hash = '/login';
    return false;
  }
  
  try {
    isRefreshing = true;
    
    const response = await fetch(`${BASE_URL}/auth/refresh-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });
    
    if (!response.ok) {
      throw new Error('Échec du rafraîchissement du token');
    }
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('accessToken', data.data.tokens.accessToken.token);
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken.token);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.hash = '/login';
    return false;
  } finally {
    isRefreshing = false;
  }
}

export default {
  get,
  post,
  put
};
