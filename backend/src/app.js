import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import config from '~/config/config';
import passport from '~/config/passport';
import error from '~/middlewares/error';
import { globalRateLimiter } from '~/middlewares/rateLimiter';
import routes from '~/routes/v1';

const app = express();

// Utilisation de Morgan uniquement en environnement "development"
if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Middlewares de sécurité et configuration
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('public'));
app.use(globalRateLimiter);
app.use(passport.initialize());

// Routes
app.use('/api/', routes);

// Gestion des erreurs
app.use(error.notFound);
app.use(error.converter);
app.use(error.handler);

export default app;
