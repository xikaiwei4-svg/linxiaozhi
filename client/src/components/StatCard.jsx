import React from 'react';
import { Card } from 'antd';

function StatCard({ title, value, icon, color = '#2e7d32' }) {
  return (
    <Card style={{ borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#999', fontSize: 14 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 'bold', color }}>{value}</div>
        </div>
        {icon && <div style={{ fontSize: 40, opacity: 0.3 }}>{icon}</div>}
      </div>
    </Card>
  );
}

export default StatCard;
