
import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple redirect since user management is removed
const Auth = () => {
  return <Navigate to="/" replace />;
};

export default Auth;
