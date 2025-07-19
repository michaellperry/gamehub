/**
 * User model for the attendee identity provider
 */

export interface User {
    id: string;
    identityCookie?: string; // The cookie value used to identify this user
    email?: string;
    phoneNumber?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserIdentity {
    userId: string;
    cookieValue: string;
}
