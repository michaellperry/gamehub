import { useEffect, useState } from "react";
import { fetchPublicKeys } from "../services/relayService";
import { RawService } from "./useServicePrincipals";

const relayServiceUrl = import.meta.env.VITE_RELAY_SERVICE_URL;

export function useKnownServices() {
    const [data, setData] = useState<RawService[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Fetch known services when component mounts
    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchData = async () => {
            if (!relayServiceUrl) {
                setError(new Error('Relay service URL not configured'));
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const response = await fetchPublicKeys(relayServiceUrl, signal);
                const services: RawService[] = Object.entries(response.services).map(
                    ([serviceName, serviceInfo]) => ({
                        serviceName,
                        publicKey: serviceInfo.publicKey,
                        lastChecked: serviceInfo.lastChecked,
                        responseTime: serviceInfo.responseTime,
                    })
                );
                if (!signal.aborted) {
                    setData(services);
                }
            } catch (error) {
                if (!signal.aborted) {
                    setError(error as Error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        return () => {
            controller.abort();
        };
    }, []);

    return {
        data,
        loading,
        error,
    };
}