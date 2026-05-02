import React, { useState, useEffect } from 'react';
import { Card, Select, Input, Button, message, List, Tag, Modal, Space, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { systemPromptAPI } from '../services/api';

const { TextArea } = Input;
const { Title, Text } = Typography;

function Settings() {
  const [prompts, setPrompts] = useState([]);
  const [activePrompt, setActivePrompt] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPrompt, setEditPrompt] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'forestry', content: '', description: '' });

  useEffect(() => { loadPrompts(); }, []);

  const loadPrompts = async () => {
    try {
      const [listRes, activeRes] = await Promise.all([
        systemPromptAPI.list(),
        systemPromptAPI.getActive()
      ]);
      setPrompts(listRes.prompts);
      setActivePrompt(activeRes.prompt);
    } catch (error) {
      message.error('加载提示词失败');
    }
  };

  const openCreate = () => {
    setEditPrompt(null);
    setFormData({ name: '', category: 'forestry', content: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (prompt) => {
    setEditPrompt(prompt);
    setFormData({
      name: prompt.name,
      category: prompt.category,
      content: prompt.content,
      description: prompt.description || ''
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editPrompt) {
        await systemPromptAPI.update(editPrompt._id, formData);
        message.success('提示词更新成功');
      } else {
        await systemPromptAPI.create(formData);
        message.success('提示词创建成功');
      }
      setModalOpen(false);
      loadPrompts();
    } catch (error) {
      message.error(error.message || '保存失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await systemPromptAPI.delete(id);
      message.success('提示词已删除');
      loadPrompts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleActivate = async (id) => {
    try {
      await systemPromptAPI.activate(id);
      message.success('提示词已激活');
      loadPrompts();
    } catch (error) {
      message.error('激活失败');
    }
  };

  const categoryColors = {
    forestry: 'green',
    sales: 'blue',
    support: 'orange',
    tech: 'purple',
    general: 'default',
    custom: 'magenta'
  };

  return (
    <div className="settings-page">
      <Title level={3}>系统提示词设置</Title>
      <Text type="secondary">
        配置AI助手的回复风格和专业领域。当前激活的提示词会影响所有对话。
      </Text>

      <div style={{ marginTop: 16, marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建提示词
        </Button>
      </div>

      <List
        dataSource={prompts}
        renderItem={(item) => (
          <List.Item
            actions={[
              item.isActive && <Tag color="green" icon={<CheckCircleOutlined />}>使用中</Tag>,
              <Button size="small" onClick={() => openEdit(item)}>编辑</Button>,
              !item.isActive && <Button size="small" type="primary" onClick={() => handleActivate(item._id)}>激活</Button>,
              !item.isDefault && <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item._id)} />
            ]}
          >
            <List.Item.Meta
              title={item.name}
              description={
                <Space>
                  <Tag color={categoryColors[item.category]}>{item.category}</Tag>
                  <Text type="secondary" ellipsis style={{ maxWidth: 300 }}>{item.description || item.content.substring(0, 80)}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <Modal
        title={editPrompt ? '编辑提示词' : '新建提示词'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        width={700}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            placeholder="提示词名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Select value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })}>
            <Select.Option value="forestry">林业知识</Select.Option>
            <Select.Option value="sales">售前咨询</Select.Option>
            <Select.Option value="support">售后服务</Select.Option>
            <Select.Option value="tech">技术支持</Select.Option>
            <Select.Option value="general">通用</Select.Option>
            <Select.Option value="custom">自定义</Select.Option>
          </Select>
          <Input
            placeholder="简要描述"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextArea
            placeholder="提示词内容（系统指令，定义AI的角色和行为）"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={8}
          />
        </div>
      </Modal>
    </div>
  );
}

export default Settings;
