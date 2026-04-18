import { useState, useEffect } from 'react';
import { publicApi, api } from '../api/client';
import { useToast } from '../components/Toast';

export default function MockPanelPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [responses, setResponses] = useState({});
  const [loadings, setLoadings] = useState({});

  // HRIS form
  const [hris, setHris] = useState({
    full_name: 'Nguyễn Văn An', email: 'an.nguyen@company.com',
    role: 'Software Engineer', department: 'Engineering',
    start_date: '2026-05-20', seniority_level: 'junior', location: 'HCM',
  });

  // IT form
  const [it, setIt] = useState({ employee_id: '', task_type: 'email_setup', resolved_by: 'it_admin@company.com' });
  // LMS form
  const [lms, setLms] = useState({ employee_id: '', course_name: 'Security Awareness Training', score: 85 });

  useEffect(() => {
    api('/api/employees').then(r => { if (r.success) setEmployees(r.data || []); });
  }, []);

  async function fire(key, url, body) {
    setLoadings(p => ({ ...p, [key]: true }));
    try {
      const r = await publicApi(url, { method: 'POST', body: JSON.stringify(body) });
      setResponses(p => ({ ...p, [key]: JSON.stringify(r, null, 2) }));
      toast(r.success ? '✅ Webhook sent!' : `❌ ${r.error}`, r.success ? 'success' : 'error');
      if (r.success && key === 'hris') {
        api('/api/employees').then(r2 => { if (r2.success) setEmployees(r2.data || []); });
      }
    } catch (e) {
      setResponses(p => ({ ...p, [key]: `Error: ${e.message}` }));
      toast('❌ Lỗi kết nối', 'error');
    }
    setLoadings(p => ({ ...p, [key]: false }));
  }

  return (
    <div>
      <div className="page-header">
        <h1>🎮 Mock Control Panel</h1>
        <p>Giả lập webhook từ HRIS, IT, LMS để test luồng onboarding</p>
      </div>

      <div className="panel-grid">
        {/* HRIS */}
        <div className="card panel-card hris">
          <div className="panel-title">🏢 HRIS: Tạo Nhân Viên Mới</div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Họ tên</label>
              <input className="form-input" value={hris.full_name} onChange={e => setHris(p => ({ ...p, full_name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Email</label>
              <input className="form-input" value={hris.email} onChange={e => setHris(p => ({ ...p, email: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Vị trí</label>
              <input className="form-input" value={hris.role} onChange={e => setHris(p => ({ ...p, role: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Phòng ban</label>
              <input className="form-input" value={hris.department} onChange={e => setHris(p => ({ ...p, department: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Ngày bắt đầu</label>
              <input className="form-input" type="date" value={hris.start_date} onChange={e => setHris(p => ({ ...p, start_date: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Cấp bậc</label>
              <select className="form-select" value={hris.seniority_level} onChange={e => setHris(p => ({ ...p, seniority_level: e.target.value }))}>
                <option value="junior">Junior</option><option value="senior">Senior</option><option value="intern">Intern</option>
              </select></div>
          </div>
          <button className="btn btn-primary" disabled={loadings.hris}
            onClick={() => fire('hris', '/api/webhooks/hris/new-employee', hris)}>
            {loadings.hris ? '⏳...' : '🚀 Gửi Webhook'}
          </button>
          {responses.hris && <div className="response-box">{responses.hris}</div>}
        </div>

        {/* IT */}
        <div className="card panel-card it">
          <div className="panel-title">🔧 IT: Resolve Ticket</div>
          <div className="form-group"><label className="form-label">Nhân viên</label>
            <select className="form-select" value={it.employee_id} onChange={e => setIt(p => ({ ...p, employee_id: e.target.value }))}>
              <option value="">-- Chọn NV --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label">Task Type</label>
            <select className="form-select" value={it.task_type} onChange={e => setIt(p => ({ ...p, task_type: e.target.value }))}>
              <option value="email_setup">Email Setup</option><option value="laptop_setup">Laptop Setup</option>
              <option value="vpn_access">VPN Access</option><option value="software_install">Software Install</option>
            </select></div>
          <button className="btn btn-success" disabled={loadings.it || !it.employee_id}
            onClick={() => fire('it', '/api/webhooks/it/ticket-resolved', { ...it, ticket_id: `IT-${Date.now()}` })}>
            {loadings.it ? '⏳...' : '✅ Resolve Ticket'}
          </button>
          {responses.it && <div className="response-box">{responses.it}</div>}
        </div>

        {/* LMS */}
        <div className="card panel-card lms">
          <div className="panel-title">📚 LMS: Course Completed</div>
          <div className="form-group"><label className="form-label">Nhân viên</label>
            <select className="form-select" value={lms.employee_id} onChange={e => setLms(p => ({ ...p, employee_id: e.target.value }))}>
              <option value="">-- Chọn NV --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Khóa học</label>
              <input className="form-input" value={lms.course_name} onChange={e => setLms(p => ({ ...p, course_name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Điểm</label>
              <input className="form-input" type="number" value={lms.score} onChange={e => setLms(p => ({ ...p, score: +e.target.value }))} /></div>
          </div>
          <button className="btn btn-primary" style={{ background: 'var(--yellow)', boxShadow: 'none' }} disabled={loadings.lms || !lms.employee_id}
            onClick={() => fire('lms', '/api/webhooks/lms/course-completed', { ...lms, course_id: 'SEC-101', completed_at: new Date().toISOString() })}>
            {loadings.lms ? '⏳...' : '📚 Hoàn thành khóa học'}
          </button>
          {responses.lms && <div className="response-box">{responses.lms}</div>}
        </div>
      </div>
    </div>
  );
}
