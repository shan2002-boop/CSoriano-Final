import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    console.log('User in ProtectedRoute:', user); 
    console.log('Allowed roles:', allowedRoles);  
    

    if (!user) {
        
        console.log('User not authenticated, redirecting to login'); 
        return navigate('/Login');
      }
    
      if (!allowedRoles.includes(user.role)) {
       
        console.log('User role not allowed:', user.role); 
        return navigate('/Unauthorized');
      }
    
      
      return children;
    };
    
    export default ProtectedRoute;
