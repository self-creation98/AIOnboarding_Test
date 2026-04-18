import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useToast } from '../components/Toast';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [emp, setEmp] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [copilot, setCopilot] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('info');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [empR, anaR] = await Promise.all([
        api(`/api/employees/${id}`),
        api(`/api/analytics/employee/${id}`),
      ]);
      if (empR.success) setEmp(empR.data);
      if (anaR.success) setAnalytics(anaR.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runCopilot() {
    setCopilotLoading(true);
    try {
      const r = await api('/api/analytics/copilot', {
        method: 'POST', body: JSON.stringify({ employee_id: id }),
      });
      if (r.success) setCopilot(r.data);
    } catch (e) { console.error(e); }
    setCopilotLoading(false);
  }

  async function doAction(action) {
    try {
      const r = await api(`/api/actions/${action}`, {
        method: 'POST', body: JSON.stringify({ employee_id: id }),
      });
      toast(r.success ? `✅ ${r.data?.message || 'Thành công'}` : `❌ ${r.error}`, r.success ? 'success' : 'error');
    } catch (e) { toast('❌ Lỗi kết nối', 'error'); }
  }

  if (loading) return <div className="loading"><div className="spinner" />Đang tải...</div>;
  if (!emp) return <div className="empty-state"><div className="icon">❌</div><h3>Không tìm thấy nhân viên</h3><button className="btn btn-secondary" onClick={() => navigate('/')}>← Quay lại</button></div>;

  const a = analytics || {};
  const checklists = a.checklist_items || [];

  function statusIcon(s) {
    if (s === 'hoan_thanh') return 'done';
    if (s === 'dang_lam') return 'pending';
    return 'pending';
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <button className="btn-ghost" onClick={() => navigate('/')} style={{ marginBottom: 8 }}>← Quay lại Dashboard</button>
          <h1>{emp.full_name}</h1>
          <p>{emp.role} • {emp.department}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <span className={`badge ${emp.health_score >= 80 ? 'green' : emp.health_score >= 50 ? 'yellow' : 'red'}`}>
            Sức khỏe: {emp.health_score ?? 'N/A'}
          </span>
          <span className={`badge ${emp.onboarding_status === 'completed' ? 'green' : 'blue'}`}>
            {emp.onboarding_status}
          </span>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')}>📝 Thông tin</button>
        <button className={`tab-btn${tab === 'checklist' ? ' active' : ''}`} onClick={() => setTab('checklist')}>📋 Checklist ({checklists.length})</button>
        <button className={`tab-btn${tab === 'copilot' ? ' active' : ''}`} onClick={() => { setTab('copilot'); if (!copilot) runCopilot(); }}>🤖 AI Copilot</button>
        <button className={`tab-btn${tab === 'actions' ? ' active' : ''}`} onClick={() => setTab('actions')}>⚡ Actions</button>
      </div>

      {tab === 'info' && (
        <div className="detail-grid">
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Thông tin cá nhân</div>
            <div className="info-row"><span className="label">Email</span><span className="value">{emp.email}</span></div>
            <div className="info-row"><span className="label">Mã NV</span><span className="value">{emp.employee_code || '—'}</span></div>
            <div className="info-row"><span className="label">Phòng ban</span><span className="value">{emp.department}</span></div>
            <div className="info-row"><span className="label">Vị trí</span><span className="value">{emp.role}</span></div>
            <div className="info-row"><span className="label">Ngày bắt đầu</span><span className="value">{emp.start_date || '—'}</span></div>
            <div className="info-row"><span className="label">Cấp bậc</span><span className="value">{emp.seniority_level || '—'}</span></div>
            <div className="info-row"><span className="label">Địa điểm</span><span className="value">{emp.location || '—'}</span></div>
          </div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 12 }}>Tiến độ onboarding</div>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--accent)' }}>{Math.round(a.completion_percentage || 0)}%</div>
              <div className="progress-bar" style={{ width: '100%', height: 12, marginTop: 12 }}>
                <div className="progress-fill accent" style={{ width: `${a.completion_percentage || 0}%` }} />
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around', fontSize: 13 }}>
                <span>✅ Xong: {a.completed_items || 0}</span>
                <span>📋 Tổng: {a.total_items || 0}</span>
                <span>⚠️ Quá hạn: {a.overdue_count || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'checklist' && (
        <div className="card">
          {checklists.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>Chưa có checklist</h3></div>
          ) : (
            checklists.map((item, i) => (
              <div key={item.id || i} className="checklist-item">
                <div className={`check-icon ${statusIcon(item.status)}`}>
                  {item.status === 'hoan_thanh' ? '✓' : item.status === 'dang_lam' ? '◐' : '○'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="item-title">{item.title}</div>
                  <div className="item-meta">
                    {item.category && <span className="badge gray" style={{ marginRight: 4 }}>{item.category}</span>}
                    {item.owner && <span className="badge purple" style={{ marginRight: 4 }}>{item.owner}</span>}
                    {item.deadline_date && <span>Hạn: {item.deadline_date}</span>}
                  </div>
                </div>
                <span className={`badge ${item.status === 'hoan_thanh' ? 'green' : item.status === 'dang_lam' ? 'yellow' : 'gray'}`}>
                  {item.status === 'hoan_thanh' ? 'Xong' : item.status === 'dang_lam' ? 'Đang làm' : 'Chưa bắt đầu'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'copilot' && (
        <div className="card">
          {copilotLoading ? (
            <div className="loading"><div className="spinner" />AI đang phân tích...</div>
          ) : copilot ? (
            <div className="copilot-box">
              <div className="card-title" style={{ marginBottom: 12 }}>🤖 AI Copilot Analysis</div>
              <div className="summary">{copilot.summary}</div>
              {copilot.risk_factors?.length > 0 && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>⚠️ Risk Factors:</div>
                  {copilot.risk_factors.map((r, i) => (
                    <div key={i} className="risk-item">🔸 {r}</div>
                  ))}
                </div>
              )}
              {copilot.suggestions?.length > 0 && (
                <div className="copilot-actions">
                  {copilot.suggestions.map((s, i) => (
                    <button key={i} className="btn btn-sm btn-secondary">{s.label || s}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary" onClick={runCopilot}>🤖 Phân tích với AI Copilot</button>
          )}
        </div>
      )}

      {tab === 'actions' && (
        <div className="detail-grid">
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => doAction('assign-buddy')}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32 }}>🤝</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Assign Buddy</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Nhắc Manager assign buddy</div>
            </div>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => doAction('escalate-it')}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32 }}>🚨</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Escalate IT</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Escalate IT tasks</div>
            </div>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => doAction('schedule-checkin')}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32 }}>📅</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Schedule Check-in</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Đặt lịch check-in</div>
            </div>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => doAction('send-reminder')}>
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 32 }}>📩</div>
              <div style={{ fontWeight: 600, marginTop: 8 }}>Send Reminder</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Gửi nhắc nhở NV</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
