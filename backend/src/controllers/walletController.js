import Wallet from '~/models/walletModel';
import APIError from '~/utils/apiError';
import status from 'http-status';

/**
 * Obtenir le portefeuille de l'utilisateur courant
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getMyWallet = async (req, res) => {
    const wallet = await Wallet.getOrCreateWallet(req.user.id);
    
    return res.json({
        success: true,
        data: {
            balance: wallet.balance,
            userId: wallet.user
        }
    });
};

/**
 * Obtenir l'historique des transactions de l'utilisateur courant
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const getMyTransactions = async (req, res) => {
    const options = {
        page: req.query.page ? parseInt(req.query.page) : 1,
        limit: req.query.limit ? parseInt(req.query.limit) : 10
    };
    
    const result = await Wallet.getTransactionHistory(req.user.id, options);
    
    return res.json({
        success: true,
        data: result.transactions,
        pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit
        }
    });
};

/**
 * Ajouter des fonds au portefeuille (admin uniquement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const addFunds = async (req, res) => {
    const { userId, amount, description } = req.body;
    
    const wallet = await Wallet.addFunds(userId, amount, description);
    
    return res.json({
        success: true,
        data: {
            balance: wallet.balance,
            transaction: wallet.transactions[wallet.transactions.length - 1]
        }
    });
};

/**
 * Retirer des fonds du portefeuille (admin uniquement)
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const removeFunds = async (req, res) => {
    const { userId, amount, description } = req.body;
    
    const wallet = await Wallet.removeFunds(userId, amount, description);
    
    return res.json({
        success: true,
        data: {
            balance: wallet.balance,
            transaction: wallet.transactions[wallet.transactions.length - 1]
        }
    });
};

/**
 * Vérifier si l'utilisateur peut placer un pari
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const canPlaceBet = async (req, res) => {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
        throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
    }
    
    const hasFunds = await Wallet.hasSufficientFunds(req.user.id, amount);
    
    return res.json({
        success: true,
        data: {
            canPlaceBet: hasFunds,
            amount
        }
    });
};

/**
 * Placer un pari pour une partie
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const placeBet = async (req, res) => {
    const { gameId, amount, gameType } = req.body;
    
    if (!gameId) {
        throw new APIError('ID de jeu manquant', status.BAD_REQUEST);
    }
    
    if (!amount || amount <= 0) {
        throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
    }
    
    if (!gameType) {
        throw new APIError('Type de jeu manquant', status.BAD_REQUEST);
    }
    
    const result = await Wallet.removeFunds(
        req.user.id,
        amount,
        `Mise pour une partie de ${gameType}`,
        gameId,
        'bet'
    );
    
    return res.json({
        success: true,
        data: {
            gameId,
            amount,
            newBalance: result.balance
        }
    });
};

/**
 * Récupérer ses gains après une victoire
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const claimWinnings = async (req, res) => {
    const { gameId, amount, gameType } = req.body;
    
    if (!gameId) {
        throw new APIError('ID de jeu manquant', status.BAD_REQUEST);
    }
    
    if (!amount || amount <= 0) {
        throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
    }
    
    if (!gameType) {
        throw new APIError('Type de jeu manquant', status.BAD_REQUEST);
    }
    
    const result = await Wallet.addFunds(
        req.user.id,
        amount,
        `Gains d'une partie de ${gameType}`,
        gameId,
        'win'
    );
    
    return res.json({
        success: true,
        data: {
            gameId,
            amount,
            newBalance: result.balance
        }
    });
};

/**
 * Vérifier si l'utilisateur a déjà collecté son bonus quotidien
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const checkDailyBonusStatus = async (req, res) => {
    const wallet = await Wallet.getOrCreateWallet(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasCollectedToday = wallet.transactions.some(t => 
        t.type === 'bonus' && 
        t.description.includes('Bonus quotidien') &&
        new Date(t.createdAt) >= today
    );
    
    return res.json({
        success: true,
        data: {
            hasCollectedToday
        }
    });
};

/**
 * Placer un pari personnalisé
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const placeCustomBet = async (req, res) => {
    const { gameId, amount, gameType, opponentId } = req.body;
    
    if (!gameId) {
        throw new APIError('ID de jeu manquant', status.BAD_REQUEST);
    }
    
    if (!amount || amount <= 0) {
        throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
    }
    
    if (!gameType) {
        throw new APIError('Type de jeu manquant', status.BAD_REQUEST);
    }
    
    if (!opponentId) {
        throw new APIError('ID de l\'adversaire manquant', status.BAD_REQUEST);
    }
    
    // Vérifier que les deux joueurs ont suffisamment de fonds
    const currentUserHasFunds = await Wallet.hasSufficientFunds(req.user.id, amount);
    const opponentHasFunds = await Wallet.hasSufficientFunds(opponentId, amount);
    
    if (!currentUserHasFunds || !opponentHasFunds) {
        return res.json({
            success: false,
            message: 'Un ou plusieurs joueurs n\'ont pas suffisamment de fonds'
        });
    }
    
    return res.json({
        success: true,
        data: {
            gameId,
            amount,
            canProceed: true
        }
    });
};

/**
 * Collecter un bonus quotidien
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
export const collectDailyBonus = async (req, res) => {
    // Vérifier si l'utilisateur a déjà collecté le bonus aujourd'hui
    const wallet = await Wallet.getOrCreateWallet(req.user.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const hasCollectedToday = wallet.transactions.some(t => 
        t.type === 'bonus' && 
        t.description.includes('Bonus quotidien') &&
        new Date(t.createdAt) >= today
    );
    
    if (hasCollectedToday) {
        throw new APIError('Vous avez déjà collecté votre bonus quotidien aujourd\'hui', status.BAD_REQUEST);
    }
    
    // Montant aléatoire entre 50 et 150
    const amount = Math.floor(Math.random() * 101) + 50;
    
    const result = await Wallet.addFunds(
        req.user.id,
        amount,
        `Bonus quotidien du ${new Date().toLocaleDateString()}`,
        null,
        'bonus'
    );
    
    return res.json({
        success: true,
        data: {
            amount,
            newBalance: result.balance,
            message: `Vous avez reçu ${amount} GameCoins!`
        }
    });
};

export default {
    getMyWallet,
    getMyTransactions,
    addFunds,
    removeFunds,
    canPlaceBet,
    placeBet,
    placeCustomBet,
    claimWinnings,
    collectDailyBonus,
    checkDailyBonusStatus
};