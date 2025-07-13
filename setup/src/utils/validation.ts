import Joi from 'joi';
import { ScriptInputs } from '../models';
import { logger } from './logger';

/**
 * Validates and sets defaults for script inputs
 * @param inputs Raw input parameters
 * @returns Validated and normalized inputs
 */
export function validateInputs(inputs: Partial<ScriptInputs>): ScriptInputs {
    logger.debug('Validating inputs', { ...inputs, API_KEY: inputs.API_KEY ? '[PRESENT]' : '[MISSING]' });

    // Define validation schema
    const schema = Joi.object({
        // Required inputs
        API_KEY: Joi.string().required().messages({
            'any.required': 'API_KEY is required',
            'string.empty': 'API_KEY cannot be empty'
        }),

        // Optional inputs with defaults
        FUSION_AUTH_URL: Joi.string().uri().default('http://localhost/auth').messages({
            'string.uri': 'FUSION_AUTH_URL must be a valid URL'
        }),
        APP_NAME: Joi.string().default('GameHub'),
        ADMIN_REDIRECT_URI: Joi.string().uri().default('http://localhost/portal/callback').messages({
            'string.uri': 'ADMIN_REDIRECT_URI must be a valid URL'
        }),
        PLAYER_REDIRECT_URI: Joi.string().uri().default('http://localhost/player/callback').messages({
            'string.uri': 'PLAYER_REDIRECT_URI must be a valid URL'
        }),
        CONTENT_STORE_URL: Joi.string().uri().default('http://localhost/content').messages({
            'string.uri': 'CONTENT_STORE_URL must be a valid URL'
        }),
        REPLICATOR_URL: Joi.string().uri().default('http://localhost/replicator/jinaga').messages({
            'string.uri': 'REPLICATOR_URL must be a valid URL'
        }),
        PLAYER_IP_URL: Joi.string().uri().default('http://localhost/player-ip').messages({
            'string.uri': 'PLAYER_IP_URL must be a valid URL'
        }),
        JWT_SECRET: Joi.string().default('development-secret-key'),
        JWT_ISSUER: Joi.string().default('player-ip'),
        JWT_AUDIENCE: Joi.string().default('gamehub-player'),
        PLAYER_APP_URL: Joi.string().uri().default('http://localhost/player').messages({
            'string.uri': 'PLAYER_APP_URL must be a valid URL'
        })
    });

    // Validate inputs
    const { error, value } = schema.validate(inputs, { abortEarly: false });

    if (error) {
        const errorMessages = error.details.map(detail => detail.message).join(', ');
        logger.error(`Input validation failed: ${errorMessages}`);
        throw new Error(`Input validation failed: ${errorMessages}`);
    }

    logger.debug('Input validation successful', {
        ...value,
        API_KEY: '[REDACTED]',
        JWT_SECRET: '[REDACTED]'
    });

    return value as ScriptInputs;
}

/**
 * Validates a URL string
 * @param url URL to validate
 * @throws Error if URL is invalid
 */
export function validateUrl(url: string): void {
    try {
        new URL(url);
    } catch (error) {
        throw new Error(`Invalid URL: ${url}`);
    }
}

/**
 * Extracts hostname and port from a URL
 * @param url URL to extract from
 * @returns Hostname with port if present
 */
export function extractHostname(url: string): string {
    try {
        const urlObj = new URL(url);
        return `${urlObj.hostname}${urlObj.port ? ':' + urlObj.port : ''}`;
    } catch (error) {
        throw new Error(`Invalid URL: ${url}`);
    }
}