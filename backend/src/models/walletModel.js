import mongoose from 'mongoose';
import toJSON from './plugins/toJSONPlugin';
import paginate from './plugins/paginatePlugin';
import APIError from '~/utils/apiError';
import status from 'http-status';

const walletSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'users',
            required: true,
            unique: true
        },
        balance: {
            type: Number,
            required: true,
            default: 1000,
            min: 0
        },
        transactions: [{
            type: {
                type: String,
                enum: ['deposit', 'withdrawal', 'bet', 'win', 'bonus', 'transfer'],
                required: true
            },
            amount: {
                type: Number,
                required: true
            },
            description: {
                type: String,
                required: true
            },
            gameId: {
                type: String,
                default: null
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        }]
    },
    {
        timestamps: true
    }
);

walletSchema.plugin(toJSON);
walletSchema.plugin(paginate);

class WalletClass {
    /**
     * Obtenir le portefeuille d'un utilisateur, en le créant si nécessaire
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Wallet>} - Portefeuille de l'utilisateur
     */
    static async getOrCreateWallet(userId) {
        let wallet = await this.findOne({ user: userId });

        if (!wallet) {
            // Créer un nouveau portefeuille avec le solde par défaut
            wallet = await this.create({
                user: userId,
                balance: 1000,
                transactions: [{
                    type: 'deposit',
                    amount: 1000,
                    description: 'Initial balance'
                }]
            });
        }

        return wallet;
    }

    /**
     * Ajouter des fonds au portefeuille
     * @param {string} userId - ID de l'utilisateur
     * @param {number} amount - Montant à ajouter
     * @param {string} description - Description de la transaction
     * @param {string} [gameId] - ID du jeu (optionnel)
     * @param {string} [type] - Type de transaction
     * @returns {Promise<Wallet>} - Portefeuille mis à jour
     */
    static async addFunds(userId, amount, description, gameId = null, type = 'deposit') {
        if (amount <= 0) {
            throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
        }

        const wallet = await this.getOrCreateWallet(userId);

        // Ajouter la transaction
        wallet.transactions.push({
            type,
            amount,
            description,
            gameId,
            createdAt: new Date()
        });

        // Mettre à jour le solde
        wallet.balance += amount;

        await wallet.save();
        return wallet;
    }

    /**
     * Retirer des fonds du portefeuille
     * @param {string} userId - ID de l'utilisateur
     * @param {number} amount - Montant à retirer
     * @param {string} description - Description de la transaction
     * @param {string} [gameId] - ID du jeu (optionnel)
     * @param {string} [type] - Type de transaction
     * @returns {Promise<Wallet>} - Portefeuille mis à jour
     */
    static async removeFunds(userId, amount, description, gameId = null, type = 'withdrawal') {
        if (amount <= 0) {
            throw new APIError('Le montant doit être positif', status.BAD_REQUEST);
        }

        const wallet = await this.getOrCreateWallet(userId);

        // Vérifier si le solde est suffisant
        if (wallet.balance < amount) {
            throw new APIError('Solde insuffisant', status.BAD_REQUEST);
        }

        // Ajouter la transaction
        wallet.transactions.push({
            type,
            amount: -amount, // Montant négatif pour les retraits
            description,
            gameId,
            createdAt: new Date()
        });

        // Mettre à jour le solde
        wallet.balance -= amount;

        await wallet.save();
        return wallet;
    }

    /**
     * Vérifier si l'utilisateur a suffisamment de fonds
     * @param {string} userId - ID de l'utilisateur
     * @param {number} amount - Montant à vérifier
     * @returns {Promise<boolean>} - true si l'utilisateur a suffisamment de fonds
     */
    static async hasSufficientFunds(userId, amount) {
        const wallet = await this.getOrCreateWallet(userId);
        return wallet.balance >= amount;
    }

