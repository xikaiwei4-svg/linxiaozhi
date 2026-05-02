export function streamChat(conversationId, content, onChunk, onDone, onError) {
  const token = localStorage.getItem('token');

  fetch(`/api/conversations/${conversationId}/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  }).then(async (response) => {
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: '网络错误' }));
      throw new Error(err.message || '请求失败');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') onChunk(data.content);
            else if (data.type === 'done') onDone(data);
            else if (data.type === 'error') onError(new Error(data.content));
          } catch (e) {}
        }
      }
    }
  }).catch(onError);
}

// EventSource fallback (not recommended for POST-based SSE, kept as reference)
export function subscribeToUpdates(url, onMessage, onError) {
  const es = new EventSource(url);
  es.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (e) {
      onMessage(event.data);
    }
  };
  es.onerror = onError;
  return es;
}
