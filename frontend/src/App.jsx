import React,{ useEffect, useState } from 'react';
import { api } from './api/client';
import { connectSocket, disconnectSocket } from './socket';
import LoginPage from './pages/LoginPage';
import RetailerPage from './pages/RetailerPage';
import DispatcherPage from './pages/DispatcherPage';
import RiderPage from './pages/RiderPage';
import './index.css';

const ROLE_PAGES = {
  retailer: RetailerPage,
  dispatcher: DispatcherPage,
  rider: RiderPage,
};

export default function App() {
  const [user, setUser] = useState(api.getStoredUser());

  useEffect(() => {
    // Reconnect the socket on page reload if we still have a valid-looking session.
    if (user) connectSocket();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    api.logout();
    disconnectSocket();
    setUser(null);
  };

  if (!user) {
    return <LoginPage onAuthed={setUser} />;
  }

  /* Each account has exactly one role — no role switcher, since access is now
   enforced server-side by that account's role, not a client-side toggle.*/
  const Page = ROLE_PAGES[user.role];

  return (
    <div>
      <nav className="bg-gray-900 border-b border-gray-800 p-3 flex items-center justify-between">
        <span className="text-sm text-gray-400">
          {user.name} · <span className="text-lime-400">{user.role}</span>
        </span>
        <button onClick={handleLogout} className="text-sm text-white border border-gray-700 px-3 py-1 rounded">
          Log out
        </button>
      </nav>
      <Page />
    </div>
  );
}