    /**
     * Traiter un pari entre deux joueurs
     * @param {string} gameId - ID de la partie
     * @param {string} player1Id - ID du joueur 1
     * @param {string} player2Id - ID du joueur 2
     * @param {number} betAmount - Montant du pari
     * @param {string} gameType - Type de jeu
     * @returns {Promise<Object>} - Résultat de l'opération
     */
    static async processBetByPlayers(gameId, player1Id, player2Id, betAmount, gameType) {
        // Vérifier que les deux joueurs ont suffisamment de fonds
        const player1HasFunds = await this.hasSufficientFunds(player1Id, betAmount);
        const player2HasFunds = await this.hasSufficientFunds(player2Id, betAmount);

        if (!player1HasFunds || !player2HasFunds) {
            throw new APIError('Un ou plusieurs joueurs n\'ont pas suffisamment de fonds', status.BAD_REQUEST);
        }

        // Retirer les fonds des deux joueurs
        await this.removeFunds(
            player1Id,
            betAmount,
            `Mise pour une partie de ${gameType}`,
            gameId,
            'bet'
        );

        await this.removeFunds(
            player2Id,
            betAmount,
            `Mise pour une partie de ${gameType}`,
            gameId,
            'bet'
        );

        return {
            success: true,
            totalPot: betAmount * 2
        };
    }

    /**
     * Traiter un pari entre deux joueurs (méthode existante pour compatibilité)
     * @param {string} gameId - ID de la partie
     * @param {string} player1Id - ID du joueur 1
     * @param {string} player2Id - ID du joueur 2
     * @param {number} betAmount - Montant du pari
     * @param {string} gameType - Type de jeu
     * @returns {Promise<Object>} - Résultat de l'opération
     */
    static async processBet(gameId, player1Id, player2Id, betAmount, gameType) {
        // Vérifier que les deux joueurs ont suffisamment de fonds
        const player1HasFunds = await this.hasSufficientFunds(player1Id, betAmount);
        const player2HasFunds = await this.hasSufficientFunds(player2Id, betAmount);

        if (!player1HasFunds || !player2HasFunds) {
            throw new APIError('Un ou plusieurs joueurs n\'ont pas suffisamment de fonds', status.BAD_REQUEST);
        }

        // Retirer les fonds des deux joueurs
        await this.removeFunds(
            player1Id,
            betAmount,
            `Mise pour une partie de ${gameType}`,
            gameId,
            'bet'
        );

        await this.removeFunds(
            player2Id,
            betAmount,
            `Mise pour une partie de ${gameType}`,
            gameId,
            'bet'
        );

        return {
            success: true,
            totalPot: betAmount * 2
        };
    }

    /**
     * Attribuer les gains au vainqueur
     * @param {string} gameId - ID de la partie
     * @param {string} winnerId - ID du joueur gagnant
     * @param {number} amount - Montant à attribuer
     * @param {string} gameType - Type de jeu
     * @returns {Promise<Wallet>} - Portefeuille mis à jour du vainqueur
     */
    static async awardWinner(gameId, winnerId, amount, gameType) {
        return await this.addFunds(
            winnerId,
            amount,
            `Gains d'une partie de ${gameType}`,
            gameId,
            'win'
        );
    }

    /**
     * Rembourser les joueurs en cas de match nul
     * @param {string} gameId - ID de la partie
     * @param {string} player1Id - ID du joueur 1
     * @param {string} player2Id - ID du joueur 2
     * @param {number} betAmount - Montant du pari
     * @param {string} gameType - Type de jeu
     * @returns {Promise<Object>} - Résultat de l'opération
     */
    static async refundDraw(gameId, player1Id, player2Id, betAmount, gameType) {
        await this.addFunds(
            player1Id,
            betAmount,
            `Remboursement pour match nul (${gameType})`,
            gameId,
            'win'
        );

        await this.addFunds(
            player2Id,
            betAmount,
            `Remboursement pour match nul (${gameType})`,
            gameId,
            'win'
        );

        return {
            success: true,
            message: 'Les deux joueurs ont été remboursés'
        };
    }

    /**
     * Obtenir l'historique des transactions d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} options - Options de pagination
     * @returns {Promise<Array>} - Liste des transactions
     */
    static async getTransactionHistory(userId, options = {}) {
        const wallet = await this.getOrCreateWallet(userId);

        // Trier par date décroissante (plus récent en premier)
        let transactions = wallet.transactions.sort((a, b) => b.createdAt - a.createdAt);

        // Pagination simple
        const page = options.page || 1;
        const limit = options.limit || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        transactions = transactions.slice(startIndex, endIndex);

        return {
            transactions,
            total: wallet.transactions.length,
            page,
            limit
        };
    }
}

walletSchema.loadClass(WalletClass);

const Wallet = mongoose.model('wallets', walletSchema);

export default Wallet;