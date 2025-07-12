import React, { useCallback, useState } from 'react';
import Icon from './Icon';

export interface ImageUploaderProps {
  onImageSelected: (file: File) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((file: File): boolean => {
    // Reset error state
    setError(null);

    // Check file type if accept is specified
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const acceptedPatterns = acceptedTypes.map(type => {
        // Convert MIME type wildcard syntax to regex
        // e.g., "image/*" becomes "^image\/.*$"
        return new RegExp(`^${type.replace('*', '.*').replace('/', '\\/')}$`);
      });
      
      const isAcceptedFileType = acceptedPatterns.some(pattern => 
        pattern.test(file.type)
      );
      
      if (!isAcceptedFileType) {
        // Create a more user-friendly description of accepted types
        const typeDescriptions = acceptedTypes.map(type => {
          if (type === 'image/*') return 'images';
          if (type.includes('*')) return `${type.split('/')[0]} files`;
          return type.split('/')[1] || type;
        }).join(', ');
        
        setError(`File type not supported. Please upload ${typeDescriptions}.`);
        return false;
      }
    }

    // Check file size
    if (maxSize && file.size > maxSize) {
      const sizeMB = Math.round(maxSize / 1024 / 1024);
      setError(`File is too large. Maximum size is ${sizeMB}MB.`);
      return false;
    }

    return true;
  }, [accept, maxSize]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onImageSelected(file);
      }
    }
  }, [onImageSelected, validateFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onImageSelected(file);
      }
    }
  }, [onImageSelected, validateFile]);

  // Base classes
  const baseClasses = 'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors';
  
  // State classes
  const stateClasses = isDragging
    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
    : 'border-gray-300 hover:border-primary-400 dark:border-gray-600 dark:hover:border-primary-500';
  
  // Error classes
  const errorClasses = error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : '';
  
  // Combine all classes
  const uploaderClasses = `
    ${baseClasses}
    ${stateClasses}
    ${errorClasses}
    ${className}
  `;

  return (
    <div className="w-full">
      <div
        className={uploaderClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="flex flex-col items-center justify-center">
          <Icon
            name="upload"
            size={36}
            className={`mb-2 ${error ? 'text-red-500' : 'text-gray-400'}`}
          />
          
          {error ? (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragging ? 'Drop your image here' : 'Drag and drop your image here'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                or <span className="text-primary-600 dark:text-primary-400">browse</span> to upload
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
