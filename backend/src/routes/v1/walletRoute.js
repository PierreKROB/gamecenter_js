import { Router } from 'express';
import catchAsync from '~/utils/catchAsync';
import validate from '~/middlewares/validate';
import authenticate from '~/middlewares/authenticate';
import walletValidation from '~/validations/walletValidation';
import walletController from '~/controllers/walletController';

const router = Router();

// Routes pour l'utilisateur connecté
router.get('/me', authenticate(), catchAsync(walletController.getMyWallet));
router.get('/transactions', authenticate(), validate(walletValidation.getMyTransactions), catchAsync(walletController.getMyTransactions));
router.post('/bonus/daily', authenticate(), catchAsync(walletController.collectDailyBonus));
router.get('/bonus/status', authenticate(), catchAsync(walletController.checkDailyBonusStatus));

// Routes liées aux paris
router.post('/bet/check', authenticate(), validate(walletValidation.canPlaceBet), catchAsync(walletController.canPlaceBet));
router.post('/bet/place', authenticate(), validate(walletValidation.placeBet), catchAsync(walletController.placeBet));
router.post('/bet/custom', authenticate(), validate(walletValidation.placeCustomBet), catchAsync(walletController.placeCustomBet));
router.post('/winnings/claim', authenticate(), validate(walletValidation.claimWinnings), catchAsync(walletController.claimWinnings));

// Routes admin pour la gestion des fonds (nécessitent des permissions spéciales)
router.post('/admin/add', authenticate('wallet:add'), validate(walletValidation.addFunds), catchAsync(walletController.addFunds));
router.post('/admin/remove', authenticate('wallet:remove'), validate(walletValidation.removeFunds), catchAsync(walletController.removeFunds));

export default router;