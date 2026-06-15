# Danh sách Công việc & Theo dõi Tiến độ (Tasks & Progress Tracking)

## Milestone 1: Project Setup
*   **T-1.1**: Khởi tạo repository Git và file `.gitignore`
    *   **Mục tiêu**: Thiết lập Git bỏ qua các thư mục cục bộ và file nhạy cảm.
    *   **Mô tả**: Tạo `.gitignore` loại trừ `node_modules`, `.env`, `dist`, `.expo`, v.v.
    *   **Module ảnh hưởng**: Root folder
    *   **Test**: Kiểm tra trạng thái Git đảm bảo không track `.env` hay `node_modules`.
    *   **Dependency**: Không có
    *   **Trạng thái**: Done
*   **T-1.2**: Cấu hình dự án Backend Node.js Express TypeScript
    *   **Mục tiêu**: Tạo cấu trúc dự án backend cơ bản.
    *   **Mô tả**: Khởi tạo `package.json`, cài đặt dependencies cơ bản, tạo `tsconfig.json`.
    *   **Module ảnh hưởng**: Backend root
    *   **Test**: Run build TypeScript không có lỗi.
    *   **Dependency**: T-1.1
    *   **Trạng thái**: Done
*   **T-1.3**: Thiết lập Linter & Formatter cho Backend
    *   **Mục tiêu**: Đảm bảo chất lượng và định dạng code đồng nhất.
    *   **Mô tả**: Cấu hình ESLint và Prettier theo chuẩn dự án.
    *   **Module ảnh hưởng**: Backend root
    *   **Test**: Run lệnh lint không lỗi.
    *   **Dependency**: T-1.2
    *   **Trạng thái**: Done
*   **T-1.4**: Cấu hình file môi trường mẫu
    *   **Mục tiêu**: Cung cấp file cấu hình mẫu cho nhà phát triển khác.
    *   **Mô tả**: Tạo `.env.example` chứa các cấu hình mẫu (DB_PORT, JWT_SECRET, v.v.).
    *   **Module ảnh hưởng**: Root
    *   **Test**: Kiểm tra file `.env.example` hiển thị đầy đủ các biến môi trường cần thiết.
    *   **Dependency**: T-1.2
    *   **Trạng thái**: Done

---

## Milestone 2: Backend Foundation
*   **T-2.1**: Tích hợp Sequelize CLI và cấu hình kết nối Database
    *   **Mục tiêu**: Kết nối thành công tới database.
    *   **Mô tả**: Khởi tạo Sequelize, cấu hình file `config/config.json` hoặc sử dụng biến môi trường kết nối MySQL/PostgreSQL.
    *   **Module ảnh hưởng**: DB Module
    *   **Test**: Chạy lệnh kiểm tra kết nối database thành công.
    *   **Dependency**: T-1.4
    *   **Trạng thái**: Done
*   **T-2.2**: Tạo migration cho bảng `users`
    *   **Mục tiêu**: Có bảng lưu thông tin người dùng trong DB.
    *   **Mô tả**: Tạo file migration khởi tạo bảng `users` với các trường id (UUID), username, email, password_hash, avatar_url, created_at, updated_at.
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công và kiểm tra cấu trúc bảng trong DB.
    *   **Dependency**: T-2.1
    *   **Trạng thái**: Done
*   **T-2.3**: Thiết lập Base App Express & Global Error Handler
    *   **Mục tiêu**: Có một khung server chạy được và xử lý lỗi tập trung.
    *   **Mô tả**: Viết file `src/app.ts` khởi tạo Express, đăng ký parser JSON và middleware xử lý lỗi tập trung.
    *   **Module ảnh hưởng**: Route & Middleware
    *   **Test**: Khởi động server thành công, truy cập endpoint test trả về response lỗi chuẩn khi ném ra lỗi bất kỳ.
    *   **Dependency**: T-1.2
    *   **Trạng thái**: Done
*   **T-2.4**: Phát triển Validation Middleware bằng Zod
    *   **Mục tiêu**: Validate request payload trước khi vào Controller.
    *   **Mô tả**: Viết middleware nhận vào schema Zod, thực hiện validate `req.body`/`req.query`/`req.params`. Trả về lỗi `VALIDATION_ERROR` nếu không hợp lệ.
    *   **Module ảnh hưởng**: Middleware
    *   **Test**: Viết Unit Test truyền dữ liệu sai định dạng qua middleware kiểm tra mã lỗi trả về.
    *   **Dependency**: T-2.3
    *   **Trạng thái**: Done

---

## Milestone 3: Authentication
*   **T-3.1**: Phát triển tiện ích mã hóa mật khẩu
    *   **Mục tiêu**: Mã hóa và so sánh mật khẩu an toàn.
    *   **Mô tả**: Viết class/helper mã hóa mật khẩu bằng `bcrypt` trước khi lưu vào DB.
    *   **Module ảnh hưởng**: Auth Module (Helpers)
    *   **Test**: Unit test kiểm tra hash mật khẩu và khớp mật khẩu khi so sánh lại.
    *   **Dependency**: T-2.2
    *   **Trạng thái**: Done
