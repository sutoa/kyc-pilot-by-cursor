'use client';

import { useState } from 'react';
import FileUpload from './components/FileList/FileUpload';
import Logo from './components/Logo';

export default function Home() {
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedPrompts = [
    "Analyze the content of the provided documents",
    "Extract key information from the files",
    "Summarize the main points",
  ];

  const handleFileSelect = async (files: FileList) => {
    console.log('Processing files...');
    setIsUploading(true);
    const newContents: { [key: string]: string } = { ...fileContents };

    try {
      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append('file', file);

          const res = await fetch('http://localhost:8001/api/extract-text', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Failed to process ${file.name}`);
          }

          const data = await res.json();
          if (data.error) {
            throw new Error(data.error);
          }
          newContents[file.name] = data.text;
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          setShowFileDialog(false);  // Close dialog before showing alert
          setIsUploading(false);
          alert(`Failed to process ${file.name}. Please try again.`);
          return;  // Exit early on error
        }
      }

      setFileContents(newContents);
    } finally {
      setIsUploading(false);
      setShowFileDialog(false);
    }
  };

  const handleRemoveFile = (filename: string) => {
    const newContents = { ...fileContents };
    delete newContents[filename];
    setFileContents(newContents);
  };

  const handleSubmit = async () => {
    if (Object.keys(fileContents).length === 0) {
      alert('Please select at least one file');
      return;
    }

    if (!selectedPrompt) {
      alert('Please enter or select a prompt');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combine prompt with file contents
      let contextText = '';
      Object.entries(fileContents).forEach(([filename, content]) => {
        contextText += `\n\nFile ${filename} content:\n${content}`;
      });

      const fullPrompt = `${selectedPrompt}\n\nBelow is the context, please do not make up values if you cannot find any answers. Just say 'not found'.${contextText}`;

      const res = await fetch('http://localhost:8001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar - File List */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <Logo />
        <div className="mt-24">
          <button
            onClick={() => setShowFileDialog(true)}
            disabled={isUploading}
            className={`w-full mb-2 px-4 py-2 text-sm text-white rounded-md ${
              isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Add Files'
            )}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {Object.keys(fileContents).map((filename) => (
            <div key={filename} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded group">
              <span className="truncate text-sm" title={filename}>
                {filename}
              </span>
              <button
                onClick={() => handleRemoveFile(filename)}
                className="invisible group-hover:visible text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Prompt Section */}
        <div className="mb-6">
          <select
            className="w-full p-2 border rounded-md mb-4"
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select a prompt template...</option>
            {predefinedPrompts.map((prompt, index) => (
              <option key={index} value={prompt}>
                {prompt}
              </option>
            ))}
          </select>
          <textarea
            className="w-full p-4 border rounded-md h-32"
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            placeholder="Enter or modify your prompt here..."
            disabled={isSubmitting}
          />
          <button
            onClick={handleSubmit}
            disabled={isUploading || isSubmitting}
            className={`mt-4 px-6 py-2 text-white rounded-md flex items-center justify-center ${
              isUploading || isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Response Section */}
        {response && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Response</h3>
            <div className="prose max-w-none">
              {(() => {
                try {
                  // Try to parse as JSON first
                  const jsonData = JSON.parse(response);
                  return (
                    <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
                      <code className="text-sm">
                        {JSON.stringify(jsonData, null, 2)}
                      </code>
                    </pre>
                  );
                } catch (e) {
                  // If not JSON, check if it's a table (contains | and -)
                  if (response.includes('|') && response.includes('-')) {
                    return (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          {response.split('\n').map((row, i) => (
                            <tr key={i} className={i === 0 ? 'bg-gray-50' : 'bg-white'}>
                              {row.split('|').map((cell, j) => (
                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm">
                                  {cell.trim()}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </table>
                      </div>
                    );
                  }
                  // If neither JSON nor table, display as plain text
                  return <div className="whitespace-pre-wrap">{response}</div>;
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* File Selection Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Files</h3>
              <button
                onClick={() => setShowFileDialog(false)}
                disabled={isUploading}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <FileUpload onFileSelect={handleFileSelect} />
          </div>
        </div>
      )}
    </main>
  );
}
