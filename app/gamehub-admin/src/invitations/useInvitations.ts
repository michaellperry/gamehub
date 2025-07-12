import {
    Administrator,
    Invitation,
    InvitationAcceptance,
    InvitationApproval,
    InvitationClosure,
    InvitationDecline,
    model,
    Tenant
} from "@model/model";
import { useSpecification } from "jinaga-react";
import { useState } from "react";
import { useUser } from "../auth/UserProvider";
import { j } from "../jinaga-config";

export interface InvitationViewModel {
    code: string;
    acceptances: AcceptanceViewModel[];
}

export interface AcceptanceViewModel {
    acceptance: InvitationAcceptance;
    userPublicKey: string;
}

// Get active invitations for the current tenant
const invitationsForTenant = model.given(Tenant).match(tenant =>
    Invitation.in(tenant)
        .select(invitation => ({
            code: invitation.code,
            acceptances: InvitationAcceptance.for(invitation)
                .selectMany(acceptance => acceptance.user.predecessor()
                    .select(user => ({
                        acceptance: acceptance,
                        userPublicKey: user.publicKey
                    }))
                )
        }))
);

// Generate a random code for new invitations
function generateRandomCode(length: number = 8): string {
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

export function useInvitations(tenant: Tenant | null) {
    const { user, error: userError } = useUser();
    const { data, error, loading } = useSpecification(j, invitationsForTenant, tenant);
    const [actionError, setActionError] = useState<Error | null>(null);

    // Create a new invitation with a randomly generated code
    async function createInvitation() {
        if (!tenant || !user) return;

        try {
            const code = generateRandomCode();
            
            // Create the invitation
            await j.fact(new Invitation(tenant, code));
            
            setActionError(null);
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error(String(err)));
        }
    }

    // Approve an acceptance
    async function approveAcceptance(acceptance: InvitationAcceptance) {
        if (!tenant || !user) return;

        try {
            // Create the approval
            await j.fact(new InvitationApproval(acceptance));
            
            // Create an Administrator fact for the accepted user
            await j.fact(new Administrator(tenant, acceptance.user, new Date()));
            
            setActionError(null);
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error(String(err)));
        }
    }

    // Decline an acceptance
    async function declineAcceptance(acceptance: InvitationAcceptance) {
        if (!tenant || !user) return;

        try {
            // Create the decline
            await j.fact(new InvitationDecline(acceptance));
            
            setActionError(null);
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error(String(err)));
        }
    }

    // Close an invitation
    async function closeInvitation(invitation: Invitation) {
        if (!tenant || !user) return;

        try {
            // Create the closure
            await j.fact(new InvitationClosure(invitation));
            
            setActionError(null);
        } catch (err) {
            setActionError(err instanceof Error ? err : new Error(String(err)));
        }
    }

    return {
        invitations: data,
        error: userError || actionError || error,
        isLoading: loading,
        createInvitation,
        approveAcceptance,
        declineAcceptance,
        closeInvitation
    };
}