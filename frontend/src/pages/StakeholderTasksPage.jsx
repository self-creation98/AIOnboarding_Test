import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, RefreshCw, CheckCircle2, ClipboardList } from 'lucide-react';

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

  const totalPending = Object.values(summary).reduce((s, v) => s + (v.pending || 0), 0);
  const totalCompleted = Object.values(summary).reduce((s, v) => s + (v.completed || 0), 0);
  const totalInProgress = Object.values(summary).reduce((s, v) => s + (v.in_progress || 0), 0);

  return (
    <PageTransition>
      <AnimatedItem>
        <Header title="Stakeholder Tasks" subtitle="Quản lý tasks giao cho IT, Admin, Manager" />
      </AnimatedItem>

      <AnimatedItem>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon={Clock} label="Pending" value={totalPending} color="yellow" />
          <StatCard icon={RefreshCw} label="In Progress" value={totalInProgress} color="blue" />
          <StatCard icon={CheckCircle2} label="Completed" value={totalCompleted} color="green" />
        </div>
      </AnimatedItem>

      {Object.keys(summary).length > 0 && (
        <AnimatedItem>
          <Card className="mb-6">
            <CardHeader><CardTitle>Theo team</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4 flex-wrap">
                {Object.entries(summary).map(([team, counts]) => (
                  <div key={team} className="rounded-xl border border-slate-200 p-4 min-w-[140px]">
                    <Badge variant={teamColors[team] || 'gray'} className="mb-2">{team.toUpperCase()}</Badge>
                    <div className="space-y-0.5 text-xs text-slate-500">
                      {Object.entries(counts).map(([s, c]) => (
                        <div key={s} className="flex justify-between">
                          <span>{s}</span>
                          <span className="font-semibold text-slate-700">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <div className="flex items-center gap-3 mb-5">
          <Select value={teamFilter} onChange={e => setTeamFilter(e.target.value)} className="w-40">
            <option value="">Tất cả team</option>
            <option value="it">IT</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="finance">Finance</option>
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40">
            <option value="">Tất cả status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <ClipboardList className="h-12 w-12 mb-3 text-slate-200" />
                <h3 className="text-sm font-semibold text-slate-500">Không có task</h3>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Task</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Nhân viên</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map(t => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{t.title}</div>
                        {t.description && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{t.description.slice(0, 80)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={teamColors[t.assigned_to_team] || 'gray'}>{t.assigned_to_team?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500">{t.employee_name || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusColors[t.status] || 'gray'}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">{t.deadline || '—'}</TableCell>
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
