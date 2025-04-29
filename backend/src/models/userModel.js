import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import paginate from './plugins/paginatePlugin';
import toJSON from './plugins/toJSONPlugin';
import APIError from '~/utils/apiError';
import Role from './roleModel';
import config from '~/config/config';
import status from 'http-status';

const userSchema = mongoose.Schema(
    {
        userName: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true,
            private: true
        },
        is_temporary_password: {
            type: Boolean,
            default: false
        },
        phone_number: {
            type: String,
            required: false
        },
        avatar: {
            type: String,
            default: 'avatar.png'
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        roles: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'roles'
            }
        ],
        permissions: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'permissions'
            }
        ],
        isDeleted: {
            type: Boolean,
            default: false
        },
    },
    {
		timestamps: true,
		toJSON: { virtuals: true }
	}
)

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.virtual('avatarUrl').get(function () {
    return config.IMAGE_URL + '/' + this.avatar;
});

class UserClass {

    static async isUserNameAlreadyExists(userName, excludeUserId) {
        return !!(await this.findOne({ userName, _id: { $ne: excludeUserId } }));
    }

    static async isEmailAlreadyExists(email, excludeUserId) {
		return !!(await this.findOne({ email, _id: { $ne: excludeUserId } }));
	}

    static async isRoleIdAlreadyExists(roleId, excludeUserId) {
		return !!(await this.findOne({ roles: roleId, _id: { $ne: excludeUserId } }));
	}

    static async getUser(id) {
        return await this.findById(id);
    }

    static async getUserWithRoles(id) {
        return await this.findOne({ _id: id, isDeleted: false }).populate({
            path: 'roles',
            select: 'name description createdAt updatedAt'
        });
    }

    static async getUserByUserName(userName) {
        return await this.findOne({ userName });
    }

    static async createUser(body) {
        if (await this.isUserNameAlreadyExists(body.userName)) {
            throw new APIError('User name already exists', status.BAD_REQUEST);
        }

        if (await this.isEmailAlreadyExists(body.email)) {
			throw new APIError('Email already exists', status.BAD_REQUEST);
		}

        if (body.roles) {
            const validRoles = await Role.find({ _id: { $in: body.roles } });
            if (validRoles.length !== body.roles.length) {
                throw new APIError('Some roles do not exist', status.BAD_REQUEST);
            }
        }

        return await this.create(body);
    }

    static async updateUser(userId, body) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new APIError('User not found', status.NOT_FOUND);
        }
        if (await this.isUserNameAlreadyExists(body.userName, userId)) {
            throw new APIError('User name already exists', status.BAD_REQUEST);
        }
        if (body.roles) {
            const validRoles = await Role.find({ _id: { $in: body.roles } });
            if (validRoles.length !== body.roles.length) {
                throw new APIError('Some roles do not exist', status.BAD_REQUEST);
            }
        }
        Object.assign(user, body);
        return await user.save();
    }

    static async deleteUser(userId) {
        const user = await this.getUser(userId);
        if (!user) {
            throw new APIError('User not found', status.NOT_FOUND);
        }
        user.isDeleted = true;
        return await user.save();
    }

    static async restoreUserById(userId) {
        const user = await this.getUser(userId);
        if (!user || !user.isDeleted) {
            throw new APIError('User not found or not deleted', status.NOT_FOUND);
        }
        user.isDeleted = false;
        return await user.save();
    }

    async isPasswordMatch(password) {
        return await bcrypt.compare(password, this.password);
    }
}

userSchema.loadClass(UserClass);

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.pre(['find', 'findOne', 'findById'], function (next) {
    if (!this.getFilter().includeDeleted) {
        this.setQuery({ ...this.getFilter(), isDeleted: false });
    }
    next();
});

const User = mongoose.model('users', userSchema);

export default User;