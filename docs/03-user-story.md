# User Stories

## Authentication & Profile (Xác thực & Cá nhân hóa)

### US-1: Đăng ký tài khoản
* **Là một** Khách truy cập (Guest),
* **Tôi muốn** đăng ký tài khoản bằng email, username và mật khẩu,
* **Để** tôi có thể tạo một tài khoản an toàn lưu trữ snaps và chi tiêu của mình.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Hệ thống kiểm tra tính duy nhất và định dạng hợp lệ của email.
  - [ ] Hệ thống kiểm tra tính duy nhất của username.
  - [ ] Yêu cầu độ phức tạp của mật khẩu (ví dụ: tối thiểu 6 ký tự).
  - [ ] Thực hiện hash mật khẩu bằng thuật toán an toàn trước khi lưu vào database.
  - [ ] Đăng nhập tự động hoặc trả về access/refresh token sau khi đăng ký thành công.

### US-2: Đăng nhập & Tự động gia hạn phiên
* **Là một** Người dùng đã đăng ký,
* **Tôi muốn** đăng nhập bằng email hoặc username cùng mật khẩu của mình,
* **Để** tôi có thể truy cập dữ liệu riêng tư của mình một cách bảo mật qua các phiên làm việc.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Trả về JWT access token (ngắn hạn) và refresh token (dài hạn) khi thông tin đăng nhập chính xác.
  - [ ] Tự động refresh access token mới dưới nền bằng refresh token khi access token cũ hết hạn.
  - [ ] Chặn truy cập và trả về mã lỗi thích hợp khi token không hợp lệ hoặc đã hết hạn.

---

## Camera & Daily Snap (Camera & Khoảnh khắc hàng ngày)

### US-3: Chụp ảnh Snap
* **Là một** Người dùng,
* **Tôi muốn** mở camera chụp ảnh và thêm mô tả ghi chú,
* **Để** tôi có thể ghi lại kỷ niệm trực quan của ngày hôm nay.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Yêu cầu quyền truy cập camera của thiết bị nếu chưa được cấp trước đó.
  - [ ] Hiển thị màn hình camera trực tiếp bên trong ứng dụng.
  - [ ] Lưu trữ file ảnh đã chụp an toàn và liên kết nó với người dùng hiện tại.
  - [ ] Cho phép người dùng nhập thêm một đoạn caption/ghi chú ngắn.

### US-4: Đính kèm chi tiêu vào Snap
* **Là một** Người dùng,
* **Tôi muốn** đính kèm thông tin chi tiêu trực tiếp khi đang tạo hoặc sửa snap,
* **Để** tôi lưu trữ trực quan những thứ tôi đã mua tại thời điểm chụp bức ảnh đó.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Trong giao diện tạo/sửa snap, có tùy chọn nhập số tiền và chọn danh mục chi tiêu.
  - [ ] Hệ thống liên kết tự động khoản chi này với snap tương ứng.
  - [ ] Chi tiêu được đính kèm sẽ hiển thị đè (overlay) hoặc ngay bên cạnh bức ảnh trên dòng thời gian.

---

## Daily Expense Tracking & Categories (Theo dõi chi tiêu & Danh mục)

### US-5: Quản lý chi tiêu thủ công (Thêm/Sửa/Xóa)
* **Là một** Người dùng,
* **Tôi muốn** tự tay ghi chép, chỉnh sửa hoặc xóa bỏ một khoản chi tiêu,
* **Để** đảm bảo nhật ký chi tiêu của tôi luôn đầy đủ và chính xác nhất.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Số tiền chi tiêu phải là số lớn hơn 0.
  - [ ] Phải chọn một danh mục chi tiêu hợp lệ từ hệ thống hoặc danh mục tự tạo.
  - [ ] Khi chỉnh sửa, cho phép cập nhật lại tất cả các trường (số tiền, danh mục, ghi chú, ngày).
  - [ ] Khi xóa một khoản chi, nó phải lập tức biến mất khỏi dòng thời gian và các biểu đồ thống kê.

