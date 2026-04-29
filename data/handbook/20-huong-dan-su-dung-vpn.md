# Hướng dẫn sử dụng VPN

> Tài liệu nội bộ Company. Cập nhật: 04/2026.

## Khi nào cần dùng VPN?

VPN **bắt buộc** khi truy cập hệ thống nội bộ từ bên ngoài văn phòng:

- Làm việc tại nhà (WFH)
- Đi công tác
- Làm việc tại quán cà phê, co-working space
- Truy cập server staging/production
- Kết nối database nội bộ

**Trong văn phòng**: Không cần VPN (mạng nội bộ đã an toàn).

## Cài đặt VPN

Company sử dụng **WireGuard VPN**. File cấu hình được IT gửi qua email trong ngày đầu tiên.

### macOS

1. Tải WireGuard từ App Store.
2. Mở app → Import Tunnels → chọn file `.conf` IT đã gửi.
3. Bật toggle để kết nối.

### Windows

1. Tải WireGuard từ [wireguard.com/install](https://www.wireguard.com/install/).
2. Mở app → Import tunnel(s) from file → chọn file `.conf`.
3. Click **Activate** để kết nối.

### Linux

```bash
sudo apt install wireguard
sudo cp company-vpn.conf /etc/wireguard/
sudo wg-quick up company-vpn
```

### Điện thoại (iOS / Android)

1. Tải WireGuard từ App Store / Google Play.
2. Scan QR code IT cung cấp (hoặc import file .conf).
3. Bật toggle để kết nối.

## Kiểm tra kết nối

Sau khi bật VPN, mở trình duyệt và truy cập:

```
https://internal.company.vn/health
```

Nếu hiện **"OK"** → VPN đã hoạt động.

Nếu không truy cập được → xem mục **Xử lý sự cố** bên dưới.

## Xử lý sự cố thường gặp

| Lỗi | Nguyên nhân | Giải pháp |
|---|---|---|
| Không kết nối được VPN | File config hết hạn | Liên hệ IT để cấp lại config |
| VPN kết nối nhưng không vào được hệ thống | DNS chưa resolve | Thử tắt/bật lại VPN, hoặc đổi DNS sang 8.8.8.8 |
| Tốc độ rất chậm khi bật VPN | Mạng internet yếu | Kiểm tra tốc độ mạng gốc, thử đổi WiFi |
| Bị ngắt kết nối liên tục | Router chặn UDP port 51820 | Đổi sang mạng khác, hoặc báo IT để dùng TCP fallback |

## Lưu ý bảo mật

- **Không chia sẻ** file config VPN cho bất kỳ ai.
- Mỗi nhân viên có config riêng — nếu lộ, IT sẽ thu hồi và cấp lại.
- Luôn **tắt VPN** khi không sử dụng (tiết kiệm bandwidth server).
- Khi nghỉ việc: VPN config tự động bị vô hiệu hóa trong ngày cuối cùng.

## Liên hệ

Phòng IT: it-support@company.vn | Ext: 300
Slack: #it-support
