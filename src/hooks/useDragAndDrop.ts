import { useCallback } from 'react';
import { FileValidator } from '../utils/validation';

interface UseDragAndDropProps {
  onFileSelect: (file: File) => void;
  onDragActiveChange: (active: boolean) => void;
  onError: (message: string) => void;
}

interface UseDragAndDropReturn {
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export const useDragAndDrop = ({
  onFileSelect,
  onDragActiveChange,
  onError
}: UseDragAndDropProps): UseDragAndDropReturn => {
  
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      onDragActiveChange(true);
    } else if (e.type === 'dragleave') {
      onDragActiveChange(false);
    }
  }, [onDragActiveChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragActiveChange(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      
      try {
        FileValidator.validateFileType(file.name);
        onFileSelect(file);
      } catch (error) {
        onError('Please drop a CSV file only.');
      }
    }
  }, [onFileSelect, onDragActiveChange, onError]);

  return {
    handleDrag,
    handleDrop
  };
}; 