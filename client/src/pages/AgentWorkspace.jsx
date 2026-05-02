import React, { useState, useEffect, useRef } from 'react';
import { List, Button, Card, Tag, message, Input, Typography, Space, Badge, Empty } from 'antd';
import { CustomerServiceOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { agentAPI } from '../services/api';
import MessageBubble from '../components/MessageBubble';

const { TextArea } = Input;
const { Title, Text } = Typography;

function AgentWorkspace() {
  const [agent, setAgent] = useState(null);
  const [queue, setQueue] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadAgent();
    loadQueue();
    intervalRef.current = setInterval(loadQueue, 15000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadAgent = async () => {
    try {
      const res = await agentAPI.getMe();
      setAgent(res.agent);
    } catch (e) { message.error('获取坐席信息失败'); }
  };

  const loadQueue = async () => {
    try {
      const res = await agentAPI.getQueue();
      setQueue(res.queue);
    } catch (e) {}
  };

  const toggleStatus = async (newStatus) => {
    try {
      await agentAPI.updateStatus(newStatus);
      setAgent(prev => ({ ...prev, status: newStatus }));
      message.success(`状态已切换为: ${newStatus}`);
    } catch (e) { message.error('状态切换失败'); }
  };

  const acceptChat = async (id) => {
    try {
      const res = await agentAPI.acceptChat(id);
      setActiveChat(res.conversation);
      setQueue(queue.filter(q => q.id !== id));
      loadAgent();
      message.success('已接管对话');
    } catch (e) { message.error(e.message || '接管失败'); }
  };

  const resolveChat = async () => {
    if (!activeChat) return;
    try {
      await agentAPI.resolveChat(activeChat.id);
      setActiveChat(null);
      loadAgent();
      message.success('对话已关闭');
    } catch (e) { message.error('关闭失败'); }
  };

  const sendAgentMessage = async () => {
    if (!inputValue.trim() || !activeChat) return;
    setLoading(true);
    try {
      await agentAPI.agentMessage(activeChat.id, inputValue.trim());
      setInputValue('');
      message.success('消息已发送');
    } catch (e) {
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    online: 'green', offline: 'default', busy: 'orange', away: 'yellow'
  };

  return (
    <div className="agent-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>坐席工作台</Title>
        <Space>
          <Tag color={statusColors[agent?.status]}>状态: {agent?.status || '-'}</Tag>
          <Button size="small" type="primary" onClick={() => toggleStatus('online')}>上线</Button>
          <Button size="small" onClick={() => toggleStatus('busy')}>忙碌</Button>
          <Button size="small" danger onClick={() => toggleStatus('offline')}>离线</Button>
        </Space>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: 16, height: 'calc(100vh - 180px)' }}>
        {/* 待处理队列 */}
        <Card title={`待处理队列 (${queue.length})`} size="small" style={{ overflow: 'auto' }}>
          {queue.length === 0 ? (
            <Empty description="暂无待处理对话" />
          ) : (
            <List
              dataSource={queue}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="primary" size="small" onClick={() => acceptChat(item.id)} icon={<CustomerServiceOutlined />}>
                      接管
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">用户: {item.user}</Text>
                        <Text type="secondary">消息数: {item.messageCount}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        {/* 当前处理对话 */}
        <Card
          title={activeChat ? activeChat.title : '未选择对话'}
          size="small"
          extra={activeChat && (
            <Button size="small" icon={<CheckCircleOutlined />} onClick={resolveChat} type="primary">
              关闭对话
            </Button>
          )}
          bodyStyle={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 57px)', padding: 0 }}
        >
          {activeChat ? (
            <>
              <div className="messages-container" style={{ flex: 1 }}>
                {activeChat.messages?.map((msg, i) => (
                  <MessageBubble key={i} message={msg} />
                ))}
              </div>
              <div className="input-container" style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0' }}>
                <TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAgentMessage(); } }}
                  placeholder="输入回复..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                />
                <Button type="primary" onClick={sendAgentMessage} loading={loading} style={{ marginLeft: 8 }}>
                  发送
                </Button>
              </div>
            </>
          ) : (
            <Empty description="请从左侧队列中选择一个对话进行接管" style={{ marginTop: 100 }} />
          )}
        </Card>
      </div>
    </div>
  );
}

export default AgentWorkspace;
