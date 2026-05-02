import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Popconfirm, Typography, Select, Tabs, Modal, Spin } from 'antd';
import { DeleteOutlined, DatabaseOutlined, CloudUploadOutlined, BookOutlined } from '@ant-design/icons';
import { knowledgeAPI } from '../services/api';
import KnowledgeUploader from '../components/KnowledgeUploader';

const { Title, Paragraph } = Typography;

function Knowledge() {
  const [activeTab, setActiveTab] = useState('mysql');
  const [docs, setDocs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState(null);
  const [mysqlCategories, setMysqlCategories] = useState([]);
  const [docDetail, setDocDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'mongo') loadDocs();
    else loadMysqlDocs();
  }, [page, category, activeTab]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 20 };
      if (category) params.category = category;
      const res = await knowledgeAPI.list(params);
      setDocs(res.docs);
      setTotal(res.total);
    } catch (error) {
      message.error('加载失败');
    } finally { setLoading(false); }
  };

  const loadMysqlDocs = async () => {
    setLoading(true);
    try {
      const params = { page, pageSize: 20 };
      if (category) params.category = category;
      const res = await knowledgeAPI.mysqlList(params);
      setDocs(res.docs || []);
      setTotal(res.total || 0);
      setMysqlCategories(res.categories || []);
    } catch (error) {
      message.error('加载MySQL知识库失败');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    try {
      await knowledgeAPI.delete(id);
      message.success('文档已删除');
      loadDocs();
    } catch (error) { message.error('删除失败'); }
  };

  const viewDetail = async (id) => {
    try {
      const res = await knowledgeAPI.mysqlGetOne(id);
      setDocDetail(res.doc);
      setDetailOpen(true);
    } catch (e) { message.error('获取详情失败'); }
  };

  const mongoColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '文件名', dataIndex: 'fileName', key: 'fileName', width: 200, ellipsis: true },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100,
      render: (cat) => <Tag color="green">{cat}</Tag> },
    { title: '类型', dataIndex: 'fileType', key: 'fileType', width: 80 },
    { title: '分段', key: 'chunks', width: 60,
      render: (_, r) => r.metadata?.chunkCount || r.chunks?.length || '-' },
    { title: '上传时间', dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (d) => new Date(d).toLocaleString('zh-CN') },
    { title: '操作', key: 'action', width: 80,
      render: (_, r) => (
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r._id)}>
          <Button type="link" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) }
  ];

  const mysqlColumns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 400 },
    { title: '分类', dataIndex: 'category_id', key: 'cat', width: 140,
      render: (id) => {
        const cat = mysqlCategories.find(c => c.id === id);
        const colors = {1:'green',2:'blue',3:'red',4:'orange',5:'purple',6:'cyan'};
        return <Tag color={colors[id] || 'default'}>{cat?.name || `分类${id}`}</Tag>;
      } },
    { title: '来源', dataIndex: 'source', key: 'source', ellipsis: true, width: 200 },
    { title: '关键词', dataIndex: 'keywords', key: 'keywords', ellipsis: true, width: 200,
      render: (kw) => kw ? kw.split(',').slice(0,3).map(k => <Tag key={k} style={{fontSize:11}}>{k}</Tag>) : '-' },
    { title: '操作', key: 'action', width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => viewDetail(r.id)}>查看</Button>
      ) }
  ];

  return (
    <div className="knowledge-page">
      <Title level={3}>林业知识库管理</Title>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
        {
          key: 'mysql',
          label: <span><DatabaseOutlined /> MySQL 林业知识库</span>,
          children: (
            <div>
              <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                系统内置的林业知识库，涵盖6大分类12篇专业文档，基于MySQL全文检索。
              </Paragraph>
              <Table
                columns={mysqlColumns}
                dataSource={docs}
                rowKey="id"
                loading={loading}
                pagination={{
                  current: page, pageSize: 20, total,
                  onChange: (p) => setPage(p),
                  showTotal: (t) => `共 ${t} 篇文档`
                }}
              />
              <Modal
                title={docDetail?.title}
                open={detailOpen}
                onCancel={() => setDetailOpen(false)}
                footer={null}
                width={800}
              >
                {docDetail ? (
                  <div>
                    <p><strong>来源：</strong>{docDetail.source}</p>
                    <p><strong>关键词：</strong>{docDetail.keywords}</p>
                    <div style={{
                      maxHeight: 500, overflow: 'auto', whiteSpace: 'pre-wrap',
                      background: '#f9f9f9', padding: 16, borderRadius: 8,
                      lineHeight: 1.8, fontSize: 14
                    }}>
                      {docDetail.content}
                    </div>
                    {docDetail.chunks && (
                      <div style={{ marginTop: 12 }}>
                        <Tag>共 {docDetail.chunks.length} 个检索分块</Tag>
                      </div>
                    )}
                  </div>
                ) : <Spin />}
              </Modal>
            </div>
          )
        },
        {
          key: 'mongo',
          label: <span><CloudUploadOutlined /> 上传知识库</span>,
          children: (
            <div>
              <div style={{ marginBottom: 16 }}>
                <KnowledgeUploader onSuccess={loadDocs} />
              </div>
              <Table
                columns={mongoColumns}
                dataSource={docs}
                rowKey="_id"
                loading={loading}
                pagination={{
                  current: page, pageSize: 20, total,
                  onChange: (p) => setPage(p),
                  showTotal: (t) => `共 ${t} 份文档`
                }}
              />
            </div>
          )
        }
      ]} />
    </div>
  );
}

export default Knowledge;
