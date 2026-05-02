import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Typography, Menu } from 'antd';
import {
  MessageOutlined, SettingOutlined, FileTextOutlined,
  CustomerServiceOutlined, DashboardOutlined, LogoutOutlined
} from '@ant-design/icons';

const { Title } = Typography;

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    { key: '/chat', icon: <MessageOutlined />, label: '对话' },
    { key: '/settings', icon: <SettingOutlined />, label: '设置' },
  ];

  if (user.role === 'admin' || user.role === 'agent') {
    menuItems.push({ key: '/knowledge', icon: <FileTextOutlined />, label: '知识库' });
  }
  if (user.role === 'agent') {
    menuItems.push({ key: '/agent', icon: <CustomerServiceOutlined />, label: '坐席工作台' });
  }
  if (user.role === 'admin') {
    menuItems.push({ key: '/admin', icon: <DashboardOutlined />, label: '管理面板' });
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const currentKey = '/' + location.pathname.split('/')[1];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Title level={4} style={{ margin: 0, color: '#2e7d32' }}>🌲 林业知识助手</Title>
      </div>
      <div className="sidebar-user">
        {user.username} {user.role === 'admin' ? '(管理员)' : user.role === 'agent' ? '(坐席)' : ''}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[currentKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{ borderRight: 0, flex: 1 }}
      />
      <div className="sidebar-footer">
        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} danger block>
          退出登录
        </Button>
      </div>
    </div>
  );
}

export default Sidebar;