*   **T-3.2**: Viết logic TokenService sinh/xác thực JWT
    *   **Mục tiêu**: Tạo Access Token và Refresh Token cho session người dùng.
    *   **Mô tả**: Sử dụng thư viện `jsonwebtoken` sinh access token (hạn ngắn) và refresh token (hạn dài).
    *   **Module ảnh hưởng**: Auth Module (Services)
    *   **Test**: Unit test sinh token và verify tính hợp lệ của token.
    *   **Dependency**: T-1.4
    *   **Trạng thái**: Done
*   **T-3.3**: Endpoint Đăng ký tài khoản (`POST /api/v1/auth/register`)
    *   **Mục tiêu**: Cho phép khách tạo tài khoản mới.
    *   **Mô tả**: Route & Controller xử lý luồng register, validate bằng Zod, lưu user mới và trả về cặp token.
    *   **Module ảnh hưởng**: Auth Module (Routes, Controllers, Services)
    *   **Test**: Integration test gửi payload đăng ký hợp lệ và nhận về HTTP 201 cùng cặp token.
    *   **Dependency**: T-3.1, T-3.2, T-2.4
    *   **Trạng thái**: Done
*   **T-3.3-refactor**: Tách UserRepository cho Auth Register
    *   **Mục tiêu**: Tách UserRepository để sửa lỗi kiến trúc (Service gọi trực tiếp Sequelize model).
    *   **Mô tả**: Tạo UserRepository trong User Module, ánh xạ camelCase sang snake_case, refactor AuthService để chỉ gọi qua UserRepository.
    *   **Module ảnh hưởng**: Users Module, Auth Module
    *   **Test**: Toàn bộ unit test và integration test (29/29) pass, format và lint sạch lỗi.
    *   **Dependency**: T-3.3
    *   **Trạng thái**: Done
*   **T-3.4**: Endpoint Đăng nhập (`POST /api/v1/auth/login`)
    *   **Mục tiêu**: Xác thực người dùng và bắt đầu session.
    *   **Mô tả**: Route & Controller xử lượng login, kiểm tra email/username và mật khẩu, trả về cặp token.
    *   **Module ảnh hưởng**: Auth Module
    *   **Test**: Integration test gửi thông tin đăng nhập đúng (HTTP 200) và sai (HTTP 401).
    *   **Dependency**: T-3.3
    *   **Trạng thái**: Done
*   **T-3.4-refactor-docs**: Chuẩn hóa Auth DTO và siết lại Architecture Docs
    *   **Mục tiêu**: Tách biệt Auth DTO khỏi AuthService và siết chặt quy định kiến trúc phân tầng trong tài liệu.
    *   **Mô tả**: Di chuyển RegisterDto, LoginDto, và AuthResponseDto sang auth.dto.ts, import type vào AuthService. Cập nhật docs/05-architecture.md và docs/10-coding-rule.md để làm rõ ranh giới các layer, cấm Service/Controller gọi Model trực tiếp.
    *   **Module ảnh hưởng**: Auth Module, Documentation
    *   **Test**: Toàn bộ unit test và integration test (36/36) pass sạch sẽ.
    *   **Dependency**: T-3.4
    *   **Trạng thái**: Done
*   **T-3.5**: Endpoint Refresh Token và Đăng xuất
    *   **Mục tiêu**: Duy trì session và hủy session an toàn.
    *   **Mô tả**: POST `/api/v1/auth/refresh` và POST `/api/v1/auth/logout`.
    *   **Module ảnh hưởng**: Auth Module
    *   **Test**: Test lấy access token mới qua refresh token. Đăng xuất xong không dùng được refresh token cũ nữa.
    *   **Dependency**: T-3.4
    *   **Trạng thái**: Done
*   **T-3.6**: Phát triển `authMiddleware` chặn truy cập trái phép
    *   **Mục tiêu**: Bảo vệ các API nhạy cảm.
    *   **Mô tả**: Middleware kiểm tra header `Authorization: Bearer [accessToken]`, verify JWT và gán `req.user`.
    *   **Module ảnh hưởng**: Middleware
    *   **Test**: Gọi API được bảo vệ không có token nhận về 401, có token nhận về 200.
    *   **Dependency**: T-3.2
    *   **Trạng thái**: Done

---

## Milestone 4: User/Profile
*   **T-4.1**: API lấy thông tin Profile cá nhân (`GET /api/v1/users/profile`)
    *   **Mục tiêu**: Trả về thông tin cá nhân của user đang đăng nhập.
    *   **Mô tả**: Route & Controller lấy thông tin user từ `req.user.id`.
    *   **Module ảnh hưởng**: User Module
    *   **Test**: Integration test gọi API profile của chính mình trả về dữ liệu đúng cấu trúc.
    *   **Dependency**: T-3.6
    *   **Trạng thái**: Done
