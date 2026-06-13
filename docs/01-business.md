# Bối cảnh nghiệp vụ (Business Context)

## Lĩnh vực nghiệp vụ (Business Domain)
Quản lý tài chính cá nhân trực quan kết hợp nhật ký chia sẻ nhóm riêng tư.

## Đối tượng người dùng (Target Users)
* Học sinh, sinh viên
* Người trẻ tuổi
* Người mới bắt đầu quản lý tài chính cá nhân
* Những người muốn theo dõi chi tiêu hàng ngày một cách trực quan bằng hình ảnh
* Các nhóm bạn thân hoặc cặp đôi muốn chia sẻ khoảnh khắc hàng ngày một cách riêng tư

## Vai trò người dùng (User Roles)

### Khách (Guest)
* Xem hướng dẫn sử dụng ban đầu (onboarding)
* Đăng ký tài khoản (Register)
* Đăng nhập (Login)

### Người dùng (User)
* Chụp ảnh bằng camera trong app (Take snaps)
* Thêm ghi chú hàng ngày (Add daily notes)
* Ghi chép chi tiêu (Add/edit/delete expense records)
* Xem dòng thời gian hàng ngày (Daily timeline)
* Xem thống kê chi tiêu (Spending statistics)
* Quản lý danh mục chi tiêu (Manage categories)
* Quản lý thông tin cá nhân (Manage profile)
* Kết bạn hoặc quản lý thành viên nhóm riêng tư (Manage friends)

### Quản trị viên (Admin)
* Quản lý người dùng (Manage users)
* Quản lý nội dung bị báo cáo (nếu có tính năng chia sẻ cộng đồng)
* Quản lý các mẫu danh mục chi tiêu mặc định
* Xem thống kê hệ thống cơ bản

## Luồng nghiệp vụ chính (Business Workflows)

### 1. Luồng Daily Snap
1. Người dùng mở ứng dụng.
2. Người dùng nhấn nút camera.
3. Người dùng chụp ảnh.
4. Người dùng thêm ghi chú hoặc mô tả cho ảnh.
5. Người dùng tùy chọn thêm thông tin chi tiêu (số tiền, danh mục).
6. Hệ thống lưu snap vào dòng thời gian (timeline) hàng ngày.
7. Người dùng có thể xem lại snap trong lịch hoặc timeline.
8. Nếu chia sẻ được bật, bạn bè được chọn có thể xem và thả emoji reaction.

### 2. Luồng Ghi nhận chi tiêu (Expense Workflow)
1. Người dùng mở màn hình chi tiêu.
2. Người dùng nhập số tiền, danh mục, ngày và ghi chú.
3. Người dùng có thể tùy chọn đính kèm ảnh (hoặc đính kèm chi tiêu này vào một snap).
4. Hệ thống thực hiện validation số tiền và danh mục.
5. Hệ thống lưu thông tin chi tiêu.
6. Người dùng xem thống kê chi tiêu hàng ngày và hàng tháng.

### 3. Luồng kết bạn và chia sẻ (Friend Sharing Workflow)
1. Người dùng tìm kiếm hoặc mời bạn bè bằng username hoặc email.
2. Bạn bè chấp nhận yêu cầu kết bạn.
3. Người dùng có thể chia sẻ các snap được chọn với bạn bè đó.
4. Bạn bè có thể xem và thả emoji reaction.
5. Người dùng có thể hủy kết bạn hoặc thay đổi cài đặt riêng tư bất cứ lúc nào.

## Quy tắc nghiệp vụ (Business Rules)
* **Tính hợp lệ của chi tiêu**: Số tiền chi tiêu phải lớn hơn 0.
* **Danh mục hợp lệ**: Mỗi khoản chi tiêu phải thuộc về một danh mục hợp lệ.
* **Quyền sở hữu**:
  - Mỗi khoản chi tiêu phải thuộc về duy nhất một người dùng.
  - Mỗi ảnh chụp (snap) phải thuộc về duy nhất một người dùng.
  - Người dùng chỉ được sửa hoặc xóa snap và chi tiêu do chính họ tạo ra.
* **Liên kết**: Một snap có thể đính kèm một hoặc nhiều khoản chi tiêu.
* **Bảo mật dữ liệu riêng tư**:
  - Snap riêng tư chỉ hiển thị với chủ sở hữu.
  - Snap chia sẻ chỉ hiển thị với những bạn bè được chọn và đã được phê duyệt kết bạn.
  - Người dùng không được phép xem dữ liệu riêng tư của người dùng khác (snap, chi tiêu, danh mục tự tạo, thông tin profile chi tiết).
* **Thống kê**: Thống kê tháng và ngày chỉ được tính toán từ các khoản chi tiêu chưa bị xóa của chính người dùng hiện tại đang đăng nhập.
* **Bảo mật hệ thống**:
  - Các route API nhạy cảm bắt buộc phải yêu cầu Authentication bằng JWT.
  - Mật khẩu người dùng phải được hash bảo mật trước khi lưu (ví dụ dùng bcrypt).
  - Ảnh tải lên phải được lưu trữ an toàn.
* **Validation**: API phải validate tất cả dữ liệu đầu vào.
* **Nền tảng**: Ứng dụng phải hoạt động mượt mà trên cả iOS và Android.
