import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

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
    try {
      const r = await api('/api/documents');
      if (r.success) setDocs(r.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api('/api/documents/upload', {
        method: 'POST',
        body: JSON.stringify({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      if (r.success) {
        toast('✅ Document uploaded!', 'success');
        setShowForm(false);
        setForm({ title: '', content: '', category: 'policy', tags: '' });
        loadDocs();
      } else {
        toast(`❌ ${r.error}`, 'error');
      }
    } catch (e) { toast('❌ Lỗi kết nối', 'error'); }
    setSaving(false);
  }

  if (loading) return <div className="loading"><div className="spinner" />Đang tải...</div>;

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>📄 Knowledge Base</h1><p>Quản lý tài liệu cho RAG</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Đóng' : '+ Thêm tài liệu'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Tiêu đề</label>
                <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
              <div className="form-group"><label className="form-label">Danh mục</label>
                <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  <option value="policy">Chính sách</option><option value="procedure">Quy trình</option>
                  <option value="faq">FAQ</option><option value="guide">Hướng dẫn</option><option value="benefit">Phúc lợi</option>
                </select></div>
            </div>
            <div className="form-group"><label className="form-label">Nội dung</label>
              <textarea className="form-textarea" rows={6} value={form.content}
                onChange={e => setForm(p => ({ ...p, content: e.target.value }))} required
                placeholder="Nhập nội dung tài liệu..." /></div>
            <div className="form-group"><label className="form-label">Tags (phân cách bằng dấu phẩy)</label>
              <input className="form-input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                placeholder="nghỉ phép, chính sách, hr" /></div>
            <button className="btn btn-primary" disabled={saving} type="submit">
              {saving ? '⏳...' : '💾 Lưu tài liệu'}
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {docs.length === 0 ? (
          <div className="empty-state"><div className="icon">📄</div><h3>Chưa có tài liệu</h3><p>Thêm tài liệu để chatbot có thể trả lời</p></div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Tiêu đề</th><th>Danh mục</th><th>Tags</th><th>Ngày tạo</th></tr></thead>
            <tbody>
              {docs.map(d => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 500 }}>{d.title}</td>
                  <td><span className="badge purple">{d.category}</span></td>
                  <td>{(d.tags || []).map(t => <span key={t} className="badge gray" style={{ marginRight: 4 }}>{t}</span>)}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{d.created_at ? new Date(d.created_at).toLocaleDateString('vi') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
