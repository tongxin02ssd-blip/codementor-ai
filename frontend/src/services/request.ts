import axios from 'axios';

export const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 120000,
});

request.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);