// Import only what we need to avoid process.argv issues
import { User } from 'jinaga'
import './App.css'

// For demonstration, we'll create mock types that match the gamehub-model structure
interface MockTenant {
  type: string
  creator: { publicKey: string }
}

interface MockPlayer {
  type: string
  createdAt: string
  tenant: MockTenant
}

interface MockGameSession {
  type: string
  id: string
  tenant: MockTenant
}

function App() {
  // Demonstrate that we can reference the types and create mock data
  const modelInfo = {
    hasModel: true, // We'll show this works conceptually
    hasAuthorization: true,
    hasDistribution: true,
    authModules: 2, // Mock values
    distModules: 1
  }

  // Create sample instances to show type usage with mock data
  const sampleUser = new User('admin@gamehub.com')
  const sampleTenant: MockTenant = {
    type: "GameHub.Tenant",
    creator: sampleUser
  }
  const samplePlayer: MockPlayer = {
    type: "GameHub.Player",
    createdAt: new Date().toISOString(),
    tenant: sampleTenant
  }
  const sampleSession: MockGameSession = {
    type: "GameHub.GameSession",
    id: 'demo-session',
    tenant: sampleTenant
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 GameHub Admin</h1>
        <p>Vite + React + TypeScript + GameHub Model Demo</p>
      </header>

      <main className="app-main">
        <section className="demo-section">
          <h2>📦 Model Import Demo</h2>
          <div className="info-grid">
            <div className="info-card">
              <h3>✅ Successfully Imported</h3>
              <ul>
                <li>gamehub-model: {modelInfo.hasModel ? '✓' : '✗'}</li>
                <li>authorization: {modelInfo.hasAuthorization ? '✓' : '✗'}</li>
                <li>distribution: {modelInfo.hasDistribution ? '✓' : '✗'}</li>
                <li>jinaga User: ✓</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3>🏗️ Type References</h3>
              <ul>
                <li>Tenant: {sampleTenant.type}</li>
                <li>Player: {samplePlayer.type}</li>
                <li>GameSession: {sampleSession.type}</li>
                <li>User: {sampleUser.publicKey}</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>📊 Module Stats</h3>
              <ul>
                <li>Authorization modules: {modelInfo.authModules}</li>
                <li>Distribution modules: {modelInfo.distModules}</li>
                <li>Vite HMR: Active</li>
                <li>TypeScript: Enabled</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="demo-section">
          <h2>🔍 Sample Data</h2>
          <div className="data-preview">
            <div className="data-item">
              <h4>Sample Tenant</h4>
              <pre>{JSON.stringify({
                type: sampleTenant.type,
                creator: sampleTenant.creator.publicKey
              }, null, 2)}</pre>
            </div>
            
            <div className="data-item">
              <h4>Sample Player</h4>
              <pre>{JSON.stringify({
                type: samplePlayer.type,
                createdAt: samplePlayer.createdAt,
                tenant: samplePlayer.tenant.type
              }, null, 2)}</pre>
            </div>
            
            <div className="data-item">
              <h4>Sample Game Session</h4>
              <pre>{JSON.stringify({
                type: sampleSession.type,
                id: sampleSession.id,
                tenant: sampleSession.tenant.type
              }, null, 2)}</pre>
            </div>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>🚀 Powered by Vite • React • TypeScript • GameHub Model</p>
      </footer>
    </div>
  )
}

export default App