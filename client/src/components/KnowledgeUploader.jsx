import React, { useState } from 'react';
import { Upload, Button, Select, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { knowledgeAPI } from '../services/api';

function KnowledgeUploader({ onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('forestry');

  const handleUpload = async (file) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('category', category);
      await knowledgeAPI.upload(formData);
      message.success('文档上传成功');
      setTitle('');
      onSuccess?.();
    } catch (error) {
      message.error(error.message || '上传失败');
    } finally {
      setLoading(false);
    }
    return false; // prevent auto upload
  };

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Input
        placeholder="文档标题（可选，默认文件名）"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: 200 }}
      />
      <Select value={category} onChange={setCategory} style={{ width: 120 }}>
        <Select.Option value="forestry">林业知识</Select.Option>
        <Select.Option value="faq">常见问答</Select.Option>
        <Select.Option value="policy">政策法规</Select.Option>
        <Select.Option value="other">其他</Select.Option>
      </Select>
      <Upload beforeUpload={handleUpload} showUploadList={false} accept=".txt,.md,.pdf,.docx,.doc,.html">
        <Button type="primary" icon={<UploadOutlined />} loading={loading}>
          上传文档
        </Button>
      </Upload>
    </div>
  );
}

export default KnowledgeUploader;
