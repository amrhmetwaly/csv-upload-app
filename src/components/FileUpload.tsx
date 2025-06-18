import React, { useRef } from 'react';
import { Upload, FileText, Info } from 'lucide-react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

interface FileUploadProps {
  file: File | null;
  dragActive: boolean;
  onFileSelect: (file: File) => void;
  onDragActiveChange: (active: boolean) => void;
  onError: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  file,
  dragActive,
  onFileSelect,
  onDragActiveChange,
  onError
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleDrag, handleDrop } = useDragAndDrop({
    onFileSelect,
    onDragActiveChange,
    onError
  });

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset file input when file is cleared
  React.useEffect(() => {
    if (!file) {
      resetFileInput();
    }
  }, [file]);

  return (
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
          onChange={handleFileInputChange}
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
              <Info className="w-4 h-4 inline mr-1" />
              Only CSV files are accepted. Max file size: 10MB
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 