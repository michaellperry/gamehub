#!/usr/bin/env node

import { User } from "jinaga";
import { model, authorization, distribution } from "gamehub-model";
import { 
  Tenant, 
  Player, 
  PlayerName, 
  GameSession, 
  GameSessionName, 
  GameSessionDate,
  Participant,
  ParticipantInformation,
  ParticipantSession
} from "gamehub-model/model";

/**
 * GameHub Player IP Console Application
 * 
 * This application demonstrates how to import and use the gamehub-model
 * shared library, including the model, authorization, and distribution modules.
 */

console.log("🎮 GameHub Player IP Console Application");
console.log("=========================================\n");

// Demonstrate model usage
console.log("📦 Model Information:");
console.log(`Model contains ${Object.keys(model.given).length} fact types`);
console.log("Available fact types:", Object.keys(model.given).join(", "));
console.log();

// Create sample data to demonstrate the model
console.log("🏗️  Creating sample GameHub entities...\n");

try {
  // Create a sample user (this would typically come from authentication)
  const sampleUser = new User("sample-user-id");
  console.log("✅ Created sample user:", sampleUser.publicKey);

  // Create a tenant
  const tenant = new Tenant(sampleUser);
  console.log("✅ Created tenant with creator:", tenant.creator.publicKey);

  // Create a player
  const player = new Player(tenant, new Date().toISOString());
  console.log("✅ Created player in tenant at:", player.createdAt);

  // Create a player name
  const playerName = new PlayerName(player, "PlayerOne", []);
  console.log("✅ Created player name:", playerName.name);

  // Create a game session
  const gameSession = new GameSession(tenant, `session-${Date.now()}`);
  console.log("✅ Created game session with ID:", gameSession.id);

  // Create game session metadata
  const sessionName = new GameSessionName(gameSession, "Epic Battle Royale", []);
  const sessionDate = new GameSessionDate(gameSession, new Date().toISOString(), []);
  console.log("✅ Created session name:", sessionName.value);
  console.log("✅ Created session date:", sessionDate.date);

  // Create a participant
  const participant = new Participant(sampleUser, tenant);
  console.log("✅ Created participant for user:", participant.user.publicKey);

  // Create participant information
  const participantInfo = new ParticipantInformation(
    participant,
    "John",
    "Doe", 
    "john.doe@example.com",
    []
  );
  console.log("✅ Created participant info:", `${participantInfo.firstName} ${participantInfo.lastName}`);

  // Create participant session relationship
  const participantSession = new ParticipantSession(participant, gameSession);
  console.log("✅ Created participant session relationship");

  console.log("\n🎯 Sample Data Creation Complete!\n");

  // Demonstrate authorization module
  console.log("🔐 Authorization Information:");
  console.log("Authorization rules are available for securing GameHub operations");
  console.log("Authorization module loaded successfully");
  console.log();

  // Demonstrate distribution module  
  console.log("📡 Distribution Information:");
  console.log("Distribution rules are available for data synchronization");
  console.log("Distribution module loaded successfully");
  console.log();

  // Show some model relationships
  console.log("🔗 Model Relationships Demo:");
  console.log("- Tenants can have multiple Players");
  console.log("- Players can have Names and Logos (with history)");
  console.log("- Game Sessions belong to Tenants");
  console.log("- Participants can join Game Sessions");
  console.log("- Winners are recorded for completed sessions");
  console.log();

  // Demonstrate fact type information
  console.log("📋 Fact Type Examples:");
  console.log(`- Tenant: ${Tenant.Type}`);
  console.log(`- Player: ${Player.Type}`);
  console.log(`- GameSession: ${GameSession.Type}`);
  console.log(`- Participant: ${Participant.Type}`);
  console.log();

  console.log("✨ GameHub Model Integration Successful!");
  console.log("The player-ip application can successfully import and use gamehub-model components.");

} catch (error) {
  console.error("❌ Error demonstrating GameHub model:", error);
  process.exit(1);
}

// Export for potential testing or module usage
export {
  model,
  authorization,
  distribution,
  Tenant,
  Player,
  GameSession,
  Participant
};