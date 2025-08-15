import React from 'react';

interface ShowTypeSelectorProps {
  onSelectType: (type: string) => void;
  onCancel: () => void;
}

export const ShowTypeSelector: React.FC<ShowTypeSelectorProps> = ({ 
  onSelectType, 
  onCancel 
}) => {
  const showTypes = ['text', 'p5', 'shader', 'wasm'];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Show</h1>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Show Type</h2>
          <div className="grid grid-cols-2 gap-4">
            {showTypes.map(type => (
              <button
                key={type}
                onClick={() => onSelectType(type)}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  type === 'text' ? 'border-purple-200 hover:border-purple-400 bg-purple-50' :
                  type === 'p5' ? 'border-orange-200 hover:border-orange-400 bg-orange-50' :
                  type === 'shader' ? 'border-cyan-200 hover:border-cyan-400 bg-cyan-50' :
                  'border-pink-200 hover:border-pink-400 bg-pink-50'
                }`}
              >
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  type === 'text' ? 'bg-purple-100 text-purple-800' :
                  type === 'p5' ? 'bg-orange-100 text-orange-800' :
                  type === 'shader' ? 'bg-cyan-100 text-cyan-800' :
                  'bg-pink-100 text-pink-800'
                }`}>
                  {type}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};