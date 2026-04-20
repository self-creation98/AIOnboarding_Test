import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import HealthIndicator from '@/components/HealthIndicator';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp, Construction } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [bottlenecks, setBottlenecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, emp, bn] = await Promise.all([
        api('/api/analytics/overview'), api('/api/employees'), api('/api/analytics/bottlenecks'),
      ]);
      if (ov.success) setOverview(ov.data);
      if (emp.success) setEmployees(emp.data || []);
      if (bn.success) setBottlenecks(bn.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function healthBadge(score) {
    if (!score) return <Badge variant="gray">N/A</Badge>;
    const m = { green: ['green', 'Healthy'], yellow: ['yellow', 'At Risk'], red: ['red', 'Critical'] };
    const [v, l] = m[score] || ['gray', score];
    return <Badge variant={v}>{l}</Badge>;
  }

  function statusBadge(s) {
    const m = { pre_boarding: ['blue', 'Pre-boarding'], in_progress: ['yellow', 'In Progress'], completed: ['green', 'Completed'] };
    const [c, l] = m[s] || ['gray', s];
    return <Badge variant={c}>{l}</Badge>;
  }

  if (loading) return (
    <div>
      <Header title="Dashboard" subtitle="Active" breadcrumbs={['Dashboard', 'Overview']} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="h-24 rounded-2xl mb-6" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  const ov = overview || {};

  return (
    <PageTransition>
      <AnimatedItem>
        <Header title="Dashboard" subtitle="Active" breadcrumbs={['Dashboard', 'Overview']} />
      </AnimatedItem>

      <AnimatedItem>
        <p className="text-sm text-[#6e6880] mb-5 -mt-2">Tổng quan hệ thống onboarding</p>
      </AnimatedItem>

      <AnimatedItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard icon={Users} label="Đang onboarding" value={ov.total_onboarding || 0} tint="purple" />
          <StatCard icon={AlertTriangle} label="Quá hạn" value={ov.overdue_count || 0} tint="yellow" />
          <StatCard icon={CheckCircle2} label="Hoàn thành tháng" value={ov.completed_this_month || 0} tint="green" />
          <StatCard icon={ShieldAlert} label="Cần chú ý" value={ov.at_risk_count || 0} tint="red" />
          <StatCard icon={TrendingUp} label="TB hoàn thành" value={ov.avg_completion ? `${Math.round(ov.avg_completion)}%` : '—'} tint="blue" />
        </div>
      </AnimatedItem>

      {ov.health_distribution && (
        <AnimatedItem>
          <Card className="mb-6">
            <CardHeader><CardTitle>Onboarding Health</CardTitle></CardHeader>
            <CardContent><HealthIndicator distribution={ov.health_distribution} /></CardContent>
          </Card>
        </AnimatedItem>
      )}

      <AnimatedItem>
        <Tabs defaultValue="employees">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="employees"><Users className="h-3.5 w-3.5" /> Nhân viên</TabsTrigger>
              <TabsTrigger value="bottlenecks"><Construction className="h-3.5 w-3.5" /> Bottlenecks</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="employees">
            <Card>
              <CardContent className="p-0">
                {employees.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-[#9e97b0]">
                    <Users className="h-10 w-10 mb-3 text-[#ddd9e4]" />
                    <h3 className="text-sm font-medium text-[#6e6880]">Chưa có nhân viên</h3>
                    <p className="text-xs mt-1">Sử dụng Mock Panel để tạo</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Tên</TableHead><TableHead>Phòng ban</TableHead><TableHead>Vị trí</TableHead>
                        <TableHead>Status</TableHead><TableHead>Tiến độ</TableHead><TableHead>Sức khỏe</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map(e => (
                        <TableRow key={e.id} className="cursor-pointer" onClick={() => navigate(`/employee/${e.id}`)}>
                          <TableCell className="font-medium text-[#1a1523]">{e.full_name}</TableCell>
                          <TableCell>{e.department || '—'}</TableCell>
                          <TableCell>{e.role || '—'}</TableCell>
                          <TableCell>{statusBadge(e.onboarding_status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5 min-w-[120px]">
                              <Progress value={e.completion_percentage || 0} color={(e.completion_percentage||0)>=80?'green':(e.completion_percentage||0)>=40?'yellow':'primary'} className="w-20" />
                              <span className="text-xs font-medium text-[#9e97b0]">{Math.round(e.completion_percentage||0)}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{healthBadge(e.health_score)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bottlenecks">
            <Card>
              <CardContent className="p-0">
                {bottlenecks.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-[#9e97b0]">
                    <CheckCircle2 className="h-10 w-10 mb-3 text-[#ddd9e4]" />
                    <h3 className="text-sm font-medium text-[#6e6880]">Không có bottleneck</h3>
                  </div>
                ) : (
                  <div className="divide-y divide-[#eeedf0]">
                    {bottlenecks.map((b, i) => (
                      <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-[#faf9fb] transition-colors">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-medium text-[#1a1523]">
                            <Construction className="h-4 w-4 text-amber-500" />{b.task_name}
                          </div>
                          <div className="mt-1 text-xs text-[#9e97b0]">{b.affected_employees} NV stuck • TB quá hạn {Math.round(b.avg_overdue_days||0)} ngày</div>
                        </div>
                        <Badge variant="red">{b.affected_employees} NV</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedItem>
    </PageTransition>
  );
}
