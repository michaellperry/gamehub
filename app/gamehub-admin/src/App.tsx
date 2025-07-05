// Import gamehub-model components
import { User } from 'jinaga'
import { model, authorization, distribution, getModelInfo } from 'gamehub-model'
import {
  Tenant,
  Player,
  GameSession,
  PlayerName,
  GameSessionName,
  Participant
} from 'gamehub-model/model'
import './App.css'

function App() {
  // Demonstrate actual gamehub-model usage
  const modelInfo = {
    hasModel: !!model,
    hasAuthorization: !!authorization,
    hasDistribution: !!distribution,
    factTypes: Object.keys(model.given || {}).length,
    authModules: Object.keys(authorization || {}).length,
    distModules: Object.keys(distribution || {}).length,
    ...getModelInfo() // Integration test: use new function from gamehub-model
  }

  // Create actual instances using gamehub-model
  const sampleUser = new User('admin@gamehub.com')
  const sampleTenant = new Tenant(sampleUser)
  const samplePlayer = new Player(sampleTenant, new Date().toISOString())
  const playerName = new PlayerName(samplePlayer, 'Admin Player', [])
  const sampleSession = new GameSession(sampleTenant, `admin-session-${Date.now()}`)
  const sessionName = new GameSessionName(sampleSession, 'Admin Demo Session', [])
  const participant = new Participant(sampleUser, sampleTenant)
  
  // Additional data for display
  const participantInfo = {
    user: participant.user.publicKey,
    tenant: participant.tenant.creator.publicKey
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
                <li>Tenant: {Tenant.Type}</li>
                <li>Player: {Player.Type}</li>
                <li>GameSession: {GameSession.Type}</li>
                <li>User: {sampleUser.publicKey}</li>
              </ul>
            </div>

            <div className="info-card">
              <h3>📊 Module Stats</h3>
              <ul>
                <li>Fact types: {modelInfo.factTypes}</li>
                <li>Authorization modules: {modelInfo.authModules}</li>
                <li>Distribution modules: {modelInfo.distModules}</li>
                <li>Model version: {modelInfo.version}</li>
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
                type: Tenant.Type,
                creator: sampleTenant.creator.publicKey
              }, null, 2)}</pre>
            </div>
            
            <div className="data-item">
              <h4>Sample Player</h4>
              <pre>{JSON.stringify({
                type: Player.Type,
                createdAt: samplePlayer.createdAt,
                name: playerName.name
              }, null, 2)}</pre>
            </div>
            
            <div className="data-item">
              <h4>Sample Game Session</h4>
              <pre>{JSON.stringify({
                type: GameSession.Type,
                id: sampleSession.id,
                name: sessionName.value
              }, null, 2)}</pre>
            </div>
            
            <div className="data-item">
              <h4>Sample Participant</h4>
              <pre>{JSON.stringify({
                type: Participant.Type,
                user: participantInfo.user,
                tenant: participantInfo.tenant
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