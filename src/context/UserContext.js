import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext({
  userRole: null,
  setUserRole: () => {}
});

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user role is stored in localStorage
    const storedRole = localStorage.getItem('userRole');
    if (storedRole) {
      setUserRole(storedRole);
    }
    
    // You can also fetch the user role from your API here if needed
    // For example:
    // axios.get('/api/user/me')
    //   .then(response => {
    //     if (response.data.success) {
    //       setUserRole(response.data.role);
    //       localStorage.setItem('userRole', response.data.role);
    //     }
    //   })
    //   .catch(error => console.error('Error fetching user role:', error));
  }, []);

  return (
    <UserContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider; 