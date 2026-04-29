# Công cụ làm việc

> Tài liệu nội bộ Company. Cập nhật: 04/2026.

## Tổng quan hệ thống

Company sử dụng các công cụ sau cho công việc hàng ngày. Tài khoản được IT cấp **trong ngày đầu tiên** làm việc.

| Công cụ | Mục đích | Link |
|---|---|---|
| **Google Workspace** | Email, Calendar, Drive, Meet | mail.company.vn |
| **Slack** | Chat nội bộ, thông báo nhanh | company.slack.com |
| **Jira** | Quản lý dự án, task tracking | jira.company.vn |
| **Confluence** | Wiki, tài liệu nội bộ | confluence.company.vn |
| **GitHub** | Source code, code review, CI/CD | github.com/company |
| **Figma** | Thiết kế UI/UX (team Design) | figma.com |
| **VPN** | Truy cập hệ thống nội bộ khi WFH | Xem hướng dẫn riêng |

## Google Workspace

### Email công ty
- Địa chỉ: **[tên]@company.vn**
- Dung lượng: 30GB/tài khoản.
- Chữ ký email: theo mẫu chuẩn công ty (HR gửi template trong ngày đầu).
- Email công ty chỉ dùng cho **mục đích công việc**. Không đăng ký dịch vụ cá nhân bằng email công ty.

### Google Calendar
- Cập nhật lịch họp và lịch nghỉ trên Calendar.
- Đặt phòng họp qua Calendar (chọn resource "Phòng họp A/B/C").
- Chia sẻ lịch với team để mọi người biết khi nào bạn bận/rảnh.

### Google Drive
- Lưu tài liệu công việc trên **Shared Drive** của team (không dùng My Drive cá nhân cho file công việc).
- Quyền truy cập: chỉ share cho người cần thiết, **không bật "Anyone with the link"** cho tài liệu nội bộ.

## Slack

### Quy tắc sử dụng
- Tin nhắn công việc: gửi trong **channel phù hợp** (không DM nếu cả team cần biết).
- Cập nhật status khi WFH, nghỉ phép, hoặc bận họp.
- Phản hồi tin nhắn trong giờ làm việc: **trong vòng 2 giờ** (trừ tin khẩn cấp — phản hồi ngay).
- Không gửi thông tin nhạy cảm (mật khẩu, key, dữ liệu khách hàng) qua Slack.

### Channels quan trọng

| Channel | Mô tả |
|---|---|
| #general | Thông báo chung toàn công ty |
| #random | Chat thoải mái, không liên quan công việc |
| #it-support | Hỏi/yêu cầu hỗ trợ IT |
| #hr-announcements | Thông báo từ Phòng Nhân sự |
| #team-[tên-team] | Channel riêng của từng team |

## Jira

- Mỗi dự án có **Jira Board** riêng (Scrum hoặc Kanban).
- Cập nhật status task hàng ngày: To Do → In Progress → Review → Done.
- Log thời gian làm việc trên mỗi task (nếu dự án yêu cầu time tracking).
- Báo cáo bug: tạo ticket loại "Bug" với mô tả rõ ràng + screenshot.

## GitHub

- Tất cả source code nằm trên GitHub organization của Company.
- Quy tắc branch: `main` (production) → `develop` → `feature/xxx` → Pull Request.
- Mọi code phải qua **Code Review** (ít nhất 1 reviewer approve) trước khi merge.
- Quyền truy cập repo: Manager tạo request → IT cấp trong 24h.
- Quyền truy cập **database production**: cần approval từ Tech Lead + CTO.

## Liên hệ

Phòng IT: it-support@company.vn | Ext: 300
