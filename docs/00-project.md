# Tổng quan dự án: DailySnap Expense

## Tên dự án
DailySnap Expense

## Mục tiêu dự án
Xây dựng một ứng dụng di động riêng tư lấy cảm hứng từ phong cách chia sẻ ảnh nhanh của Locket, kết hợp với theo dõi chi tiêu hàng ngày.
Ứng dụng cho phép người dùng nhanh chóng ghi lại các khoảnh khắc hàng ngày bằng camera, viết ghi chú, ghi lại chi tiêu, phân loại chi tiêu và xem lại cuộc sống hàng ngày của họ thông qua một nhật ký tài chính bằng hình ảnh.
Mục tiêu là giúp người dùng nhớ lại họ đã làm gì, chi tiền vào việc gì và thói quen chi tiêu của họ thay đổi như thế nào theo thời gian.

## Phạm vi dự án (MVP)
Phiên bản MVP đầu tiên phải bao gồm:
* **Ứng dụng di động**: Ứng dụng chạy trên cả iOS và Android sử dụng React Native Expo.
* **Authentication**: Đăng ký, Đăng nhập, Đăng xuất, Authentication bằng JWT với cơ chế refresh token.
* **Camera & Daily Snap**: Mở camera trong ứng dụng, chụp ảnh, thêm mô tả/ghi chú, lưu ảnh vào timeline hàng ngày, đính kèm thông tin chi tiêu vào ảnh, xem lịch sử ảnh theo ngày.
* **Daily Expense Tracking**: Thêm/sửa/xóa chi tiêu thủ công với số tiền, danh mục, ngày, ghi chú và tùy chọn đính kèm ảnh.
* **Danh mục chi tiêu**: Ăn uống (Food), Di chuyển (Transport), Mua sắm (Shopping), Giải trí (Entertainment), Học tập (Study), Sức khỏe (Health), Khác (Other) và người dùng có thể tự tạo danh mục tùy chỉnh.
* **Timeline / Journal (Nhật ký)**: Xem ảnh ghi chú hàng ngày, xem chi tiêu đính kèm theo từng ngày, lọc theo ngày và tìm kiếm theo ghi chú hoặc danh mục.
* **Thống kê (Statistics)**: Tổng chi tiêu hàng ngày, tổng chi tiêu hàng tháng, chi tiêu theo danh mục, xu hướng chi tiêu gần đây, các danh mục chi tiêu nhiều nhất.
* **Chia sẻ riêng tư (Private Sharing)**: Người dùng có thể kết bạn, chia sẻ snap hàng ngày riêng tư với bạn bè được chọn, bạn bè có thể thả emoji reaction.
* **Backend API**: API Contract rõ ràng, thiết kế theo kiến trúc sạch sẽ với cơ chế validate đầu vào.
* **Database**: Thiết kế cơ sở dữ liệu quan hệ cho user, snap, expense, category và bạn bè.
* **Testing**: Viết Unit Test và Integration Test cho các Service và API quan trọng phía backend.

## Ngoài phạm vi (Out of Scope) cho MVP
* Clone hoàn chỉnh widget Locket (hiển thị widget trực tiếp trên màn hình chính của điện thoại)
* Phát hành chính thức lên App Store / Play Store
* Tích hợp cổng thanh toán thực tế
* Kết nối tài khoản ngân hàng
* Tự động phát hiện chi tiêu bằng AI
* Quét hóa đơn bằng OCR
* Các tính năng mạng xã hội phức tạp (như bảng tin công khai - Public feed)
* Hệ thống chat nâng cao
* Hệ thống thông báo đẩy (push notification) phức tạp
* Hỗ trợ đa ngôn ngữ (chỉ tập trung vào một ngôn ngữ chính)

## Hạn định (Deadline)
Dự án được thực hiện để xây dựng một MVP hoàn chỉnh, phục vụ cho việc demo, thử nghiệm và thuyết trình.