*   **T-4.2**: Tích hợp Multer và thiết lập lớp trừu tượng `StorageService`
    *   **Mục tiêu**: Xử lý tải file ảnh lên server.
    *   **Mô tả**: Thiết lập `multer` middleware đón file ảnh. Viết interface `StorageService` và cài đặt `LocalStorageProvider` để lưu ảnh cục bộ vào thư mục static.
    *   **Module ảnh hưởng**: Storage Module
    *   **Test**: Unit test tải lên một file ảnh giả lập và kiểm tra file tồn tại trong thư mục đích.
    *   **Dependency**: T-2.3
    *   **Trạng thái**: Todo
*   **T-4.3**: API Cập nhật Profile (`PUT /api/v1/users/profile`)
    *   **Mục tiêu**: Cho phép đổi tên hiển thị và upload ảnh avatar.
    *   **Mô tả**: API nhận dữ liệu multipart/form-data, upload avatar qua `StorageService`, cập nhật thông tin user.
    *   **Module ảnh hưởng**: User Module
    *   **Test**: Integration test gửi yêu cầu sửa tên và đính kèm file ảnh avatar hợp lệ.
    *   **Dependency**: T-4.1, T-4.2
    *   **Trạng thái**: Todo

---

## Milestone 5: Category
*   **T-5.1**: Tạo migration cho bảng `categories`
    *   **Mục tiêu**: Có bảng lưu danh mục trong DB.
    *   **Mô tả**: Tạo migration bảng `categories` chứa id (UUID), user_id (UUID, Nullable), name, color, icon.
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công.
    *   **Dependency**: T-2.1
    *   **Trạng thái**: Todo
*   **T-5.2**: Viết Seed dữ liệu danh mục mặc định của hệ thống
    *   **Mục tiêu**: Khởi tạo danh mục mặc định cho tất cả user.
    *   **Mô tả**: Seed các danh mục Food, Transport, Shopping, Entertainment, Study, Health, Other vào DB với `user_id = NULL`.
    *   **Module ảnh hưởng**: DB Module (Seeds)
    *   **Test**: Kiểm tra bảng `categories` có dữ liệu mặc định sau khi chạy seed.
    *   **Dependency**: T-5.1
    *   **Trạng thái**: Todo
*   **T-5.3**: API Lấy danh sách danh mục chi tiêu (`GET /api/v1/categories`)
    *   **Mục tiêu**: Hiển thị toàn bộ danh mục khả dụng của user.
    *   **Mô tả**: Truy vấn toàn bộ danh mục có `user_id = NULL` HOẶC `user_id = req.user.id`.
    *   **Module ảnh hưởng**: Category Module
    *   **Test**: Kiểm tra danh sách trả về chứa đủ danh mục mặc định và các danh mục tự tạo của chính user đó.
    *   **Dependency**: T-5.2, T-3.6
    *   **Trạng thái**: Todo
*   **T-5.4**: API Tạo danh mục tùy chỉnh (`POST /api/v1/categories`)
    *   **Mục tiêu**: Cho phép người dùng cá nhân hóa danh mục chi tiêu.
    *   **Mô tả**: Tạo bản ghi danh mục mới liên kết với `user_id = req.user.id`.
    *   **Module ảnh hưởng**: Category Module
    *   **Test**: Integration test tạo danh mục mới, kiểm tra trường `user_id` không bị NULL.
    *   **Dependency**: T-5.3
    *   **Trạng thái**: Todo

---

## Milestone 6: Expense
*   **T-6.1**: Tạo migration cho bảng `expenses` (Có soft delete)
    *   **Mục tiêu**: Có bảng lưu giao dịch chi tiêu trong DB.
    *   **Mô tả**: Khởi tạo bảng `expenses` có cột `deleted_at` (TIMESTAMP, nullable).
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công.
    *   **Dependency**: T-5.1, T-2.2
    *   **Trạng thái**: Todo
*   **T-6.2**: API Thêm chi tiêu thủ công (`POST /api/v1/expenses`)
    *   **Mục tiêu**: Ghi chép giao dịch chi tiêu không cần ảnh.
    *   **Mô tả**: Tạo bản ghi chi tiêu mới với số tiền, danh mục, ghi chú, ngày, `snapId = NULL`.
    *   **Module ảnh hưởng**: Expense Module
    *   **Test**: Gửi khoản chi hợp lệ (HTTP 201), gửi khoản chi âm (HTTP 400 Validation Error).
    *   **Dependency**: T-6.1, T-3.6
    *   **Trạng thái**: Todo
*   **T-6.3**: API Lấy danh sách chi tiêu (`GET /api/v1/expenses`)
    *   **Mục tiêu**: Xem lịch sử chi tiêu có phân trang và bộ lọc.
    *   **Mô tả**: Truy vấn các khoản chi chưa bị xóa mềm của user. JOIN thông tin snap liên kết, xử lý an toàn nếu snap đã bị xóa mềm bằng cách trả về `snapDeleted: true` và `imageUrl: null`.
    *   **Module ảnh hưởng**: Expense Module
    *   **Test**: Gửi query có filter category, kiểm tra danh sách trả về có phân trang chính xác.
    *   **Dependency**: T-6.2
    *   **Trạng thái**: Todo
