import { useState, useRef, useEffect } from 'react';
import { api, getUser } from '@/api/client';
import Header from '@/components/Header';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react';

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
      const r = await api('/api/chat', { method: 'POST', body: JSON.stringify({ message: text, employee_id: user?.id || 'anonymous' }) });
      const reply = r.success ? (r.data?.response || r.data?.message || JSON.stringify(r.data)) : (r.error || 'Không thể trả lời lúc này');
      setMessages(p => [...p, { role: 'assistant', content: reply, time: new Date() }]);
    } catch (e) { setMessages(p => [...p, { role: 'assistant', content: '❌ Lỗi kết nối server', time: new Date() }]); }
    setSending(false);
  }

  const suggestions = ['Chính sách nghỉ phép?', 'Tuần đầu tiên cần làm gì?', 'Quy trình xin WFH?', 'Cách đăng ký bảo hiểm?'];

  return (
    <PageTransition>
      <AnimatedItem><Header title="AI Chat" subtitle="Hỏi đáp với AI Onboarding Assistant" /></AnimatedItem>
      <AnimatedItem>
        <Card className="flex flex-col h-[calc(100vh-140px)] overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 mb-4">
                  <Bot className="h-7 w-7 text-primary-500" />
                </div>
                <h3 className="text-sm font-semibold text-[#1a1523] mb-1">AI Onboarding Assistant</h3>
                <p className="text-sm text-[#9e97b0] mb-5">Hãy hỏi tôi bất cứ điều gì về quy trình onboarding</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestions.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#eeedf0] bg-white px-3.5 py-2 text-xs font-medium text-[#6e6880] transition-all hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 cursor-pointer">
                      <Sparkles className="h-3 w-3 text-primary-400" />{s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50"><Bot className="h-4 w-4 text-primary-500" /></div>
                )}
                <div className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-[#f0eef2] text-[#1a1523]'
                }`}>
                  {m.content}
                  <div className={`text-[10px] mt-1.5 ${m.role === 'user' ? 'text-primary-200' : 'text-[#9e97b0]'}`}>{m.time.toLocaleTimeString('vi')}</div>
                </div>
                {m.role === 'user' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600"><User className="h-4 w-4 text-white" /></div>
                )}
              </motion.div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-50"><Bot className="h-4 w-4 text-primary-500" /></div>
                <div className="rounded-2xl bg-[#f0eef2] px-4 py-3 text-sm text-[#9e97b0] flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Đang suy nghĩ...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2.5 border-t border-[#eeedf0] px-5 py-3.5">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Nhập câu hỏi..." disabled={sending} className="flex-1" />
            <Button type="submit" disabled={sending || !input.trim()} size="icon">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </Card>
      </AnimatedItem>
    </PageTransition>
  );
}
