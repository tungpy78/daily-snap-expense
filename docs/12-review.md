# Nhật ký Review & Đánh giá Dự án (Project Reviews)

## 1. Mục đích File Review
Tài liệu này được sử dụng để ghi lại:
* **Nhật ký review kỹ thuật**: Theo dõi chi tiết các đợt review sau khi hoàn thành mỗi task.
* **Quyết định kiến trúc**: Lưu trữ các quyết định thiết kế quan trọng và lý do lựa chọn.
* **Vấn đề phát hiện**: Các bug, lỗ hổng bảo mật hoặc lỗi logic được phát hiện trong quá trình phát triển.
* **Technical Debt (Nợ kỹ thuật)**: Ghi lại các phần code cần refactor hoặc tối ưu hóa sau.
* **Rủi ro cần theo dõi**: Các yếu tố có thể ảnh hưởng đến tiến độ, hiệu năng hoặc bảo mật của hệ thống.
* **Kết quả đánh giá sau mỗi task**: Đảm bảo chất lượng trước khi gộp code hoặc chuyển sang task tiếp theo.

---

## 2. Đánh giá trước khi viết Code (Pre-code Review)
Hiện trạng dự án trước khi bắt đầu viết những dòng code đầu tiên:
* [x] **Tài liệu nghiệp vụ**: Đã hoàn thành, làm rõ các luồng công việc chính và quy tắc nghiệp vụ.
* [x] **Kiến trúc hệ thống**: Đã hoàn thành thiết kế Client-Server, luồng JWT, nén ảnh và cơ chế Storage Service.
* [x] **Thiết kế database**: Đã hoàn thành thiết kế chi tiết 6 bảng chính, các mối quan hệ, index và quy tắc soft delete.
* [x] **API Contract**: Đã định nghĩa đầy đủ các nhóm API chính kèm theo request/response mẫu và mã lỗi chuẩn.
* [x] **UI Design**: Đã phác thảo cấu trúc điều hướng, các màn hình di động chính và luồng giao diện nghiệp vụ.
* [x] **Coding Rules**: Đã thiết lập các quy tắc viết Clean Code, SOLID, quy ước đặt tên và yêu cầu viết test.
* [x] **Task Breakdown**: Đã chia nhỏ kế hoạch công việc thành 17 Milestones với mã task rõ ràng.

---

## 3. Quyết định Kỹ thuật đã chốt (Technical Decisions)

### Kiến trúc (Architecture)
* **Mô hình tổng thể**: Sử dụng kiến trúc Client - Server.
* **Mobile App**: Xây dựng bằng React Native Expo.
* **Backend API**: Sử dụng Node.js Express.js với TypeScript.
* **Backend Layered Architecture**: Tổ chức phân tầng rõ ràng gồm: `Route` $\rightarrow$ `Middleware` $\rightarrow$ `Controller` $\rightarrow$ `Service` $\rightarrow$ `Repository/Model`.

### Xác thực & Validation
* **Thư viện validate**: Sử dụng **Zod** ở cả Mobile và Backend.
* **Cơ chế Backend**: Validate dữ liệu được xử lý tập trung bằng **Validation Middleware** gắn tại Route.
* **Controller**: Chỉ tiếp nhận dữ liệu đã được validate hợp lệ chuyển sang từ middleware, sau đó gọi Service xử lý. Controller không tự viết logic validate thủ công để tránh trùng lặp code.

### Liên kết Khoảnh khắc & Chi tiêu (Snap - Expense Linkage)
* **Tạo Snap kèm chi tiêu**: Cho phép gửi đồng thời ảnh snap và danh sách chi tiêu trong API `POST /api/v1/snaps`.
* **Database Transaction**: Backend bắt buộc phải quản lý bằng Sequelize Transaction khi lưu snap kèm expenses. Nếu ghi đính kèm chi tiêu gặp lỗi, toàn bộ snap và hình ảnh liên kết phải được rollback hoàn toàn.

### Xóa mềm (Soft Delete)
* **Bảng áp dụng**: Cả `expenses` và `snaps` đều sử dụng cơ chế Soft Delete thông qua cột `deleted_at`.
* **Luồng xử lý xóa snap**: Khi xóa snap, **không** tự động xóa hoặc ẩn các expense đính kèm.
* **Hiển thị**: Timeline và Friend Feed loại bỏ các snap đã bị soft delete. Tuy nhiên, các khoản chi tiêu liên quan vẫn xuất hiện trong danh sách chi tiêu thủ công và được tính vào thống kê tài chính bình thường, ngoại trừ trường hợp chính expense đó bị xóa. Trên UI, nếu một expense có liên kết tới snap bị xóa mềm, hệ thống hiển thị nhãn thay thế *"Ảnh nhật ký đã bị xóa"* để tránh lỗi crash app.

### Lưu trữ hình ảnh (Image Storage)
* **Môi trường MVP**: Lưu trữ file ảnh cục bộ (Local Storage) trong thư mục tĩnh của backend server.
* **Trừu tượng hóa**: Thiết kế thông qua lớp trừu tượng `StorageService` sử dụng `LocalStorageProvider`. Trong tương lai có thể dễ dàng cắm cấu hình `CloudinaryProvider` hoặc `S3Provider` mà không làm thay đổi logic của `SnapService`.
* **Database**: Chỉ lưu trữ đường dẫn ảnh (`image_url`), tuyệt đối không lưu dữ liệu nhị phân (binary image) trong database.

