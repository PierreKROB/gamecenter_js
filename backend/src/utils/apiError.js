class APIError extends Error {
	constructor(message, status = 500, isOperational = true) {
	  super();
	  this.name = this.constructor.name;
  
	  // Si le message est une chaîne, convertis-le en tableau
	  this.message = Array.isArray(message)
		? message
		: [{ message }];
  
	  this.status = status;
	  this.isOperational = isOperational;
	  Error.captureStackTrace(this, this.constructor);
	}
  }
  
  module.exports = APIError;
  