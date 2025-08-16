import Cookies from 'js-cookie';
import 'prismjs/components/prism-clike';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import React, { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { renderToCanvas } from '../utils/canvas';
import { ShowNotes } from './ShowNotes';

interface NewShowEditorProps {
  showType: string;
  onCancel: () => void;
  onSave: () => void;
  onBackToTypeSelection: () => void;
}

export const NewShowEditor: React.FC<NewShowEditorProps> = ({ 
  showType, 
  onCancel, 
  onSave, 
  onBackToTypeSelection 
}) => {
  const [content, setContent] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isActiveRef = useRef(false);

  const getCsrfToken = () => {
    return Cookies.get('csrftoken') || '';
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const getLanguageForShowType = (showType: string) => {
    switch (showType) {
      case 'p5':
        return languages.javascript || languages.js;
      case 'shader':
        return languages.clike;
      case 'text':
        return languages.markup || languages.clike;
      case 'wasm':
      default:
        return languages.clike;
    }
  };

  const readStream = async (reader: ReadableStreamDefaultReader<Uint8Array>) => {
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const base64Data = line.substring(6);
            if (isActiveRef.current) {
              renderToCanvas('new-show-canvas', base64Data);
            }
          } else if (line.startsWith('event: error')) {
            console.error('Preview error event');
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error reading stream:', err);
      }
    }
  };

  const startPreview = async () => {
    try {
      setShowPreview(true);
      isActiveRef.current = true;
      
      const response = await fetch('/api/preview-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          show_type: showType,
          content: content
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start preview');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }
      
      setStreamReader(reader);
      readStream(reader);
    } catch (err) {
      console.error('Error starting preview:', err);
      setShowPreview(false);
      isActiveRef.current = false;
    }
  };

  const stopPreview = () => {
    setShowPreview(false);
    isActiveRef.current = false;
    if (streamReader) {
      streamReader.cancel();
      setStreamReader(null);
    }
  };

  const saveShow = async () => {
    if (!content.trim()) {
      alert('Please enter content for the show.');
      return;
    }

    try {
      const response = await fetch('/api/create-show', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          show_type: showType,
          content: content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create show');
      }

      const data = await response.json();
      if (data.success) {
        stopPreview();
        onSave();
      } else {
        throw new Error(data.error || 'Failed to create show');
      }
    } catch (err) {
      console.error('Error creating show:', err);
      alert('Failed to create show. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add a New {showType} Show</h1>
          <button
            onClick={() => {
              stopPreview();
              onBackToTypeSelection();
            }}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer"
          >
            Back to Type Selection
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content ({showType})
            </label>
            <div className="border border-gray-300 rounded-md" style={{ minHeight: '400px' }}>
              <Editor
                value={content}
                onValueChange={setContent}
                highlight={code => highlight(code, getLanguageForShowType(showType))}
                padding={12}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                  minHeight: '400px',
                  backgroundColor: '#fafafa',
                }}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={showPreview ? stopPreview : startPreview}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${showPreview 
                ? 'bg-red-200 hover:bg-red-300 text-red-800'
                : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
                }`}
            >
              {showPreview ? 'Stop Preview' : 'Preview'}
            </button>
            <button 
              onClick={() => {
                stopPreview();
                onCancel();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={saveShow}
              className="px-4 py-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-md transition-colors cursor-pointer"
            >
              Save Show
            </button>
          </div>
          
          {showPreview && (
            <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex justify-center">
                <canvas
                  id="new-show-canvas"
                  width={96}
                  height={38}
                  className="border border-gray-300 bg-black"
                  style={{ 
                    imageRendering: 'pixelated',
                    width: '480px',
                    height: '190px'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mt-6">
          <ShowNotes showType={showType} />
        </div>
      </div>
      
    </div>
  );
};