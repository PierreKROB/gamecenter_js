import { Router } from 'express';
import catchAsync from '~/utils/catchAsync';
import validate from '~/middlewares/validate';
import userValidation from '~/validations/userValidation';
import userController from '~/controllers/userController';
import authenticate from '~/middlewares/authenticate';

const router = Router();

router.get('/',
    authenticate('user:read'),
    validate(userValidation.getUsers),
    catchAsync(userController.getUsers)
);

router.get('/:userId',
    authenticate('user:read'),
    validate(userValidation.getUser),
    catchAsync(userController.getUser)
);

router.post('/',
    authenticate('user:create'),
    validate(userValidation.createUser),
    catchAsync(userController.createUser)
);

router.put('/:userId',
    authenticate('user:update'),
    validate(userValidation.updateUser),
    catchAsync(userController.updateUser)
);

router.delete('/:userId',
    authenticate('user:delete'),
    validate(userValidation.deleteUser),
    catchAsync(userController.deleteUser)
);

export default router;