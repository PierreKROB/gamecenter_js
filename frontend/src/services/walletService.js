import api from './api.js';

/**
 * Service pour la gestion du portefeuille
 */
const walletService = {
    /**
     * Obtenir les informations du portefeuille de l'utilisateur connecté
     * @returns {Promise} - Promesse contenant les informations du portefeuille
     */
    getMyWallet: async () => {
        return await api.get('/wallet/me');
    },

    /**
     * Obtenir l'historique des transactions de l'utilisateur connecté
     * @param {Object} options - Options de pagination
     * @returns {Promise} - Promesse contenant l'historique des transactions
     */
    getMyTransactions: async (options = {}) => {
        const queryParams = new URLSearchParams();
        
        if (options.page) queryParams.append('page', options.page);
        if (options.limit) queryParams.append('limit', options.limit);
        
        const queryString = queryParams.toString();
        return await api.get(`/wallet/transactions${queryString ? `?${queryString}` : ''}`);
    },

    /**
     * Vérifier si l'utilisateur peut placer un pari
     * @param {number} amount - Montant à vérifier
     * @returns {Promise} - Promesse indiquant si l'utilisateur peut placer le pari
     */
    canPlaceBet: async (amount) => {
        return await api.post('/wallet/bet/check', { amount });
    },

    /**
     * Placer un pari
     * @param {string} gameId - ID de la partie
     * @param {number} amount - Montant du pari
     * @param {string} gameType - Type de jeu
     * @returns {Promise} - Promesse contenant le résultat de l'opération
     */
    placeBet: async (gameId, amount, gameType) => {
        return await api.post('/wallet/bet/place', { gameId, amount, gameType });
    },

    /**
     * Réclamer des gains
     * @param {string} gameId - ID de la partie
     * @param {number} amount - Montant des gains
     * @param {string} gameType - Type de jeu
     * @returns {Promise} - Promesse contenant le résultat de l'opération
     */
    claimWinnings: async (gameId, amount, gameType) => {
        return await api.post('/wallet/winnings/claim', { gameId, amount, gameType });
    },

    /**
     * Vérifier si l'utilisateur a déjà collecté son bonus quotidien
     * @returns {Promise} - Promesse contenant le statut du bonus quotidien
     */
    checkDailyBonusStatus: async () => {
        return await api.get('/wallet/bonus/status');
    },

    /**
     * Collecter le bonus quotidien
     * @returns {Promise} - Promesse contenant le résultat de l'opération
     */
    collectDailyBonus: async () => {
        return await api.post('/wallet/bonus/daily');
    },

    /**
     * Placer un pari personnalisé
     * @param {string} gameId - ID de la partie
     * @param {number} amount - Montant du pari
     * @param {string} gameType - Type de jeu
     * @param {string} opponentId - ID de l'adversaire
     * @returns {Promise} - Promesse contenant le résultat de la vérification
     */
    placeCustomBet: async (gameId, amount, gameType, opponentId) => {
        return await api.post('/wallet/bet/custom', { gameId, amount, gameType, opponentId });
    }
};

export default walletService;