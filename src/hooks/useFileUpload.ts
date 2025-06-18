import { useState, useCallback } from 'react';
import { AlertMessage, UploadResponse, ProcessedData, FileUploadData } from '../types/shared';
import { FileValidator, ThresholdValidator, createDetailedError } from '../utils/validation';
import { getApiEndpoint } from '../config/env';

interface UseFileUploadReturn {
  file: File | null;
  threshold: string;
  isLoading: boolean;
  alerts: AlertMessage[];
  processingResult: (ProcessedData & FileUploadData) | null;
  dragActive: boolean;
  setFile: (file: File | null) => void;
  setThreshold: (threshold: string) => void;
  setDragActive: (active: boolean) => void;
  addAlert: (type: AlertMessage['type'], message: string) => void;
  removeAlert: (alert: AlertMessage) => void;
  clearAlerts: () => void;
  handleFileSelect: (file: File) => void;
  handleSubmit: () => Promise<void>;
  clearResults: () => void;
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [processingResult, setProcessingResult] = useState<(ProcessedData & FileUploadData) | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const addAlert = useCallback((type: AlertMessage['type'], message: string) => {
    const newAlert: AlertMessage = { 
      type, 
      message, 
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
    };
    
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
    }, 5000);
  }, []);

  const removeAlert = useCallback((alertToRemove: AlertMessage) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertToRemove.id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const validateForm = useCallback((): boolean => {
    clearAlerts();
    
    try {
      if (!file) {
        addAlert('error', 'Please select a CSV file to upload.');
        return false;
      }

      FileValidator.validateFile(file);
      ThresholdValidator.validateThresholdString(threshold);

      // Additional warning for high thresholds
      const thresholdNum = parseFloat(threshold);
      if (thresholdNum > 10000) {
        addAlert('warning', 'Threshold seems unusually high. Please verify.');
      }

      return true;
    } catch (error) {
      const errorDetails = createDetailedError(error);
      addAlert('error', errorDetails.message);
      return false;
    }
  }, [file, threshold, clearAlerts, addAlert]);

  const handleFileSelect = useCallback((selectedFile: File) => {
    try {
      FileValidator.validateFile(selectedFile);
      setFile(selectedFile);
      addAlert('info', `File "${selectedFile.name}" selected successfully!`);
    } catch (error) {
      const errorDetails = createDetailedError(error);
      addAlert('error', errorDetails.message);
      setFile(null);
    }
  }, [addAlert]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !file) {
      return;
    }

    setIsLoading(true);
    clearAlerts();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('threshold', threshold);

      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        body: formData,
      });

      const result: UploadResponse = await response.json();

      if (response.ok) {
        addAlert('success', result.message || 'File uploaded and processed successfully!');
        
        if (result.data) {
          setProcessingResult(result.data);
        }
        
        // Reset form
        setFile(null);
        setThreshold('');
      } else {
        const errorResult = result as unknown as { error: string; code?: string };
        addAlert('error', errorResult.error || 'An error occurred while processing your request.');
        setProcessingResult(null);
      }
    } catch (error) {
      const errorDetails = createDetailedError(error);
      addAlert('error', 'Failed to connect to the server. Please try again.');
      console.error('Upload error:', errorDetails);
    } finally {
      setIsLoading(false);
    }
  }, [file, threshold, validateForm, clearAlerts, addAlert]);

  const clearResults = useCallback(() => {
    setProcessingResult(null);
  }, []);

  return {
    file,
    threshold,
    isLoading,
    alerts,
    processingResult,
    dragActive,
    setFile,
    setThreshold,
    setDragActive,
    addAlert,
    removeAlert,
    clearAlerts,
    handleFileSelect,
    handleSubmit,
    clearResults
  };
}; 