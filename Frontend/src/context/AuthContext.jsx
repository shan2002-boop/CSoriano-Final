import { createContext, useReducer, useEffect } from 'react';
import PropTypes from 'prop-types';

export const AuthContext = createContext();

export const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload };
    case 'LOGOUT':
      return { user: null };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
  
    if (storedUser) {
      dispatch({ type: 'LOGIN', payload: storedUser });
    } else {
      console.warn('No user found in localStorage');  
      dispatch({ type: 'LOGOUT' });  
    }
  }, [dispatch]);
  
  

  console.log('authcontext state: ', state);

  return (
    <AuthContext.Provider value={{ ...state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
