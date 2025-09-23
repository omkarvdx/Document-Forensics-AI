import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook that persists state to sessionStorage across navigation
 * @param key - Storage key
 * @param initialValue - Initial value if nothing in storage
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error loading persisted state for key "${key}":`, error);
      return initialValue;
    }
  });

  const setPersistedValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(prevValue => {
      const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue;
      try {
        sessionStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`Error persisting state for key "${key}":`, error);
      }
      return valueToStore;
    });
  }, [key]);

  const clearPersistedValue = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
      setValue(initialValue);
    } catch (error) {
      console.warn(`Error clearing persisted state for key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [value, setPersistedValue, clearPersistedValue] as const;
}

/**
 * Special hook for persisting file and blob data
 */
export function usePersistedFileState() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    // Store file metadata (can't store File object directly)
    const fileMetadata = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    };
    
    // Set the file in state
    setSelectedFile(file);
    
    // Create and store preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      
      // Store both metadata and data URL
      try {
        sessionStorage.setItem('forensics_fileMetadata', JSON.stringify(fileMetadata));
        sessionStorage.setItem('forensics_fileDataUrl', dataUrl);
      } catch (error) {
        console.warn('Error storing file data:', error);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const clearFileData = useCallback(() => {
    setSelectedFile(null);
    setPreviewUrl(null);
    try {
      sessionStorage.removeItem('forensics_fileMetadata');
      sessionStorage.removeItem('forensics_fileDataUrl');
    } catch (error) {
      console.warn('Error clearing file data:', error);
    }
  }, []);

  // Restore file from stored data on component mount
  useEffect(() => {
    if (selectedFile || isRestoring) return; // Don't restore if we already have a file or are already restoring
    
    try {
      const fileMetadata = sessionStorage.getItem('forensics_fileMetadata');
      const fileDataUrl = sessionStorage.getItem('forensics_fileDataUrl');
      
      if (fileMetadata && fileDataUrl) {
        setIsRestoring(true);
        const metadata = JSON.parse(fileMetadata);
        
        // Set preview URL immediately
        setPreviewUrl(fileDataUrl);
        
        // Convert data URL back to File object
        fetch(fileDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const restoredFile = new File([blob], metadata.name, {
              type: metadata.type,
              lastModified: metadata.lastModified
            });
            setSelectedFile(restoredFile);
          })
          .catch(error => {
            console.warn('Error restoring file from storage:', error);
            // If restoration fails, clear the stored data
            clearFileData();
          })
          .finally(() => {
            setIsRestoring(false);
          });
      }
    } catch (error) {
      console.warn('Error loading file from storage:', error);
      setIsRestoring(false);
    }
  }, [selectedFile, isRestoring, clearFileData]);

  return {
    selectedFile,
    previewUrl,
    handleFileSelect,
    clearFileData
  };
}
