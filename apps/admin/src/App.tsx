import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY ?? 'admin-dev-key-change-in-production';

type Tab = 'overview' | 'races' | 'cheaters' | 'tournaments';

async function adminFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'x-admin-key': ADMIN_KEY },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function App() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState({ totalUsers: 0, racesLast7Days: 0, cheatFlags24h: 0 });
  const [races, setRaces] = useState<Record<string, unknown>[]>([]);
  const [flags, setFlags] = useState<Record<string, unknown>[]>([]);
  const [tournaments, setTournaments] = useState<Record<string, unknown>[]>([]);
  const [banUserId, setBanUserId] = useState('');

  useEffect(() => {
    if (tab === 'overview') adminFetch<typeof overview>('/api/admin/analytics/overview').then(setOverview);
    if (tab === 'races') adminFetch<{ races: Record<string, unknown>[] }>('/api/admin/races/live').then((d) => setRaces(d.races));
    if (tab === 'cheaters') adminFetch<{ flags: Record<string, unknown>[] }>('/api/admin/cheat-flags').then((d) => setFlags(d.flags));
    if (tab === 'tournaments') adminFetch<{ tournaments: Record<string, unknown>[] }>('/api/admin/tournaments').then((d) => setTournaments(d.tournaments));
  }, [tab]);

  const banUser = async () => {
    if (!banUserId) return;
    await fetch(`${API}/api/admin/users/${banUserId}/ban`, {
      method: 'POST',
      headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'admin_panel' }),
    });
    setBanUserId('');
    alert('User banned');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>RunRace Admin</h1>
        <nav>
          {(['overview', 'races', 'cheaters', 'tournaments'] as Tab[]).map((t) => (
            <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main">
        {tab === 'overview' && (
          <>
            <h2>Analytics</h2>
            <div className="cards">
              <div className="card"><h3>Users</h3><p>{overview.totalUsers}</p></div>
              <div className="card"><h3>Races (7d)</h3><p>{overview.racesLast7Days}</p></div>
              <div className="card"><h3>Cheat flags (24h)</h3><p>{overview.cheatFlags24h}</p></div>
            </div>
            <h3>Ban user</h3>
            <input placeholder="User UUID" value={banUserId} onChange={(e) => setBanUserId(e.target.value)} />
            <button onClick={banUser}>Ban</button>
          </>
        )}
        {tab === 'races' && (
          <>
            <h2>Live Races</h2>
            <table>
              <thead><tr><th>Code</th><th>Status</th><th>Host</th></tr></thead>
              <tbody>
                {races.map((r) => (
                  <tr key={String(r.id)}>
                    <td>{String(r.code)}</td>
                    <td>{String(r.status)}</td>
                    <td>{String(r.host_username)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'cheaters' && (
          <>
            <h2>Suspicious Activity</h2>
            <table>
              <thead><tr><th>User</th><th>Flag</th><th>Confidence</th></tr></thead>
              <tbody>
                {flags.map((f) => (
                  <tr key={String(f.id)}>
                    <td>{String(f.username)}</td>
                    <td className="flag">{String(f.flag_type)}</td>
                    <td>{String(f.confidence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'tournaments' && (
          <>
            <h2>Tournaments</h2>
            <table>
              <thead><tr><th>Name</th><th>Entry</th><th>Prize pool</th></tr></thead>
              <tbody>
                {tournaments.map((t) => (
                  <tr key={String(t.id)}>
                    <td>{String(t.name)}</td>
                    <td>${(Number(t.entry_fee_cents) / 100).toFixed(2)}</td>
                    <td>${(Number(t.prize_pool_cents) / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
}
