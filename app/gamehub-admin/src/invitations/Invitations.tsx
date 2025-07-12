import { Invitation, InvitationAcceptance } from "@model/model";
import { useState } from "react";
import { Alert, Button, Icon } from "../components/atoms";
import { ConfirmModal, ListItem, PageHeader } from "../components/molecules";
import { ResourceList } from "../components/organisms";
import { j } from "../jinaga-config";
import { useTenant } from "../tenants/useTenant";
import { AcceptanceViewModel, InvitationViewModel, useInvitations } from "./useInvitations";

function Invitations() {
    const tenant = useTenant();
    const { 
        invitations, 
        error, 
        isLoading, 
        createInvitation, 
        approveAcceptance, 
        declineAcceptance, 
        closeInvitation 
    } = useInvitations(tenant);
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Copy invitation code to clipboard
    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Handle creating a new invitation
    const handleCreateInvitation = () => {
        createInvitation();
        setIsCreateModalOpen(false);
    };

    // Toggle showing acceptances for an invitation
    const toggleInvitationDetails = (invitationCode: string) => {
        setSelectedInvitation(selectedInvitation === invitationCode ? null : invitationCode);
    };

    // Handle approving an acceptance
    const handleApproveAcceptance = async (invitation: InvitationViewModel, acceptance: AcceptanceViewModel) => {
        if (!tenant) return;
        
        // Create the objects needed for the operation
        const invitationObj = new Invitation(tenant, invitation.code);
        const acceptanceObj = new InvitationAcceptance(invitationObj, { 
            type: "Jinaga.User",
            publicKey: acceptance.userPublicKey 
        });
        
        await approveAcceptance(acceptanceObj);
    };

    // Handle declining an acceptance
    const handleDeclineAcceptance = async (invitation: InvitationViewModel, acceptance: AcceptanceViewModel) => {
        if (!tenant) return;
        
        // Create the objects needed for the operation
        const invitationObj = new Invitation(tenant, invitation.code);
        const acceptanceObj = new InvitationAcceptance(invitationObj, { 
            type: "Jinaga.User",
            publicKey: acceptance.userPublicKey 
        });
        
        await declineAcceptance(acceptanceObj);
    };

    // Handle closing an invitation
    const handleCloseInvitation = async (invitation: InvitationViewModel) => {
        if (!tenant) return;
        
        // Create the objects needed for the operation
        const invitationObj = new Invitation(tenant, invitation.code);
        
        await closeInvitation(invitationObj);
    };

    // Create invitation button
    const createInvitationButton = (
        <Button 
            onClick={() => setIsCreateModalOpen(true)}
            icon="add"
            variant="primary"
            size="md"
        >
            Create Invitation
        </Button>
    );

    // Render an invitation item
    const renderInvitationItem = (invitation: InvitationViewModel) => {
        const isSelected = selectedInvitation === invitation.code;
        
        return (
            <>
                <ListItem
                    key={invitation.code}
                    onClick={() => toggleInvitationDetails(invitation.code)}
                    action={
                        <div className="flex space-x-2">
                            <Button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(invitation.code);
                                }}
                                variant="secondary"
                                size="sm"
                            >
                                {copiedCode === invitation.code ? (
                                    <>
                                        <Icon name="info" className="text-green-500 mr-2" size={16} />
                                        Copied
                                    </>
                                ) : (
                                    "Copy Code"
                                )}
                            </Button>
                            <Button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseInvitation(invitation);
                                }}
                                variant="danger"
                                size="sm"
                            >
                                Close
                            </Button>
                        </div>
                    }
                >
                    <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Invitation Code: <span className="font-mono">{invitation.code}</span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {invitation.acceptances.length} {invitation.acceptances.length === 1 ? 'acceptance' : 'acceptances'}
                        </div>
                    </div>
                </ListItem>

                {isSelected && invitation.acceptances.length > 0 && (
                    <div className="pl-8 pr-6 pb-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Acceptances</h4>
                        <div className="space-y-2">
                            {invitation.acceptances.map(acceptance => (
                                <div 
                                    key={j.hash(acceptance.acceptance)}
                                    className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md flex justify-between items-center"
                                >
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 dark:text-white">
                                            Code: <span className="font-mono">{j.hash(acceptance.acceptance)}</span>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button 
                                            onClick={() => handleApproveAcceptance(invitation, acceptance)}
                                            variant="primary"
                                            size="sm"
                                        >
                                            Approve
                                        </Button>
                                        <Button 
                                            onClick={() => handleDeclineAcceptance(invitation, acceptance)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div>
            <PageHeader
                title="Invitations"
                description="Manage invitations to your tenant"
                action={createInvitationButton}
            />
            
            {error && (
                <Alert 
                    variant="error" 
                    title="Error" 
                    message={error.message} 
                />
            )}

            <ResourceList
                items={invitations}
                isError={!!error}
                isLoading={isLoading}
                emptyState={{
                    iconName: "info",
                    title: "No invitations found",
                    description: "Create an invitation to allow users to join your tenant.",
                    action: (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            variant="primary"
                        >
                            Create Invitation
                        </Button>
                    )
                }}
                renderItem={renderInvitationItem}
                keyExtractor={(invitation) => invitation.code}
            />

            <ConfirmModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onConfirm={handleCreateInvitation}
                title="Create New Invitation"
                confirmText="Create Invitation"
                cancelText="Cancel"
            >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    This will create a new invitation with a randomly generated code. 
                    You can share this code with users to allow them to join your tenant.
                </p>
            </ConfirmModal>
        </div>
    );
}

export default Invitations;