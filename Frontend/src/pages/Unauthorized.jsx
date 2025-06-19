import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import styles from '../css/Unauthorized.module.css';

const Unauthorized = () => {
  const { dispatch } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    
    localStorage.removeItem('user');

    
    dispatch({ type: 'LOGOUT' });

    
    const timer = setTimeout(() => {
      navigate('/');
    }, 5000); 

    
    return () => clearTimeout(timer);
  }, [dispatch, navigate]);

  return (
    <div className={styles.container}>
      <h1 className={styles.nigma   }>Unauthorized</h1>
      <p className={styles.pig}>You do not have permission to view this page.</p>
      <p className={styles.pig}>You will be redirected to the Home page...</p>
    </div>
  );
};

export default Unauthorized;
