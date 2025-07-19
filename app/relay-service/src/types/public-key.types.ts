export interface PublicKeyServiceData {
    publicKey?: string;
    lastChecked: string;
    responseTime: number;
    error?: string;
}

export interface PublicKeyResponse {
    timestamp: string;
    services: Record<string, PublicKeyServiceData>;
}