*   **T-6.4**: API Cập nhật chi tiêu (`PUT /api/v1/expenses/:id`)
    *   **Mục tiêu**: Thay đổi thông tin chi tiêu đã ghi.
    *   **Mô tả**: Cho phép sửa các trường chi tiêu, bắt buộc kiểm tra quyền sở hữu bản ghi.
    *   **Module ảnh hưởng**: Expense Module
    *   **Test**: User A sửa chi tiêu của User B nhận về lỗi 403 Forbidden.
    *   **Dependency**: T-6.3
    *   **Trạng thái**: Todo
*   **T-6.5**: API Xóa chi tiêu (`DELETE /api/v1/expenses/:id`)
    *   **Mục tiêu**: Xóa mềm khoản chi khỏi hệ thống.
    *   **Mô tả**: Cập nhật trường `deleted_at = NOW`.
    *   **Module ảnh hưởng**: Expense Module
    *   **Test**: Gọi API xóa thành công, sau đó kiểm tra API list expenses không còn hiển thị khoản chi này nữa.
    *   **Dependency**: T-6.3
    *   **Trạng thái**: Todo

---

## Milestone 7: Snap/Photo Journal
*   **T-7.1**: Tạo migration cho bảng `snaps` (Có soft delete)
    *   **Mục tiêu**: Có bảng lưu thông tin snap trong DB.
    *   **Mô tả**: Tạo migration bảng `snaps` chứa `deleted_at` (TIMESTAMP, nullable).
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công.
    *   **Dependency**: T-2.2
    *   **Trạng thái**: Todo
*   **T-7.2**: Tích hợp upload ảnh snap thông qua `LocalStorageProvider`
    *   **Mục tiêu**: Xử lý lưu trữ file ảnh snap an toàn.
    *   **Mô tả**: Sử dụng `StorageService` để lưu trữ ảnh chụp tải lên vào thư mục public của server.
    *   **Module ảnh hưởng**: Storage Module
    *   **Test**: Gọi hàm upload và kiểm tra đường dẫn URL tĩnh trả về truy cập được ảnh.
    *   **Dependency**: T-4.2, T-7.1
    *   **Trạng thái**: Todo
*   **T-7.3**: API Đăng Snap kèm Chi tiêu (`POST /api/v1/snaps`)
    *   **Mục tiêu**: Tạo snap và các chi tiêu đính kèm đồng thời bảo đảm tính toàn vẹn dữ liệu.
    *   **Mô tả**: API multipart/form-data nhận file ảnh và chuỗi JSON `expenses`. Sử dụng **Sequelize Transaction** để tạo snap và tạo các khoản chi đính kèm. Rollback nếu có lỗi xảy ra.
    *   **Module ảnh hưởng**: Snap Module, Expense Module
    *   **Test**: Gửi request hợp lệ (tạo thành công cả hai). Gửi mảng `expenses` có lỗi (ví dụ: category sai) $\rightarrow$ kiểm tra xem snap có bị rollback không tạo thành công.
    *   **Dependency**: T-7.2, T-6.2
    *   **Trạng thái**: Todo
*   **T-7.4**: API Lấy dòng thời gian cá nhân (`GET /api/v1/snaps/timeline`)
    *   **Mục tiêu**: Hiển thị nhật ký ảnh và tài chính của người dùng theo ngày.
    *   **Mô tả**: Lấy danh sách snaps chưa bị xóa mềm, JOIN các expenses tương ứng chưa bị xóa mềm. Sắp xếp mới nhất ở trên.
    *   **Module ảnh hưởng**: Snap Module
    *   **Test**: Chạy integration test kiểm tra timeline trả về không có snap bị xóa mềm.
    *   **Dependency**: T-7.3
    *   **Trạng thái**: Todo
*   **T-7.5**: API Xóa Snap (`DELETE /api/v1/snaps/:id` - Soft Delete)
    *   **Mục tiêu**: Ẩn snap khỏi dòng thời gian mà không làm mất dữ liệu chi tiêu liên quan.
    *   **Mô tả**: Cập nhật `deleted_at = NOW` cho snap. **Không** cập nhật xóa mềm các expense liên kết để giữ lại số liệu chi tiêu và thống kê.
    *   **Module ảnh hưởng**: Snap Module
    *   **Test**: Xóa snap thành công $\rightarrow$ kiểm tra timeline không còn snap $\rightarrow$ kiểm tra API list expenses vẫn giữ khoản chi đính kèm với `snapDetails.snapDeleted = true`.
    *   **Dependency**: T-7.4, T-6.5
    *   **Trạng thái**: Todo

---

## Milestone 8: Friendship & Private Sharing
*   **T-8.1**: Tạo migration cho bảng `friendships`
    *   **Mục tiêu**: Có bảng lưu thông tin quan hệ bạn bè.
    *   **Mô tả**: Tạo migration bảng `friendships` với cột id, sender_id, receiver_id, status (PENDING, ACCEPTED, DECLINED). Thiết lập unique index ghép đôi.
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công.
    *   **Dependency**: T-2.2
    *   **Trạng thái**: Todo
