const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      localStorage.setItem('jobrobots_user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (data.success && data.data.token) {
      this.setToken(data.data.token);
      localStorage.setItem('jobrobots_user', JSON.stringify(data.data.user));
    }

    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async updateProfile(data) {
    const result = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.success && result.data.user) {
      localStorage.setItem('jobrobots_user', JSON.stringify(result.data.user));
    }
    return result;
  }

  getUser() {
    const user = localStorage.getItem('jobrobots_user');
    return user ? JSON.parse(user) : null;
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  logout() {
    this.removeToken();
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

  async generateGoalTracker(goal, targetDays, currentProgress) {
    return this.request('/ai/goal-tracker', {
      method: 'POST',
      body: JSON.stringify({ goal, targetDays, currentProgress }),
    });
  }

  async tailorResume(resume, jobDescription, targetRole) {
    return this.request('/ai/tailor-resume', {
      method: 'POST',
      body: JSON.stringify({ resume, jobDescription, targetRole }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
