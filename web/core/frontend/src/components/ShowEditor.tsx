import Cookies from 'js-cookie';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markup';
import 'prismjs/themes/prism.css';
import React, { useEffect, useRef, useState } from 'react';
import Editor from 'react-simple-code-editor';
import { renderToCanvas } from '../utils/canvas';
import { ShowNotes } from './ShowNotes';
const { highlight, languages } = Prism;

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
  const [previewShowId, setPreviewShowId] = useState<number | null>(null);
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
        return { grammar: languages.javascript || languages.js, language: 'javascript' };
      case 'shader':
        return { grammar: languages.clike, language: 'clike' };
      case 'text':
        return { grammar: languages.markup || languages.clike, language: 'markup' };
      case 'wasm':
      default:
        return { grammar: languages.clike, language: 'clike' };
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

  const restartPreview = async () => {
    stopPreview();
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 100));
    await startPreview();
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

  const showImmediately = async () => {
    try {
      // First, create or update the preview show
      const createPreviewResponse = await fetch('/api/create-or-update-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          show_type: show.show_type,
          content: payload,
          preview_show_id: previewShowId
        })
      });

      if (!createPreviewResponse.ok) {
        throw new Error('Failed to create preview show');
      }

      const previewData = await createPreviewResponse.json();
      if (!previewData.success) {
        throw new Error(previewData.error || 'Failed to create preview show');
      }

      // Save the preview show ID for reuse
      setPreviewShowId(previewData.show_id);

      // Now tell the worker to show it immediately
      const showImmediatelyResponse = await fetch(`/api/shows/${previewData.show_id}/show_immediately`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (!showImmediatelyResponse.ok) {
        throw new Error('Failed to show immediately');
      }

      const showData = await showImmediatelyResponse.json();
      if (!showData.success) {
        throw new Error('Failed to show immediately');
      }
    } catch (err) {
      console.error('Error showing immediately:', err);
      alert('Failed to show immediately. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Show</h1>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${show.show_type === 'text' ? 'bg-purple-100 text-purple-800' :
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
                highlight={code => {
                  const lang = getLanguageForShowType(show.show_type);
                  return highlight(code, lang.grammar, lang.language);
                }}
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
              onClick={() => {
                stopPreview();
                onClose();
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={showPreview ? restartPreview : startPreview}
              className={`px-4 py-2 rounded-md transition-colors cursor-pointer ${showPreview
                ? 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800'
                : 'bg-blue-200 hover:bg-blue-300 text-blue-800'
                }`}
            >
              {showPreview ? 'Restart Preview' : 'Preview'}
            </button>
            <button
              onClick={showImmediately}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors cursor-pointer"
            >
              Show Immediately
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