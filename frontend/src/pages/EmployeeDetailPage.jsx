import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Building2, MapPin, Calendar, Shield, Loader2, Bot, Handshake, Siren, CalendarClock, Send, CheckCircle2, Circle, Clock } from 'lucide-react';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [emp, setEmp] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [copilot, setCopilot] = useState(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [empR, anaR] = await Promise.all([api(`/api/employees/${id}`), api(`/api/analytics/employee/${id}`)]);
      if (empR.success) setEmp(empR.data);
      if (anaR.success) setAnalytics(anaR.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function runCopilot() {
    setCopilotLoading(true);
    try {
      const r = await api('/api/analytics/copilot', { method: 'POST', body: JSON.stringify({ employee_id: id }) });
      if (r.success) setCopilot(r.data);
    } catch (e) { console.error(e); }
    setCopilotLoading(false);
  }

  async function doAction(action) {
    try {
      const r = await api(`/api/actions/${action}`, { method: 'POST', body: JSON.stringify({ employee_id: id }) });
      toast(r.success ? `✅ ${r.data?.message || 'Thành công'}` : `❌ ${r.error}`, r.success ? 'success' : 'error');
    } catch (e) { toast('❌ Lỗi kết nối', 'error'); }
  }

  if (loading) return (
    <div>
      <Skeleton className="h-8 w-48 mb-4" />
      <Skeleton className="h-32 rounded-2xl mb-6" />
      <div className="grid grid-cols-2 gap-4"><Skeleton className="h-48 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>
    </div>
  );

  if (!emp) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <h3 className="text-base font-semibold text-slate-500 mb-3">Không tìm thấy nhân viên</h3>
      <Button variant="secondary" onClick={() => navigate('/')}><ArrowLeft className="h-4 w-4" /> Quay lại</Button>
    </div>
  );

  const a = analytics || {};
  const cl = a.checklist || {};
  const checklists = emp?.checklist || [];
  const initials = emp.full_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'NV';

  const healthVariant = emp.health_score === 'green' ? 'green' : emp.health_score === 'yellow' ? 'yellow' : emp.health_score === 'red' ? 'red' : 'gray';
  const healthLabel = emp.health_score === 'green' ? 'Healthy' : emp.health_score === 'yellow' ? 'At Risk' : emp.health_score === 'red' ? 'Critical' : emp.health_score ?? 'N/A';

  const infoRows = [
    { icon: Mail, label: 'Email', value: emp.email },
    { icon: Building2, label: 'Phòng ban', value: emp.department },
    { icon: Shield, label: 'Vị trí', value: emp.role },
    { icon: Calendar, label: 'Ngày bắt đầu', value: emp.start_date || '—' },
    { icon: Shield, label: 'Cấp bậc', value: emp.seniority_level || '—' },
    { icon: MapPin, label: 'Địa điểm', value: emp.location || '—' },
  ];

  const actions = [
    { key: 'assign-buddy', icon: Handshake, label: 'Assign Buddy', desc: 'Nhắc Manager assign buddy', color: 'bg-primary-50 text-primary-600' },
    { key: 'escalate-it', icon: Siren, label: 'Escalate IT', desc: 'Escalate IT tasks', color: 'bg-red-50 text-red-600' },
    { key: 'schedule-checkin', icon: CalendarClock, label: 'Schedule Check-in', desc: 'Đặt lịch check-in', color: 'bg-amber-50 text-amber-600' },
    { key: 'send-reminder', icon: Send, label: 'Send Reminder', desc: 'Gửi nhắc nhở NV', color: 'bg-emerald-50 text-emerald-600' },
  ];

  return (
    <PageTransition>
      <AnimatedItem>
        <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="mb-4"><ArrowLeft className="h-4 w-4" /> Quay lại Dashboard</Button>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar size="xl"><AvatarFallback className="text-lg">{initials}</AvatarFallback></Avatar>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{emp.full_name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">{emp.role} • {emp.department}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={healthVariant}>{healthLabel}</Badge>
            <Badge variant={emp.onboarding_status === 'completed' ? 'green' : 'blue'}>{emp.onboarding_status}</Badge>
          </div>
        </div>
      </AnimatedItem>

      <AnimatedItem>
        <Tabs defaultValue="info">
          <TabsList>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
            <TabsTrigger value="checklist">Checklist ({checklists.length})</TabsTrigger>
            <TabsTrigger value="copilot">AI Copilot</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card>
                <CardHeader><CardTitle>Thông tin cá nhân</CardTitle></CardHeader>
                <CardContent className="space-y-0 divide-y divide-slate-100">
                  {infoRows.map(r => (
                    <div key={r.label} className="flex items-center justify-between py-3 text-sm">
                      <span className="flex items-center gap-2 text-slate-400"><r.icon className="h-4 w-4" />{r.label}</span>
                      <span className="font-medium text-slate-700">{r.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Tiến độ onboarding</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <div className="text-4xl font-semibold text-zinc-900">{Math.round(cl.completion_percentage || 0)}%</div>
                    <Progress value={cl.completion_percentage || 0} className="mt-4 h-3" />
                    <div className="mt-5 flex justify-around text-xs text-slate-400">
                      <span>✅ Xong: <strong className="text-slate-600">{cl.completed || 0}</strong></span>
                      <span>📋 Tổng: <strong className="text-slate-600">{cl.total || 0}</strong></span>
                      <span>⚠️ Quá hạn: <strong className="text-slate-600">{cl.overdue || 0}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <Card>
              <CardContent className="p-0">
                {checklists.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-slate-400"><h3 className="text-sm font-semibold text-slate-500">Chưa có checklist</h3></div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {checklists.map((item, i) => (
                      <div key={item.id || i} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/60 transition-colors">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${item.status === 'hoan_thanh' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'}`}>
                          {item.status === 'hoan_thanh' ? <CheckCircle2 className="h-4 w-4" /> : item.status === 'dang_lam' ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-700">{item.title}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {item.category && <Badge variant="gray" className="text-[10px]">{item.category}</Badge>}
                            {item.owner && <Badge variant="purple" className="text-[10px]">{item.owner}</Badge>}
                            {item.deadline_date && <span className="text-[11px] text-slate-400">Hạn: {item.deadline_date}</span>}
                          </div>
                        </div>
                        <Badge variant={item.status === 'hoan_thanh' ? 'green' : item.status === 'dang_lam' ? 'yellow' : 'gray'}>
                          {item.status === 'hoan_thanh' ? 'Xong' : item.status === 'dang_lam' ? 'Đang làm' : 'Chưa bắt đầu'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="copilot">
            <Card>
              <CardContent>
                {copilotLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mr-2" /> AI đang phân tích...</div>
                ) : copilot ? (
                  <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-5">
                    <h3 className="text-sm font-medium text-zinc-800 mb-3 flex items-center gap-2"><Bot className="h-4 w-4 text-zinc-500" /> AI Copilot Analysis</h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{copilot.summary}</p>
                    {copilot.risk_factors?.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-semibold text-slate-500 mb-2">⚠️ Risk Factors</div>
                        {copilot.risk_factors.map((r, i) => <div key={i} className="text-xs text-red-500 py-1">🔸 {r}</div>)}
                      </div>
                    )}
                    {copilot.suggested_actions?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">{copilot.suggested_actions.map((s, i) => <Button key={i} variant="secondary" size="sm">{s.label || s}</Button>)}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Bot className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                    <Button onClick={runCopilot}><Bot className="h-4 w-4" /> Phân tích với AI Copilot</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {actions.map(a => (
                <motion.div key={a.key} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                  <Card className="cursor-pointer" onClick={() => doAction(a.key)}>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${a.color}`}><a.icon className="h-5 w-5" /></div>
                      <div><div className="text-sm font-semibold text-slate-800">{a.label}</div><div className="text-xs text-slate-400 mt-0.5">{a.desc}</div></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </AnimatedItem>
    </PageTransition>
  );
}
