
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (content: string, name: string) => void;
  fileName: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, fileName }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    if (file.name.split('.').pop()?.toLowerCase() !== 'srt') {
      alert('Please upload a valid .srt file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDragEvents = useCallback((event: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(dragging);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(event, false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  }, [handleDragEvents]);

  const baseClasses = "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300";
  const stateClasses = isDragging ? "border-indigo-400 bg-gray-700" : "border-gray-600 bg-gray-800 hover:bg-gray-700/50";

  return (
    <div>
      <label
        htmlFor="dropzone-file"
        className={`${baseClasses} ${stateClasses}`}
        onDragEnter={(e) => handleDragEvents(e, true)}
        onDragOver={(e) => handleDragEvents(e, true)}
        onDragLeave={(e) => handleDragEvents(e, false)}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
          <UploadIcon />
          {fileName ? (
            <>
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-indigo-400">File selected:</span>
              </p>
              <p className="text-xs text-gray-400 break-all">{fileName}</p>
            </>
          ) : (
            <>
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">SRT files only</p>
            </>
          )}
        </div>
        <input id="dropzone-file" type="file" className="hidden" accept=".srt" onChange={handleFileChange} />
      </label>
    </div>
  );
};

export default FileUpload;