*   **T-8.2**: API Gửi lời mời kết bạn (`POST /api/v1/friends/request`)
    *   **Mục tiêu**: Bắt đầu thiết lập kết nối bạn bè.
    *   **Mô tả**: Nhận email/username người nhận, kiểm tra tài khoản tồn tại, tạo bản ghi trạng thái `PENDING`.
    *   **Module ảnh hưởng**: Friendship Module
    *   **Test**: Gửi request thành công. Thử gửi lại lần 2 nhận về lỗi trùng lặp (400 Bad Request).
    *   **Dependency**: T-8.1, T-3.6
    *   **Trạng thái**: Todo
*   **T-8.3**: API Phản hồi yêu cầu kết bạn (`PUT /api/v1/friends/request/:id`)
    *   **Mục tiêu**: Xác nhận hoặc từ chối kết bạn.
    *   **Mô tả**: Cập nhật trạng thái thành `ACCEPTED` hoặc `DECLINED`.
    *   **Module ảnh hưởng**: Friendship Module
    *   **Test**: Đồng ý kết bạn $\rightarrow$ kiểm tra quan hệ bạn bè được xác lập thành công.
    *   **Dependency**: T-8.2
    *   **Trạng thái**: Todo
*   **T-8.4**: API Lấy dòng thời gian bạn bè (`GET /api/v1/friends/feed`)
    *   **Mục tiêu**: Xem các khoảnh khắc được chia sẻ bởi bạn bè.
    *   **Mô tả**: Lấy danh sách snaps chưa bị xóa mềm của những người dùng có trạng thái kết bạn `ACCEPTED` với người dùng hiện tại, có thiết lập `isPrivate = false`.
    *   **Module ảnh hưởng**: Friendship Module, Snap Module
    *   **Test**: Kiểm tra Feed hiển thị đúng các snap public của bạn bè, không hiển thị snap private của họ, và không hiển thị snap của người lạ.
    *   **Dependency**: T-8.3, T-7.4
    *   **Trạng thái**: Todo

---

## Milestone 9: Reaction
*   **T-9.1**: Tạo migration cho bảng `reactions`
    *   **Mục tiêu**: Có bảng lưu trữ reaction trong DB.
    *   **Mô tả**: Tạo migration bảng `reactions` liên kết với `snap_id` (CASCADE khi xóa cứng snap) và `user_id`.
    *   **Module ảnh hưởng**: DB Module (Migrations)
    *   **Test**: Chạy migration thành công.
    *   **Dependency**: T-7.1
    *   **Trạng thái**: Todo
*   **T-9.2**: API Thả Reaction vào Snap (`POST /api/v1/snaps/:id/react`)
    *   **Mục tiêu**: Tương tác cảm xúc trên snap của bạn bè.
    *   **Mô tả**: Thêm bản ghi reaction mới. Kiểm tra điều kiện snap thuộc về chính user hoặc thuộc về một người bạn đã ACCEPTED và snap không ở chế độ private.
    *   **Module ảnh hưởng**: Reaction Module
    *   **Test**: Thả emoji thành công. Thử thả emoji vào snap private của người không kết bạn nhận về lỗi 403 Forbidden.
    *   **Dependency**: T-9.1, T-8.4
    *   **Trạng thái**: Todo

---

## Milestone 10: Statistics
*   **T-10.1**: Phát triển logic truy vấn thống kê dữ liệu tài chính
    *   **Mục tiêu**: Tính toán các chỉ số tài chính từ cơ sở dữ liệu.
    *   **Mô tả**: Viết các câu query (hoặc hàm trong service) tính tổng chi tiêu ngày, tổng chi tiêu tháng, gom nhóm chi tiêu theo danh mục, tính xu hướng chi tiêu tuần qua của user. Bỏ qua các chi tiêu đã bị soft delete.
    *   **Module ảnh hưởng**: Statistics Module (Services)
    *   **Test**: Unit test với dữ liệu giả lập, kiểm tra tổng tiền và phần trăm tính toán chính xác.
    *   **Dependency**: T-6.3
    *   **Trạng thái**: Todo
*   **T-10.2**: API lấy tóm tắt thống kê tài chính (`GET /api/v1/statistics`)
    *   **Mục tiêu**: Trả về dữ liệu thống kê tổng hợp dạng JSON cho client vẽ biểu đồ.
    *   **Mô tả**: Route & Controller gọi dịch vụ thống kê và trả về response chuẩn.
    *   **Module ảnh hưởng**: Statistics Module
    *   **Test**: Integration test gọi API thống kê trả về đầy đủ các trường dữ liệu cần thiết.
    *   **Dependency**: T-10.1, T-3.6
    *   **Trạng thái**: Todo

---

