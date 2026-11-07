import Cookies from 'js-cookie';
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import "./App.css";
import { ShowCard } from './components/ShowCard';
import { NewShowEditorRoute, ShowEditorRoute } from './components/ShowRoutes';
import { ShowTypeSelector } from './components/ShowTypeSelector';

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
  const navigate = useNavigate();

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

  const showImmediately = async (showId: number) => {
    try {
      const response = await fetch(`/api/shows/${showId}/show_immediately`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to show immediately');
      }

      const data = await response.json();
      if (!data.success) {
        console.error('Error showing immediately:', data.message);
      }
    } catch (err) {
      console.error('Error showing immediately:', err);
    }
  }

  const editShow = (showId: number) => {
    navigate(`/shows/${showId}`);
  };

  const handleSave = () => {
    navigate('/');
    fetchShows();
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

  const listView = (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rapid Riter Shows</h1>
          <button
            onClick={() => navigate('/new')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors cursor-pointer"
          >
            Add Show
          </button>
        </div>
        
        {shows.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No shows found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shows.map(show => (
              <ShowCard
                key={show.id}
                show={show}
                onEdit={editShow}
                onToggleDisabled={setShowDisabled}
                onDelete={deleteShow}
                onShowImmediately={showImmediately}
              />
            ))}
          </div>
        )}
      </div>
      
      
      <footer className="mt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-md text-gray-400">
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

  return (
    <Routes>
      <Route path="/" element={listView} />
      <Route
        path="/new"
        element={
          <ShowTypeSelector
            onSelectType={type => navigate(`/new/${type}`)}
            onCancel={() => navigate('/')}
          />
        }
      />
      <Route path="/new/:type" element={<NewShowEditorRoute onSave={handleSave} />} />
      <Route path="/shows/:id" element={<ShowEditorRoute onSave={handleSave} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
