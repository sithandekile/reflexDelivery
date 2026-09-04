const BASE_URL = import.meta.env.VITE_API_URL || 'https://reflexdelivery.onrender.com
';

function getToken() {
  return localStorage.getItem('reflex_token');
}

function setSession(token, user) {
  localStorage.setItem('reflex_token', token);
  localStorage.setItem('reflex_user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('reflex_token');
  localStorage.removeItem('reflex_user');
}

function getStoredUser() {
  const raw = localStorage.getItem('reflex_user');
  return raw ? JSON.parse(raw) : null;
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (payload) =>request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
      .then(({ token, user }) => { setSession(token, user); return user; }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
      .then(({ token, user }) => { setSession(token, user); return user; }),
  logout: clearSession,getStoredUser,getToken,

  // Deliveries
  createDelivery: (payload) =>request('/deliveries', { method: 'POST', body: JSON.stringify(payload) }),
  listDeliveries: (params = {}) =>request(`/deliveries?${new URLSearchParams(params)}`),
  getDelivery: (id) => request(`/deliveries/${id}`),

  // Assignments
  assignRider: (payload) =>request('/assignments', { method: 'POST', body: JSON.stringify(payload) }),

  // Status
  updateStatus: (deliveryId, payload) =>request(`/status/${deliveryId}`, { method: 'POST', body: JSON.stringify(payload) }),

  // Users
  listUsers: (role) => request(`/users?role=${role}`),
};
