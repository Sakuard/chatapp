// ./context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    // 檢查localStorage中的isChatActive來決定auth狀態
    const isChatActive = localStorage.getItem('isChatActive');
    if (isChatActive) {
      setAuth(true);
    }
  }, []);

  const join = () => {
    localStorage.setItem('isChatActive', 'true'); // 進入聊天室時設置標誌
    setAuth(true);
  };
  const leave = () => {
    localStorage.removeItem('isChatActive'); // 離開聊天室時清除標誌
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ auth, join, leave }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext);
