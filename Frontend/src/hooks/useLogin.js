import { useState } from "react";
import { useAuthContext } from "./useAuthContext";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const useLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  const login = async (Username, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`https://foxconstruction-final.onrender.com/api/user/login`, { Username, password });
      const json = response.data;

      // Log the user data after logging in
      console.log('User login response:', json);

      // Save the user details to localStorage
      localStorage.setItem('user', JSON.stringify(json));

      // Update the global auth context with the logged-in user
      dispatch({ type: 'LOGIN', payload: json });

      // Redirect based on user role
      const { role } = json;
      if (role === 'admin') {
        navigate('/AdminDashboard');
      } else if (role === 'user') {
        navigate('/UserDashboard');
      } else if (role === 'contractor') {
        navigate('/ContractorDashboard');
      } else {
        navigate('/UnknownRole');
      }

      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      setError(error.response ? error.response.data.error : 'Login failed. Please try again.');
    }
  };

  return { login, isLoading, error };
};

