# Yêu cầu hệ thống (Requirements)

## Yêu cầu chức năng (Functional Requirements)

### 1. Quản lý tài khoản & Authentication
* **FR-1.1**: Khách hàng (Guest) phải có thể đăng ký tài khoản mới bằng email, username và mật khẩu.
* **FR-1.2**: Người dùng phải có thể đăng nhập để nhận access token (JWT) và refresh token.
* **FR-1.3**: Người dùng phải có thể đăng xuất để hủy phiên làm việc hiện tại.
* **FR-1.4**: Người dùng phải có thể cập nhật thông tin cá nhân (tên hiển thị, ảnh đại diện - avatar).

### 2. Chụp ảnh & Tạo Snap hàng ngày
* **FR-2.1**: Ứng dụng phải tích hợp và mở camera của thiết bị trực tiếp bên trong giao diện ứng dụng.
* **FR-2.2**: Người dùng phải có thể chụp ảnh từ camera.
* **FR-2.3**: Người dùng phải có thể thêm ghi chú/mô tả ngắn vào ảnh đã chụp.
* **FR-2.4**: Người dùng phải có thể đính kèm một hoặc nhiều khoản chi tiêu vào snap ảnh đó.
* **FR-2.5**: Hệ thống phải lưu snap vào dòng thời gian (timeline) hàng ngày của người dùng.

### 3. Theo dõi chi tiêu hàng ngày
* **FR-3.1**: Người dùng phải có thể tạo một khoản chi tiêu thủ công bằng cách nhập số tiền, danh mục, ngày chi tiêu và ghi chú.
* **FR-3.2**: Người dùng phải có thể tùy chọn đính kèm ảnh chụp vào khoản chi tiêu tạo thủ công.
* **FR-3.3**: Người dùng phải có thể cập nhật (sửa) các khoản chi tiêu hiện có.
* **FR-3.4**: Người dùng phải có thể xóa các khoản chi tiêu (các khoản chi bị xóa không được tính vào thống kê).

### 4. Quản lý danh mục chi tiêu
* **FR-4.1**: Hệ thống phải cung cấp các danh mục chi tiêu mặc định bao gồm: Ăn uống (Food), Di chuyển (Transport), Mua sắm (Shopping), Giải trí (Entertainment), Học tập (Study), Sức khỏe (Health), và Khác (Other).
* **FR-4.2**: Người dùng phải có thể tạo các danh mục chi tiêu tùy chỉnh của riêng mình.
* **FR-4.3**: Người dùng phải có thể liệt kê và xóa các danh mục tự tạo.

### 5. Dòng thời gian / Nhật ký trực quan (Timeline Feed)
* **FR-5.1**: Người dùng phải có thể xem dòng thời gian (timeline) hiển thị trực quan các snap ảnh và chi tiêu theo thứ tự thời gian.
* **FR-5.2**: Timeline phải hiển thị rõ ảnh chụp, mô tả đi kèm và các khoản chi tiêu được đính kèm với ảnh đó.
* **FR-5.3**: Người dùng phải có thể lọc dòng thời gian theo phạm vi ngày.
* **FR-5.4**: Người dùng phải có thể tìm kiếm các bài đăng trên dòng thời gian bằng từ khóa trong ghi chú hoặc theo tên danh mục chi tiêu.

### 6. Thống kê chi tiêu (Statistics)
* **FR-6.1**: Ứng dụng phải hiển thị tổng số tiền đã chi tiêu trong ngày hiện tại và tháng hiện tại.
* **FR-6.2**: Ứng dụng phải hiển thị tỷ lệ phần trăm và tổng tiền chi tiêu theo từng danh mục dưới dạng biểu đồ (ví dụ: biểu đồ tròn hoặc thanh tiến trình).
* **FR-6.3**: Ứng dụng phải hiển thị biểu đồ xu hướng chi tiêu gần đây (ví dụ: biểu đồ đường/cột thể hiện tổng chi tiêu hàng ngày trong tuần/tháng qua).
* **FR-6.4**: Ứng dụng phải làm nổi bật các danh mục chi tiêu nhiều nhất.

### 7. Chia sẻ riêng tư & Kết bạn
* **FR-7.1**: Người dùng phải có thể tìm kiếm người dùng khác bằng username hoặc email và gửi lời mời kết bạn.
* **FR-7.2**: Người dùng phải có thể xem danh sách lời mời kết bạn đã nhận, và lựa chọn chấp nhận hoặc từ chối.
* **FR-7.3**: Khi tạo snap, người dùng phải có thể chọn chia sẻ snap đó với bạn bè hoặc giữ ở chế độ riêng tư.
* **FR-7.4**: Bạn bè được chia sẻ phải có thể xem snap trên feed của họ và thả các emoji reaction (ví dụ: 👍, ❤️, 😂, 😮).
* **FR-7.5**: Người dùng phải có thể quản lý danh sách bạn bè (ví dụ: hủy kết bạn).

---

## Yêu cầu phi chức năng (Non-Functional Requirements)

### 1. Hiệu năng (Performance)
* **NFR-1.1**: Ứng dụng di động phải tải nhanh dữ liệu timeline đã lưu trong bộ nhớ tạm (cache) và đồng bộ dữ liệu mới từ server dưới nền.
* **NFR-1.2**: Các hình ảnh chụp phải được nén và tối ưu hóa dung lượng trước khi tải lên để tiết kiệm băng thông di động của người dùng.
* **NFR-1.3**: Thời gian phản hồi của API khi lấy dữ liệu thống kê và timeline phải dưới 300ms trong điều kiện mạng bình thường.

### 2. Bảo mật & Quyền riêng tư (Security & Privacy)
* **NFR-2.1**: Tất cả các API endpoint nhạy cảm phải được bảo vệ bằng cơ chế xác thực JWT (Authentication).
* **NFR-2.2**: Mật khẩu lưu trong database phải được mã hóa một chiều bằng thuật toán băm an toàn (ví dụ: bcrypt).
* **NFR-2.3**: Hình ảnh tải lên phải được lưu trữ và phân quyền truy cập an toàn (sử dụng thư mục server riêng biệt hoặc lưu trên cloud như AWS S3/Cloudinary với cơ chế ký URL hoặc giới hạn truy cập trực tiếp).
* **NFR-2.4**: Hệ thống phải thực thi Authorization chặt chẽ, đảm bảo người dùng chỉ được phép truy xuất, sửa hoặc xóa dữ liệu thuộc sở hữu của chính họ.

### 3. Độ tin cậy & Khả năng bảo trì (Reliability & Maintainability)
* **NFR-3.1**: Cấu trúc database phải được quản lý và cập nhật thông qua các file migration có phiên bản (Sequelize migrations).
* **NFR-3.2**: Các logic xử lý backend quan trọng phải có Unit Test và Integration Test bao phủ (sử dụng Jest/Supertest).
* **NFR-3.3**: Hệ thống API backend phải thực hiện validate tất cả dữ liệu đầu vào và trả về lỗi có cấu trúc rõ ràng khi validate thất bại.

### 4. Khả năng tương thích & Giao diện (Usability & Compatibility)
* **NFR-4.1**: Ứng dụng di động phải hoạt động ổn định trên cả iOS (v14+) và Android (v8+) thông qua Expo.
* **NFR-4.2**: Giao diện ứng dụng phải được thiết kế cao cấp, hiện đại, hỗ trợ giao diện sáng/tối đồng nhất, font chữ tùy chỉnh đẹp mắt và bố cục co giãn mượt mà.
