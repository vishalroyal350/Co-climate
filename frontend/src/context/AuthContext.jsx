import React, { createContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeProjectId, setActiveProjectId] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('coclimate_token');
    const user = sessionStorage.getItem('coclimate_user');
    const loginProjId = sessionStorage.getItem('coclimate_project_id');

    if (token && user) {
      setCurrentUser(JSON.parse(user));
      if (loginProjId) {
        setActiveProjectId(loginProjId);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.auth.login({
      email,
      password
    });

    if (response.success && response.user) {
      const tokenPayload = {
        userId: response.user.id,
        role: response.user.role,
        email: response.user.email,
        name: response.user.name,
        exp: Date.now() + (2 * 60 * 60 * 1000)
      };

      const mockToken = btoa(JSON.stringify(tokenPayload));
      const projId = response.user.role === 'admin' ? 'all' : (response.user.projectId || 'project-1');

      sessionStorage.setItem('coclimate_token', mockToken);
      sessionStorage.setItem('coclimate_project_id', projId);
      sessionStorage.setItem('coclimate_user', JSON.stringify(response.user));

      setCurrentUser(response.user);
      setActiveProjectId(projId);
      return response.user;
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('coclimate_token');
    sessionStorage.removeItem('coclimate_user');
    sessionStorage.removeItem('coclimate_project_id');
    setCurrentUser(null);
    setActiveProjectId('all');
    window.location.href = 'login.html';
  };

  const updateProfile = (updatedUser) => {
    sessionStorage.setItem('coclimate_user', JSON.stringify(updatedUser));
    setCurrentUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      activeProjectId,
      setActiveProjectId,
      login,
      logout,
      updateProfile,
      loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
