import React, { useState, useRef, useEffect } from 'react';
import Cookies from 'js-cookie';
import Editor from 'react-simple-code-editor';
import 'prismjs/themes/prism.css';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
const { highlight, languages } = Prism;
import { ShowNotes } from './ShowNotes';
import { renderToCanvas } from '../utils/canvas';

interface ShowDetail {
  id: number;
  show_type: string;
  payload: any;
  created_at: string;
  disabled: boolean;
}

interface ShowEditorProps {
  show: ShowDetail;
  onClose: () => void;
  onSave: () => void;
}

export const ShowEditor: React.FC<ShowEditorProps> = ({ show, onClose, onSave }) => {
  const [payload, setPayload] = useState<string>(() => {
    const showTypeContent = show.payload[show.show_type] || '';
    return typeof showTypeContent === 'string' ? showTypeContent : JSON.stringify(showTypeContent, null, 2);
  });
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
              renderToCanvas('show-editor-canvas', base64Data);
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
          show_type: show.show_type,
          content: payload
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
    try {
      const payloadToSave = {
        [show.show_type]: payload
      };

      const response = await fetch(`/api/shows/${show.id}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify(payloadToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save show');
      }

      const data = await response.json();
      if (data.success) {
        stopPreview();
        onSave();
      }
    } catch (err) {
      console.error('Error saving show:', err);
      alert('Failed to save show. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Show</h1>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                show.show_type === 'text' ? 'bg-purple-100 text-purple-800' :
                show.show_type === 'p5' ? 'bg-orange-100 text-orange-800' :
                show.show_type === 'shader' ? 'bg-cyan-100 text-cyan-800' :
                show.show_type === 'wasm' ? 'bg-pink-100 text-pink-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {show.show_type}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${show.disabled 
                  ? 'bg-gray-200 text-gray-600' 
                  : 'bg-green-100 text-green-800'
                }`}>
                {show.disabled ? 'Disabled' : 'Enabled'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Created: {new Date(show.created_at).toLocaleString()}
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content ({show.show_type})
            </label>
            <div className="border border-gray-300 rounded-md" style={{ minHeight: '400px' }}>
              <Editor
                value={payload}
                onValueChange={setPayload}
                highlight={code => highlight(code, getLanguageForShowType(show.show_type))}
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
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${
                showPreview 
                  ? 'bg-red-200 hover:bg-red-300 text-red-800'
                  : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
              }`}
            >
              {showPreview ? 'Stop Preview' : 'Preview'}
            </button>
            <button 
              onClick={() => {
                stopPreview();
                onClose();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={saveShow}
              className="px-4 py-2 bg-green-200 hover:bg-green-300 text-green-800 rounded-md transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
          
          {showPreview && (
            <div className="mt-4 p-4 border border-gray-200 rounded bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
              <div className="flex justify-center">
                <canvas
                  id="show-editor-canvas"
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
          <ShowNotes showType={show.show_type} />
        </div>
      </div>
      
    </div>
  );
};