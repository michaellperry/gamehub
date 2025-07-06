import { JinagaClient } from "jinaga";
import { ServiceAuthenticationProvider } from "./provider";

const serviceAuthenticationProvider = new ServiceAuthenticationProvider();

export const jinagaClient = JinagaClient.create({
    httpEndpoint: process.env.REPLICATOR_URL || "http://localhost:3000/jinaga",
    httpAuthenticationProvider: serviceAuthenticationProvider
});