import { useState, useEffect } from 'react';
import axios from 'axios';

export const useFetchUsers = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const apiUrl = process.env.REACT_APP_BACKEND_URL;

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get(`https://foxconstruction-final.onrender.com/api/user`);
                setUsers(response.data);
            } catch (error) {
                setError('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, error, loading };
};
