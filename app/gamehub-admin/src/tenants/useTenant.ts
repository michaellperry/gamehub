import { Tenant } from "@model/model";
import { User } from "jinaga";

function createTenant() {
    try {
        if (import.meta.env.DEV) {
            return new Tenant(new User("-----TENANT USER-----"));
        }

        const VITE_TENANT_PUBLIC_KEY = import.meta.env.VITE_TENANT_PUBLIC_KEY;
        const tenantPublicKey = VITE_TENANT_PUBLIC_KEY
            ? JSON.parse(VITE_TENANT_PUBLIC_KEY)
            : null;
        if (tenantPublicKey && typeof tenantPublicKey === "string" && tenantPublicKey.startsWith("-----BEGIN PUBLIC KEY-----")) {
            return new Tenant(new User(tenantPublicKey));
        }
        console.error(`Invalid tenant public key format. Expected a PEM formatted string (${import.meta.env.VITE_TENANT_PUBLIC_KEY}).`);
    }
    catch (error) {
        console.error(`Error parsing tenant public key (${import.meta.env.VITE_TENANT_PUBLIC_KEY}):`, error);
    }
    return null;
}

const tenant = createTenant();

export function useTenant() {
    return tenant;
}
