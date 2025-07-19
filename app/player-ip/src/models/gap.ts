/**
 * Game Access Path (GAP) model
 */

export enum GAPType {
    OPEN = 'open',
    USER_SPECIFIC = 'user_specific',
}

export enum OpenAccessPolicy {
    COLLECT_VALIDATE_EMAIL = 'collect_validate_email',
    COLLECT_VALIDATE_PHONE = 'collect_validate_phone',
    COOKIE_BASED = 'cookie_based',
}

export enum UserSpecificAccessPolicy {
    VALIDATE_EMAIL = 'validate_email',
    VALIDATE_PHONE = 'validate_phone',
    NO_VALIDATION = 'no_validation',
}

export interface OpenAccessPath {
    id: string;
    type: GAPType.OPEN;
    policy: OpenAccessPolicy;
    eventId: string;
}

export interface UserSpecificAccessPath {
    id: string;
    type: GAPType.USER_SPECIFIC;
    policy: UserSpecificAccessPolicy;
    eventId: string;
    users: string[]; // List of user IDs who can access this path
}

export type GameAccessPath = OpenAccessPath | UserSpecificAccessPath;
