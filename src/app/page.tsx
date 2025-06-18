'use client';

import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Info } from 'lucide-react';
import Image from 'next/image';

import { useFileUpload } from '../hooks/useFileUpload';
import { AlertList } from '../components/Alert';
import { FileUpload } from '../components/FileUpload';
import { ProcessingResults } from '../components/ProcessingResults';

export default function Home() {
  const {
    file,
    threshold,
    isLoading,
    alerts,
    processingResult,
    dragActive,
    setThreshold,
    setDragActive,
    addAlert,
    removeAlert,
    handleFileSelect,
    handleSubmit,
    clearResults
  } = useFileUpload();

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmit();
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
        <AlertList alerts={alerts} onRemove={removeAlert} />

        {/* Main Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handleFormSubmit} className="space-y-8">
              
              {/* File Upload Section */}
              <FileUpload
                file={file}
                dragActive={dragActive}
                onFileSelect={handleFileSelect}
                onDragActiveChange={setDragActive}
                onError={(message) => addAlert('error', message)}
              />

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
          <ProcessingResults data={processingResult} onClear={clearResults} />

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
