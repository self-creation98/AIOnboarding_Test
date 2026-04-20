import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Loader2, Save, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'policy', tags: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    setLoading(true);
    try { const r = await api('/api/documents'); if (r.success) setDocs(r.data || []); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api('/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({ title: form.title, content: form.content, category: form.category, department_tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      if (r.success) { toast('✅ Document uploaded!', 'success'); setShowForm(false); setForm({ title: '', content: '', category: 'policy', tags: '' }); loadDocs(); }
      else toast(`❌ ${r.error}`, 'error');
    } catch (e) { toast('❌ Lỗi kết nối', 'error'); }
    setSaving(false);
  }

  if (loading) return (
    <div><Header title="Knowledge Base" subtitle="Quản lý tài liệu cho RAG" /><Skeleton className="h-64 rounded-2xl" /></div>
  );

  return (
    <PageTransition>
      <AnimatedItem>
        <div className="flex items-center justify-between mb-8">
          <Header title="Knowledge Base" subtitle="Quản lý tài liệu cho RAG" />
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <><X className="h-4 w-4" /> Đóng</> : <><Plus className="h-4 w-4" /> Thêm tài liệu</>}
          </Button>
        </div>
      </AnimatedItem>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
            <AnimatedItem>
              <Card className="mb-5">
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tiêu đề</label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
                      <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Danh mục</label>
                        <Select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="policy">Chính sách</option><option value="procedure">Quy trình</option>
                          <option value="faq">FAQ</option><option value="guide">Hướng dẫn</option><option value="benefit">Phúc lợi</option>
                        </Select></div>
                    </div>
                    <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Nội dung</label>
                      <Textarea rows={5} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required placeholder="Nhập nội dung tài liệu..." /></div>
                    <div><label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tags (phân cách bằng dấu phẩy)</label>
                      <Input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="nghỉ phép, chính sách, hr" /></div>
                    <Button disabled={saving} type="submit">
                      {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : <><Save className="h-4 w-4" /> Lưu tài liệu</>}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </AnimatedItem>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatedItem>
        <Card>
          <CardContent className="p-0">
            {docs.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <FileText className="h-12 w-12 mb-3 text-slate-200" />
                <h3 className="text-sm font-semibold text-slate-500">Chưa có tài liệu</h3>
                <p className="text-xs mt-1">Thêm tài liệu để chatbot có thể trả lời</p>
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Tiêu đề</TableHead><TableHead>Danh mục</TableHead><TableHead>Tags</TableHead><TableHead>Ngày tạo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {docs.map(d => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium text-slate-900">{d.title}</TableCell>
                      <TableCell><Badge variant="purple">{d.category}</Badge></TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{(d.department_tags || d.role_tags || []).map(t => <Badge key={t} variant="gray">{t}</Badge>)}</div></TableCell>
                      <TableCell className="text-xs text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString('vi') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageTransition>
  );
}
