import status from 'http-status';
import Joi from 'joi';
import config from '~/config/config';
import logger from '~/config/logger';
import APIError from '~/utils/apiError';

// Middleware pour convertir les erreurs
const converter = (err, req, res, next) => {
  if (err instanceof Joi.ValidationError) {
    const errorMessage = err.details.map((d) => ({
      message: d.message,
      location: d.path[1],
      locationType: d.path[0],
    }));

    const apiError = new APIError(errorMessage, status.BAD_REQUEST);
    apiError.stack = err.stack;
    return next(apiError);
  }

  if (!(err instanceof APIError)) {
    const statusCode = err.status || status.INTERNAL_SERVER_ERROR;
    const message = err.message || status[statusCode];

    const apiError = new APIError(message, statusCode, false);
    apiError.stack = err.stack;
    apiError.message = [{ message: err.message }];
    return next(apiError);
  }
  err.message = [{ message: err.message }];
  return next(err);
};

// Middleware pour les routes non trouvées
const notFound = (req, res, next) => {
  const message = 'bad endpoint';
  next(new APIError([{ message }], status.NOT_FOUND));
};

// Middleware pour gérer les erreurs globales
const handler = (err, req, res, next) => {
  const statusCode = err.status || status.INTERNAL_SERVER_ERROR;

  const message = Array.isArray(err.message)
    ? err.message
    : [{ message: err.message || 'Erreur interne du serveur' }];

  logger.error(`[${new Date().toISOString()}] [Handler] Erreur stack :`, err.stack);

  res.status(statusCode).json({
    status: statusCode,
    errors: message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default {
  converter,
  notFound,
  handler,
};
