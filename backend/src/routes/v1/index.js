import { Router } from 'express';
import userRoute from './userRoute';
import authRoute from './authRoute';
import roleRoute from './roleRoute';

const router = Router();

router.use('/user', userRoute);
router.use('/auth', authRoute);
router.use('/role', roleRoute);

export default router;