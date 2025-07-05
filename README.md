# GameHub - Multiplayer Game Platform Template

A complete, production-ready template for building multiplayer games using React, Jinaga, and modern web technologies. GameHub provides a full-stack foundation with real-time data synchronization, OAuth authentication, and microservices architecture.

## 🎮 What is GameHub?

GameHub is a **starter template** that provides everything you need to build your own multiplayer game platform. It demonstrates best practices for:

- **Real-time multiplayer gameplay** with conflict-free data synchronization
- **Multi-tenant architecture** supporting multiple games and organizations
- **Modern React applications** with TypeScript and Vite
- **Distributed data management** using Jinaga's fact-based architecture
- **OAuth authentication** with secure service-to-service communication
- **Docker orchestration** for easy deployment and scaling

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Docker** and **Docker Compose**
- **Git**

### Get Started in 5 Minutes

1. **Clone and setup**:
   ```bash
   git clone https://github.com/michaellperry/gamehub.git
   cd gamehub/app
   npm install
   ```

2. **Build the shared model**:
   ```bash
   npm run build:model
   ```

3. **Start development**:
   ```bash
   # Admin interface
   npm run dev:admin
   
   # Player console demo
   npm run dev:player-ip
   ```

4. **Launch full environment**:
   ```bash
   cd ../mesh
   docker-compose up -d
   ```

Visit `http://localhost` to see your game platform running!

## 📚 Documentation

Follow our comprehensive getting started guides:

1. **[Prerequisites](docs/getting-started/01-prerequisites.md)** - System requirements and tools
2. **[Architecture Overview](docs/getting-started/02-architecture-overview.md)** - Understanding the system design
3. **[Project Setup](docs/getting-started/03-project-setup.md)** - Initial configuration
4. **[Jinaga Data Model](docs/getting-started/04-jinaga-model.md)** - Real-time data layer
5. **[React Applications](docs/getting-started/05-react-applications.md)** - Frontend development
6. **[Backend Services](docs/getting-started/06-backend-services.md)** - API and business logic
7. **[Deployment](docs/getting-started/09-deployment.md)** - Production deployment
8. **[Troubleshooting](docs/getting-started/10-troubleshooting.md)** - Common issues and solutions

## 🏗️ Architecture

```
Frontend (React + Vite)     Backend Services (Node.js)     Data Layer (Jinaga)
┌─────────────────────┐    ┌─────────────────────────┐    ┌─────────────────────┐
│  Admin Portal       │    │  Player IP Service      │    │  Jinaga Replicator  │
│  Player Interface   │───▶│  Service IP Provider    │───▶│  PostgreSQL         │
│  Real-time Updates  │    │  Content Store          │    │  Real-time Sync     │
└─────────────────────┘    └─────────────────────────┘    └─────────────────────┘
```

### Repository Structure

- **[app/](app/)** - Main monorepo with all applications and shared libraries
  - **[gamehub-model/](app/gamehub-model/)** - Shared TypeScript library with Jinaga domain model
  - **[gamehub-admin/](app/gamehub-admin/)** - Vite-based web application for administration
  - **[player-ip/](app/player-ip/)** - Node.js console application for player IP management
- **[docs/](docs/)** - Comprehensive documentation and guides
- **[mesh/](mesh/)** - Docker orchestration and deployment configuration

### Key Features

- **📱 React Admin Portal** - Manage games, players, and sessions
- **🎯 Player Console** - Demonstrate game participation
- **🔄 Real-time Synchronization** - Jinaga's conflict-free data sync
- **🔐 OAuth Authentication** - Secure user and service authentication
- **🐳 Docker Orchestration** - Production-ready container setup
- **📊 Multi-tenant Support** - Isolate data by organization
- **🚀 Auto-deployment** - CI/CD with Azure DevOps integration

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Data Layer**: Jinaga (distributed facts), PostgreSQL
- **Authentication**: OAuth 2.0 + PKCE, JWT tokens
- **Orchestration**: Docker Compose, Nginx reverse proxy
- **Deployment**: Azure Container Apps, GitHub Actions

## 🎮 Building Your Game

GameHub provides the foundation - you add your game logic:

1. **Define your game facts** in [`app/gamehub-model/model/`](app/gamehub-model/model/)
2. **Create authorization rules** in [`app/gamehub-model/authorization/`](app/gamehub-model/authorization/)
3. **Build your game UI** in [`app/gamehub-admin/src/`](app/gamehub-admin/src/)
4. **Add game logic** to the backend services
5. **Deploy with Docker** using the provided orchestration

