import db from '../../config/database.js';
import {
  GameAccessPath,
  GAPType,
  OpenAccessPolicy,
  OpenAccessPath,
  UserSpecificAccessPath,
  UserSpecificAccessPolicy
} from '../../models/index.js';
import { v4 as uuidv4 } from 'uuid';

// Prepare statements
const getGAPByIdStmt = db.prepare(`
  SELECT * FROM gaps WHERE id = ?
`);

const getGAPUsersStmt = db.prepare(`
  SELECT user_id FROM gap_users WHERE gap_id = ?
`);

const createGAPStmt = db.prepare(`
  INSERT INTO gaps (id, type, policy, event_id)
  VALUES (?, ?, ?, ?)
`);

const addGAPUserStmt = db.prepare(`
  INSERT INTO gap_users (gap_id, user_id)
  VALUES (?, ?)
`);

/**
 * Get GAP by ID
 */
export const getGAPById = (gapId: string): GameAccessPath | undefined => {
  const row = getGAPByIdStmt.get(gapId) as any;
  
  if (!row) {
    return undefined;
  }
  
  // Common properties
  const baseGap = {
    id: row.id,
    eventId: row.event_id,
    type: row.type as GAPType
  };
  
  // Create the appropriate GAP type
  if (row.type === GAPType.OPEN) {
    return {
      ...baseGap,
      type: GAPType.OPEN,
      policy: row.policy as OpenAccessPolicy
    } as OpenAccessPath;
  } else if (row.type === GAPType.USER_SPECIFIC) {
    // Get users for this GAP
    const userRows = getGAPUsersStmt.all(gapId) as any[];
    const users = userRows.map(row => row.user_id);
    
    return {
      ...baseGap,
      type: GAPType.USER_SPECIFIC,
      policy: row.policy as UserSpecificAccessPolicy,
      users
    } as UserSpecificAccessPath;
  }
  
  return undefined;
};

/**
 * Create a sample open access path
 */
export const createSampleOpenAccessPath = (): GameAccessPath => {
  const gapId = uuidv4();
  const eventId = uuidv4();
  
  const gap: OpenAccessPath = {
    id: gapId,
    type: GAPType.OPEN,
    policy: OpenAccessPolicy.COOKIE_BASED,
    eventId
  };
  
  createGAPStmt.run(gapId, gap.type, gap.policy, eventId);
  
  return gap;
};

/**
 * Create an open access path
 * @param gapId The ID of the GAP
 * @param policy Policy options for the open access path
 * @param eventId The ID of the event
 * @returns A GameAccessPath object
 */
export const createOpenAccessPath = (
  gapId: string,
  policy: OpenAccessPolicy,
  eventId: string
): GameAccessPath => {
  // Create the GAP
  createGAPStmt.run(gapId, GAPType.OPEN, policy, eventId);
  
  return {
    id: gapId,
    type: GAPType.OPEN,
    policy,
    eventId
  };
}

/**
 * Create a user-specific access path
 */
export const createUserSpecificAccessPath = (
  gapId: string,
  policy: UserSpecificAccessPolicy,
  eventId: string,
  userIds: string[]
): GameAccessPath => {
  // Begin transaction
  const transaction = db.transaction(() => {
    // Create the GAP
    createGAPStmt.run(gapId, GAPType.USER_SPECIFIC, policy, eventId);
    
    // Add users
    for (const userId of userIds) {
      addGAPUserStmt.run(gapId, userId);
    }
  });
  
  // Execute transaction
  transaction();
  
  return {
    id: gapId,
    type: GAPType.USER_SPECIFIC,
    policy,
    eventId,
    users: [...userIds]
  };
};
