const API_BASE = 'http://localhost:3333';

const setToken = (token) => {
  localStorage.setItem('session_token', token);
};

const getToken = () => localStorage.getItem('session_token');

const clearToken = () => {
  localStorage.removeItem('session_token');
};

const apiCall = async (method, endpoint, data = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Always read fresh from localStorage
  const token = getToken();
  if (token) {
    options.headers['X-Authorization'] = token;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    // safe parsing
    const text = await response.text();
    let json;
    try {
        json = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error('Server response was not valid JSON');
    }

    if (!response.ok) {
      throw new Error(json.error_message || json.error || 'Request failed');
    }

    return json;
  } catch (err) {
    throw err;
  }
};

export const auth = {
  register: (first_name, last_name, email, password) =>
    apiCall('POST', '/register', { first_name, last_name, email, password }),
  login: async (email, password) => {
    const response = await apiCall('POST', '/login', { email, password });
    if (response.session_token) {
        setToken(response.session_token);
    }
    return response;
  },
  logout: () => apiCall('POST', '/logout'),
  setToken,
  getToken,
  clearToken,
};

export const rounds = {
  create: (courseId, date, holesPlayed, teeColor) =>
    apiCall('POST', '/rounds', { courseId, date, holesPlayed, teeColor }),

  getAll: () => apiCall('GET', '/rounds'),
  getById: (roundId) => apiCall('GET', `/rounds/${roundId}`),
  updateHoleScore: (roundId, holeNumber, strokes, par, putts, notes, fairwayHit) =>
    apiCall('PATCH', `/rounds/${roundId}/hole/${holeNumber}`, {
      strokes: parseInt(strokes),
      par: parseInt(par),
      holeNumber: parseInt(holeNumber),
      putts: putts !== null ? parseInt(putts) : null,
      notes: notes || '',
      fairwayHit: fairwayHit // Pass boolean/integer
    }),
  finalize: (roundId, totalScore, notes) =>
    apiCall('POST', `/rounds/${roundId}/finalize`, { totalScore, notes }),
  delete: (roundId) => apiCall('DELETE', `/rounds/${roundId}`),
  getStats: (days) => apiCall('GET', `/my/stats?days=${days}`),
  seedRounds: (count) => apiCall('POST', '/debug/seed', { count }),
};

export const user = {
  getHandicap: () => apiCall('GET', '/my/handicap'),
};