## Milestone 11: Mobile App Foundation
*   **T-11.1**: Khởi tạo dự án React Native Expo
    *   **Mục tiêu**: Có một khung ứng dụng di động chạy được.
    *   **Mô tả**: Khởi tạo bằng Expo CLI với template TypeScript.
    *   **Module ảnh hưởng**: Mobile root
    *   **Test**: Khởi động Expo server thành công, chạy ứng dụng hiển thị màn hình chào mừng trên simulator/thiết bị thật.
    *   **Dependency**: T-1.1
    *   **Trạng thái**: Todo
*   **T-11.2**: Cài đặt các thư viện bổ trợ thiết yếu
    *   **Mục tiêu**: Cung cấp đầy đủ công cụ lập trình cho mobile app.
    *   **Mô tả**: Cài đặt `react-navigation`, `axios`, `zustand`, `react-hook-form`, `zod`, `expo-image-picker`, `expo-image-manipulator`, `expo-secure-store`.
    *   **Module ảnh hưởng**: Mobile package.json
    *   **Test**: Chạy npm install thành công, khởi động app không bị lỗi xung đột package.
    *   **Dependency**: T-11.1
    *   **Trạng thái**: Todo
*   **T-11.3**: Thiết lập HTTP Axios Client và Interceptors
    *   **Mục tiêu**: Kết nối tự động với Backend API một cách bảo mật.
    *   **Mô tả**: Cấu hình baseURL, viết interceptors đính kèm accessToken vào header, tự động gọi API refresh token và thử lại request nếu gặp lỗi token hết hạn (HTTP 401).
    *   **Module ảnh hưởng**: Mobile Services (`api.ts`)
    *   **Test**: Giả lập token hết hạn, kiểm tra xem client có tự động refresh và lấy lại được dữ liệu không.
    *   **Dependency**: T-11.2
    *   **Trạng thái**: Todo
*   **T-11.4**: Thiết lập hệ thống UI Core (Themes, Styles, Custom Components)
    *   **Mục tiêu**: Đảm bảo giao diện đồng nhất và cao cấp.
    *   **Mô tả**: Định nghĩa bảng màu (Teal, Dark background), các kiểu chữ dùng chung, thiết kế các UI Component cơ bản (nút bấm Glassmorphism, Input Field).
    *   **Module ảnh hưởng**: Mobile UI Core
    *   **Test**: Hiển thị thử các component trên màn hình nháp kiểm tra tính thẩm mỹ trực quan.
    *   **Dependency**: T-11.2
    *   **Trạng thái**: Todo

---

## Milestone 12: Mobile Authentication UI
*   **T-12.1**: Thiết kế giao diện Onboarding Slide
    *   **Mục tiêu**: Giới thiệu ứng dụng sinh động cho người dùng mới.
    *   **Mô tả**: Màn hình vuốt slide ngang giới thiệu các tính năng visual finance, Locket-style sharing.
    *   **Module ảnh hưởng**: Mobile Presentation Layer
    *   **Test**: Vuốt qua lại các slide mượt mà, bấm nút "Bắt đầu" chuyển sang màn hình Login.
    *   **Dependency**: T-11.4
    *   **Trạng thái**: Todo
*   **T-12.2**: Thiết kế màn hình Đăng nhập (Login Screen)
    *   **Mục tiêu**: Cho phép đăng nhập tài khoản.
    *   **Mô tả**: Form nhập email/username và mật khẩu, tích hợp validation bằng Zod.
    *   **Module ảnh hưởng**: Mobile Auth Feature
    *   **Test**: Gửi thông tin trống báo lỗi validate đỏ dưới ô nhập. Nhập đúng chuyển hướng sang trang chủ.
    *   **Dependency**: T-12.1, T-11.3
    *   **Trạng thái**: Todo
*   **T-12.3**: Thiết kế màn hình Đăng ký (Register Screen)
    *   **Mục tiêu**: Cho phép tạo tài khoản mới trên app.
    *   **Mô tả**: Form nhập email, username, mật khẩu, xác nhận mật khẩu.
    *   **Module ảnh hưởng**: Mobile Auth Feature
    *   **Test**: Kiểm tra ràng buộc mật khẩu khớp nhau trực tiếp trên giao diện.
    *   **Dependency**: T-12.2
    *   **Trạng thái**: Todo
*   **T-12.4**: Tích hợp Auth Zustand Store và quản lý lưu trữ Token bảo mật
    *   **Mục tiêu**: Lưu trạng thái đăng nhập lâu dài.
    *   **Mô tả**: Lưu `refreshToken` vào `expo-secure-store`. Quản lý state đăng nhập toàn cục.
    *   **Module ảnh hưởng**: Mobile Store Module
    *   **Test**: Khởi động lại ứng dụng khi đã đăng nhập trước đó $\rightarrow$ tự động mở thẳng màn hình Timeline, không bắt login lại.
    *   **Dependency**: T-12.2
    *   **Trạng thái**: Todo

---

