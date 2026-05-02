import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Tag, message, Tabs, Select, Typography } from 'antd';
import { UserOutlined, CommentOutlined, FileTextOutlined, TeamOutlined } from '@ant-design/icons';
import { adminAPI } from '../services/api';
import StatCard from '../components/StatCard';

const { Title } = Typography;

function Admin() {
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [userTotal, setUserTotal] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [convTotal, setConvTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDashboard(); loadUsers(); loadConversations(); }, []);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.dashboard();
      setDashboard(res.dashboard);
    } catch (e) { message.error('加载仪表盘失败'); }
  };

  const loadUsers = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers({ page, pageSize: 20 });
      setUsers(res.users);
      setUserTotal(res.total);
    } catch (e) { message.error('加载用户列表失败'); }
    finally { setLoading(false); }
  };

  const loadConversations = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminAPI.listConversations({ page, pageSize: 20 });
      setConversations(res.conversations);
      setConvTotal(res.total);
    } catch (e) { message.error('加载对话列表失败'); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminAPI.updateUser(userId, { role });
      message.success('角色更新成功');
      loadUsers();
    } catch (e) { message.error('更新失败'); }
  };

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '角色', dataIndex: 'role', key: 'role', width: 150,
      render: (role, record) => (
        <Select
          value={role}
          size="small"
          style={{ width: 100 }}
          onChange={(v) => handleRoleChange(record._id, v)}
        >
          <Select.Option value="user">用户</Select.Option>
          <Select.Option value="agent">坐席</Select.Option>
          <Select.Option value="admin">管理员</Select.Option>
        </Select>
      )
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s) => <Tag color={s === 'active' ? 'green' : 'red'}>{s === 'active' ? '正常' : '禁用'}</Tag>
    },
    {
      title: '注册时间', dataIndex: 'createdAt', key: 'createdAt',
      render: (d) => new Date(d).toLocaleString('zh-CN')
    }
  ];

  const convColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: '用户', key: 'user', width: 120,
      render: (_, r) => r.userId?.username || '-'
    },
    {
      title: '坐席', key: 'agent', width: 120,
      render: (_, r) => r.agentId?.username || '-'
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s) => {
        const colors = { active: 'blue', archived: 'default', deleted: 'red' };
        return <Tag color={colors[s]}>{s}</Tag>;
      }
    },
    { title: '消息数', key: 'msgs', width: 80, render: (_, r) => r.messages?.length || 0 },
    {
      title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt',
      render: (d) => new Date(d).toLocaleString('zh-CN')
    }
  ];

  return (
    <div className="admin-page">
      <Title level={3}>管理员面板</Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <StatCard title="总用户数" value={dashboard?.totalUsers || 0} icon={<UserOutlined />} color="#2e7d32" />
        </Col>
        <Col span={6}>
          <StatCard title="总对话数" value={dashboard?.totalConversations || 0} icon={<CommentOutlined />} color="#1565c0" />
        </Col>
        <Col span={6}>
          <StatCard title="知识库文档" value={dashboard?.totalDocs || 0} icon={<FileTextOutlined />} color="#e65100" />
        </Col>
        <Col span={6}>
          <StatCard title="在线坐席" value={dashboard?.onlineAgents || 0} icon={<TeamOutlined />} color="#6a1b9a" />
        </Col>
      </Row>

      <Tabs defaultActiveKey="users">
        <Tabs.TabPane tab="用户管理" key="users">
          <Table columns={userColumns} dataSource={users} rowKey="_id" loading={loading}
            pagination={{ total: userTotal, pageSize: 20, onChange: (p) => loadUsers(p) }}
          />
        </Tabs.TabPane>
        <Tabs.TabPane tab="对话监控" key="conversations">
          <Table columns={convColumns} dataSource={conversations} rowKey="_id" loading={loading}
            pagination={{ total: convTotal, pageSize: 20, onChange: (p) => loadConversations(p) }}
          />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Admin;
