import Cookies from 'js-cookie';
import { useEffect, useState } from "react";
import "./App.css";
import { NewShowEditor } from './components/NewShowEditor';
import { ShowCard } from './components/ShowCard';
import { ShowEditor } from './components/ShowEditor';
import { ShowTypeSelector } from './components/ShowTypeSelector';

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
  const [addingShow, setAddingShow] = useState(false);
  const [selectedShowType, setSelectedShowType] = useState<string | null>(null);

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
      }
    } catch (err) {
      console.error('Error fetching show details:', err);
    }
  };

  const closeEditor = () => {
    setEditingShow(null);
  };

  const startAddingShow = () => {
    setAddingShow(true);
    setSelectedShowType(null);
  };

  const selectShowType = (showType: string) => {
    setSelectedShowType(showType);
  };

  const cancelAddShow = () => {
    setAddingShow(false);
    setSelectedShowType(null);
  };

  const handleSaveNewShow = () => {
    cancelAddShow();
    fetchShows();
  };

  const backToTypeSelection = () => {
    setSelectedShowType(null);
  };



  const handleSaveShow = () => {
    closeEditor();
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

  if (editingShow) {
    return (
      <ShowEditor 
        show={editingShow}
        onClose={closeEditor}
        onSave={handleSaveShow}
      />
    );
  }

  if (addingShow) {
    if (!selectedShowType) {
      return (
        <ShowTypeSelector 
          onSelectType={selectShowType}
          onCancel={cancelAddShow}
        />
      );
    } else {
      return (
        <NewShowEditor 
          showType={selectedShowType}
          onCancel={cancelAddShow}
          onSave={handleSaveNewShow}
          onBackToTypeSelection={backToTypeSelection}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rapid Riter Shows</h1>
          <button
            onClick={startAddingShow}
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
}

export default App;
