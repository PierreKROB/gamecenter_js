import passport from 'passport';
import status from 'http-status';
import APIError from '~/utils/apiError';
import Role from '~/models/roleModel';

const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
    if (err || info || !user) {
        return reject(new APIError(status[status.UNAUTHORIZED], status.UNAUTHORIZED));
    }
    req.user = user;
    if (requiredRights.length) {
        const userRights = [];
        const roles = await Role.find({ _id: { $in: user.roles } }).populate('permissions');
        roles.forEach((i) => {
            i.permissions.forEach((j) => {
                userRights.push(`${j.controller}:${j.action}`);
            });
        });
        const hasRequiredRights = requiredRights.every((r) => userRights.includes(r));
        if (!hasRequiredRights) {
            return reject(new APIError('Resource access denied', status.FORBIDDEN));
        }
    }
    return resolve();
};

const authenticate =
    (...requiredRights) =>
        async (req, res, next) => {
            return new Promise((resolve, reject) => {
                passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
            })
                .then(() => next())
                .catch((err) => next(err));
        };

export default authenticate;