# Quy tắc viết Code & Quy ước (Coding Rules & Conventions)

Tài liệu này định nghĩa các tiêu chuẩn kỹ thuật, quy tắc viết code và quy ước phát triển bắt buộc áp dụng cho toàn bộ dự án DailySnap Expense để đảm bảo mã nguồn sạch sẽ, dễ bảo trì và dễ kiểm thử.

---

## 1. Nguyên tắc thiết kế phần mềm cốt lõi
* **Clean Code**: Code phải rõ ràng, dễ đọc, viết bình luận (comments) giải thích "tại sao" làm vậy chứ không phải "làm thế nào".
* **SOLID**:
  - *Single Responsibility*: Mỗi class/function chỉ thực hiện duy nhất một nhiệm vụ.
  - *Open/Closed*: Code nên mở rộng được mà không cần sửa đổi mã nguồn gốc (áp dụng cho `StorageService`).
* **DRY (Don't Repeat Yourself)**: Tránh lặp lại code. Trích xuất các hàm tiện ích dùng chung hoặc component dùng chung khi xuất hiện đoạn code tương tự lần thứ hai.
* **KISS (Keep It Simple, Stupid)**: Giải pháp thiết kế đơn giản nhất luôn là tốt nhất. Tránh việc tối ưu hóa code quá sớm khi chưa cần thiết.
* **YAGNI (You Aren't Gonna Need It)**: Không viết các tính năng hoặc cấu trúc code phức tạp chỉ vì "có thể tương lai sẽ cần". Chỉ tập trung giải quyết yêu cầu hiện tại.

---

## 2. Quy ước Đặt tên (Naming Conventions)
Mã nguồn (tên file, biến, hàm, class) bắt buộc phải sử dụng **tiếng Anh**:
* **Biến & Hàm (Variables & Functions)**: camelCase (ví dụ: `getUserProfile`, `amountValue`, `isValidCategory`). Tên hàm phải bắt đầu bằng một động từ.
* **Classes & Types (Interfaces / Types)**: PascalCase (ví dụ: `StorageService`, `CreateUserDto`, `ExpressStorageProvider`).
* **Files & Directories**:
  - File logic/code: camelCase hoặc lowercase với dấu gạch ngang (kebab-case) tùy theo nền tảng (ví dụ: `auth.controller.ts` hoặc `user-service.ts`).
  - React Components: PascalCase (ví dụ: `TimelineCard.tsx`).
* **Hằng số (Constants)**: UPPER_SNAKE_CASE (ví dụ: `DEFAULT_PAGE_LIMIT`, `MAX_IMAGE_SIZE_BYTES`).
* **Cơ sở dữ liệu**:
  - Tên bảng và tên cột: snake_case (ví dụ: `users`, `password_hash`, `deleted_at`).
  - Tên bảng phải ở dạng số nhiều (plural).

---

## 3. Quy tắc phát triển Backend (Express.js TypeScript)
Tuân thủ mô hình phân tầng **Layered Architecture**:

### Lớp Route
- Chỉ định nghĩa endpoint, HTTP method và gắn middleware cần thiết.
- Middleware có thể bao gồm: authentication, authorization, validation, upload file.
- Không chứa business logic.
- Không mount từng module route trực tiếp trong app.ts.
- app.ts chỉ mount root API router, ví dụ `app.use('/api/v1', apiV1Routes)`.
- Các module route phải được đăng ký tập trung trong `src/routes/index.ts`.
- Khi thêm module mới, chỉ cập nhật `src/routes/index.ts`, hạn chế làm `app.ts` phình ra.

### Validation Middleware
- Chịu trách nhiệm validate `req.body`, `req.query`, `req.params` bằng Zod schema.
- Nếu dữ liệu không hợp lệ, trả về lỗi `VALIDATION_ERROR`.
- Nếu dữ liệu hợp lệ, chuyển request sang Controller.

### Lớp Controller
- Nhận request đã được middleware validate.
- Lấy dữ liệu cần thiết từ request như `req.body`, `req.params`, `req.query`, `req.user`.
- Gọi Service để xử lý nghiệp vụ.
- Định dạng HTTP response trả về cho client.
- Không chứa business logic phức tạp.
- **Tuyệt đối không** import trực tiếp Sequelize Model hay query database trực tiếp.

### Lớp Service
* Nơi tập trung toàn bộ **Business Logic** và nghiệp vụ của dự án.
* Sử dụng **Sequelize Transactions** khi có nhiều tác vụ ghi database liên tiếp để đảm bảo tính toàn vẹn dữ liệu.
* Không tương tác trực tiếp với đối tượng Request/Response của Express.
* **Tuyệt đối không** import trực tiếp Sequelize Model hoặc thực hiện các câu query database (phải đi qua Repository).
* Các interface/type đại diện cho DTO (như `RegisterDto`, `LoginDto`, v.v.) nên được tách riêng ra thư mục `dtos/` để dễ tái sử dụng và giữ file Service sạch sẽ. Không khai báo DTO/interface dùng chung trực tiếp trong service/controller. DTO/request/response type của module phải đặt trong thư mục `dtos` của module (Ví dụ: `src/modules/categories/dtos/category.dto.ts`). Service/controller/repository import type từ DTO file bằng `import type`.

### Lớp Repository
* Xử lý truy vấn cơ sở dữ liệu. Là tầng **duy nhất** được phép import Sequelize Model và gọi các hàm của model (`findOne`, `create`, `update`, `destroy`, v.v.).
* Không chứa logic nghiệp vụ nâng cao ngoài các thao tác CRUD và JOIN cơ bản.
* Đóng gói toàn bộ các cú pháp/truy vấn đặc trưng của database (như Sequelize `Op.or`, `Op.and`) để các tầng trên không bị phụ thuộc vào database cụ thể.

### Middleware & Xử lý lỗi (Error Handling)
* Sử dụng một global error handling middleware duy nhất để bắt mọi lỗi phát sinh từ controller/service.
* Không dùng khối try-catch rỗng hoặc log lỗi ra màn hình mà không ném lỗi tiếp (re-throw) để middleware xử lý.

---

## 4. Quy tắc phát triển Mobile App (React Native Expo)
* **Tổ chức thư mục theo Feature-based folder**: Gom màn hình, components đặc thù, custom hooks và store của cùng một tính năng vào cùng một thư mục (ví dụ: `src/features/auth/`).
* **Component Structure**:
  - Tách UI component (JSX) sạch sẽ.
  - Các logic xử lý sự kiện phức tạp hoặc tính toán dữ liệu lớn phải được tách ra các **Custom Hooks** (ví dụ: `useTimelineData.ts`).
* **Zustand Store**:
  - Chia nhỏ các store theo tính năng (ví dụ: `useAuthStore`, `useTimelineStore`).
  - Tránh nhồi nhét tất cả các state toàn cục vào một store duy nhất.
* **Form & Validation**: Sử dụng cặp đôi **React Hook Form** + **Zod** để kiểm soát validate dữ liệu trên UI trước khi gửi lên API.
* **Không gọi API trực tiếp trong UI Component**: Mọi hành động gọi API phải đi qua thư viện HTTP client (`services/api.ts`) hoặc thông qua custom hook/store để đảm bảo UI tách biệt với dữ liệu.

---

## 5. Quy tắc Thiết kế & Tương tác Cơ sở dữ liệu
* **Tên bảng/cột tiếng Anh**: Viết bằng tiếng Anh, kiểu snake_case, bảng dùng danh từ số nhiều.
* **Migration**:
  - Không chỉnh sửa trực tiếp schema database bằng các công cụ GUI trên server dev/stg.
  - Bắt buộc tạo Sequelize migration file cho mọi thay đổi về cấu trúc bảng, cột, khóa ngoại hoặc index.
* **Soft Delete**:
  - Sử dụng cột `deleted_at` (TIMESTAMP, nullable).
  - Mặc định Sequelize model phải được cấu hình `paranoid: true` cho các bảng cần soft delete (`expenses`, `snaps`).
  - Mọi câu lệnh truy vấn (Query) dòng thời gian (Timeline) cá nhân, bảng tin bạn bè (Friend Feed) hoặc danh sách chi tiêu bắt buộc phải loại bỏ các bản ghi đã bị xóa mềm (`deleted_at IS NOT NULL`). Đối với Sequelize, điều này được xử lý tự động nhờ cơ chế paranoid, nhưng nếu viết raw query hoặc JOIN thủ công cần bắt buộc thêm điều kiện loại trừ.
* **Audit Fields**: Mọi bảng dữ liệu phải có `created_at` và `updated_at`.
* **Sequelize model typing**: Sequelize model phải khai báo rõ Attributes và CreationAttributes khi có thao tác create/update để tránh lỗi TypeScript infer sai kiểu. Ví dụ: `Model<CategoryAttributes, CategoryCreationAttributes>`.

---

## 6. Tiêu chuẩn thiết kế API
* **Response Format**: Trả về đúng định dạng JSON chuẩn đã thống nhất trong `docs/08-api.md`.
* **Mã lỗi HTTP (Status Codes)**:
  - `200 OK` / `201 Created`: Thao tác thành công.
  - `400 Bad Request`: Validation lỗi hoặc dữ liệu đầu vào không hợp lệ.
  - `401 Unauthorized`: Lỗi xác thực (chưa gửi token, token hết hạn).
  - `403 Forbidden`: Xác thực đúng nhưng không có quyền truy cập tài nguyên của người khác.
  - `404 Not Found`: Không tìm thấy tài nguyên.
  - `500 Internal Server Error`: Lỗi hệ thống server.
* **Phân trang (Pagination)**: Tất cả API lấy danh sách nhiều dữ liệu (Timeline, Feed, Lịch sử) bắt buộc phải tích hợp phân trang dùng `limit` và `offset`.

---

## 7. Quy tắc Kiểm thử (Testing)
* **Unit Test**: Viết unit test cho các Service xử lý nghiệp vụ phức tạp bằng Jest. Đạt độ bao phủ (coverage) tối thiểu 80% cho các luồng nghiệp vụ quan trọng.
* **Integration Test**: Viết integration test giả lập luồng gọi API bằng Supertest. Kiểm thử đầy đủ các kịch bản thành công và lỗi (Negative Test).
* **Negative Test (Kiểm thử biên/lỗi)**:
  - Bắt buộc kiểm thử các trường hợp dữ liệu đầu vào bị sai, thiếu hoặc vượt giới hạn (ví dụ: nhập số tiền âm, gửi sai định dạng UUID, gửi ảnh quá dung lượng cho phép).
* **Xác thực và Phân quyền (Security Test)**:
  - Viết test case xác minh việc cố tình truy cập hoặc sửa xóa dữ liệu của user khác mà không được phép (trả về lỗi `403 Forbidden`).

---

## 8. Quy tắc An toàn & Bảo mật dự án (Safety & Security Rules)
* **Quản lý Secrets**:
  - Không hardcode các chuỗi nhạy cảm như JWT_SECRET, Database password, API Keys vào mã nguồn.
  - Sử dụng file cấu hình `.env` cục bộ.
  - **Tuyệt đối không commit file `.env`** lên Git repository (bắt buộc phải cấu hình `.gitignore`). Chỉ commit file mẫu `.env.example`.
* **Kiểm soát file**:
  - Không tự ý xóa các file mã nguồn hoặc thư mục tài liệu cấu trúc dự án khi chưa có sự thảo luận hoặc phê duyệt.
  - Không tự ý cài đặt thêm các package/dependencies mới bên ngoài danh sách tech stack đã thống nhất nếu không có lý do thực sự cần thiết và phải được báo cáo trước.
* **Tuân thủ kiến trúc**: Không tự ý thay đổi cấu trúc thư mục, các quy tắc dependency layer hoặc thay đổi API contract mà chưa cập nhật trước vào tài liệu thiết kế trong `docs/`.
