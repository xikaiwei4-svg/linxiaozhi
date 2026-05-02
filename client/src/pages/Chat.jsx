import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Typography, message, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { conversationAPI } from '../services/api';
import { streamChat } from '../services/sse';
import MessageBubble from '../components/MessageBubble';

const { TextArea } = Input;
const { Title, Text } = Typography;

function Chat() {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, streamingMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationAPI.getConversations();
      setConversations(response.conversations);
      if (response.conversations.length > 0 && !currentConversation) {
        await loadConversation(response.conversations[0].id);
      }
    } catch (error) {
      message.error('加载对话失败');
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await conversationAPI.getConversation(conversationId);
      setCurrentConversation(response.conversation);
    } catch (error) {
      message.error('加载对话详情失败');
    }
  };

  const createNewConversation = async () => {
    try {
      const response = await conversationAPI.createConversation({});
      setConversations([response.conversation, ...conversations]);
      setCurrentConversation({ ...response.conversation, messages: [] });
    } catch (error) {
      message.error('创建对话失败');
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !currentConversation || isStreaming) return;

    const messageText = inputValue.trim();
    setInputValue('');
    setLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');

    // 添加用户消息到当前对话
    const userMsg = {
      role: 'user',
      content: messageText,
      metadata: { timestamp: new Date().toISOString() }
    };
    const updatedMessages = [...(currentConversation.messages || []), userMsg];
    setCurrentConversation(prev => ({ ...prev, messages: updatedMessages }));

    // 流式接收 AI 回复
    let fullContent = '';
    streamChat(
      currentConversation.id,
      messageText,
      (chunk) => {
        fullContent += chunk;
        setStreamingMessage(fullContent);
      },
      async (doneData) => {
        // 流结束，添加完整 AI 回复到消息列表
        const aiMsg = {
          role: 'assistant',
          content: fullContent,
          metadata: { timestamp: new Date().toISOString(), tokenCount: doneData.usage?.total_tokens }
        };
        setCurrentConversation(prev => ({
          ...prev,
          messages: [...prev.messages, aiMsg]
        }));
        setStreamingMessage('');
        setIsStreaming(false);
        setLoading(false);
        loadConversations(); // 刷新列表以更新标题等
      },
      (error) => {
        message.error(error.message || '发送消息失败');
        setStreamingMessage('');
        setIsStreaming(false);
        setLoading(false);
      }
    );
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      await conversationAPI.deleteConversation(conversationId);
      const newList = conversations.filter(c => c.id !== conversationId);
      setConversations(newList);
      if (currentConversation?.id === conversationId) {
        if (newList.length > 0) {
          await loadConversation(newList[0].id);
        } else {
          setCurrentConversation(null);
        }
      }
      message.success('对话已删除');
    } catch (error) {
      message.error('删除对话失败');
    }
  };

  const handleTransfer = () => {
    message.info('已请求转接人工服务，请稍候...');
  };

  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return '暂无消息';
    return conversation.lastMessage.content.substring(0, 50) + (conversation.lastMessage.content.length > 50 ? '...' : '');
  };

  if (conversationsLoading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="chat-page">
      {/* 对话列表侧边栏 */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <Title level={5} style={{ margin: 0 }}>对话列表</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={createNewConversation} size="small">
            新建
          </Button>
        </div>
        <div className="conversations-list">
          {conversations.map(conversation => (
            <div
              key={conversation.id}
              className={`conversation-item ${currentConversation?.id === conversation.id ? 'active' : ''}`}
              onClick={() => loadConversation(conversation.id)}
            >
              <div className="conversation-title">{conversation.title}</div>
              <div className="conversation-preview">{getLastMessagePreview(conversation)}</div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无对话</div>
          )}
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="chat-main">
        {currentConversation ? (
          <>
            <div className="chat-header">
              <Title level={4} style={{ margin: 0 }}>{currentConversation.title}</Title>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button icon={<CustomerServiceOutlined />} onClick={handleTransfer}>
                  转人工
                </Button>
                <Button danger icon={<DeleteOutlined />} onClick={() => deleteConversation(currentConversation.id)}>
                  删除
                </Button>
              </div>
            </div>

            <div className="messages-container">
              {currentConversation.messages?.map((message, index) => (
                <MessageBubble key={index} message={message} />
              ))}

              {/* 流式消息 */}
              {isStreaming && streamingMessage && (
                <MessageBubble
                  message={{ role: 'assistant', content: streamingMessage, metadata: { timestamp: new Date().toISOString() } }}
                  isStreaming={true}
                />
              )}

              {/* 加载指示器 */}
              {isStreaming && !streamingMessage && (
                <div className="message message-assistant">
                  <div className="message-avatar">🌲</div>
                  <div className="message-body">
                    <div className="message-sender">林小智</div>
                    <div className="message-content typing-indicator">
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <TextArea
                className="input-area"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入林业相关问题..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={isStreaming}
              />
              <Button
                type="primary"
                onClick={sendMessage}
                loading={loading}
                disabled={!inputValue.trim() || isStreaming}
                className="send-button"
              >
                发送
              </Button>
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🌲</div>
              <Title level={3}>欢迎使用林业知识AI助手</Title>
              <Text type="secondary">点击左侧"新建"按钮开始咨询林业相关问题</Text>
              <div style={{ marginTop: 24, color: '#999', fontSize: 13 }}>
                <p>我可以帮助您了解：</p>
                <p>🌳 森林资源管理 &nbsp; 🌱 林木栽培技术 &nbsp; 🐛 病虫害防治</p>
                <p>📋 林业政策法规 &nbsp; 🌍 森林生态保护 &nbsp; 📊 林业产业发展</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Chat;
