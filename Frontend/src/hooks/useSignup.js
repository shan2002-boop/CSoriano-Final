import { useState } from "react";
import axios from 'axios';

export const useSignup = () => {
  const [isLoading, setIsLoading] = useState(null);
  const [error, setError] = useState(null);

  const signup = async (Username, password, role) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`https://foxconstruction-final.onrender.com/api/user/signup`, {
        Username,
        password,
        role
      });

      const json = response.data;

      if (response.status >= 400) {
        setError(json.error);
      } else {
       
        return { user: json };
      }
    } catch (error) {
      
      setError(error.response?.data?.error || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return { signup, isLoading, error };
};
