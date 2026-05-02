import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TypewriterText from './TypewriterText';

function MessageBubble({ message, isStreaming }) {
  const { role, content, metadata } = message;

  const roleLabels = {
    user: '👤',
    assistant: '🌲',
    system: '📢',
    agent: '🎧',
  };

  const roleNames = {
    user: '用户',
    assistant: '林小智',
    system: '系统',
    agent: '人工服务',
  };

  return (
    <div className={`message message-${role}`}>
      {role !== 'user' && (
        <div className="message-avatar">{roleLabels[role] || '🤖'}</div>
      )}
      <div className="message-body">
        <div className="message-sender">{roleNames[role] || role}</div>
        <div className="message-content">
          {isStreaming ? (
            <TypewriterText text={content} speed={30} />
          ) : role === 'assistant' || role === 'agent' ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  return inline
                    ? <code className="inline-code" {...props}>{children}</code>
                    : <pre className="code-block"><code className={className} {...props}>{children}</code></pre>;
                }
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <div style={{ whiteSpace: 'pre-wrap' }}>{content}</div>
          )}
        </div>
        <div className="message-time">
          {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleTimeString('zh-CN') : ''}
        </div>
      </div>
      {role === 'user' && (
        <div className="message-avatar">{roleLabels[role]}</div>
      )}
    </div>
  );
}

export default MessageBubble;
