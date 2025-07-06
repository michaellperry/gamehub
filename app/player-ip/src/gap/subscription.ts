import { ConsoleTracer, Trace, User } from "jinaga";
import { model } from "gamehub-model";
import { GameAccessPathConfigured } from "gamehub-model/model";
import { GameAccessPath, Tenant } from "gamehub-model/model";
import { OpenAccessPolicy } from "../models/index.js";
import { createOpenAccessPath } from "../repository/index.js";
import { jinagaClient } from "./jinaga-config.js";

const accessPathsToConfigure = model.given(Tenant).match(tenant =>
    GameAccessPath.in(tenant)
        .notExists(accessPath => GameAccessPathConfigured.for(accessPath))
)

export async function startSubscription() {
    if (!process.env.TENANT_PUBLIC_KEY || !process.env.TENANT_PUBLIC_KEY.startsWith("-----BEGIN PUBLIC KEY-----")) {
        throw new Error("Set the TENANT_PUBLIC_KEY environment variable to the public key of the tenant creator");
    }
    Trace.configure(new ConsoleTracer());

    const { userFact } = await jinagaClient.login<User>();

    Trace.info(
        `Attendee service principal public key:\n${userFact.publicKey}`
    );

    const tenant = new Tenant(new User(process.env.TENANT_PUBLIC_KEY));
    const observer = jinagaClient.subscribe(accessPathsToConfigure, tenant, async accessPath => {
        try {
            const typedAccessPath = accessPath as GameAccessPath;
            Trace.info(
                `Configuring access path ${typedAccessPath.id} for event ${typedAccessPath.session.id}.`
            );
            await createOpenAccessPath(
                typedAccessPath.id,
                OpenAccessPolicy.COOKIE_BASED,
                typedAccessPath.session.id);
            await jinagaClient.fact(new GameAccessPathConfigured(typedAccessPath, new Date()));
            Trace.info(
                `Successfully configured access path ${typedAccessPath.id} for event ${typedAccessPath.session.id}.`
            );
        } catch (error) {
            Trace.error(error);
        }
    });

    let retryTimeoutId: NodeJS.Timeout | null = null;

    const initializeCache = async () => {
        try {
            const cacheReady = await observer.cached();
            if (cacheReady) {
                Trace.info("Subscription is cached.");
            } else {
                Trace.info("Subscription is loading.");
                await observer.loaded();
                Trace.info("Subscription loaded successfully.");
            }
        } catch (error) {
            Trace.error(error);
            // Retry in 5 seconds
            retryTimeoutId = setTimeout(() => {
                initializeCache();
            }, 5000);
        }
    };

    return () => {
        observer.stop();
        if (retryTimeoutId) {
            clearTimeout(retryTimeoutId);
        }
        Trace.info("Subscription stopped.");
    };
}
