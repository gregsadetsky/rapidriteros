import React, { useState, useRef } from 'react';
import Cookies from 'js-cookie';

interface PreviewProps {
  showType: string;
  content: string;
  canvasId: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

const renderToCanvas = (canvasId: string, base64Data: string) => {
  try {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    
    // Decode base64 to binary data
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Create ImageData for 96x38 1-bit display
    const imageData = ctx.createImageData(96, 38);
    const data = imageData.data;
    
    // Convert 1-bit data to RGBA
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      for (let bit = 0; bit < 8; bit++) {
        const pixelIndex = i * 8 + bit;
        const x = pixelIndex % 96;
        const y = Math.floor(pixelIndex / 96);
        
        if (x < 96 && y < 38) {
          const rgbaIndex = (y * 96 + x) * 4;
          const isOn = (byte >> (7 - bit)) & 1;
          const color = isOn ? 255 : 0;
          
          data[rgbaIndex] = color;
          data[rgbaIndex + 1] = color;
          data[rgbaIndex + 2] = color;
          data[rgbaIndex + 3] = 255;
        }
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
  } catch (err) {
    console.error('Error rendering canvas:', err);
  }
};

const readStream = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  canvasId: string,
  isActiveRef: React.MutableRefObject<boolean>,
  onStop: () => void
) => {
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
            renderToCanvas(canvasId, base64Data);
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
    onStop();
  }
};

export const Preview: React.FC<PreviewProps> = ({ 
  showType, 
  content, 
  canvasId, 
  isOpen, 
  onClose, 
  title 
}) => {
  const [streamReader, setStreamReader] = useState<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const isActiveRef = useRef(false);

  const getCsrfToken = () => {
    return Cookies.get('csrftoken') || '';
  };

  const startPreview = async () => {
    try {
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
      readStream(reader, canvasId, isActiveRef, stopPreview);
    } catch (err) {
      console.error('Error starting preview:', err);
      onClose();
    }
  };

  const stopPreview = () => {
    isActiveRef.current = false;
    if (streamReader) {
      streamReader.cancel();
      setStreamReader(null);
    }
    onClose();
  };

  // Start preview when component opens
  React.useEffect(() => {
    if (isOpen && !isActiveRef.current) {
      startPreview();
    } else if (!isOpen) {
      stopPreview();
    }
    
    // Cleanup on unmount
    return () => {
      stopPreview();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={stopPreview}
            className="px-4 py-2 bg-red-200 hover:bg-red-300 text-red-800 rounded-md transition-colors cursor-pointer"
          >
            Stop Preview
          </button>
        </div>
        <div className="relative">
          <canvas
            id={canvasId}
            width={96}
            height={38}
            className="border border-gray-300 bg-black"
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              imageRendering: 'pixelated',
              width: '480px',
              height: '190px'
            }}
          />
        </div>
      </div>
    </div>
  );
};