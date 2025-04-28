import Joi from 'joi';

export const createUser = {
    body: Joi.object().keys({
        userName: Joi.string().required(),
        password: Joi.string().required().min(6),
        is_temporary_password: Joi.boolean(),
        avatar: Joi.string().optional(),
        roles: Joi.array().items(Joi.string()).default([]),
        permissions: Joi.array().items(
            Joi.object({
                model: Joi.string().required(),
                action: Joi.string().required()
            })
        ),
        isDeleted: Joi.boolean(),
    }),
};

export const getUser = {
    params: Joi.object().keys({
        userId: Joi.string().required(),
    }),
};


export const updateUser = {
    params: Joi.object().keys({
        userId: Joi.string().required(),
    }),
    body: Joi.object().keys({
        firstname: Joi.string(),
        lastname: Joi.string(),
        username: Joi.string(),
        password: Joi.string().min(6),
        phone_number: Joi.string(),
        is_temporary_password: Joi.boolean(),
        id_address: Joi.string().optional(),
        avatar: Joi.string().optional(),
        role: Joi.array().items(Joi.string()),
        permissions: Joi.array().items(
            Joi.object({
                model: Joi.string().required(),
                action: Joi.string().required()
            })
        ),
        isDeleted: Joi.boolean(),
    }).min(1),
};

export const getUsers = {
    query: Joi.object().keys({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).default(10),
        search: Joi.string(),
        sortBy: Joi.string(),
        order: Joi.string().valid('asc', 'desc'),
    }),
};


export const deleteUser = {
    params: Joi.object().keys({
        userId: Joi.string().required(),
    }),
};

export default { createUser, getUser, updateUser, deleteUser };