### US-6: Tùy chỉnh danh mục chi tiêu
* **Là một** Người dùng,
* **Tôi muốn** thêm mới hoặc xóa bỏ các danh mục chi tiêu tự chọn của mình,
* **Để** tôi có thể phân loại dòng tiền theo thói quen cá nhân.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Không cho phép xóa các danh mục mặc định của hệ thống (Ăn uống, Di chuyển, Mua sắm, Giải trí, Học tập, Sức khỏe, Khác).
  - [ ] Tên danh mục tự tạo phải là duy nhất đối với mỗi người dùng.
  - [ ] Khi xóa danh mục tự tạo, hệ thống phải xử lý hợp lý các chi tiêu đang thuộc danh mục đó (ví dụ: chuyển sang danh mục "Khác" hoặc yêu cầu người dùng gán lại).

---

## Timeline & Statistics (Dòng thời gian & Thống kê)

### US-7: Dòng thời gian tài chính trực quan
* **Là một** Người dùng,
* **Tôi muốn** xem một bảng tin dòng thời gian chứa toàn bộ ảnh snap và chi tiêu sắp xếp theo ngày,
* **Để** tôi có thể dễ dàng cuộn xem lại cuộc sống và thói quen tiêu dùng của mình.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Các mục hiển thị theo thứ tự thời gian đảo ngược (mới nhất ở trên cùng).
  - [ ] Hiển thị rõ các snap ảnh cùng các khoản chi tiêu đi kèm.
  - [ ] Hỗ trợ bộ lọc nhanh theo phạm vi ngày, tìm kiếm bằng từ khóa ghi chú, hoặc lọc theo danh mục chi tiêu.

### US-8: Biểu đồ thống kê chi tiêu
* **Là một** Người dùng,
* **Tôi muốn** xem biểu đồ trực quan về tổng chi tiêu trong ngày, trong tháng và cơ cấu theo danh mục,
* **Để** tôi nắm rõ tình hình tài chính của bản thân.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Tính toán chính xác tổng chi tiêu ngày hiện tại.
  - [ ] Tính toán chính xác tổng chi tiêu tháng hiện tại.
  - [ ] Hiển thị biểu đồ phân bổ chi tiêu theo phần trăm/số tiền cho từng danh mục.
  - [ ] Hiển thị biểu đồ xu hướng chi tiêu theo thời gian gần đây (ví dụ: 7 ngày gần nhất hoặc theo các tuần trong tháng).

---

## Private Sharing (Chia sẻ riêng tư)

### US-9: Quản lý bạn bè trong nhóm riêng tư
* **Là một** Người dùng,
* **Tôi muốn** gửi, nhận và đồng ý lời mời kết bạn với người khác,
* **Để** xây dựng một vòng kết nối bạn bè riêng tư nhằm chia sẻ khoảnh khắc.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Tìm kiếm người dùng khác bằng username hoặc email.
  - [ ] Mối quan hệ bạn bè chỉ được xác lập sau khi người nhận đồng ý (hai chiều).
  - [ ] Cho phép người dùng hủy kết bạn bất cứ lúc nào họ muốn.

### US-10: Chia sẻ Snap & Thả emoji reaction
* **Là một** Người dùng,
* **Tôi muốn** lựa chọn chia sẻ các snap cụ thể cho bạn bè và thả biểu tượng cảm xúc vào snap của họ,
* **Để** tương tác vui vẻ và giữ liên lạc một cách riêng tư.
* **Tiêu chí nghiệm thu (Acceptance Criteria)**:
  - [ ] Cung cấp lựa chọn chế độ chia sẻ (ví dụ: "Riêng tư" hoặc "Bạn bè") khi tạo/sửa snap.
  - [ ] Các snap ở chế độ bạn bè sẽ tự động xuất hiện trên dòng thời gian của bạn bè họ.
  - [ ] Cho phép bạn bè thả các emoji tương tác nhanh (ví dụ: 👍, ❤️, 😂, 😮).
  - [ ] Các biểu tượng cảm xúc được cập nhật và hiển thị ngay trên snap.
