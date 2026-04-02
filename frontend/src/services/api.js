const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://jobrobotsaii.vercel.app/api';

// Frontend API calls go to: https://jobrobotsaii.vercel.app/api/...
// Final URL example: https://jobrobotsaii.vercel.app/api/auth/login

// Decode JWT to check expiry locally (avoids unnecessary API calls on refresh)
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // Invalid token format → treat as expired
  }
};

class ApiService {
  getToken() {
    return localStorage.getItem('jobrobots_token');
  }

  setToken(token) {
    localStorage.setItem('jobrobots_token', token);
  }

  removeToken() {
    localStorage.removeItem('jobrobots_token');
    localStorage.removeItem('jobrobots_user');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API Request:', options.method || 'GET', url);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name, email, password) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  getUser() {
    const user = localStorage.getItem('jobrobots_user');
    return user ? JSON.parse(user) : null;
  }

  logout() {
    this.removeToken();
    // Don't use window.location.href — it causes full page reload which wipes React state
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    if (isTokenExpired(token)) {
      this.removeToken();
      return false;
    }
    return true;
  }

  // AI Methods
  async generateAnswer(question, role, tone, length) {
    return this.request('/ai/answer', {
      method: 'POST',
      body: JSON.stringify({ question, role, tone, length }),
    });
  }

  async generateOutreach(type, recipientName, recipientRole, company, yourBackground, targetRole) {
    return this.request('/ai/outreach', {
      method: 'POST',
      body: JSON.stringify({ type, recipientName, recipientRole, company, yourBackground, targetRole }),
    });
  }

  async generateCoverLetter(company, role, jobDescription, experience) {
    return this.request('/ai/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ company, role, jobDescription, experience }),
    });
  }

  async getAIStatus() {
    return this.request('/ai/status');
  }

  async checkCredits() {
    return this.request('/ai/check-credits');
  }

  async generateVoiceOver(text, voiceType, tone, speed) {
    return this.request('/ai/voice-over', {
      method: 'POST',
      body: JSON.stringify({ text, voiceType, tone, speed }),
    });
  }

  async generateInterviewQuestions(jobRole, interviewType) {
    return this.request('/ai/interview-questions', {
      method: 'POST',
      body: JSON.stringify({ jobRole, interviewType }),
    });
  }

  async analyzeInterviewAnswer(question, answer, interviewType) {
    return this.request('/ai/analyze-answer', {
      method: 'POST',
      body: JSON.stringify({ question, answer, interviewType }),
    });
  }

  async tailorResume(resume, jobDescription, targetRole) {
    return this.request('/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({ resume, jobDescription, targetRole }),
    });
  }

  async generateImage(prompt, width, height, seed, style) {
    return this.request('/ai/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, width, height, seed, style }),
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  // Search across applications and jobs
  async search(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // Applications CRUD
  async getApplications(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/applications${qs ? '?' + qs : ''}`);
  }

  async createApplication(data) {
    return this.request('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateApplication(id, data) {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApplication(id) {
    return this.request(`/applications/${id}`, {
      method: 'DELETE',
    });
  }

  // Jobs CRUD
  async getJobs(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/jobs${qs ? '?' + qs : ''}`);
  }

  async createJob(data) {
    return this.request('/jobs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJob(id, data) {
    return this.request(`/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJob(id) {
    return this.request(`/jobs/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;
