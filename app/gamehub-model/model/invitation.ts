import { LabelOf, ModelBuilder, User } from 'jinaga';
import { Tenant } from './gamehub.js';

export class Invitation {
    static Type = 'GameHub.Invitation' as const;
    public type = Invitation.Type;

    constructor(
        public tenant: Tenant,
        public code: string
    ) {}

    static in(tenant: LabelOf<Tenant>) {
        return tenant
            .successors(Invitation, (invitation) => invitation.tenant as LabelOf<Tenant>)
            .notExists((invitation) =>
                invitation.successors(
                    InvitationClosure,
                    (closure) => closure.invitation as LabelOf<Invitation>
                )
            );
    }
}

export class InvitationAcceptance {
    static Type = 'GameHub.Invitation.Acceptance' as const;
    public type = InvitationAcceptance.Type;

    constructor(
        public invitation: Invitation,
        public user: User
    ) {}

    static for(invitation: LabelOf<Invitation>) {
        return invitation
            .successors(InvitationAcceptance, (acceptance) => acceptance.invitation)
            .notExists((acceptance) =>
                acceptance.successors(InvitationApproval, (approval) => approval.acceptance)
            )
            .notExists((acceptance) =>
                acceptance.successors(InvitationDecline, (decline) => decline.acceptance)
            );
    }
}

export class InvitationApproval {
    static Type = 'GameHub.Invitation.Approval' as const;
    public type = InvitationApproval.Type;

    constructor(public acceptance: InvitationAcceptance) {}

    static for(acceptance: LabelOf<InvitationAcceptance>) {
        return acceptance.successors(InvitationApproval, (approval) => approval.acceptance);
    }
}

export class InvitationDecline {
    static Type = 'GameHub.Invitation.Decline' as const;
    public type = InvitationDecline.Type;

    constructor(public acceptance: InvitationAcceptance) {}

    static for(acceptance: LabelOf<InvitationAcceptance>) {
        return acceptance.successors(InvitationDecline, (decline) => decline.acceptance);
    }
}

export class InvitationClosure {
    static Type = 'GameHub.Invitation.Closure' as const;
    public type = InvitationClosure.Type;

    constructor(public invitation: Invitation) {}

    static for(invitation: LabelOf<Invitation>) {
        return invitation.successors(InvitationClosure, (closure) => closure.invitation);
    }
}

export const invitationModel = (b: ModelBuilder) =>
    b
        .type(Invitation, (m) => m.predecessor('tenant', Tenant))
        .type(InvitationAcceptance, (m) =>
            m.predecessor('invitation', Invitation).predecessor('user', User)
        )
        .type(InvitationApproval, (m) => m.predecessor('acceptance', InvitationAcceptance))
        .type(InvitationDecline, (m) => m.predecessor('acceptance', InvitationAcceptance))
        .type(InvitationClosure, (m) => m.predecessor('invitation', Invitation));
