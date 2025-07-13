import React, { useCallback, useEffect, useState } from 'react';
import { Button, ImageUploader } from '../atoms';
import { getImageUrl, uploadImage } from '../../services/contentStore';

export interface LogoUploaderProps {
    initialLogoHash?: string;
    onLogoUploaded: (hash: string) => void;
    contentStoreUrl: string;
    className?: string;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({
    initialLogoHash,
    onLogoUploaded,
    contentStoreUrl,
    className = '',
}) => {
    const [logoHash, setLogoHash] = useState<string | undefined>(initialLogoHash);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Update local state if prop changes
    useEffect(() => {
        setLogoHash(initialLogoHash);
    }, [initialLogoHash]);

    const handleImageSelected = useCallback(
        async (file: File) => {
            setIsUploading(true);
            setError(null);

            try {
                const hash = await uploadImage(file, contentStoreUrl);
                setLogoHash(hash);
                onLogoUploaded(hash);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to upload image');
                console.error('Error uploading logo:', err);
            } finally {
                setIsUploading(false);
            }
        },
        [contentStoreUrl, onLogoUploaded]
    );

    const handleRemoveLogo = useCallback(() => {
        setLogoHash(undefined);
        onLogoUploaded(''); // Empty string to indicate removal
    }, [onLogoUploaded]);

    const logoUrl = logoHash ? getImageUrl(logoHash, contentStoreUrl) : undefined;

    return (
        <div className={`w-full ${className}`}>
            {logoHash && logoUrl ? (
                <div className="mb-4">
                    <div className="relative w-full max-w-xs mx-auto">
                        <img
                            src={logoUrl}
                            alt="Competitor Logo"
                            className="w-full h-auto rounded-md shadow-sm"
                        />
                        <Button
                            variant="danger"
                            size="sm"
                            icon="delete"
                            className="absolute top-2 right-2"
                            onClick={handleRemoveLogo}
                            aria-label="Remove logo"
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <ImageUploader
                    onImageSelected={handleImageSelected}
                    accept="image/*"
                    maxSize={2 * 1024 * 1024} // 2MB
                />
            )}

            {isUploading && (
                <div className="mt-2 text-center">
                    <div className="inline-flex items-center">
                        <Button variant="primary" isLoading={true} disabled={true}>
                            Uploading...
                        </Button>
                    </div>
                </div>
            )}

            {error && <div className="mt-2 text-red-500 text-sm">{error}</div>}
        </div>
    );
};

export default LogoUploader;
