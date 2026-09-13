// StudySpace Central API Client
const API_BASE = import.meta.env.VITE_API_URL || '';

function getHeaders() {
  const token = localStorage.getItem('studyspace_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = data.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },

  async register(name, email, password, role = 'student') {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    return handleResponse(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Spaces
  async getSpaces() {
    const res = await fetch(`${API_BASE}/api/spaces`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getSpace(id) {
    const res = await fetch(`${API_BASE}/api/spaces/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async createSpace(spaceData) {
    const res = await fetch(`${API_BASE}/api/spaces`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(spaceData)
    });
    return handleResponse(res);
  },

  async deleteSpace(id) {
    const res = await fetch(`${API_BASE}/api/spaces/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Seats
  async getSeats(spaceId, { date, start_time, end_time } = {}) {
    let url = `${API_BASE}/api/spaces/${spaceId}/seats`;
    if (date && start_time && end_time) {
      url += `?date=${encodeURIComponent(date)}&start_time=${encodeURIComponent(start_time)}&end_time=${encodeURIComponent(end_time)}`;
    }
    const res = await fetch(url, { headers: getHeaders() });
    return handleResponse(res);
  },

  async createSeat(spaceId, seatData) {
    const res = await fetch(`${API_BASE}/api/spaces/${spaceId}/seats`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(seatData)
    });
    return handleResponse(res);
  },

  async deleteSeat(seatId) {
    const res = await fetch(`${API_BASE}/api/seats/${seatId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Reservations
  async createReservation(data) {
    const res = await fetch(`${API_BASE}/api/reservations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  async getMyReservations() {
    const res = await fetch(`${API_BASE}/api/reservations/my`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async getAllReservations() {
    const res = await fetch(`${API_BASE}/api/reservations`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  async cancelReservation(id) {
    const res = await fetch(`${API_BASE}/api/reservations/${id}/cancel`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};
