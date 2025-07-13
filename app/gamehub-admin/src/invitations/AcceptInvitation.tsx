import { Invitation, InvitationAcceptance } from '@model/model';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '../auth/UserProvider';
import { Button, Card } from '../components/atoms';
import Alert from '../components/atoms/Alert';
import LoadingIndicator from '../components/atoms/LoadingIndicator';
import PageHeader from '../components/molecules/PageHeader';
import { j } from '../jinaga-config';
import { useTenant } from '../tenants/useTenant';

export function AcceptInvitation() {
    const tenant = useTenant();
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { user } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [invitationCode, setInvitationCode] = useState('');
    const [acceptanceHash, setAcceptanceHash] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // If code is provided in URL, use it
        if (code) {
            setInvitationCode(code);
        }
    }, [code]);

    const handleCopyHash = () => {
        if (acceptanceHash) {
            navigator.clipboard.writeText(acceptanceHash);
            setCopied(true);

            // Reset copied state after 2 seconds
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleAcceptInvitation = async () => {
        if (!invitationCode || !tenant || !user) return;

        setIsLoading(true);
        setError(null);

        try {
            // Create the invitation object
            const invitation = new Invitation(tenant, invitationCode);

            // Create the acceptance fact
            const acceptance = await j.fact(new InvitationAcceptance(invitation, user));

            // Get the hash of the acceptance fact
            const factHash = j.hash(acceptance);
            setAcceptanceHash(factHash);

            setSuccess(true);
        } catch (err) {
            console.error('Error accepting invitation:', err);
            setError('Failed to accept invitation. Please check the code and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingIndicator size={32} />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="max-w-2xl mx-auto">
                <Alert
                    variant="warning"
                    title="Authentication Required"
                    message="Please sign in to accept this invitation."
                    className="my-6"
                />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <PageHeader
                title="Accept Invitation"
                description="Enter the invitation code to join this tenant"
            />

            <Card className="mt-6">
                <div className="p-6">
                    {error && (
                        <div className="mb-6">
                            <Alert variant="error" message={error} />
                        </div>
                    )}

                    {success ? (
                        <div className="text-center py-8">
                            <div className="text-green-500 text-5xl mb-4">✓</div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                Invitation Accepted!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                You have successfully accepted the invitation.
                            </p>
                            {acceptanceHash && (
                                <div className="text-left mb-6">
                                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                                        Please share this code with the admin who invited you:
                                    </p>
                                    <div className="flex items-center space-x-2">
                                        <code className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded flex-1 font-mono text-sm overflow-x-auto">
                                            {acceptanceHash}
                                        </code>
                                        <Button
                                            onClick={handleCopyHash}
                                            variant="secondary"
                                            className="whitespace-nowrap"
                                        >
                                            {copied ? 'Copied!' : 'Copy Code'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <Button
                                onClick={() => navigate('/')}
                                variant="primary"
                                className="mt-4"
                            >
                                Go to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="mb-6">
                                <label
                                    htmlFor="invitationCode"
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                                >
                                    Invitation Code
                                </label>
                                <input
                                    type="text"
                                    id="invitationCode"
                                    value={invitationCode}
                                    onChange={(e) =>
                                        setInvitationCode(e.target.value.toUpperCase())
                                    }
                                    placeholder="Enter invitation code"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    autoComplete="off"
                                    autoFocus
                                />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    The invitation code should have been provided to you by an
                                    administrator.
                                </p>
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <Button onClick={() => navigate('/')} variant="secondary">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAcceptInvitation}
                                    disabled={!invitationCode.trim()}
                                    variant="primary"
                                >
                                    Accept Invitation
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