### Cấu trúc thư mục di động (Mobile Folder Structure)
* **Mô hình**: Áp dụng **Feature-based Folder Structure**.
* **Phân chia**: Gom các thư mục con (components, hooks, screens, store) thuộc cùng một nhóm nghiệp vụ vào các thư mục tính năng lớn (như `features/auth`, `features/expenses`, `features/camera`, `features/timeline`, `features/statistics`, `features/social`).

---

## 4. Các Rủi ro & Điểm cần theo dõi (Open Risks / Things to Monitor)
* **Chuyển đổi Image Storage**: Việc lưu ảnh local phù hợp cho MVP nhưng cần cấu hình đường dẫn tuyệt đối chuẩn xác để khi chuyển sang AWS S3/Cloudinary không phải thay đổi cấu trúc bảng hay xử lý chuỗi phức tạp.
* **Giới hạn kích thước File**: API upload ảnh cần cấu hình giới hạn kích thước file nhận vào qua Multer để tránh nguy cơ tấn công từ chối dịch vụ (DoS) bằng file ảnh siêu lớn.
* **Tính toàn vẹn của Transaction**: Kiểm thử kỹ lưỡng luồng rollback của Sequelize Transaction khi tạo Snap kèm Expense để đảm bảo không bị rò rỉ hoặc mồ côi dữ liệu khi lỗi kết nối giữa chừng.
* **Bảo mật quyền riêng tư (Privacy & Authorization)**: Đảm bảo kiểm tra nghiêm ngặt `userId` trong token JWT và quyền kết bạn `ACCEPTED` đối với các API lấy Friend Feed (`/api/v1/friends/feed`) hoặc thả reaction để tránh lộ dữ liệu cá nhân của người dùng khác.
* **Quyền sửa xóa tài nguyên**: Tất cả API cập nhật hoặc xóa (PUT/DELETE) của snap và expense phải được xác minh quyền sở hữu (`userId` khớp) ở tầng Service/Controller.
* **Hiệu năng khi dữ liệu lớn**: Dòng thời gian Timeline và biểu đồ thống kê tài chính cần được tối ưu truy vấn SQL (sử dụng Index hợp lý trên các cột `user_id`, `date`, `deleted_at`) và bắt buộc áp dụng phân trang (Pagination) từ đầu.

---

## 5. Mẫu Review sau mỗi Task (Review Template for Each Task)

### Task Review Template
Sao chép mẫu dưới đây để tạo một mục review mới trong phần "Reviews" sau khi hoàn thành bất kỳ task nào:

```markdown
## Review: [Task ID] - [Task Name]

### Date
YYYY-MM-DD

### Summary
Mô tả ngắn task đã làm.

### Files Changed
- ...

### What Went Well
- ...

### Issues Found
- ...

### Security Review
- Authentication:
- Authorization:
- Data validation:
- Sensitive data:

### Performance Review
- Query:
- Pagination:
- File handling:

### Test Review
- Unit tests:
- Integration tests:
- Negative tests:

### Documentation Updated
- Yes/No
- Files:

### Decision
- Approved / Need changes

### Notes
- ...
```

---

## 6. Nhật ký Review Chi tiết (Detailed Task Reviews)

## Review: T-1.1 - Khởi tạo repository Git và file .gitignore

### Date
2026-06-14

### Summary
Đã cấu hình file `.gitignore` cho dự án tích hợp Node.js Express TypeScript (backend) và React Native Expo (mobile).

### Files Changed
- `.gitignore` (Tạo mới)

### What Went Well
- Khởi tạo thành công file `.gitignore` đầy đủ và chuẩn hóa, chặn triệt để các tệp nhạy cảm (secrets, `.env`), dependencies (`node_modules`), logs, build outputs (`dist`, `.expo`) và local uploads (`public/uploads`).
- `.env.example` được giữ lại để cho phép commit bình thường làm mẫu.

### Issues Found
- Ban đầu gặp lỗi môi trường sandbox không tìm thấy `powershell` trong %PATH% của runner. Tuy nhiên, rủi ro này đã được giải quyết triệt để sau khi người dùng thực hiện chạy thủ công thành công lệnh `git init` trên máy.

### Security Review
- Authentication: N/A
- Authorization: N/A
- Data validation: N/A
- Sensitive data: Đảm bảo an toàn tuyệt đối cho dữ liệu nhạy cảm bằng cách loại trừ toàn bộ file `.env*` và secrets.

### Performance Review
- Query: N/A
- Pagination: N/A
- File handling: N/A

### Test Review
- Unit tests: N/A
- Integration tests: N/A
- Negative tests: N/A

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Cả cấu hình `.gitignore` và khởi tạo Git repository đều đã hoàn thành thành công).

### Notes
- Git repository đã hoạt động bình thường, đang ở nhánh `master` và sẵn sàng track `.gitignore`, `AGENTS.md` và thư mục `docs/`.
