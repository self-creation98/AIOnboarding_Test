# Các Hệ thống Nội bộ của Chúng tôi

Ngoài các ứng dụng hướng tới khách hàng, như các phiên bản khác nhau của Basecamp, chúng tôi có một số hệ thống nội bộ giúp chúng tôi hỗ trợ, báo cáo và vận hành công ty. Chúng bao gồm:

## Queenbee

Queenbee là hệ thống hóa đơn, kế toán và định danh của chúng tôi. Tại đây, bạn có thể tra cứu bất kỳ tài khoản khách hàng nào, xem họ có được miễn phí hay không, hoàn tiền hóa đơn, hoặc thậm chí đăng nhập với tư cách khách hàng.

Đó là một quyền hạn rất lớn và chúng tôi rất nghiêm túc trong việc sử dụng nó. Chúng tôi chỉ đăng nhập với tư cách khách hàng sau khi đã được cấp quyền rõ ràng để làm như vậy, không bao giờ tự ý. Khách hàng của chúng tôi mong đợi thông tin của họ được bảo mật, ngay cả với chúng tôi, và chúng tôi luôn có ý định tôn trọng kỳ vọng đó.

[billing.37signals.com 🔒](https://billing.37signals.com)

## Sentry

Chúng tôi theo dõi các ngoại lệ lập trình trên Sentry. Khi một khách hàng gặp màn hình “Oops, something went wrong!”, điều đó có nghĩa là sẽ có một mục nhập trong Sentry giải thích cho các lập trình viên lý do họ thấy màn hình đó. Việc kiểm soát và giám sát các ngoại lệ chủ yếu là trách nhiệm của SIP và Jim thông qua chế độ trực ban.

[getsentry.com](https://getsentry.com)

## Grafana

Chúng tôi giám sát các hệ thống và tình trạng của chúng thông qua Grafana. Tại đây, bạn sẽ tìm thấy các bảng điều khiển (dashboards) và quy tắc cảnh báo. Đây là công cụ chính của chúng tôi để chẩn đoán các vấn đề về hiệu suất, sự cố ngừng hoạt động và bất kỳ hình thức thông tin chi tiết vận hành nào khác.

[grafana.37signals.com 🔒](https://grafana.37signals.com/)

## Dash

Dash là trung tâm chính cho mọi thứ liên quan đến ghi nhật ký (logging) (như tìm hiểu lý do một yêu cầu chậm hoặc liệu một email đã được gửi hay chưa), báo cáo (từ số lượng trường hợp hỗ trợ đã xử lý đến tỷ lệ thiết bị được sử dụng để truy cập Basecamp), tình trạng ứng dụng (thời gian phản hồi, ngoại lệ hàng đợi công việc, v.v.).

[dash.37signals.com 🔒](https://dash.37signals.com)

## Omarchy

[Omarchy](https://omarchy.org) là bản phân phối Linux mới của chúng tôi mà tất cả mọi người trong nhóm Ops, SIP và các lập trình viên Ruby trong nhóm Product đang chuyển sang sử dụng. Chúng tôi đã phát triển nó nội bộ và tiếp tục dẫn đầu quá trình phát triển.

## Kandji

[Kandji](https://kandji.io) là cách chúng tôi đảm bảo tất cả các máy tính xách tay Mac làm việc được cấu hình an toàn và chạy các bản cập nhật phần mềm mới nhất. Nó giúp chúng tôi giảm thiểu rủi ro trước các sự cố bảo mật. Bạn có thể đọc thêm về điều này trong [Quản lý thiết bị làm việc](https://github.com/basecamp/handbook/blob/master/managing-work-devices.md).

## Shipshape

Shipshape là công cụ nội bộ OG để đảm bảo máy tính xách tay Mac làm việc của bạn an toàn và bảo mật. Chúng tôi vẫn đang sử dụng nó, nhưng nó đang dần được thay thế bởi Kandji. Khi bạn được cấp quyền truy cập vào tài khoản GitHub của công ty, bạn có thể chạy Shipshape để đảm bảo bạn tuân thủ các quy tắc. Shipshape cũng sẽ kiểm tra máy của bạn định kỳ để cho bạn biết (và nhóm SIP của chúng tôi biết) nếu máy của bạn gặp sự cố và cần được khắc phục.

[github.com/basecamp/shipshape 🔒](https://github.com/basecamp/shipshape)