import { useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./App.css";

interface Show {
  id: number;
  show_type: string;
  created_at: string;
  disabled: boolean;
  display_text: string;
}

interface ShowDetail {
  id: number;
  show_type: string;
  payload: any;
  created_at: string;
  disabled: boolean;
}

function App() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingShow, setEditingShow] = useState<ShowDetail | null>(null);
  const [editingPayload, setEditingPayload] = useState<string>("");
  const [loadingShow, setLoadingShow] = useState(false);

  const fetchShows = () => {
    fetch('/api/shows')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch shows');
        }
        return response.json();
      })
      .then(data => {
        setShows(data.shows);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const setShowDisabled = async (showId: number, disabled: boolean) => {
    try {
      const response = await fetch(`/api/shows/${showId}/set_disabled?disabled=${disabled}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to update show');
      }

      const data = await response.json();
      if (data.success) {
        setShows(shows.map(show => 
          show.id === showId 
            ? { ...show, disabled: data.disabled }
            : show
        ));
      }
    } catch (err) {
      console.error('Error updating show:', err);
    }
  };

  const deleteShow = async (showId: number) => {
    if (!window.confirm('Are you sure you want to delete this show? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/shows/${showId}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete show');
      }

      const data = await response.json();
      if (data.success) {
        setShows(shows.filter(show => show.id !== showId));
      }
    } catch (err) {
      console.error('Error deleting show:', err);
    }
  };

  const editShow = async (showId: number) => {
    setLoadingShow(true);
    try {
      const response = await fetch(`/api/shows/${showId}`, {
        headers: {
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch show details');
      }

      const data = await response.json();
      if (data.success) {
        setEditingShow(data.show);
        const showTypeContent = data.show.payload[data.show.show_type] || '';
        setEditingPayload(typeof showTypeContent === 'string' ? showTypeContent : JSON.stringify(showTypeContent, null, 2));
      }
    } catch (err) {
      console.error('Error fetching show details:', err);
    } finally {
      setLoadingShow(false);
    }
  };

  const closeEditor = () => {
    setEditingShow(null);
    setEditingPayload("");
  };

  const saveShow = async () => {
    if (!editingShow) return;

    try {
      // Create payload object with show type as key
      const payloadToSave = {
        [editingShow.show_type]: editingPayload
      };

      const response = await fetch(`/api/shows/${editingShow.id}/save`, {
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
        // Close editor and refresh shows list
        closeEditor();
        fetchShows();
      }
    } catch (err) {
      console.error('Error saving show:', err);
      alert('Failed to save show. Please try again.');
    }
  };

  const getCsrfToken = () => {
    return Cookies.get('csrftoken') || '';
  };

  useEffect(() => {
    fetchShows();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-gray-600">Loading shows...</div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg text-red-600">Error: {error}</div>
    </div>
  );

  if (editingShow) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Edit Show</h1>
          
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  editingShow.show_type === 'text' ? 'bg-purple-100 text-purple-800' :
                  editingShow.show_type === 'p5' ? 'bg-orange-100 text-orange-800' :
                  editingShow.show_type === 'shader' ? 'bg-cyan-100 text-cyan-800' :
                  editingShow.show_type === 'wasm' ? 'bg-pink-100 text-pink-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {editingShow.show_type}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${editingShow.disabled 
                    ? 'bg-gray-200 text-gray-600' 
                    : 'bg-green-100 text-green-800'
                  }`}>
                  {editingShow.disabled ? 'Disabled' : 'Enabled'}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Created: {new Date(editingShow.created_at).toLocaleString()}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payload (JSON)
              </label>
              <textarea
                value={editingPayload}
                onChange={(e) => setEditingPayload(e.target.value)}
                className="w-full h-96 p-3 border border-gray-300 rounded-md font-mono text-sm resize-y"
                placeholder="Enter JSON payload..."
              />
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={closeEditor}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Rapid Riter Shows</h1>
        
        {shows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No shows found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shows.map(show => (
              <div key={show.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
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
                
                <button 
                  onClick={() => editShow(show.id)}
                  className="text-left text-gray-900 font-medium mb-2 underline hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {show.display_text}
                </button>
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(show.created_at).toLocaleString()}
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDisabled(show.id, !show.disabled)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${show.disabled
                        ? 'bg-green-200 hover:bg-green-300 text-green-800'
                        : 'bg-purple-200 hover:bg-purple-300 text-purple-800'
                      }`}
                  >
                    {show.disabled ? 'Enable' : 'Disable'}
                  </button>
                  <button 
                    onClick={() => deleteShow(show.id)}
                    className="px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer bg-red-100 hover:bg-red-200 text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <footer className="mt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            <a 
              href="https://github.com/gregsadetsky/rapidriteros" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-600 transition-colors underline"
            >
              GitHub
            </a>
            {" • "}
            Contact Greg Sadetsky F2'23 for any questions
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