### Example: Adding a New Game Type

```typescript
// app/gamehub-model/model/my-game.ts
export class ChessGame {
    static Type = "MyGame.Chess" as const;
    public type = ChessGame.Type;
    
    constructor(
        public session: GameSession,
        public boardState: string,
        public currentPlayer: Player
    ) {}
}

// Authorization rules
.type(ChessGame, game => Administrator.usersOf(game.session.tenant))
```

## 🚀 Development

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/michaellperry/gamehub.git
cd gamehub

# Install dependencies for all packages
cd app
npm install

# Build the shared model
npm run build:model
```

### Available Commands

```bash
# Development
npm run dev:admin          # Start admin interface
npm run dev:player-ip      # Start player console

# Building
npm run build              # Build all packages
npm run build:model        # Build only the model
npm run build:admin        # Build only the admin interface

# Testing & Quality
npm run test              # Run all tests
npm run lint              # Run linting
npm run type-check        # TypeScript checking
```

### Docker Development

```bash
# Start full development environment
cd mesh
docker-compose up -d

# View logs
docker-compose logs -f

# Stop environment
docker-compose down
```

## 🚀 Deployment

### Development
```bash
cd mesh
docker-compose up -d
```

### Production
```bash
# Build all components
cd app
npm run build

# Deploy to Azure
az containerapp up --source .
```

See [Deployment Guide](docs/getting-started/09-deployment.md) for detailed instructions.

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Reporting Issues
- **Bug reports**: Use [GitHub Issues](https://github.com/michaellperry/gamehub/issues)
- **Feature requests**: Create an issue with the `enhancement` label
- **Questions**: Ask in our [Discord community](https://discord.gg/Pssuk8uTke)

### Contributing Code
1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Make** your changes following our coding standards
4. **Test** your changes: `npm test`
5. **Commit** with clear messages: `git commit -m 'Add amazing feature'`
6. **Push** to your fork: `git push origin feature/amazing-feature`
7. **Open** a Pull Request

### Development Setup
```bash
# Fork and clone
git clone https://github.com/your-username/gamehub.git
cd gamehub

# Set up development environment
cd app
npm install
npm run build:model

# Start development
npm run dev:admin
```

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Follow the configured rules
- **Prettier**: Code formatting
- **Tests**: Write tests for new features
- **Documentation**: Update docs for API changes

## 🆘 Getting Help

### Community Support
- **Discord Community**: Join us at [https://discord.gg/Pssuk8uTke](https://discord.gg/Pssuk8uTke)
- **GitHub Discussions**: Share ideas and ask questions
- **Documentation**: Check our [comprehensive guides](docs/getting-started/)

### Common Issues
- **Build failures**: See [Troubleshooting Guide](docs/getting-started/10-troubleshooting.md)
- **Docker issues**: Check Docker Compose configuration in [`mesh/`](mesh/)
- **Authentication problems**: Review authentication setup documentation

### Frequently Asked Questions

**Q: How do I add a new game type?**
A: Create new fact types in `gamehub-model/model/`, add authorization rules, and implement the UI in the admin interface.

**Q: Can I use this for single-player games?**
A: Yes! While designed for multiplayer, the architecture works great for single-player games with real-time features.

**Q: How do I deploy to production?**
A: Follow the [Deployment Guide](docs/getting-started/09-deployment.md) for step-by-step instructions.

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

This means you can:
- ✅ Use commercially
- ✅ Modify and distribute
- ✅ Use privately
- ✅ Include copyright and license notice

## 🌟 Acknowledgments

- **[Jinaga](https://jinaga.com)** - For the revolutionary distributed data architecture
- **[React](https://reactjs.org)** - For the amazing UI framework
- **[Vite](https://vitejs.dev)** - For the lightning-fast build tool
- **Contributors** - Everyone who helps make GameHub better

## 🔗 Related Projects

- **[Jinaga](https://github.com/jinaga/jinaga.js)** - The distributed data synchronization library
- **[Jinaga Server](https://github.com/jinaga/jinaga-server)** - Server-side components for Jinaga

---

**Ready to build your multiplayer game?** Start with our [Getting Started Guide](docs/getting-started/README.md) and join our community!

[![Discord](https://img.shields.io/discord/YOUR_DISCORD_ID?label=Discord&logo=discord&logoColor=white)](https://discord.gg/Pssuk8uTke)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)](https://www.docker.com/)
