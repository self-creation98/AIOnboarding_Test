# Chính sách bảo mật thông tin

> Tài liệu nội bộ Company. Cập nhật: 04/2026.

## Nguyên tắc bảo mật

Mọi nhân viên Company có trách nhiệm bảo vệ thông tin công ty, khách hàng và đồng nghiệp. Vi phạm bảo mật có thể dẫn đến **kỷ luật lao động** và **trách nhiệm pháp lý**.

## Tài khoản và mật khẩu

### Yêu cầu mật khẩu
- Độ dài tối thiểu: **12 ký tự**.
- Phải có chữ hoa, chữ thường, số và ký tự đặc biệt.
- Đổi mật khẩu **mỗi 90 ngày** (hệ thống sẽ nhắc tự động).
- **Không được** dùng chung mật khẩu cho tài khoản công ty và tài khoản cá nhân.

### Xác thực hai yếu tố (2FA)
- **Bắt buộc** cho tất cả tài khoản: Google Workspace, GitHub, Jira, Slack, VPN.
- Sử dụng **Google Authenticator** hoặc **Authy** (không dùng SMS).
- Backup recovery codes lưu ở nơi an toàn.

### Quản lý tài khoản
- **Không chia sẻ** tài khoản hoặc mật khẩu với bất kỳ ai, kể cả đồng nghiệp.
- Khóa màn hình khi rời khỏi bàn (Windows: `Win + L`, Mac: `Ctrl + Cmd + Q`).
- Đăng xuất khỏi các hệ thống khi sử dụng máy tính công cộng.

## VPN và làm việc từ xa

- **Bắt buộc** sử dụng VPN khi làm việc ngoài văn phòng (WFH, công tác, quán cà phê).
- Không kết nối vào hệ thống nội bộ qua WiFi công cộng **nếu không bật VPN**.
- Hướng dẫn cài đặt VPN: xem tài liệu *"Hướng dẫn sử dụng VPN"*.

## Phân loại dữ liệu

| Mức độ | Mô tả | Ví dụ | Quy định |
|---|---|---|---|
| **Tuyệt mật** | Ảnh hưởng nghiêm trọng nếu lộ | Mã nguồn core, DB production, hợp đồng khách hàng | Chỉ người được phân quyền. Không sao chép. |
| **Nội bộ** | Chỉ dành cho nhân viên | Tài liệu kỹ thuật, báo cáo tài chính, lương | Không chia sẻ ra ngoài công ty. |
| **Công khai** | Có thể chia sẻ | Blog công ty, tuyển dụng, sản phẩm đã release | Thoải mái chia sẻ. |

## Email và tin nhắn

- **Không mở** link hoặc file đính kèm từ email lạ (phishing).
- Nếu nghi ngờ email lừa đảo: **forward nguyên email** tới security@company.vn, **không click** bất kỳ link nào.
- Không gửi thông tin nhạy cảm (mật khẩu, API key, dữ liệu khách hàng) qua email hoặc Slack.
- Sử dụng Google Drive (có quyền truy cập) để chia sẻ tài liệu nội bộ, **không dùng** Google Drive cá nhân.

## Phần mềm

- Chỉ cài phần mềm **có bản quyền** hoặc **open-source** đã được IT phê duyệt.
- Danh sách phần mềm được phê duyệt: xem trên Confluence (IT > Approved Software).
- Cần phần mềm mới: gửi yêu cầu qua IT ticket.

## Sự cố bảo mật — Báo cáo ngay

Nếu phát hiện hoặc nghi ngờ sự cố bảo mật:

1. **Ngay lập tức**: Báo cho Manager + gửi email tới security@company.vn.
2. **Không tự ý** khắc phục nếu không chắc chắn — có thể làm mất chứng cứ.
3. IT Security phản hồi trong vòng **2 giờ** giờ hành chính.

### Ví dụ sự cố cần báo cáo
- Nhận email phishing hoặc link đáng ngờ.
- Phát hiện truy cập trái phép vào tài khoản.
- Mất laptop hoặc điện thoại có cài ứng dụng công ty.
- Vô tình chia sẻ thông tin nội bộ ra ngoài.

## Training bảo mật

- Toàn bộ nhân viên mới phải hoàn thành **Security Awareness Training** trong tuần đầu tiên.
- Training nhắc lại: **1 lần/năm** cho toàn bộ công ty.
- Phishing simulation: IT Security gửi email test **2 lần/năm** — nhân viên click vào sẽ được nhắc nhở.

## Liên hệ

IT Security: security@company.vn | Ext: 305
Phòng IT: it-support@company.vn | Ext: 300
