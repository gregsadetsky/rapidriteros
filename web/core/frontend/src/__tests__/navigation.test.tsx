import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

const SHOWS = [
  { id: 1, show_type: 'text', created_at: '2025-01-01T00:00:00Z', disabled: false, display_text: 'hello world' },
  { id: 2, show_type: 'p5', created_at: '2025-01-02T00:00:00Z', disabled: false, display_text: 'bouncing ball' },
];

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn((url: string) => {
    if (url === '/api/shows') return json({ shows: SHOWS });
    const match = /^\/api\/shows\/(\d+)$/.exec(url);
    if (match) {
      const show = SHOWS.find(s => s.id === Number(match[1]));
      return show
        ? json({ success: true, show: { ...show, payload: { [show.show_type]: `payload ${show.id}` } } })
        : json({ success: false }, 404);
    }
    return json({}, 404);
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Exposes the current location and history navigation to the tests. MemoryRouter
// (not createMemoryRouter) matches the app's HashRouter and avoids a jsdom/undici
// AbortSignal clash in react-router's data routers.
function renderApp(initialEntries: string[] = ['/']) {
  let pathname = '';
  let navigate: ReturnType<typeof useNavigate>;
  const Probe = () => {
    pathname = useLocation().pathname;
    navigate = useNavigate();
    return null;
  };
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Probe />
      <App />
    </MemoryRouter>,
  );
  return {
    path: () => pathname,
    back: () => act(() => navigate(-1)),
  };
}

describe('navigation', () => {
  it('lists shows at /', async () => {
    renderApp();
    expect(await screen.findByText('Rapid Riter Shows')).toBeInTheDocument();
    expect(screen.getAllByText('hello world').length).toBeGreaterThan(0);
  });

  it('goes list -> type selector -> new editor, and Back retraces each step', async () => {
    const user = userEvent.setup();
    const router = renderApp();

    await user.click(await screen.findByRole('button', { name: 'Add Show' }));
    expect(router.path()).toBe('/new');
    expect(screen.getByText('Select Show Type')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'p5' }));
    expect(router.path()).toBe('/new/p5');
    expect(screen.getByRole('button', { name: 'Back to Type Selection' })).toBeInTheDocument();

    await router.back();
    expect(router.path()).toBe('/new');
    expect(screen.getByText('Select Show Type')).toBeInTheDocument();

    await router.back();
    expect(router.path()).toBe('/');
    expect(await screen.findByText('Rapid Riter Shows')).toBeInTheDocument();
  });

  it('opens a show editor from the list and Back returns to the list', async () => {
    const user = userEvent.setup();
    const router = renderApp();

    await user.click((await screen.findAllByText('bouncing ball'))[0]);
    expect(router.path()).toBe('/shows/2');
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();

    await router.back();
    expect(await screen.findByText('Rapid Riter Shows')).toBeInTheDocument();
  });

  it('loads the editor from a deep link to /shows/:id', async () => {
    renderApp(['/shows/1']);
    expect(await screen.findByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/shows/1', expect.anything());
  });

  it('shows an error with a way back for an unknown show', async () => {
    renderApp(['/shows/999']);
    expect(await screen.findByText(/Error:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to shows' })).toHaveAttribute('href', '/');
  });

  it('Cancel buttons return to the list', async () => {
    const user = userEvent.setup();
    const router = renderApp(['/new']);
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));
    expect(router.path()).toBe('/');
  });

  it('redirects an invalid show type to the type selector', async () => {
    const router = renderApp(['/new/bogus']);
    expect(await screen.findByText('Select Show Type')).toBeInTheDocument();
    expect(router.path()).toBe('/new');
  });

  it('redirects unknown routes to the list', async () => {
    const router = renderApp(['/nope']);
    expect(await screen.findByText('Rapid Riter Shows')).toBeInTheDocument();
    expect(router.path()).toBe('/');
  });
});
