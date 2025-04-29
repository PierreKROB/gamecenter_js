import jwt from 'jsonwebtoken';
import logger from '~/config/logger';
import config from '~/config/config';
import User from '~/models/userModel';

/**
 * Middleware d'authentification pour Socket.io
 * @param {SocketIO.Socket} socket - Socket de connexion
 * @param {Function} next - Fonction next
 */
const authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    logger.info(`Socket authentication attempt with token: ${token ? 'Token provided' : 'No token'}`);
    
    if (!token) {
      logger.error('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: Token required'));
    }
    
    // Vérifier le token JWT
    const decoded = jwt.verify(token, config.JWT_ACCESS_TOKEN_SECRET_PUBLIC, { algorithms: ['RS256'] });
    logger.info(`Token verified for user ID: ${decoded.sub}`);
    
    // Récupérer l'utilisateur associé
    const user = await User.getUser(decoded.sub);
    
    if (!user) {
      logger.error(`Socket authentication failed: User not found with ID ${decoded.sub}`);
      return next(new Error('Authentication error: User not found'));
    }
    
    // Stocker l'utilisateur dans l'objet socket pour un accès ultérieur
    socket.user = user;
    logger.info(`Socket authenticated for user: ${user.userName} (${user.id})`);
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
};

/**
 * Configuration du middleware d'authentification pour Socket.io
 * @param {SocketIO.Server} io - Serveur Socket.io
 */
const setupAuthMiddleware = (io) => {
  // Middleware d'authentification pour toutes les connexions
  io.use(authMiddleware);
  
  // Middleware d'authentification pour le namespace des jeux
  io.of('/games').use(authMiddleware);
};

export {
  authMiddleware,
  setupAuthMiddleware
};
