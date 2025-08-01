/**
 * In-memory repository implementation
 *
 * Note: In a production environment, this would be replaced with a database implementation
 */

import { v4 as uuidv4 } from 'uuid';
import {
    AuthorizationCode,
    User,
    UserIdentity,
} from '../../models';

// In-memory storage
const users: Map<string, User> = new Map();
const userIdentities: Map<string, string> = new Map(); // Map of cookie value to user ID
const authCodes: Map<string, AuthorizationCode> = new Map();

/**
 * User repository functions
 */

export const createUser = (): User => {
    const userId = uuidv4();
    const user: User = {
        id: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    users.set(userId, user);
    return user;
};

export const getUserById = (userId: string): User | undefined => {
    return users.get(userId);
};

export const updateUser = (user: User): User => {
    user.updatedAt = new Date();
    users.set(user.id, user);
    return user;
};

export const storeUserIdentity = (userId: string, cookieValue: string): UserIdentity => {
    userIdentities.set(cookieValue, userId);

    // Update the user with the identity cookie
    const user = users.get(userId);
    if (user) {
        user.identityCookie = cookieValue;
        updateUser(user);
    }

    return { userId, cookieValue };
};

/**
 * Authorization code repository functions
 */

export const storeAuthorizationCode = (code: AuthorizationCode): AuthorizationCode => {
    authCodes.set(code.code, code);
    return code;
};

export const getAuthorizationCode = (code: string): AuthorizationCode | undefined => {
    return authCodes.get(code);
};

export const deleteAuthorizationCode = (code: string): boolean => {
    return authCodes.delete(code);
};
