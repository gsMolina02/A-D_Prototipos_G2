import axios from 'axios';

const apiUrl = 'http://localhost:5000/api';  // URL base del backend

export const loginUser = async (data) => {
  return await axios.post(`${apiUrl}/login`, data);  // Realiza el POST a /api/login
};

export const registerUser = async (data) => {
  return await axios.post(`${apiUrl}/register`, data);  // Realiza el POST a /api/register
};
