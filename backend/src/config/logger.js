import winston from 'winston';
import config from './config';
// Définir les niveaux de logs
const levels = {
    error: 0, // Logs critiques
    warn: 1,  // Avertissements
    info: 2,  // Informations générales
    http: 3,  // Logs des requêtes HTTP
    debug: 4  // Logs détaillés (utilisés en développement)
};

// Ajout des couleurs pour améliorer la lisibilité dans la console
winston.addColors({
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white'
});

// Définir le niveau de log en fonction de l'environnement
const logLevel = config.NODE_ENV === 'development' ? 'debug' : 'warn';

// Créer une instance Winston
const logger = winston.createLogger({
    level: logLevel,
    levels,
    format: winston.format.combine(
        // Ajout d'un timestamp pour chaque log
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // Définition d'un format de log personnalisé
        winston.format.printf(
            (info) => `${info.timestamp} [${info.level}]: ${info.message}`
        )
    ),
    transports: [
        // Fichier pour les erreurs critiques
        new winston.transports.File({
            level: 'error',
            filename: 'logs/error.log',
            maxsize: 10000000, // 10 Mo
            maxFiles: 10       // Conserver les 10 derniers fichiers
        }),
        // Fichier pour tous les logs combinés
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 10000000, // 10 Mo
            maxFiles: 10       // Conserver les 10 derniers fichiers
        })
    ]
});

// Ajouter un transport Console si en développement
if (config.NODE_ENV === 'development') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize({ all: true }), // Couleurs pour les logs
                winston.format.printf(
                    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
                )
            )
        })
    );
}

module.exports = logger;
