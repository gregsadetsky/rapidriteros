import { useEffect, useState } from "react";
import "./App.css";

interface Show {
  id: number;
  show_type: string;
  created_at: string;
  disabled: boolean;
  display_text: string;
}

function App() {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='));
    return cookie ? cookie.split('=')[1] : '';
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
                
                <p className="text-gray-900 font-medium mb-2">{show.display_text}</p>
                <p className="text-sm text-gray-500 mb-4">
                  Created: {new Date(show.created_at).toLocaleString()}
                </p>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowDisabled(show.id, !show.disabled)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${show.disabled
                        ? 'bg-green-200 hover:bg-green-300 text-green-800'
                        : 'bg-red-200 hover:bg-red-300 text-red-800'
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
