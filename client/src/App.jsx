import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';
import Knowledge from './pages/Knowledge.jsx';
import Admin from './pages/Admin.jsx';
import AgentWorkspace from './pages/AgentWorkspace.jsx';
import Sidebar from './components/Sidebar.jsx';
import './App.css';

const { Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  // 公开页面：不需要侧边栏
  const publicPaths = ['/login', '/register'];
  const isPublic = publicPaths.includes(location.pathname);

  return (
    <ConfigProvider locale={zhCN}>
      {isAuthenticated && !isPublic ? (
        <Layout style={{ minHeight: '100vh' }}>
          <Sidebar />
          <Content style={{ marginLeft: 220, padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
            <Routes>
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/knowledge" element={<Knowledge />} />
              <Route path="/agent" element={<AgentWorkspace />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/" element={<Navigate to="/chat" />} />
              <Route path="*" element={<Navigate to="/chat" />} />
            </Routes>
          </Content>
        </Layout>
      ) : (
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/chat" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/chat" />} />
          <Route path="*" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} />} />
        </Routes>
      )}
    </ConfigProvider>
  );
}

export default App;
