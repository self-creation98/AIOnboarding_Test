# Quản lý thiết bị làm việc

Mọi người đều nhận được một chiếc Mac mới [khi gia nhập 37signals](https://github.com/basecamp/handbook/blob/f094e5f8b778515d363d84c9ae139cc006b66f3b/getting-started.md#your-first-few-days). Chúng tôi quản lý và bảo mật tập trung các thiết bị này bằng [Kandji](https://kandji.io/), giúp giảm thiểu rủi ro về các sự cố bảo mật. Kandji áp dụng cấu hình tiêu chuẩn cho mọi thiết bị (ví dụ: bật mã hóa ổ đĩa, tường lửa, quy tắc mật khẩu), cài đặt các ứng dụng thiết yếu (ví dụ: EncryptMe) và đảm bảo các ứng dụng có các bản cập nhật bảo mật mới nhất. Kandji cũng cho phép chúng tôi xóa dữ liệu từ xa trên các thiết bị nếu chúng bị mất hoặc khi một nhân viên rời công ty.

Chúng tôi chủ yếu sử dụng macOS và Linux tại 37signals để phát triển và hỗ trợ các ứng dụng của mình.

Đối với macOS, chúng tôi quản lý và bảo mật tập trung các thiết bị này bằng [Kandji](https://kandji.io/). Kandji áp dụng cấu hình tiêu chuẩn cho mọi thiết bị (ví dụ: bật mã hóa ổ đĩa, tường lửa, quy tắc mật khẩu), cài đặt các ứng dụng thiết yếu và đảm bảo các ứng dụng có các bản cập nhật bảo mật mới nhất. Kandji cũng cho phép chúng tôi xóa dữ liệu từ xa trên các thiết bị nếu chúng bị mất hoặc khi một nhân viên rời công ty. (Điều này không có nghĩa là bạn đang bị giám sát hoặc theo dõi! Kandji là một hệ thống quản lý cấu hình, không phải một công cụ giám sát toàn diện.)

Đối với Linux, chúng tôi sử dụng [Omarchy](https://omarchy.org), vốn đã đi kèm với cấu hình tiêu chuẩn cần thiết (mã hóa toàn bộ ổ đĩa, tường lửa, v.v.). Ở đây, chúng tôi dựa vào 1password để cung cấp quyền truy cập thông tin đăng nhập cho nhân viên khi gia nhập/rời công ty và Tailscale VPN của chúng tôi để kiểm soát quyền truy cập vào các hệ thống nội bộ. Chúng tôi không sử dụng quy trình quản lý như Kandji.

## Quyền truy cập mã nguồn và thông tin mật

Việc biết rằng các thiết bị của chúng tôi an toàn và bảo mật cho phép chúng tôi tin tưởng giao phó máy tính làm việc của mình quyền truy cập vào các hệ thống nhạy cảm như Queenbee, cũng như VPN nội bộ và các máy chủ từ xa của chúng tôi. Điều này có nghĩa là việc cài đặt VPN, kiểm tra mã nguồn 37signals và lưu trữ thông tin mật chỉ được thực hiện trên thiết bị làm việc, không phải trên thiết bị cá nhân.

Vui lòng không lưu trữ bất kỳ dữ liệu cá nhân nào trên máy tính do 37signals cấp. Bạn nên duy trì một máy tính cá nhân riêng biệt nếu bạn cần một máy tính tại nhà. Công ty có quyền, và có thể được yêu cầu, thu giữ máy tính hoặc dữ liệu của bạn vào bất kỳ thời điểm nào để phản hồi các trát đòi hầu tòa, vụ kiện hoặc sự cố bảo mật.

## Thiết bị di động và Windows

Các thiết bị chạy Android, iOS/iPadOS và Windows hiện không được quản lý. Bạn có thể cài đặt các ứng dụng BC4 và HEY của chúng tôi trên các thiết bị này để truy cập các dự án công việc và email, nhưng vì chúng không được quản lý – và do đó ‘không đáng tin cậy’ – nên không được phép lưu trữ mã nguồn hoặc thông tin mật của 37signals trên chúng. Nếu bạn đang viết mã hoặc truy cập các hệ thống bảo mật, bạn nên thực hiện điều đó trên một chiếc Mac được quản lý bởi Kandji hoặc một máy Linux chạy Omarchy.

## Câu hỏi thường gặp

Có nhiều câu hỏi phát sinh từ các chính sách IT như thế này, vì vậy chúng tôi đã viết [một mục Câu hỏi thường gặp trong BC4](https://3.basecamp.com/2914079/buckets/31986799/documents/6044843594) để giúp trả lời chúng.