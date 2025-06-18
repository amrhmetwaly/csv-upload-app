'use client';

import { getApiEndpoint } from '../config/env';
import { useState, useRef } from 'react';
import { CloudArrowUpIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { Upload, FileText, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import Image from 'next/image';

interface AlertMessage {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ProcessingResult {
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  totalRows: number;
  invalidRows: number;
  headers: string[];
  usageColumns: string[];
  threshold: number;
  thresholdAnalysis?: {
    usageColumn: string;
    rowsAboveThreshold: number;
    percentageAboveThreshold: string;
  };
  summary?: {
    totalDaysProcessed: number;
    daysExceedingThreshold: number;
    highestUsageDay?: {
      date: string;
      usage: number;
      customerName?: string;
      customerId?: string;
    };
    totalUsage: number;
    averageUsage: number;
  };
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [threshold, setThreshold] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addAlert = (type: AlertMessage['type'], message: string) => {
    const newAlert: AlertMessage = { type, message };
    setAlerts(prev => [...prev, newAlert]);
    
    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert !== newAlert));
    }, 5000);
  };

  const removeAlert = (alertToRemove: AlertMessage) => {
    setAlerts(prev => prev.filter(alert => alert !== alertToRemove));
  };

  const validateForm = (): boolean => {
    const newAlerts: AlertMessage[] = [];

    if (!file) {
      newAlerts.push({ type: 'error', message: 'Please select a CSV file to upload.' });
    } else if (!file.name.toLowerCase().endsWith('.csv')) {
      newAlerts.push({ type: 'error', message: 'Please select a valid CSV file.' });
    }

    if (!threshold.trim()) {
      newAlerts.push({ type: 'error', message: 'Please enter a usage threshold.' });
    } else {
      const thresholdNum = parseFloat(threshold);
      if (isNaN(thresholdNum)) {
        newAlerts.push({ type: 'error', message: 'Threshold must be a valid number.' });
      } else if (thresholdNum < 0) {
        newAlerts.push({ type: 'error', message: 'Threshold must be a positive number.' });
      } else if (thresholdNum > 10000) {
        newAlerts.push({ type: 'warning', message: 'Threshold seems unusually high. Please verify.' });
      }
    }

    if (newAlerts.length > 0) {
      setAlerts(newAlerts);
      return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].name.toLowerCase().endsWith('.csv')) {
        setFile(files[0]);
        addAlert('info', `File "${files[0].name}" selected successfully!`);
      } else {
        addAlert('error', 'Please drop a CSV file only.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.toLowerCase().endsWith('.csv')) {
        setFile(selectedFile);
        addAlert('info', `File "${selectedFile.name}" selected successfully!`);
      } else {
        addAlert('error', 'Please select a CSV file only.');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file!);
      formData.append('threshold', threshold);

      const response = await fetch(getApiEndpoint(), {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        addAlert('success', result.message || 'File uploaded and processed successfully!');
        
        // Store the processing results
        if (result.data) {
          setProcessingResult(result.data);
          console.log('Processing Results:', result.data); // For debugging
        }
        
        // Reset form
        setFile(null);
        setThreshold('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        addAlert('error', result.error || 'An error occurred while processing your request.');
        setProcessingResult(null);
      }
    } catch (error) {
      addAlert('error', 'Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAlertIcon = (type: AlertMessage['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertTriangle className="w-5 h-5" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
    }
  };

  const getAlertClasses = (type: AlertMessage['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 text-green-800 border-green-200';
      case 'error': return 'bg-red-50 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <Image
              src="/elect-usage-analyzer-logo.png"
              alt="Electric Usage Analyzer Logo"
              width={80}
              height={80}
              className="rounded-2xl shadow-lg"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CSV Upload & Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your CSV file and set a usage threshold to analyze your data with our advanced processing system.
          </p>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="max-w-2xl mx-auto mb-8 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start p-4 rounded-xl border-2 ${getAlertClasses(alert.type)} shadow-sm animate-in slide-in-from-top duration-300`}
              >
                <div className="flex-shrink-0 mr-3">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 text-sm font-medium">
                  {alert.message}
                </div>
                <button
                  onClick={() => removeAlert(alert)}
                  className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  CSV File Upload
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50'
                      : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-3">
                      <FileText className="mx-auto h-12 w-12 text-green-500" />
                      <div>
                        <p className="text-lg font-semibold text-green-700">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB • Ready to upload
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div>
                        <p className="text-lg font-semibold text-gray-700">
                          Drop your CSV file here
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          or <span className="text-indigo-600 font-medium">click to browse</span>
                        </p>
                      </div>
                      <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3 mt-4">
                        <InformationCircleIcon className="w-4 h-4 inline mr-1" />
                        Only CSV files are accepted. Max file size: 10MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Threshold Input */}
              <div>
                <label htmlFor="threshold" className="block text-sm font-semibold text-gray-700 mb-3">
                  Usage Threshold
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="threshold"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="Enter numeric threshold (e.g., 100)"
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-200 text-lg"
                    min="0"
                    step="0.01"
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">units</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 bg-blue-50 rounded-lg p-3">
                  <Info className="w-4 h-4 inline mr-1" />
                  This threshold will be used to filter and analyze your data. Enter a positive number.
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl'
                } text-white`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Upload & Process'
                )}
              </button>
            </form>
          </div>

          {/* Processing Results */}
          {processingResult && (
            <div className="mt-8 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Processing Results</h2>
              </div>
              
              {/* File Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-blue-600 mb-1">File Name</div>
                  <div className="text-lg font-semibold text-gray-900">{processingResult.fileName}</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-purple-600 mb-1">File Size</div>
                  <div className="text-lg font-semibold text-gray-900">{processingResult.fileSize}</div>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-indigo-600 mb-1">Uploaded At</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {new Date(processingResult.uploadedAt).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Data Processing</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Total Rows:</span>
                      <span className="font-semibold text-gray-900">{processingResult.totalRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Invalid Rows:</span>
                      <span className="font-semibold text-gray-900">{processingResult.invalidRows}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Threshold:</span>
                      <span className="font-semibold text-gray-900">{processingResult.threshold} units</span>
                    </div>
                  </div>
                </div>

                {processingResult.thresholdAnalysis && (
                  <div className="bg-orange-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-800 mb-4">Threshold Analysis</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Usage Column:</span>
                        <span className="font-semibold text-gray-900">{processingResult.thresholdAnalysis.usageColumn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Above Threshold:</span>
                        <span className="font-semibold text-gray-900">{processingResult.thresholdAnalysis.rowsAboveThreshold} rows</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Percentage:</span>
                        <span className="font-semibold text-gray-900">{processingResult.thresholdAnalysis.percentageAboveThreshold}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              {processingResult.summary && (
                <div className="bg-cyan-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-cyan-800 mb-4">Summary Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Total Usage:</span>
                        <span className="font-semibold text-gray-900">{processingResult.summary.totalUsage} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Average Usage:</span>
                        <span className="font-semibold text-gray-900">{processingResult.summary.averageUsage} units</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Days Processed:</span>
                        <span className="font-semibold text-gray-900">{processingResult.summary.totalDaysProcessed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-cyan-700">Days Exceeding:</span>
                        <span className="font-semibold text-gray-900">{processingResult.summary.daysExceedingThreshold}</span>
                      </div>
                    </div>
                  </div>
                  
                  {processingResult.summary.highestUsageDay && (
                    <div className="mt-4 pt-4 border-t border-cyan-200">
                      <h4 className="font-medium text-cyan-800 mb-2">Highest Usage Day:</h4>
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-gray-900">{processingResult.summary.highestUsageDay.date}</div>
                            {processingResult.summary.highestUsageDay.customerName && (
                              <div className="text-sm text-gray-600">{processingResult.summary.highestUsageDay.customerName}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-red-600">{processingResult.summary.highestUsageDay.usage} units</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Headers Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">CSV Structure</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-600 block mb-2">Detected Headers:</span>
                    <div className="flex flex-wrap gap-2">
                      {processingResult.headers.map((header, index) => (
                        <span key={index} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border">
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {processingResult.usageColumns.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-gray-600 block mb-2">Usage Columns:</span>
                      <div className="flex flex-wrap gap-2">
                        {processingResult.usageColumns.map((column, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {column}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Clear Results Button */}
              <div className="mt-6 text-center">
                <button
                  onClick={() => setProcessingResult(null)}
                  className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Clear Results
                </button>
              </div>
            </div>
          )}

          {/* Additional Information */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center text-sm text-gray-500 bg-white rounded-full px-4 py-2 shadow-sm">
              <DocumentTextIcon className="w-4 h-4 mr-2" />
              Secure file processing with real-time validation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
