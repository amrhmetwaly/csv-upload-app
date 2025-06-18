import React from 'react';
import { CheckCircle } from 'lucide-react';
import { ProcessedData, FileUploadData } from '../types/shared';

interface ProcessingResultsProps {
  data: (ProcessedData & FileUploadData) | null;
  onClear: () => void;
}

export const ProcessingResults: React.FC<ProcessingResultsProps> = ({ data, onClear }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="mt-8 bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
      <div className="flex items-center mb-6">
        <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Processing Results</h2>
      </div>
      
      {/* File Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="text-sm font-medium text-blue-600 mb-1">File Name</div>
          <div className="text-lg font-semibold text-gray-900">{data.fileName}</div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4">
          <div className="text-sm font-medium text-purple-600 mb-1">File Size</div>
          <div className="text-lg font-semibold text-gray-900">{data.fileSize}</div>
        </div>
        <div className="bg-indigo-50 rounded-xl p-4">
          <div className="text-sm font-medium text-indigo-600 mb-1">Uploaded At</div>
          <div className="text-lg font-semibold text-gray-900">
            {new Date(data.uploadedAt).toLocaleString()}
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
              <span className="font-semibold text-gray-900">{data.totalRows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Invalid Rows:</span>
              <span className="font-semibold text-gray-900">{data.invalidRows}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-700">Threshold:</span>
              <span className="font-semibold text-gray-900">{data.threshold} units</span>
            </div>
          </div>
        </div>

        {data.thresholdAnalysis && (
          <div className="bg-orange-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4">Threshold Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-orange-700">Usage Column:</span>
                <span className="font-semibold text-gray-900">{data.thresholdAnalysis.usageColumn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Above Threshold:</span>
                <span className="font-semibold text-gray-900">{data.thresholdAnalysis.rowsAboveThreshold} rows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-orange-700">Percentage:</span>
                <span className="font-semibold text-gray-900">{data.thresholdAnalysis.percentageAboveThreshold}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {data.summary && (
        <div className="bg-cyan-50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-cyan-800 mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-cyan-700">Total Usage:</span>
                <span className="font-semibold text-gray-900">{data.summary.totalUsage} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-700">Average Usage:</span>
                <span className="font-semibold text-gray-900">{data.summary.averageUsage} units</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-cyan-700">Days Processed:</span>
                <span className="font-semibold text-gray-900">{data.summary.totalDaysProcessed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-cyan-700">Days Exceeding:</span>
                <span className="font-semibold text-gray-900">{data.summary.daysExceedingThreshold}</span>
              </div>
            </div>
          </div>
          
          {data.summary.highestUsageDay && (
            <div className="mt-4 pt-4 border-t border-cyan-200">
              <h4 className="font-medium text-cyan-800 mb-2">Highest Usage Day:</h4>
              <div className="bg-white rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-900">{data.summary.highestUsageDay.date}</div>
                    {data.summary.highestUsageDay.customerName && (
                      <div className="text-sm text-gray-600">{data.summary.highestUsageDay.customerName}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-red-600">{data.summary.highestUsageDay.usage} units</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Headers Information */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">CSV Structure</h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm font-medium text-gray-600 block mb-2">Detected Headers:</span>
            <div className="flex flex-wrap gap-2">
              {data.headers.map((header, index) => (
                <span key={index} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border">
                  {header}
                </span>
              ))}
            </div>
          </div>
          
          {data.usageColumns.length > 0 && (
            <div>
              <span className="text-sm font-medium text-gray-600 block mb-2">Usage Columns:</span>
              <div className="flex flex-wrap gap-2">
                {data.usageColumns.map((column, index) => (
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
      <div className="text-center">
        <button
          onClick={onClear}
          className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
        >
          Clear Results
        </button>
      </div>
    </div>
  );
}; 