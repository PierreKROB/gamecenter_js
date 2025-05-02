# GameCenter JS

Un jeu multijoueur développé en JavaScript Vanilla avec un backend Express.

## Structure du projet

Le projet est divisé en deux parties principales:

- `backend`: API RESTful avec Express et MongoDB
- `frontend`: Application web en JavaScript Vanilla

## Prérequis

- Node.js (v14+)
- MongoDB

## Installation

### Configuration du backend

1. Accédez au répertoire du backend:
   ```bash
   cd backend
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Créez un fichier `.env` dans le répertoire du backend avec les variables suivantes:
   ```
   NODE_ENV=development
   APP_NAME=GameCenter
   PORT=3002
   
   DB_HOST_PROD=mongodb://localhost:27017/gamecenter_prod
   DB_HOST_DEV=mongodb://localhost:27017/gamecenter_dev
   
   JWT_ACCESS_TOKEN_SECRET_PRIVATE=
   JWT_ACCESS_TOKEN_SECRET_PUBLIC=
   JWT_ACCESS_TOKEN_EXPIRATION_MINUTES=240
   
   REFRESH_TOKEN_EXPIRATION_DAYS=1
   VERIFY_EMAIL_TOKEN_EXPIRATION_MINUTES=60
   RESET_PASSWORD_TOKEN_EXPIRATION_MINUTES=30
   
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USERNAME=your_email@example.com
   SMTP_PASSWORD=your_email_password
   EMAIL_FROM=noreply@example.com
   
   FRONTEND_URL=http://localhost:3000
   IMAGE_URL=http://localhost:3002/images
   ```

4. Lancez le serveur backend:
   ```bash
   npm run dev
   ```

### Configuration du frontend

1. Accédez au répertoire du frontend:
   ```bash
   cd frontend
   ```

2. Installez les dépendances:
   ```bash
   npm install
   ```

3. Lancez le serveur de développement:
   ```bash
   npm run dev
   ```

4. Ouvrez votre navigateur et accédez à l'URL indiquée (généralement http://localhost:5173)

## Fonctionnalités

- Système d'authentification (inscription, connexion, déconnexion)
- Gestion des tokens (accessToken et refreshToken)
- Système de compte utilisateur
- Interface utilisateur responsive

## Contribuer

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/amazing-feature`)
3. Commitez vos changements (`git commit -m 'Add some amazing feature'`)
4. Poussez vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request
