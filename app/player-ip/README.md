# Player IP Console Application

A Node.js console application that demonstrates how to import and use the `gamehub-model` shared library.

## Overview

This application serves as an example of how to:
- Import and use the gamehub-model workspace dependency
- Utilize the model, authorization, and distribution modules
- Create and work with GameHub entities like Tenants, Players, Game Sessions, and Participants
- Demonstrate proper TypeScript integration with the shared model

## Features

- **Model Integration**: Imports and demonstrates usage of all major GameHub model classes
- **Sample Data Creation**: Creates sample entities to show relationships and usage patterns
- **Module Demonstration**: Shows how to use model, authorization, and distribution modules
- **TypeScript Support**: Full TypeScript integration with proper type checking
- **Console Output**: Informative console output showing the application flow

## Prerequisites

- Node.js (version compatible with ES2020)
- npm or yarn
- The gamehub-model package must be built first

## Installation

1. Ensure the gamehub-model dependency is built:
   ```bash
   cd ../gamehub-model
   npm run build
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
Run with automatic rebuilding on changes:
```bash
npm run dev
```

### Production Mode
Build and run the application:
```bash
npm start
```

### Manual Build
Build TypeScript to JavaScript:
```bash
npm run build
```

Then run the compiled JavaScript:
```bash
node dist/index.js
```

### Clean Build
Remove build artifacts and rebuild:
```bash
npm run rebuild
```

## What the Application Demonstrates

### Model Usage
- Creating Tenant entities
- Creating Player entities with names
- Creating Game Sessions with metadata
- Creating Participants and linking them to sessions
- Demonstrating entity relationships and hierarchies

### Module Integration
- **Model Module**: Core domain entities and relationships
- **Authorization Module**: Security rules for GameHub operations
- **Distribution Module**: Data synchronization rules

### TypeScript Integration
- Proper import statements for workspace dependencies
- Type-safe entity creation and manipulation
- Full IntelliSense support for GameHub model classes

## Sample Output

When you run the application, you'll see output similar to:

```
🎮 GameHub Player IP Console Application
=========================================

📦 Model Information:
Model contains X fact types
Available fact types: GameHub.Tenant, GameHub.Player, ...

🏗️  Creating sample GameHub entities...

✅ Created sample user: [user-id]
✅ Created tenant with creator: [creator-id]
✅ Created player in tenant at: [timestamp]
✅ Created player name: PlayerOne
✅ Created game session with ID: session-[timestamp]
✅ Created session name: Epic Battle Royale
✅ Created session date: [timestamp]
✅ Created participant for user: [user-id]
✅ Created participant info: John Doe
✅ Created participant session relationship

🎯 Sample Data Creation Complete!

🔐 Authorization Information:
Authorization rules are available for securing GameHub operations

📡 Distribution Information:
Distribution rules are available for data synchronization

✨ GameHub Model Integration Successful!
```

## Project Structure

```
app/player-ip/
├── src/
│   └── index.ts          # Main application entry point
├── dist/                 # Compiled JavaScript output
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Dependencies

- **gamehub-model**: The shared domain model (workspace dependency)
- **jinaga**: Fact-based modeling framework
- **typescript**: TypeScript compiler
- **@types/node**: Node.js type definitions

## Development Notes

- The application uses ES modules (`"type": "module"`)
- TypeScript is configured to output to the `dist/` directory
- The workspace dependency on gamehub-model uses `workspace:*` syntax
- Source maps are enabled for debugging
- The application demonstrates both named and default imports from gamehub-model

## Troubleshooting

### Build Issues
If you encounter build issues:
1. Ensure gamehub-model is built first: `cd ../gamehub-model && npm run build`
2. Clean and rebuild: `npm run rebuild`
3. Check that all dependencies are installed: `npm install`

### Import Issues
If imports fail:
1. Verify the gamehub-model package has been built
2. Check that the workspace dependency is properly configured
3. Ensure TypeScript paths are correctly set in tsconfig.json

### Runtime Issues
If the application fails at runtime:
1. Check that all required dependencies are installed
2. Verify Node.js version compatibility
3. Ensure the compiled JavaScript is up to date: `npm run build`