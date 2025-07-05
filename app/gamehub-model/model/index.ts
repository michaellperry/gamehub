import { buildModel } from "jinaga";
import { bookkeepingModel } from "./bookkeeping.js";
import { gameHubModel } from "./gamehub.js";
import { gameplayModel } from "./gameplay.js";
import { invitationModel } from "./invitation.js";

// Create and export the combined model
export const model = buildModel(b => b
  .with(gameHubModel)
  .with(bookkeepingModel)
  .with(gameplayModel)
  .with(invitationModel)
);

// Re-export all model classes for convenience
export * from "./bookkeeping.js";
export * from "./gamehub.js";
export * from "./gameplay.js";
export * from "./invitation.js";

// Default export for CommonJS compatibility
export default {
  model,
  // Include individual models for direct access
  gameHubModel,
  bookkeepingModel,
  gameplayModel,
  invitationModel
};