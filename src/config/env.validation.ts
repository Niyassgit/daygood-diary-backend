import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
    PORT: Joi.number().required(),

    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().required(),
    JWT_REFRESH_SECRET: Joi.string().required(),

    REDIS_HOST: Joi.string().required(),
    REDIS_PORT: Joi.number().required(),
    
    MAIL_HOST: Joi.string().required(),
    MAIL_PORT: Joi.number().required(),
    MAIL_SECURE: Joi.boolean().required(),
    MAIL_USER: Joi.string().email().required(),
    MAIL_PASSWORD: Joi.string().required(),
    MAIL_FROM: Joi.string().required(),
})