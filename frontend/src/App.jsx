import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '@/components/Toast';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage';
import MockPanelPage from '@/pages/MockPanelPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ChatPage from '@/pages/ChatPage';
import StakeholderTasksPage from '@/pages/StakeholderTasksPage';
import MyOnboardingPage from '@/pages/MyOnboardingPage';
import { getUser } from '@/api/client';

export default function App() {
  const user = getUser();
  const role = user?.vai_tro;

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<Layout />}>
            {role === 'nhan_vien_moi' ? (
              <>
                <Route path="/" element={<MyOnboardingPage />} />
                <Route path="/chat" element={<ChatPage />} />
              </>
            ) : (
              <>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/employee/:id" element={<EmployeeDetailPage />} />
                <Route path="/mock-panel" element={<MockPanelPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/stakeholder-tasks" element={<StakeholderTasksPage />} />
              </>
            )}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
