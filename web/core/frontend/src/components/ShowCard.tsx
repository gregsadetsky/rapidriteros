import React from 'react';

interface Show {
  id: number;
  show_type: string;
  created_at: string;
  disabled: boolean;
  display_text: string;
}

interface ShowCardProps {
  show: Show;
  onEdit: (showId: number) => void;
  onToggleDisabled: (showId: number, disabled: boolean) => void;
  onDelete: (showId: number) => void;
  onShowImmediately: (showId: number) => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({ 
  show, 
  onEdit, 
  onToggleDisabled, 
  onDelete,
  onShowImmediately
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-3">
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
      
      <button 
        onClick={() => onEdit(show.id)}
        className="text-left text-gray-900 font-medium mb-2 underline hover:text-blue-600 transition-colors cursor-pointer"
      >
        {show.display_text}
      </button>

      <p className="text-sm text-gray-500 mb-4">
        Created: {new Date(show.created_at).toLocaleString()}
      </p>
      
      <div className="flex gap-2">
        <button 
          onClick={() => onEdit(show.id)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors cursor-pointer"
        >
          Edit
        </button>
        <button 
          onClick={() => onToggleDisabled(show.id, !show.disabled)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${show.disabled
            ? 'bg-green-200 hover:bg-green-300 text-green-800'
            : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
            }`}
        >
          {show.disabled ? 'Enable' : 'Disable'}
        </button>
        <button 
          onClick={() => onDelete(show.id)}
          className="px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer bg-red-100 hover:bg-red-200 text-red-700"
        >
          Delete
        </button>
        <button
          onClick={() => onShowImmediately(show.id)}
          className="px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer bg-purple-600 hover:bg-purple-700 text-white"
        >
          Show immediately
        </button>
      </div>
    </div>
  );
};