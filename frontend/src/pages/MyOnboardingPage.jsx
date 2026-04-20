import { useState, useEffect } from 'react';
import { api, getUser } from '@/api/client';
import { useToast } from '@/components/Toast';
import Header from '@/components/Header';
import { PageTransition, AnimatedItem } from '@/components/PageTransition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, Loader2, Save, Lightbulb, MessageSquare, CreditCard } from 'lucide-react';

export default function MyOnboardingPage() {
  const [data, setData] = useState(null);
  const [preboarding, setPreboarding] = useState(null);
  const [bankInfo, setBankInfo] = useState({ bankName: '', accountNumber: '' });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const user = getUser();

  useEffect(() => { fetchMyData(); }, []);

  const fetchMyData = async () => {
    try {
      if (!user?.id) return;
      const res = await api(`/api/employees/${user.id}`);
      if (res.success) setData(res.data);
      else toast(res.error, 'error');
      const pbRes = await api(`/api/preboarding/${user.id}`);
      if (pbRes.success) setPreboarding(pbRes.data);
    } catch (err) { toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleCompleteItem = async (itemId) => {
    try {
      const res = await api(`/api/checklist/items/${itemId}/complete`, { method: 'PATCH', body: JSON.stringify({ completed_by: user.id }) });
      if (res.success) { toast('Đã đánh dấu hoàn thành!', 'success'); fetchMyData(); }
      else toast(res.error, 'error');
    } catch (err) { toast(err.message, 'error'); }
  };

  const handleSubmitBankInfo = async (e) => {
    e.preventDefault();
    if (!bankInfo.bankName || !bankInfo.accountNumber) return;
    setUploading(true);
    try {
      const blob = new Blob([JSON.stringify(bankInfo, null, 2)], { type: 'application/json' });
      const formData = new FormData();
      formData.append('document_type', 'so_tai_khoan');
      formData.append('file', blob, 'bank_info.json');
      const res = await api(`/api/preboarding/${user.id}/upload`, { method: 'POST', body: formData });
      if (res.success) { toast('Đã ghi nhận thông tin ngân hàng!', 'success'); fetchMyData(); }
      else toast(res.error, 'error');
    } catch (err) { toast(err.message, 'error'); }
    finally { setUploading(false); }
  };

  if (loading) return (
    <div>
      <Skeleton className="h-8 w-64 mb-4" />
      <Skeleton className="h-32 rounded-2xl mb-5" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center py-24 text-slate-400">
      <h3 className="text-base font-semibold text-slate-500">Không tìm thấy thông tin onboarding.</h3>
    </div>
  );

  const plan = data.onboarding_plan;
  const items = data.checklist || [];
  const bankDoc = preboarding?.documents?.find(d => d.document_type === 'so_tai_khoan');
  const myItems = items.filter(i => i.owner === 'new_hire');
  const completionPct = plan?.completion_percentage || 0;

  return (
    <PageTransition>
      <AnimatedItem>
        <Header title="My Onboarding Plan" subtitle={`Chào mừng ${data.full_name}! Dưới đây là lộ trình onboarding của bạn.`} />
      </AnimatedItem>

      {/* Progress */}
      <AnimatedItem>
        <Card className="mb-5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-base">Tiến độ hoàn thành</CardTitle>
              <span className="text-3xl font-extrabold text-primary-500">{Math.round(completionPct)}%</span>
            </div>
            <Progress value={completionPct} className="h-3" />
            <div className="mt-4 flex gap-6 text-xs text-slate-400">
              <span>✅ Xong: <strong className="text-slate-600">{plan?.completed_items || 0}</strong></span>
              <span>📋 Tổng: <strong className="text-slate-600">{plan?.total_items || 0}</strong></span>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Bank info */}
      {bankDoc && (
        <AnimatedItem>
          <Card className="mb-5 border-l-4 border-l-primary-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary-500" />
                Thông tin Ngân hàng (Nhận lương)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bankDoc.status === 'missing' ? (
                <form onSubmit={handleSubmitBankInfo} className="space-y-4">
                  <p className="text-xs text-slate-400">Vui lòng cung cấp thông tin tài khoản để HR tiến hành thủ tục trả lương.</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Tên Ngân hàng</label>
                      <Input required placeholder="VD: Vietcombank chi nhánh HCM" value={bankInfo.bankName} onChange={e => setBankInfo(p => ({ ...p, bankName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Số tài khoản</label>
                      <Input required placeholder="VD: 0123456789" value={bankInfo.accountNumber} onChange={e => setBankInfo(p => ({ ...p, accountNumber: e.target.value }))} />
                    </div>
                  </div>
                  <Button disabled={uploading} type="submit">
                    {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</> : <><Save className="h-4 w-4" /> Gửi thông tin</>}
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-emerald-700">Đã cập nhật thành công!</div>
                    <div className="text-xs text-emerald-600/70 mt-0.5">HR đã nhận được thông tin tài khoản ngân hàng của bạn.</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
      )}

      {/* Tasks */}
      <AnimatedItem>
        <Card>
          <CardHeader><CardTitle>Nhiệm vụ của bạn</CardTitle></CardHeader>
          <CardContent className="p-0">
            {myItems.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <ClipboardIcon className="h-12 w-12 mb-3 text-slate-200" />
                <h3 className="text-sm font-semibold text-slate-500">Chưa có nhiệm vụ nào</h3>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myItems.map(item => (
                  <motion.div key={item.id} whileHover={{ backgroundColor: 'rgba(248,250,252,0.8)' }}
                    className="flex items-center gap-4 px-6 py-4 transition-colors">
                    <button
                      className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 transition-all ${
                        item.status === 'hoan_thanh'
                          ? 'bg-emerald-50 text-emerald-500'
                          : 'bg-slate-100 text-slate-400 hover:bg-primary-50 hover:text-primary-500 cursor-pointer'
                      }`}
                      onClick={() => { if (item.status !== 'hoan_thanh') handleCompleteItem(item.id); }}
                      disabled={item.status === 'hoan_thanh'}
                    >
                      {item.status === 'hoan_thanh' ? <CheckCircle2 className="h-4 w-4" /> : item.status === 'dang_lam' ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${item.status === 'hoan_thanh' ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.title}</div>
                      {item.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.description}</div>}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {item.is_mandatory && <Badge variant="red" className="text-[10px]">Bắt buộc</Badge>}
                        {item.category && <Badge variant="gray" className="text-[10px]">{item.category}</Badge>}
                        {item.deadline_date && <span className="text-[11px] text-slate-400">Hạn: {new Date(item.deadline_date).toLocaleDateString('vi-VN')}</span>}
                      </div>
                    </div>
                    <Badge variant={item.status === 'hoan_thanh' ? 'green' : item.status === 'dang_lam' ? 'yellow' : 'gray'}>
                      {item.status === 'hoan_thanh' ? 'Xong' : item.status === 'dang_lam' ? 'Đang làm' : 'Chưa bắt đầu'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedItem>

      {/* Tip */}
      <AnimatedItem>
        <Card className="mt-5 border-l-4 border-l-primary-500">
          <CardContent className="flex items-start gap-3 pt-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 shrink-0">
              <Lightbulb className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Cần giúp đỡ?</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Chuyển sang tab <strong className="text-slate-600">AI Chat</strong> ở menu bên trái để hỏi bất kỳ thông tin nào về công ty, quy trình hoặc tài liệu.
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedItem>
    </PageTransition>
  );
}

function ClipboardIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h.75" />
    </svg>
  );
}
