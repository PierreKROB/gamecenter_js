import Joi from 'joi';
import { mongoId } from './customValidation';

export const getMyTransactions = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1),
        limit: Joi.number().integer().min(1).max(100)
    })
};

export const addFunds = {
    body: Joi.object().keys({
        userId: Joi.string().custom(mongoId).required(),
        amount: Joi.number().positive().required(),
        description: Joi.string().min(3).max(100).required()
    })
};

export const removeFunds = {
    body: Joi.object().keys({
        userId: Joi.string().custom(mongoId).required(),
        amount: Joi.number().positive().required(),
        description: Joi.string().min(3).max(100).required()
    })
};

export const canPlaceBet = {
    body: Joi.object().keys({
        amount: Joi.number().positive().required()
    })
};

export const placeBet = {
    body: Joi.object().keys({
        gameId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        gameType: Joi.string().required()
    })
};

export const claimWinnings = {
    body: Joi.object().keys({
        gameId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        gameType: Joi.string().required()
    })
};

export const placeCustomBet = {
    body: Joi.object().keys({
        gameId: Joi.string().required(),
        amount: Joi.number().positive().required(),
        gameType: Joi.string().required(),
        opponentId: Joi.string().custom(mongoId).required()
    })
};

export default {
    getMyTransactions,
    addFunds,
    removeFunds,
    canPlaceBet,
    placeBet,
    placeCustomBet,
    claimWinnings
};