import { useState, useEffect } from 'react';
import { api, getUser } from '../api/client';
import { useToast } from '../components/Toast';

export default function MyOnboardingPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const user = getUser();

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      if (!user?.id) return;
      const res = await api.get(`/api/employees/${user.id}`);
      if (res.success) {
        setData(res.data);
      } else {
        showToast(res.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteItem = async (itemId) => {
    try {
      const res = await api.patch(`/api/checklist/items/${itemId}/complete`, {
        completed_by: user.id
      });
      if (res.success) {
        showToast('Đã đánh dấu hoàn thành!', 'success');
        fetchMyData(); // Refresh list
      } else {
        showToast(res.error, 'error');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) return <div className="p-8">Đang tải dữ liệu...</div>;
  if (!data) return <div className="p-8">Không tìm thấy thông tin onboarding.</div>;

  const plan = data.onboarding_plan;
  const items = data.checklist || [];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">My Onboarding Plan</h1>
        <p className="text-gray-500">
          Chào mừng {data.full_name}! Dưới đây là lộ trình onboarding dành riêng cho bạn.
        </p>
      </header>

      {/* Tiền trình */}
      <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-800">Tiến độ hoàn thành</h2>
          <span className="font-bold text-primary-600">{plan?.completion_percentage || 0}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div 
            className="bg-primary-500 h-3 rounded-full transition-all duration-500" 
            style={{ width: `${plan?.completion_percentage || 0}%` }}
          />
        </div>
        <div className="mt-4 flex gap-4 text-sm text-gray-500">
          <div><span className="font-medium text-gray-900">{plan?.completed_items || 0}</span> đã xong</div>
          <div><span className="font-medium text-gray-900">{plan?.total_items || 0}</span> tổng cộng</div>
        </div>
      </div>

      {/* Danh sách nhiệm vụ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Nhiệm vụ của bạn</h2>
        {items.filter(i => i.owner === 'new_hire').length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            Hiện tại bạn chưa có nhiệm vụ nào cần làm.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 divide-y overflow-hidden shadow-sm">
            {items.filter(i => i.owner === 'new_hire').map(item => (
              <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors flex items-start gap-4">
                <input 
                  type="checkbox"
                  className="mt-1.5 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  checked={item.status === 'hoan_thanh'}
                  onChange={() => {
                    if (item.status !== 'hoan_thanh') {
                      handleCompleteItem(item.id);
                    }
                  }}
                  disabled={item.status === 'hoan_thanh'}
                />
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${item.status === 'hoan_thanh' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                    {item.is_mandatory && (
                      <span className="text-red-600 bg-red-50 px-2 py-0.5 rounded">Bắt buộc</span>
                    )}
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Hạn: {new Date(item.deadline_date).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <div>
          <p className="font-semibold">Cần giúp đỡ?</p>
          <p className="text-sm mt-1">Chuyển sang tab <span className="font-semibold">AI Chat</span> ở menu bên trái để hỏi bất kỳ thông tin nào về công ty, quy trình hoặc tài liệu.</p>
        </div>
      </div>
    </div>
  );
}
