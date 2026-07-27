import React from 'react';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';

export default function LoginApp() {
  return (
    <AuthProvider>
      <Login />
    </AuthProvider>
  );
}
