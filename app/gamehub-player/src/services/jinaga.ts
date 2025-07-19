import { JinagaBrowser } from 'jinaga'

export function createJinagaClient(): JinagaBrowser {
    const replicatorUrl = import.meta.env.VITE_REPLICATOR_URL || 'http://localhost/replicator/'

    return JinagaBrowser.create({
        httpEndpoint: replicatorUrl,
        indexedDb: import.meta.env.DEV ? undefined : 'jinaga-gamehub-player',
    })
} 