## Milestone 13: Mobile Expense UI
*   **T-13.1**: Màn hình danh sách chi tiêu hàng ngày/tháng
    *   **Mục tiêu**: Xem lịch sử chi tiêu cá nhân.
    *   **Mô tả**: Hiển thị danh sách các khoản chi tiêu phân chia theo ngày, hỗ trợ lọc theo danh mục.
    *   **Module ảnh hưởng**: Mobile Expense Feature
    *   **Test**: Hiển thị đúng danh sách chi tiêu trả về từ API, cuộn xuống dưới tự động tải thêm dữ liệu (infinite scroll).
    *   **Dependency**: T-11.4, T-12.4
    *   **Trạng thái**: Todo
*   **T-13.2**: Form thêm/sửa chi tiêu thủ công
    *   **Mục tiêu**: Nhập liệu chi tiêu nhanh và dễ dàng.
    *   **Mô tả**: Màn hình nhập số tiền lớn ở đỉnh, grid chọn nhanh danh mục bằng icon màu sắc, chọn ngày tháng bằng DatePicker.
    *   **Module ảnh hưởng**: Mobile Expense Feature
    *   **Test**: Lưu thành công một khoản chi tiêu và thấy xuất hiện ngay trên danh sách.
    *   **Dependency**: T-13.1
    *   **Trạng thái**: Todo
*   **T-13.3**: Giao diện hiển thị an toàn khi chi tiêu có ảnh snap bị xóa mềm
    *   **Mục tiêu**: Tránh lỗi giao diện và thông tin rõ ràng cho người dùng.
    *   **Mô tả**: Khi API trả về `snapDetails.snapDeleted = true`, UI hiển thị nhãn: *"Ảnh nhật ký đã bị xóa"* trên thẻ chi tiêu, vô hiệu hóa nút xem ảnh phóng to.
    *   **Module ảnh hưởng**: Mobile Expense Feature
    *   **Test**: Mock dữ liệu có snap bị xóa mềm, xác minh UI hiển thị nhãn text thay thế chính xác và app không bị crash.
    *   **Dependency**: T-13.1
    *   **Trạng thái**: Todo

---

## Milestone 14: Mobile Camera & Timeline UI
*   **T-14.1**: Tích hợp Camera nội bộ và nén ảnh
    *   **Mục tiêu**: Chụp khoảnh khắc chất lượng cao nhưng dung lượng tối ưu.
    *   **Mô tả**: Mở giao diện chụp ảnh toàn màn hình, sau khi chụp xong sử dụng `expo-image-manipulator` nén file ảnh xuống mức 150KB - 300KB.
    *   **Module ảnh hưởng**: Mobile Camera Feature
    *   **Test**: Kiểm tra kích thước và dung lượng ảnh sau khi nén đảm bảo không quá lớn.
    *   **Dependency**: T-11.4
    *   **Trạng thái**: Todo
*   **T-14.2**: Giao diện Preview, nhập caption và đính kèm chi tiêu nhanh
    *   **Mục tiêu**: Chuẩn bị đầy đủ thông tin snap trước khi lưu.
    *   **Mô tả**: Hiển thị ảnh chụp, ô viết caption, công tắc chọn quyền riêng tư và nút BottomSheet mở form nhập nhanh các khoản chi đính kèm.
    *   **Module ảnh hưởng**: Mobile Camera Feature
    *   **Test**: Nhập caption, chọn đính kèm 2 khoản chi tiêu $\rightarrow$ nhấn Lưu $\rightarrow$ Hệ thống gửi đúng định dạng payload multipart/form-data lên Backend.
    *   **Dependency**: T-14.1, T-13.2
    *   **Trạng thái**: Todo
*   **T-14.3**: Màn hình Timeline Feed (Dòng thời gian nhật ký)
    *   **Mục tiêu**: Xem lại nhật ký ảnh kết hợp chi tiêu.
    *   **Mô tả**: Bố cục Timeline dạng cuộn dọc hiển thị các thẻ snap lớn, overlay caption mờ ở đáy ảnh, hiển thị các tag chi tiêu đính kèm.
    *   **Module ảnh hưởng**: Mobile Timeline Feature
    *   **Test**: Bố cục hiển thị đẹp mắt, các nhãn chi tiêu hiển thị đúng vị trí bên dưới ảnh snap tương ứng.
    *   **Dependency**: T-11.4, T-14.2
    *   **Trạng thái**: Todo
*   **T-14.4**: Bảng chọn thả emoji reaction nhanh
    *   **Mục tiêu**: Tương tác cảm xúc nhanh với bạn bè.
    *   **Mô tả**: Bấm giữ hoặc nhấn vào icon reaction để hiện popover chứa các emoji (👍, ❤️, 😂, 😮). Bấm chọn sẽ gọi API thả reaction.
    *   **Module ảnh hưởng**: Mobile Timeline Feature
    *   **Test**: Thả reaction thành công, số lượng reaction tăng trực tiếp trên giao diện.
    *   **Dependency**: T-14.3
    *   **Trạng thái**: Todo

---

