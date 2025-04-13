'use client';

import { useState } from 'react';

interface FileUploadProps {
  onFileSelect: (files: FileList) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const handleLocalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    onFileSelect(files);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Files
        </label>
        <input
          type="file"
          multiple
          onChange={handleLocalFileSelect}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>
    </div>
  );
} 