import APIError from '~/utils/apiError';
import tokenService from '~/services/tokenService';
import emailService from '~/services/emailService';
import User from '~/models/userModel';
import config from '~/config/config';
import status from 'http-status';
import Token from '~/models/tokenModel';
import Role from '~/models/roleModel';

export const signup = async (req, res) => {
	const role = await Role.getRoleByName('User');
	req.body.roles = [role.id];
	const user = await User.createUser(req.body);
	const tokens = await tokenService.generateAuthTokens(user);
	return res.json({
		success: true,
		data: { user, tokens }
	});
};

export const signin = async (req, res) => {
	const user = await User.getUserByUserName(req.body.userName);
	if (!user || !(await user.isPasswordMatch(req.body.password))) {
		throw new APIError('Incorrect user name or password', status.BAD_REQUEST);
	}
	const tokens = await tokenService.generateAuthTokens(user);
	return res.json({
		success: true,
		data: { user, tokens }
	});
};

export const current = async (req, res) => {
	const user = await User.getUser(req.user.id);
	if (!user) {
		throw new APIError('User not found', status.NOT_FOUND);
	}
	return res.json({
		success: true,
		data: {
			firstName: user.firstName,
			lastName: user.lastName,
			userName: user.userName,
			avatarUrl: user.avatarUrl
		}
	});
};

export const getMe = async (req, res) => {
	const user = await User.getUserWithRoles(req.user.id);
	if (!user) {
		throw new APIError('User not found', status.NOT_FOUND);
	}
	return res.json({
		success: true,
		data: user
	});
};

export const updateMe = async (req, res) => {
	const user = await User.updateUser(req.user.id, req.body);
	return res.json({
		success: true,
		data: user
	});
};

export const signout = async (req, res) => {
	await Token.revokeToken(req.body.refreshToken, config.TOKEN_TYPES.REFRESH);
	return res.json({
		success: true,
		data: 'Signout success'
	});
};

export const refreshTokens = async (req, res) => {
	try {
		const refreshTokenDoc = await tokenService.verifyToken(req.body.refreshToken, config.TOKEN_TYPES.REFRESH);
		const user = await User.getUser(refreshTokenDoc.user);
		if (!user) {
			throw new Error();
		}
		await refreshTokenDoc.remove();
		const tokens = await tokenService.generateAuthTokens(user);
		return res.json({
			success: true,
			data: {
				tokens
			}
		});
	} catch (err) {
		throw new APIError(err.message, status.UNAUTHORIZED);
	}
};

export const sendVerificationEmail = async (req, res) => {
	const user = await User.getUserByEmail(req.user.email);
	if (user.confirmed) {
		throw new APIError('Email verified', status.BAD_REQUEST);
	}
	const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
	await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
	return res.json({
		success: true,
		data: 'Send verification email success'
	});
};

export const verifyEmail = async (req, res) => {
	try {
		const verifyEmailTokenDoc = await tokenService.verifyToken(req.query.token, config.TOKEN_TYPES.VERIFY_EMAIL);
		const user = await User.getUser(verifyEmailTokenDoc.user);
		if (!user) {
			throw new Error();
		}
		await Token.deleteMany({ user: user.id, type: config.TOKEN_TYPES.VERIFY_EMAIL });
		await User.updateUser(user.id, { confirmed: true });
		return res.json({
			success: true,
			data: 'Verify email success'
		});
	} catch (err) {
		throw new APIError('Email verification failed', status.UNAUTHORIZED);
	}
};

export const forgotPassword = async (req, res) => {
	const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
	await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
	return res.json({
		success: true,
		data: 'Send forgot password email success'
	});
};

export const resetPassword = async (req, res) => {
	try {
		const resetPasswordTokenDoc = await tokenService.verifyToken(req.query.token, config.TOKEN_TYPES.RESET_PASSWORD);
		const user = await User.getUser(resetPasswordTokenDoc.user);
		if (!user) {
			throw new Error();
		}
		await Token.deleteMany({ user: user.id, type: config.TOKEN_TYPES.RESET_PASSWORD });
		await User.updateUser(user.id, { password: req.body.password });
		return res.json({
			success: true,
			data: 'Reset password success'
		});
	} catch (err) {
		throw new APIError('Password reset failed', status.UNAUTHORIZED);
	}
};

export default {
	signup,
	signin,
	current,
	getMe,
	updateMe,
	signout,
	refreshTokens,
	sendVerificationEmail,
	verifyEmail,
	forgotPassword,
	resetPassword
};