## Milestone 15: Mobile Statistics UI
*   **T-15.1**: Thiết kế màn hình tổng hợp số liệu
    *   **Mục tiêu**: Thống kê số tiền chi tiêu trực quan.
    *   **Mô tả**: Hiển thị tổng số tiền ngày/tháng bằng font chữ lớn nghệ thuật, tạo điểm nhấn Glassmorphism trên nền.
    *   **Module ảnh hưởng**: Mobile Statistics Feature
    *   **Test**: Nhận dữ liệu từ API và hiển thị đúng định dạng tiền tệ (ví dụ: 120.000 đ).
    *   **Dependency**: T-11.4, T-12.4
    *   **Trạng thái**: Todo
*   **T-15.2**: Tích hợp các biểu đồ phân tích (Pie Chart & Trend Chart)
    *   **Mục tiêu**: Trực quan hóa hành vi tiêu dùng của người dùng.
    *   **Mô tả**: Tích hợp thư viện đồ họa React Native SVG/Charts vẽ biểu đồ phân bổ danh mục và biểu đồ cột/đường xu hướng tuần/tháng.
    *   **Module ảnh hưởng**: Mobile Statistics Feature
    *   **Test**: Biểu đồ hiển thị mượt mà, phân bổ tỉ lệ màu sắc đúng với dữ liệu API trả về.
    *   **Dependency**: T-15.1
    *   **Trạng thái**: Todo

---

## Milestone 16: Mobile Social/Profile UI
*   **T-16.1**: Giao diện Quản lý Bạn bè
    *   **Mục tiêu**: Xây dựng vòng kết nối bạn bè riêng tư.
    *   **Mô tả**: Màn hình tìm kiếm người dùng khác bằng email/username, hiển thị danh sách bạn bè hiện tại và danh sách lời mời kết bạn đang chờ.
    *   **Module ảnh hưởng**: Mobile Social Feature
    *   **Test**: Bấm "Chấp nhận" lời mời kết bạn $\rightarrow$ danh sách bạn bè tăng thêm và lời mời biến mất.
    *   **Dependency**: T-11.4, T-12.4
    *   **Trạng thái**: Todo
*   **T-16.2**: Giao diện Private Friend Feed
    *   **Mục tiêu**: Theo dõi các cập nhật khoảnh khắc từ bạn bè.
    *   **Mô tả**: Bảng tin cuộn dọc hiển thị các snap chia sẻ công khai của bạn bè, tích hợp bảng thả reaction.
    *   **Module ảnh hưởng**: Mobile Social Feature
    *   **Test**: Kiểm tra feed chỉ tải các snap của bạn bè, không trộn lẫn timeline cá nhân.
    *   **Dependency**: T-16.1, T-14.4
    *   **Trạng thái**: Todo
*   **T-16.3**: Giao diện Sửa Profile cá nhân
    *   **Mục tiêu**: Cho phép cập nhật thông tin hiển thị và ảnh đại diện.
    *   **Mô tả**: Cho phép chọn ảnh từ thư viện thiết bị bằng `expo-image-picker`, cập nhật username/avatar qua API.
    *   **Module ảnh hưởng**: Mobile Profile Feature
    *   **Test**: Đổi avatar thành công, màn hình chính cập nhật avatar mới ngay lập tức.
    *   **Dependency**: T-11.4, T-12.4
    *   **Trạng thái**: Todo

---

## Milestone 17: Testing & Final Review
*   **T-17.1**: Chạy kiểm thử tự động toàn diện Backend
    *   **Mục tiêu**: Đảm bảo API Backend không phát sinh lỗi nghiệp vụ.
    *   **Mô tả**: Chạy toàn bộ các file Unit Test và Integration Test của API backend.
    *   **Module ảnh hưởng**: Backend root
    *   **Test**: Toàn bộ test suite chạy thành công 100%.
    *   **Dependency**: Tất cả các task backend từ M1 đến M10.
    *   **Trạng thái**: Todo
*   **T-17.2**: Kiểm thử tích hợp hệ thống trên thiết bị di động thật
    *   **Mục tiêu**: Đảm bảo ứng dụng chạy mượt mà trên môi trường thực tế.
    *   **Mô tả**: Chạy ứng dụng qua Expo Go trên cả thiết bị iOS và Android thực tế để kiểm tra khả năng hoạt động của camera, nén ảnh và kết nối API.
    *   **Module ảnh hưởng**: Mobile root
    *   **Test**: Ứng dụng chạy mượt mà, camera mở được, nén ảnh và upload thành công không bị trễ hay crash.
    *   **Dependency**: Tất cả các task mobile từ M11 đến M16.
    *   **Trạng thái**: Todo
*   **T-17.3**: Đánh giá dự án và Hoàn thiện tài liệu tổng kết
    *   **Mục tiêu**: Đóng gói mã nguồn sạch sẽ và ghi chép nhật ký phát triển.
    *   **Mô tả**: Dọn dẹp code dư thừa, kiểm tra lại linter. Hoàn thiện file `docs/12-review.md` (Project Review).
    *   **Module ảnh hưởng**: Root folder
    *   **Test**: Không còn lỗi cảnh báo linter, tất cả tài liệu thiết kế đồng bộ với code thực tế.
    *   **Dependency**: T-17.1, T-17.2
    *   **Trạng thái**: Todo
