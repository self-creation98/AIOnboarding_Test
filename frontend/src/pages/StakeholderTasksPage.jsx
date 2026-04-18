import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function StakeholderTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => { loadData(); }, [teamFilter, statusFilter]);

  async function loadData() {
    setLoading(true);
    try {
      let url = '/api/stakeholder-tasks?';
      if (teamFilter) url += `assigned_to_team=${teamFilter}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      const [tR, sR] = await Promise.all([api(url), api('/api/stakeholder-tasks/summary')]);
      if (tR.success) setTasks(tR.data || []);
      if (sR.success) setSummary(sR.data || {});
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const teamColors = { it: 'blue', admin: 'purple', manager: 'yellow', finance: 'green' };
  const statusColors = { pending: 'yellow', in_progress: 'blue', completed: 'green', cancelled: 'gray' };

  // Flatten summary to get totals
  const totalPending = Object.values(summary).reduce((s, v) => s + (v.pending || 0), 0);
  const totalCompleted = Object.values(summary).reduce((s, v) => s + (v.completed || 0), 0);
  const totalInProgress = Object.values(summary).reduce((s, v) => s + (v.in_progress || 0), 0);

  return (
    <div>
      <div className="page-header"><h1>📋 Stakeholder Tasks</h1><p>Quản lý tasks giao cho IT, Admin, Manager</p></div>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon yellow">⏳</div>
          <div><div className="stat-value">{totalPending}</div><div className="stat-label">Pending</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">🔄</div>
          <div><div className="stat-value">{totalInProgress}</div><div className="stat-label">In Progress</div></div></div>
        <div className="stat-card"><div className="stat-icon green">✅</div>
          <div><div className="stat-value">{totalCompleted}</div><div className="stat-label">Completed</div></div></div>
      </div>

      {/* Summary by team */}
      {Object.keys(summary).length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>📊 Theo team</div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {Object.entries(summary).map(([team, counts]) => (
              <div key={team} style={{ padding: '12px 20px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minWidth: 140 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}><span className={`badge ${teamColors[team] || 'gray'}`}>{team.toUpperCase()}</span></div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {Object.entries(counts).map(([s, c]) => <div key={s}>{s}: <strong>{c}</strong></div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="filters-bar">
        <select value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
          <option value="">Tất cả team</option>
          <option value="it">IT</option><option value="admin">Admin</option>
          <option value="manager">Manager</option><option value="finance">Finance</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Tất cả status</option>
          <option value="pending">Pending</option><option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="card">
        {loading ? <div className="loading"><div className="spinner" />Đang tải...</div> :
          tasks.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>Không có task</h3></div>
          ) : (
            <table className="data-table">
              <thead><tr><th>Task</th><th>Team</th><th>Nhân viên</th><th>Status</th><th>Deadline</th></tr></thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id}>
                    <td><div style={{ fontWeight: 500 }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t.description.slice(0, 80)}</div>}</td>
                    <td><span className={`badge ${teamColors[t.assigned_to_team] || 'gray'}`}>{t.assigned_to_team?.toUpperCase()}</span></td>
                    <td>{t.employee_name || '—'}</td>
                    <td><span className={`badge ${statusColors[t.status] || 'gray'}`}>{t.status}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.deadline || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}
