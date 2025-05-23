import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

// Schéma de validation des variables d'environnement
const envValidate = Joi.object()
    .keys({
        NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
        APP_NAME: Joi.string().allow('').empty('').default('App Name'),

        PORT: Joi.number().allow('').empty('').default(3002),

        DB_HOST_PROD: Joi.string().required(),
        DB_HOST_DEV: Joi.string().required(),

        JWT_ACCESS_TOKEN_SECRET_PRIVATE: Joi.string().required(),
        JWT_ACCESS_TOKEN_SECRET_PUBLIC: Joi.string().required(),
        JWT_ACCESS_TOKEN_EXPIRATION_MINUTES: Joi.number().allow('').empty('').default(240),

        REFRESH_TOKEN_EXPIRATION_DAYS: Joi.number().allow('').empty('').default(1),
        VERIFY_EMAIL_TOKEN_EXPIRATION_MINUTES: Joi.number().allow('').empty('').default(60),
        RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES: Joi.number().allow('').empty('').default(30),

        SMTP_HOST: Joi.string().allow('').empty(''),
        SMTP_PORT: Joi.number().allow('').empty(''),
        SMTP_USERNAME: Joi.string().allow('').empty(''),
        SMTP_PASSWORD: Joi.string().allow('').empty(''),
        EMAIL_FROM: Joi.string().allow('').empty(''),

        FRONTEND_URL: Joi.string().allow('').empty('').default('http://localhost:3000'),
        IMAGE_URL: Joi.string().allow('').empty('').default('http://localhost:3002/images'),
    })
    .unknown();

// Validation des variables d'environnement
const { value: env, error } = envValidate.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
    throw new Error(`Config env error: ${error.message}`);
}

// Exporter les configurations
export default {
    NODE_ENV: env.NODE_ENV,
    APP_NAME: env.APP_NAME,
    PORT: env.PORT,

    // Choisir la base de données en fonction de l'environnement
    DATABASE_URI: env.NODE_ENV === 'production' ? env.DB_HOST_PROD : env.DB_HOST_DEV,
    DATABASE_OPTIONS: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        retryWrites: true,
        w: 'majority'
    },

    JWT_ACCESS_TOKEN_SECRET_PRIVATE: Buffer.from(env.JWT_ACCESS_TOKEN_SECRET_PRIVATE, 'base64'),
	JWT_ACCESS_TOKEN_SECRET_PUBLIC: Buffer.from(env.JWT_ACCESS_TOKEN_SECRET_PUBLIC, 'base64'),
    JWT_ACCESS_TOKEN_EXPIRATION_MINUTES: env.JWT_ACCESS_TOKEN_EXPIRATION_MINUTES,

    REFRESH_TOKEN_EXPIRATION_DAYS: env.REFRESH_TOKEN_EXPIRATION_DAYS,
    VERIFY_EMAIL_TOKEN_EXPIRATION_MINUTES: env.VERIFY_EMAIL_TOKEN_EXPIRATION_MINUTES,
    RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES: env.RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES,

    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT,
    SMTP_USERNAME: env.SMTP_USERNAME,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    EMAIL_FROM: env.EMAIL_FROM,

    FRONTEND_URL: env.FRONTEND_URL,
    IMAGE_URL: env.IMAGE_URL,

    TOKEN_TYPES: {
        REFRESH: 'refresh',
        VERIFY_EMAIL: 'verifyEmail',
        RESET_PASSWORD: 'resetPassword'
    }
};
