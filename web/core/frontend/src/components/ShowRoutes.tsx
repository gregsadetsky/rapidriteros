import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { NewShowEditor } from './NewShowEditor';
import { ShowEditor } from './ShowEditor';
import { SHOW_TYPES } from './ShowTypeSelector';

type ShowDetail = React.ComponentProps<typeof ShowEditor>['show'];

interface ShowEditorRouteProps {
  onSave: () => void;
}

// /shows/:id - loads the show itself so reloads and deep links work
export const ShowEditorRoute: React.FC<ShowEditorRouteProps> = ({ onSave }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState<ShowDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/shows/${id}`, {
      headers: { 'X-CSRFToken': Cookies.get('csrftoken') || '' },
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch show details');
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        if (data.success) setShow(data.show);
        else setError('Show not found');
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-2">
        <div className="text-lg text-red-600">Error: {error}</div>
        <Link to="/" className="underline text-blue-600">Back to shows</Link>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading show...</div>
      </div>
    );
  }

  return <ShowEditor show={show} onClose={() => navigate('/')} onSave={onSave} />;
};

interface NewShowEditorRouteProps {
  onSave: () => void;
}

// /new/:type
export const NewShowEditorRoute: React.FC<NewShowEditorRouteProps> = ({ onSave }) => {
  const { type } = useParams();
  const navigate = useNavigate();

  if (!type || !SHOW_TYPES.includes(type)) {
    return <Navigate to="/new" replace />;
  }

  return (
    <NewShowEditor
      showType={type}
      onCancel={() => navigate('/')}
      onSave={onSave}
      onBackToTypeSelection={() => navigate('/new')}
    />
  );
};
