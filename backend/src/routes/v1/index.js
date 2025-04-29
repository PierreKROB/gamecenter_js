import { Router } from 'express';
import userRoute from './userRoute';
import authRoute from './authRoute';
import roleRoute from './roleRoute';
import walletRoute from './walletRoute';

const router = Router();

router.use('/user', userRoute);
router.use('/auth', authRoute);
router.use('/role', roleRoute);
router.use('/wallet', walletRoute);

export default router;