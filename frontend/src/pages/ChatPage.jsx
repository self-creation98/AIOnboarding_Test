import { useState, useRef, useEffect } from 'react';
import { api, getUser } from '../api/client';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const user = getUser();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', content: text, time: new Date() }]);
    setSending(true);
    try {
      const r = await api('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, employee_id: user?.id || 'anonymous' }),
      });
      const reply = r.success ? (r.data?.response || r.data?.message || JSON.stringify(r.data))
        : (r.error || 'Không thể trả lời lúc này');
      setMessages(p => [...p, { role: 'assistant', content: reply, time: new Date() }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: '❌ Lỗi kết nối server', time: new Date() }]);
    }
    setSending(false);
  }

  const suggestions = [
    'Chính sách nghỉ phép như thế nào?',
    'Tôi cần làm gì trong tuần đầu tiên?',
    'Quy trình xin WFH?',
    'Cách đăng ký bảo hiểm?',
  ];

  return (
    <div>
      <div className="page-header"><h1>💬 AI Chat</h1><p>Hỏi đáp với AI Onboarding Assistant</p></div>
      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              <div className="icon">🤖</div>
              <h3 style={{ marginBottom: 4 }}>Xin chào! Tôi là AI Onboarding Assistant</h3>
              <p style={{ fontSize: 14 }}>Hãy hỏi tôi bất cứ điều gì về quy trình onboarding</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
                {suggestions.map(s => (
                  <button key={s} className="btn btn-sm btn-secondary"
                    onClick={() => { setInput(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}`}>
              {m.content}
              <div className="msg-time">{m.time.toLocaleTimeString('vi')}</div>
            </div>
          ))}
          {sending && (
            <div className="chat-msg assistant" style={{ opacity: 0.6 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
              Đang suy nghĩ...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <form className="chat-input-area" onSubmit={handleSend}>
          <input className="form-input" value={input} onChange={e => setInput(e.target.value)}
            placeholder="Nhập câu hỏi..." disabled={sending} />
          <button className="btn btn-primary" disabled={sending || !input.trim()} type="submit">
            {sending ? '⏳' : '📤'} Gửi
          </button>
        </form>
      </div>
    </div>
  );
}
