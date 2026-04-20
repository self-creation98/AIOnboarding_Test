import { useState, useEffect } from 'react';
import { publicApi, api } from '@/api/client';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Building2, Wrench, BookOpen, Loader2, Send } from 'lucide-react';

export default function MockPanelPage() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [responses, setResponses] = useState({});
  const [loadings, setLoadings] = useState({});

  const [hris, setHris] = useState({ full_name: 'Nguyễn Văn An', email: 'an.nguyen@company.com', role: 'Software Engineer', department: 'Engineering', start_date: '2026-05-20', seniority: 'junior', location: 'HCM' });
  const [it, setIt] = useState({ employee_id: '', task_type: 'email_setup', resolved_by: 'it_admin@company.com' });
  const [lms, setLms] = useState({ employee_id: '', course_name: 'Security Awareness Training', score: 85 });

  useEffect(() => { api('/api/employees').then(r => { if (r.success) setEmployees(r.data || []); }); }, []);

  async function fire(key, url, body) {
    setLoadings(p => ({ ...p, [key]: true }));
    try {
      const r = await publicApi(url, { method: 'POST', body: JSON.stringify(body) });
      setResponses(p => ({ ...p, [key]: JSON.stringify(r, null, 2) }));
      toast(r.success ? '✅ Webhook sent!' : `❌ ${r.error}`, r.success ? 'success' : 'error');
      if (r.success && key === 'hris') api('/api/employees').then(r2 => { if (r2.success) setEmployees(r2.data || []); });
    } catch (e) {
      setResponses(p => ({ ...p, [key]: `Error: ${e.message}` }));
      toast('❌ Lỗi kết nối', 'error');
    }
    setLoadings(p => ({ ...p, [key]: false }));
  }

  const Label = ({ children }) => <label className="text-sm font-medium text-[#6e6880] mb-1.5 block">{children}</label>;

  return (
    <PageTransition>
      <AnimatedItem><Header title="Mock Control Panel" subtitle="Giả lập webhook từ HRIS, IT, LMS để test luồng onboarding" /></AnimatedItem>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* HRIS */}
        <AnimatedItem>
          <Card className="border-l-[3px] border-l-primary-500">
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary-500" /> HRIS: Tạo Nhân Viên Mới</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Họ tên</Label><Input value={hris.full_name} onChange={e => setHris(p => ({ ...p, full_name: e.target.value }))} /></div>
                <div><Label>Email</Label><Input value={hris.email} onChange={e => setHris(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Vị trí</Label><Input value={hris.role} onChange={e => setHris(p => ({ ...p, role: e.target.value }))} /></div>
                <div><Label>Phòng ban</Label><Input value={hris.department} onChange={e => setHris(p => ({ ...p, department: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Ngày bắt đầu</Label><Input type="date" value={hris.start_date} onChange={e => setHris(p => ({ ...p, start_date: e.target.value }))} /></div>
                <div><Label>Cấp bậc</Label><Select value={hris.seniority} onChange={e => setHris(p => ({ ...p, seniority: e.target.value }))}><option value="junior">Junior</option><option value="senior">Senior</option><option value="intern">Intern</option></Select></div>
              </div>
              <Button disabled={loadings.hris} onClick={() => fire('hris', '/api/webhooks/hris/new-employee', { event: 'employee.created', data: hris })}>
                {loadings.hris ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Gửi Webhook</>}
              </Button>
              {responses.hris && <pre className="mt-3 rounded-xl bg-[#faf9fb] border border-[#eeedf0] p-3 text-xs text-[#6e6880] font-mono max-h-40 overflow-auto">{responses.hris}</pre>}
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* IT */}
        <AnimatedItem>
          <Card className="border-l-[3px] border-l-emerald-400">
            <CardHeader><CardTitle className="flex items-center gap-2"><Wrench className="h-4 w-4 text-emerald-500" /> IT: Resolve Ticket</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Nhân viên</Label><Select value={it.employee_id} onChange={e => setIt(p => ({ ...p, employee_id: e.target.value }))}><option value="">-- Chọn NV --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</Select></div>
              <div><Label>Task Type</Label><Select value={it.task_type} onChange={e => setIt(p => ({ ...p, task_type: e.target.value }))}><option value="email_setup">Email Setup</option><option value="laptop_setup">Laptop Setup</option><option value="vpn_access">VPN Access</option><option value="software_install">Software Install</option></Select></div>
              <Button variant="success" disabled={loadings.it || !it.employee_id} onClick={() => fire('it', '/api/webhooks/it/ticket-resolved', { event: 'ticket.resolved', data: { ...it, ticket_id: `IT-${Date.now()}` } })}>
                {loadings.it ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Resolve Ticket</>}
              </Button>
              {responses.it && <pre className="mt-3 rounded-xl bg-[#faf9fb] border border-[#eeedf0] p-3 text-xs text-[#6e6880] font-mono max-h-40 overflow-auto">{responses.it}</pre>}
            </CardContent>
          </Card>
        </AnimatedItem>

        {/* LMS */}
        <AnimatedItem>
          <Card className="border-l-[3px] border-l-amber-400">
            <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-amber-500" /> LMS: Course Completed</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Nhân viên</Label><Select value={lms.employee_id} onChange={e => setLms(p => ({ ...p, employee_id: e.target.value }))}><option value="">-- Chọn NV --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}</Select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Khóa học</Label><Input value={lms.course_name} onChange={e => setLms(p => ({ ...p, course_name: e.target.value }))} /></div>
                <div><Label>Điểm</Label><Input type="number" value={lms.score} onChange={e => setLms(p => ({ ...p, score: +e.target.value }))} /></div>
              </div>
              <Button disabled={loadings.lms || !lms.employee_id} onClick={() => fire('lms', '/api/webhooks/lms/course-completed', { event: 'course.completed', data: { ...lms, course_id: 'SEC-101', completed_at: new Date().toISOString() } })}>
                {loadings.lms ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Send className="h-4 w-4" /> Hoàn thành khóa học</>}
              </Button>
              {responses.lms && <pre className="mt-3 rounded-xl bg-[#faf9fb] border border-[#eeedf0] p-3 text-xs text-[#6e6880] font-mono max-h-40 overflow-auto">{responses.lms}</pre>}
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>
    </PageTransition>
  );
}
