import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, emp, bn] = await Promise.all([
        api('/api/analytics/overview'),
        api('/api/employees'),
        api('/api/analytics/bottlenecks'),
      ]);
      if (ov.success) setOverview(ov.data);
      if (emp.success) setEmployees(emp.data || []);
      if (bn.success) setBottlenecks(bn.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function healthBadge(score) {
    if (!score && score !== 0) return <span className="badge gray">N/A</span>;
    if (score >= 80) return <span className="badge green">🟢 {score}</span>;
    if (score >= 50) return <span className="badge yellow">🟡 {score}</span>;
    return <span className="badge red">🔴 {score}</span>;
  }

  function statusBadge(s) {
    const map = {
      pre_boarding: ['blue', 'Pre-boarding'],
      in_progress: ['yellow', 'Đang OB'],
      completed: ['green', 'Hoàn thành'],
    };
    const [c, l] = map[s] || ['gray', s];
    return <span className={`badge ${c}`}>{l}</span>;
  }

  if (loading) return <div className="loading"><div className="spinner" />Đang tải dữ liệu...</div>;

  const ov = overview || {};

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Tổng quan hệ thống onboarding</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div><div className="stat-value">{ov.total_employees || 0}</div><div className="stat-label">Tổng nhân viên</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div><div className="stat-value">{ov.in_progress || 0}</div><div className="stat-label">Đang onboarding</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div><div className="stat-value">{ov.completed || 0}</div><div className="stat-label">Hoàn thành</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">🚨</div>
          <div><div className="stat-value">{ov.at_risk || 0}</div><div className="stat-label">Cần chú ý</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">📈</div>
          <div><div className="stat-value">{ov.avg_completion ? `${Math.round(ov.avg_completion)}%` : '—'}</div><div className="stat-label">TB hoàn thành</div></div>
        </div>
      </div>

      {/* Health Distribution */}
      {ov.health_distribution && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>🏥 Phân bố sức khỏe onboarding</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {Object.entries(ov.health_distribution).map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{v}</div>
                <div className={`badge ${k}`} style={{ marginTop: 4 }}>{k === 'green' ? '🟢 Tốt' : k === 'yellow' ? '🟡 TB' : '🔴 Nguy hiểm'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn${tab === 'overview' ? ' active' : ''}`} onClick={() => setTab('overview')}>👥 Nhân viên</button>
        <button className={`tab-btn${tab === 'bottleneck' ? ' active' : ''}`} onClick={() => setTab('bottleneck')}>🚧 Bottlenecks</button>
      </div>

      {tab === 'overview' && (
        <div className="card">
          {employees.length === 0 ? (
            <div className="empty-state"><div className="icon">👤</div><h3>Chưa có nhân viên</h3><p>Sử dụng Mock Panel để tạo nhân viên mới</p></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Tên</th><th>Phòng ban</th><th>Vị trí</th><th>Status</th><th>Tiến độ</th><th>Sức khỏe</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id} className="clickable" onClick={() => navigate(`/employee/${e.id}`)}>
                    <td style={{ fontWeight: 500 }}>{e.full_name}</td>
                    <td>{e.department || '—'}</td>
                    <td>{e.role || '—'}</td>
                    <td>{statusBadge(e.onboarding_status)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ width: 80 }}>
                          <div className={`progress-fill ${(e.completion_percentage || 0) >= 80 ? 'green' : (e.completion_percentage || 0) >= 40 ? 'yellow' : 'accent'}`}
                            style={{ width: `${e.completion_percentage || 0}%` }} />
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{Math.round(e.completion_percentage || 0)}%</span>
                      </div>
                    </td>
                    <td>{healthBadge(e.health_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'bottleneck' && (
        <div className="card">
          {bottlenecks.length === 0 ? (
            <div className="empty-state"><div className="icon">✅</div><h3>Không có bottleneck</h3><p>Tất cả tasks đang chạy tốt</p></div>
          ) : (
            <div>
              {bottlenecks.map((b, i) => (
                <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>🚧 {b.task_title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {b.stuck_count} NV bị stuck • TB quá hạn {Math.round(b.avg_overdue_days || 0)} ngày
                      </div>
                    </div>
                    <span className="badge red">{b.stuck_count} NV</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
