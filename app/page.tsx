'use client';

import { useState } from 'react';
import FileUpload from './components/FileList/FileUpload';
import Logo from './components/Logo';

export default function Home() {
  const [fileContents, setFileContents] = useState<{ [key: string]: string }>({});
  const [selectedPromptName, setSelectedPromptName] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  const predefinedPrompts = [
    "Find CSMs for the client",
    "Analyze the content of the provided documents",
    "Extract key information from the files",
    "Summarize the main points",
  ];

  const predefinedPromptTemplates: { [key: string]: string } = {
    "Find CSMs for the client": `You are a senior KYC analyst for a major European bank. Your job is to find the list of direct owners and executive officers of the client. 
- return the result in markdown format
- display a line above the table below with the company name in bold
- list of people in a table, including attributes such as Full Name, Title, Ownership Code and Ownership Description. Note that you need to find the description based on the code. For instance, for 'C', the description is '25% but less than 50%'. Also note that for code 'NA', the description is NOT 'Not Applicable'`
  };

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

  const handlePromptSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedPromptName(selectedValue);
    setSelectedPrompt(predefinedPromptTemplates[selectedValue] || selectedValue);
  };

  const handleSubmit = async () => {
    if (!selectedPrompt) {
      alert('Please enter or select a prompt');
      return;
    }

    setIsSubmitting(true);
    const startTime = Date.now();

    try {
      // Combine prompt with file contents if any exist
      let contextText = '';
      if (Object.keys(fileContents).length > 0) {
        Object.entries(fileContents).forEach(([filename, content]) => {
          contextText += `\n\nFile ${filename} content:\n${content}`;
        });
      }

      const fullPrompt = `${selectedPrompt}${contextText ? `\n\nBelow is the context, please do not make up values if you cannot find any answers. Just say 'not found'.${contextText}` : ''}`;

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
      setElapsedTime((Date.now() - startTime) / 1000); // Convert to seconds
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to process request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Logo and Main Content */}
      <div className="px-4">
        {/* Logo */}
        <div className="h-28 flex items-center">
          <Logo />
        </div>

        {/* Main Content */}
        <div className="flex gap-4 h-[calc(100vh-12rem)]">
          {/* Left Sidebar - File List */}
          <div className="w-64 bg-white rounded-xl shadow-sm flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 rounded-t-xl">
              <h1 className="text-xl font-semibold">KYC Data Source</h1>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
              <button
                onClick={() => setShowFileDialog(true)}
                disabled={isUploading}
                className={`w-full px-4 py-2 text-sm text-white rounded-md ${
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
              
              <div className="flex items-center mt-6 mb-4">
                <input type="checkbox" className="mr-2" />
                <span className="text-sm text-gray-600">Select all sources</span>
              </div>

              <div className="space-y-2">
                {Object.keys(fileContents).map((filename) => (
                  <div key={filename} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded group">
                    <div className="flex items-center">
                      <input type="checkbox" className="mr-2" checked />
                      <span className="truncate text-sm" title={filename}>
                        {filename}
                      </span>
                    </div>
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
          </div>

          {/* Middle Panel - Chat Interface */}
          <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 rounded-t-xl">
              <h1 className="text-xl font-semibold">Chat</h1>
            </div>

            {/* Chat Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              {response && (
                <div className="bg-white rounded-lg mb-4">
                  {elapsedTime !== null && (
                    <div className="text-sm text-gray-500 text-right mb-2">
                      Elapsed time: {elapsedTime.toFixed(2)}s
                    </div>
                  )}
                  <div className="prose max-w-none">
                    {(() => {
                      try {
                        const jsonData = JSON.parse(response);
                        return (
                          <pre className="bg-gray-50 p-4 rounded-md overflow-auto">
                            <code className="text-sm">
                              {JSON.stringify(jsonData, null, 2)}
                            </code>
                          </pre>
                        );
                      } catch (e) {
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
                        return <div className="whitespace-pre-wrap">{response}</div>;
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 rounded-b-xl mt-auto">
              <div className="flex flex-col space-y-4">
                <select
                  className="w-full p-2 border rounded-md text-sm"
                  value={selectedPromptName}
                  onChange={handlePromptSelect}
                  disabled={isSubmitting}
                >
                  <option value="">Select a prompt template...</option>
                  {predefinedPrompts.map((prompt, index) => (
                    <option key={index} value={prompt}>
                      {prompt}
                    </option>
                  ))}
                </select>
                
                <div className="relative">
                  <textarea
                    className="w-full p-4 pr-12 border rounded-md text-sm min-h-[100px] resize-none"
                    value={selectedPrompt}
                    onChange={(e) => setSelectedPrompt(e.target.value)}
                    placeholder="Start typing..."
                    disabled={isSubmitting}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="absolute right-2 bottom-2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Studio */}
          <div className="w-80 bg-white rounded-xl shadow-sm flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-4 rounded-t-xl">
              <h1 className="text-xl font-semibold">Studio</h1>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Placeholder for future content */}
            </div>
          </div>
        </div>
      </div>

      {/* File Selection Dialog */}
      {showFileDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
    </div>
  );
}
