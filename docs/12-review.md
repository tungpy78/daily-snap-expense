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
- Approved (Cấu hình `.gitignore`, khởi tạo Git, thực hiện initial commit và push lên GitHub hoàn tất).

### Notes
- Đã thực hiện initial commit thành công với message: `"docs: initialize project context and rules"`.
- Đổi tên nhánh mặc định từ `master` sang `main`.
- Đã thiết lập remote `origin` tới GitHub: `https://github.com/tungpy78/daily-snap-expense.git`.
- Thực hiện push thành công toàn bộ tài liệu dự án ban đầu (baseline docs) lên nhánh `main` của GitHub. Dòng code đã được đồng bộ lên remote repository.

---

## Review: T-1.2 - Cấu hình dự án Backend Node.js Express TypeScript

### Date
2026-06-14

### Summary
Khởi tạo cấu trúc dự án backend nền tảng trong thư mục `backend/` gồm các file cấu hình `package.json`, `tsconfig.json`, `.env.example`, mã nguồn khởi động server Express cơ bản (`src/app.ts`, `src/server.ts`) và các thư mục phân tầng Layered Architecture trống có file `.gitkeep`.

### Files Changed
- `backend/package.json` (Tạo mới)
- `backend/tsconfig.json` (Tạo mới)
- `backend/.env.example` (Tạo mới)
- `backend/src/app.ts` (Tạo mới)
- `backend/src/server.ts` (Tạo mới)
- `backend/src/config/.gitkeep` (Tạo mới)
- `backend/src/middlewares/.gitkeep` (Tạo mới)
- `backend/src/modules/.gitkeep` (Tạo mới)
- `backend/src/shared/.gitkeep` (Tạo mới)

### What Went Well
- Khởi dựng thành công cấu trúc thư mục backend chuẩn phân lớp.
- Cấu hình biên dịch TypeScript tối ưu với `outDir: dist` và `rootDir: src`.
- Tích hợp các middleware bảo mật cơ bản như `helmet`, `cors` và endpoint kiểm tra sức khỏe hệ thống `/api/health`.
- Định hình sẵn global error handler middleware để chuẩn hóa phản hồi lỗi.
- Bổ sung trình xử lý lỗi lắng nghe cổng mạng (`EADDRINUSE`) giúp hiển thị thông báo lỗi tường minh khi port bị chiếm dụng.

### Issues Found
- Cảnh báo phân giải module: Phát hiện việc thiếu package `ts-node` trực tiếp trong `devDependencies` có thể khiến một số môi trường chạy `ts-node-dev` bị lỗi không khởi chạy được. Đã khắc phục bằng cách bổ sung `"ts-node": "^10.9.2"` vào `package.json`.
- Cấu hình `tsconfig.json` có thuộc tính `paths` dư thừa gây ra lỗi/cảnh báo phân giải module khi không cấu hình kèm `tsconfig-paths`. Đã tiến hành xóa bỏ phần `paths` mapping này.

### Security Review
- Authentication: N/A (Sẽ triển khai ở Milestone 3).
- Authorization: N/A.
- Data validation: N/A.
- Sensitive data: File nhạy cảm `.env` đã được bỏ qua thông qua cấu hình `.gitignore` của task T-1.1, chỉ sử dụng `.env.example` để làm mẫu cấu hình.

### Performance Review
- Query: N/A.
- Pagination: N/A.
- File handling: Sử dụng middleware `express.static('public')` làm tiền đề cho việc upload ảnh local.

### Test Review
- Unit tests: N/A.
- Integration tests: N/A.
- Negative tests: Kiểm thử biên lỗi cổng mạng (`EADDRINUSE`) thành công. Khi chạy cổng `5000` bị trùng, hệ thống đã ném lỗi và xuất log chỉ dẫn đổi cổng rõ ràng, thoát tiến trình an toàn với mã lỗi 1.
- Kiểm thử thực tế trên máy thật:
  - Khởi chạy dev server (`npm run dev`) thành công trên cổng `5001` sau khi đổi file `.env`.
  - Endpoint `http://localhost:5001/api/health` trả về kết quả JSON chính xác.
  - Lệnh build (`npm run build`) chạy biên dịch sang TypeScript sạch sẽ mà không gặp bất kỳ lỗi biên dịch nào.
  - Sự kiện dừng server bằng `Ctrl+C` (SIGINT) kích hoạt cơ chế tắt ứng dụng an toàn (graceful shutdown) thành công.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Đã kiểm thử tích hợp và kiểm thử biên thành công trên máy thật của người dùng).

### Notes
- Cấu hình server cơ bản và xử lý lỗi khởi động đã được nghiệm thu thực tế.
- Các task tiếp theo có thể tự tin sử dụng khung gầm backend này.

---

## Review: T-1.3 - Thiết lập Linter & Formatter cho Backend (ESLint, Prettier)

### Date
2026-06-14

### Summary
Thiết lập hệ thống kiểm tra coding conventions và tự động định dạng mã nguồn (Linter & Formatter) cho backend Express TypeScript bằng cách khởi tạo các file cấu hình `.eslintrc.json`, `.prettierrc`, `.prettierignore`, bổ sung devDependencies liên quan và 4 scripts chạy lint/format vào file `package.json`.

### Files Changed
- `backend/package.json` (Chỉnh sửa)
- `backend/.eslintrc.json` (Tạo mới)
- `backend/.prettierrc` (Tạo mới)
- `backend/.prettierignore` (Tạo mới)

### What Went Well
- Cấu hình thành công bộ ESLint v8 (`eslint: ^8.57.1`) ổn định kết hợp với cấu hình parser TypeScript tương ứng.
- Sử dụng `eslint-config-prettier` tắt bỏ hoàn toàn xung đột về mặt định dạng thụt lề, dấu chấm phẩy giữa ESLint và Prettier.
- Quy định bỏ qua (ignore) các thư mục phân phối (`dist/`, `node_modules/`, `coverage/`) thống nhất trên cả ESLint và Prettier thông qua `ignorePatterns` và file `.prettierignore`.
- Thêm script `format:check` giúp kiểm tra nhanh định dạng code trên CI/CD mà không thay đổi file gốc.

### Issues Found
- Cảnh báo `no-explicit-any` tại `src/server.ts`: Phát hiện warning từ ESLint tại dòng `10:26` do tham số `err` được định nghĩa kiểu `any`. Đã xử lý bằng cách khai báo interface `SystemError extends Error { code?: string; }` và thay thế kiểu dữ liệu an toàn.
- Lỗi định dạng mã nguồn phát hiện bởi `format:check`: Prettier báo cáo các file `src/app.ts` và `src/server.ts` chưa được format đúng tiêu chuẩn (ví dụ: thiếu dấu phẩy cuối ở đối tượng dưới cấu hình `"trailingComma": "all"`). Đã xử lý bằng cách chạy định dạng tự động qua Prettier.

### Security Review
- Authentication: N/A
- Authorization: N/A
- Data validation: N/A
- Sensitive data: `.prettierignore` được cấu hình để bỏ qua các file môi trường `.env` và `.env.*` nhằm tránh tình trạng định dạng ghi đè làm thay đổi cấu trúc file nhạy cảm.

### Performance Review
- N/A

### Test Review
- Unit tests: N/A
- Integration tests: N/A
- Negative tests: N/A
- Kiểm thử định dạng và biên dịch trên máy thật:
  - Ban đầu `npm run format:check` phát hiện style issues tại các file `src/app.ts` và `src/server.ts` (thiếu dấu phẩy cuối).
  - Đã xử lý định dạng tự động thành công thông qua lệnh `npm run format`.
  - Kiểm thử lại bằng `npm run format:check` thành công, không còn cảnh báo style.
  - Chạy `npm run lint` thành công, đạt kết quả sạch lỗi (0 errors, 0 warnings).
  - Chạy `npm run build` thành công, biên dịch dự án TypeScript không sinh lỗi.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Hệ thống Linter & Formatter hoạt động hoàn hảo và đã được nghiệm thu thực tế trên máy thật).

### Notes
- Hệ thống kiểm soát code style và linter đã sẵn sàng.
- Từ các task tiếp theo, nhà phát triển bắt buộc phải chạy `npm run format` và `npm run lint` trước khi yêu cầu review hoặc push code.

---

## Review: T-1.4 - Cấu hình file môi trường mẫu

### Date
2026-06-14

### Summary
Cập nhật và chuẩn hóa file mẫu cấu hình biến môi trường `backend/.env.example` chứa đầy đủ 5 nhóm cấu hình cần thiết (App, Database, JWT, Upload, Security/CORS) phục vụ toàn bộ các giai đoạn phát triển tiếp theo của dự án. Thiết lập cổng mẫu mặc định là `PORT=5001` theo đặc tả yêu cầu.

### Files Changed
- `backend/.env.example` (Chỉnh sửa)

### What Went Well
- Phân chia các nhóm biến trực quan giúp nhà phát triển dễ hiểu và điền thông tin cấu hình.
- Sử dụng các giá trị placeholder chuẩn như `replace_with_database_password` hay `replace_with_access_secret` bảo đảm an toàn, không rò rỉ thông tin bảo mật của dự án.
- Thiết lập sẵn cổng `PORT=5001` giúp tránh xung đột với cổng `5000` của các dịch vụ hệ thống khác.

### Issues Found
- Không có.

### Security Review
- Authentication: N/A.
- Authorization: N/A.
- Data validation: N/A.
- Sensitive data: Bảo đảm không chứa bất kỳ secret thật, mật khẩu database thật hay khóa ký JWT thật nào trong file mẫu. Tệp `.env` thật đã được kiểm tra và chắc chắn nằm trong danh sách bỏ qua của `.gitignore`.

### Performance Review
- N/A

### Test Review
- Unit tests: N/A
- Integration tests: N/A
- Negative tests: N/A

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (File cấu hình mẫu đã được chuẩn hóa và nghiệm thu).

### Notes
- Người dùng cần cập nhật lại tệp `.env` trên máy thật bằng cách đồng bộ theo `.env.example` mới để chuẩn bị cho giai đoạn kết nối cơ sở dữ liệu và xác thực ở các Milestones tiếp theo.
- `CORS_ORIGIN=*` chỉ phù hợp cho môi trường development/MVP. Khi lên production, cần thay `CORS_ORIGIN` bằng domain hoặc origin cụ thể.
- `CLIENT_URL=http://localhost:19006` phù hợp cho Expo Web/local, nhưng khi test trên thiết bị thật có thể cần đổi thành IP LAN của máy backend.

---

## Review: T-2.1 - Tích hợp Sequelize CLI và cấu hình kết nối Database

### Date
2026-06-14

### Summary
Tích hợp Sequelize ORM và cấu hình kết nối database MySQL dựa trên các biến môi trường cấu hình tại `.env`, đồng thời thiết lập cấu trúc cho migrations/seeders/models trong thư mục `backend/src`.

### Files Changed
- `backend/package.json` (Chỉnh sửa: Thêm `sequelize`, `mysql2`, `sequelize-cli`)
- `backend/.sequelizerc` (Tạo mới: Cấu hình đường dẫn Sequelize CLI)
- `backend/src/config/database.js` (Tạo mới: Cấu hình DB cho Sequelize CLI)
- `backend/src/shared/database/index.ts` (Tạo mới: Khởi tạo Sequelize instance và cấu hình `snake_case` mapping)
- `backend/src/server.ts` (Chỉnh sửa: Tích hợp `sequelize.authenticate()` kiểm tra kết nối DB trước khi server listen)
- `backend/src/shared/models/.gitkeep` (Tạo mới)
- `backend/src/shared/database/migrations/.gitkeep` (Tạo mới)
- `backend/src/shared/database/seeders/.gitkeep` (Tạo mới)

### What Went Well
- Cài đặt đầy đủ các thư viện và cấu hình linh hoạt cho cả môi trường phát triển (TypeScript code) và CLI (CommonJS configuration).
- Sequelize instance được cấu hình chuẩn chỉ để tự động map properties camelCase sang database snake_case.
- Server startup được ràng buộc chặt chẽ với trạng thái kết nối DB, tự động log lỗi cụ thể và dừng tiến trình an toàn khi kết nối DB lỗi.

### Issues Found
- Ban đầu T-2.1 có warning `no-explicit-any` tại file `src/shared/database/index.ts` đối với kiểu của `dbDialect` và `dbPassword`. Đã xử lý triệt để bằng cách import type an toàn `Dialect` từ Sequelize và chuyển đổi kiểu của `dbPassword` thành `string | undefined` thay vì ép kiểu `any`.

### Security Review
- Authentication: N/A.
- Authorization: N/A.
- Data validation: N/A.
- Sensitive data: Không chứa bất kỳ thông tin nhạy cảm hay mật khẩu database hardcode nào. Tất cả cấu hình được nạp từ biến môi trường của file `.env` (file này đã được loại bỏ thông qua `.gitignore`). Đồng thời việc log lỗi kết nối DB được catch an toàn không làm rò rỉ connection string chứa mật khẩu.

### Performance Review
- Query: N/A.
- Pagination: N/A.
- File handling: N/A.

### Test Review
- Unit tests: N/A.
- Integration tests: N/A.
- Negative tests: Đã bắt lỗi kết nối cơ sở dữ liệu và log ra thông tin lỗi chi tiết của driver/mạng một cách an toàn mà không làm app crash không rõ lý do.
- Thực nghiệm kiểm thử trên máy thật:
  - Chạy `npx sequelize-cli db:create` thành công, tạo cơ sở dữ liệu `dailysnap_expense` trong MySQL.
  - Chạy `npx sequelize-cli db:migrate:status` thành công, Sequelize CLI kết nối cơ sở dữ liệu chính xác và tạo bảng quản lý lịch sử migration `SequelizeMeta` thành công.
  - Sửa lỗi ban đầu `Access denied for user 'root'@'localhost' (using password: NO)` bằng cách cấu hình đúng `DATABASE_PASSWORD` trong file `.env` thật.
  - `npm run format:check`, `npm run lint` và `npm run build` đều vượt qua thành công (pass). Các warning `no-explicit-any` trong `src/shared/database/index.ts` đã được giải quyết triệt để bằng kiểu dữ liệu an toàn (`Dialect` và `string | undefined`).
  - Chạy `npm run dev` thành công, ghi nhận log kết nối database thành công và server Express hoạt động tại cổng 5001.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Nghiệm thu hoàn tất sau khi kiểm thử thành công trên máy thật).

### Notes
- Người dùng cần cài đặt dependencies mới (`npm install`) và chạy `npx sequelize-cli db:create` để tạo database trên môi trường MySQL local trước khi khởi động ứng dụng.

---

## Review: T-2.2 - Tạo migration cho bảng users

### Date
2026-06-14

### Summary
Tạo file migration khởi tạo cấu trúc bảng `users` trong cơ sở dữ liệu MySQL với các ràng buộc về unique index cho `username` và `email`, thiết lập giá trị mặc định cho `role`, `is_active` và cấu trúc soft delete bằng cột `deleted_at`.

### Files Changed
- `backend/src/shared/database/migrations/20260614010830-create-users.js` (Tạo mới)

### What Went Well
- Cấu trúc bảng `users` được thiết kế chặt chẽ kết hợp giữa tài liệu thiết kế cơ sở dữ liệu (`username` dùng cho Friendship/Auth) và các trường mở rộng yêu cầu.
- Các index/constraint unique (`users_username_unique`, `users_email_unique`) được đặt tên cụ thể, rõ ràng.
- Migration status đã chuyển đổi thành công từ `down` sang `up` sau khi chạy lệnh migrate.
- Bảng `users` đã tồn tại thực tế trong DB `dailysnap_expense` đúng theo thiết kế.

### Issues Found
- File migration `.js` được tạo thủ công ban đầu chưa pass style format của Prettier. Đã được format lại bằng lệnh `npx prettier --write` và hoàn toàn pass `npm run format:check` sau đó.

### Security Review
- Authentication: N/A (Chưa triển khai logic ở task này).
- Authorization: N/A (Chưa triển khai logic ở task này).
- Data validation: N/A.
- Sensitive data: Cột `password_hash` được tạo để sẵn sàng lưu mật khẩu mã hóa an toàn, không có thông tin nhạy cảm nào bị hardcode.

### Performance Review
- Query: Unique index trên `username` và `email` tối ưu hóa thời gian tìm kiếm người dùng và tốc độ đăng nhập.
- Pagination: N/A.
- File handling: N/A.

### Test Review
- Unit tests: N/A.
- Integration tests: N/A.
- Negative tests: N/A.
- Thực nghiệm kiểm thử trên máy thật:
  - Chạy `npx sequelize-cli db:migrate:status` chuyển từ `down` sang `up` thành công.
  - Kiểm tra trực tiếp bảng và cấu trúc cột trong MySQL/DBeaver thành công.
  - Các lệnh kiểm tra style và linter backend (`npm run format:check`, `npm run lint`) pass 100%.
  - Biên dịch dự án TypeScript (`npm run build`) không có lỗi.
  - Chạy server development (`npm run dev`) kết nối DB và lắng nghe cổng 5001 thành công.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Migration đã chạy thành công và các bước kiểm thử kiểm tra đều pass trên máy thật).

### Notes
- Giá trị UUID cho `id` sẽ được sinh ở application layer (model/service) ở các bước sau vì MySQL không tự sinh UUID mặc định ổn định.

---

## Review: T-2.3 - Thiết lập Base App Express & Global Error Handler

### Date
2026-06-14

### Summary
Thiết lập khung ứng dụng Express vững chắc với lớp lỗi tùy chỉnh `AppError` và middleware xử lý lỗi tập trung (`errorHandler`), tích hợp kèm middleware xử lý lỗi route không tồn tại (`notFoundHandler`). Cấu trúc phản hồi lỗi JSON tuân thủ đầy đủ đặc tả API.

### Files Changed
- `backend/src/shared/utils/appError.ts` (Tạo mới)
- `backend/src/middlewares/error.middleware.ts` (Tạo mới)
- `backend/src/app.ts` (Chỉnh sửa)

### What Went Well
- Global error handler được tích hợp thành công, định dạng toàn bộ response lỗi về JSON chuẩn theo `docs/08-api.md`.
- Lớp `AppError` và helper `catchAsync` được xây dựng hoàn toàn type-safe, không sử dụng `any`, không lạm dụng `eslint-disable`.
- Cơ chế 404 handler (`notFoundHandler`) hoạt động tốt, trả về JSON lỗi chuẩn khi truy cập route không tồn tại (không trả HTML mặc định của Express).
- Cấu hình phân chia môi trường hoạt động tốt: Trả thêm trường `stack` ở môi trường `development` và ẩn nó đi ở `production`.
- Đã kiểm tra thực nghiệm và chứng minh được `catchAsync` bắt lỗi bất đồng bộ thành công.

### Issues Found
- Ban đầu một số file code mới tạo (`src/app.ts` và `src/middlewares/error.middleware.ts`) chưa pass kiểm tra code format của Prettier. Đã được định dạng lại hoàn chỉnh bằng lệnh `npm run format`.

### Security Review
- Authentication: N/A.
- Authorization: N/A.
- Data validation: N/A.
- Sensitive data: Ghi nhận console.error được lọc và không log các dữ liệu nhạy cảm như password, JWT secret, connection string.

### Performance Review
- N/A.

### Test Review
- Unit tests: N/A.
- Integration tests: N/A.
- Negative tests: Đã giả lập lỗi 400 (Bad Request), 404 (Not Found), 500 (Sync/Async Internal Error) và xác minh JSON response phản hồi đúng cấu trúc.
- Thực nghiệm kiểm thử trên máy thật:
  - `npm run format:check` pass.
  - `npm run lint` pass.
  - `npm run build` pass.
  - `npm run dev` pass (server kết nối database thành công).
  - Test trực tiếp các endpoint `GET /api/health`, `GET /api/not-exist`, `GET /api/test-error?type=bad_request`, `GET /api/test-error?type=async_error` đều cho kết quả khớp mong muốn.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Các chức năng thiết lập khung Express và xử lý lỗi tập trung hoạt động tốt và pass toàn bộ bước kiểm thử trên máy thật).

---

## Review: T-2.4 - Phát triển Validation Middleware bằng Zod

### Date
2026-06-14

### Summary
Phát triển middleware kiểm chứng dữ liệu đầu vào `validateRequest` tập trung bằng cách sử dụng Zod, tích hợp xử lý lỗi format validation chi tiết `VALIDATION_ERROR` (HTTP 400). Đồng thời, tối ưu cơ chế Global Error Handler để bắt lỗi JSON malformed từ body parser trả về `BAD_REQUEST` thay vì `INTERNAL_SERVER_ERROR`.

### Files Changed
- `backend/src/middlewares/validation.middleware.ts` (Tạo mới)
- `backend/src/middlewares/error.middleware.ts` (Chỉnh sửa)
- `backend/src/app.ts` (Chỉnh sửa)

### What Went Well
- Middleware `validateRequest` hoạt động tốt và kiểm chứng đầy đủ đồng thời `body`, `query`, `params`.
- Lỗi kiểm chứng dữ liệu (Zod validation fail) trả về lỗi JSON chuẩn hóa dạng `VALIDATION_ERROR` với HTTP status `400` và danh sách chi tiết các trường bị lỗi trong `details`.
- Lỗi JSON body gửi lên sai cú pháp được bắt gọn ở global error handler, trả về HTTP status `400` với mã lỗi `BAD_REQUEST` và thông điệp `"JSON body không hợp lệ."` rõ ràng, không expose stack trace ở production.
- Code viết hoàn toàn type-safe, tuân thủ nghiêm ngặt các quy tắc kiến trúc và không lạm dụng `any` hay `eslint-disable`.

### Issues Found
- Ban đầu Prettier báo lỗi format trên các file mới tạo/sửa đổi. Đã được xử lý triệt để bằng lệnh `npm run format`.

### Security Review
- Authentication: N/A.
- Authorization: N/A.
- Data validation: Đã tích hợp validateRequest bảo vệ an toàn cho dữ liệu đầu vào.
- Sensitive data: N/A.

### Performance Review
- N/A.

### Test Review
- Unit tests: N/A.
- Integration tests: N/A.
- Negative tests: Đã giả lập gửi dữ liệu thiếu/sai kiểu dữ liệu (trả về 400 VALIDATION_ERROR) và gửi JSON hỏng cú pháp (trả về 400 BAD_REQUEST).
- Thực nghiệm kiểm thử trên máy thật:
  - Các lệnh format check, lint, build và dev server khởi chạy thành công.
  - Test validation hợp lệ trả về `HTTP 200` và coerce kiểu dữ liệu chính xác (query.limit từ string sang number).
  - Test validation lỗi trả về `HTTP 400` đúng format `VALIDATION_ERROR`.
  - Test malformed JSON trả về `HTTP 400` đúng format `BAD_REQUEST`.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Middleware kiểm chứng Zod hoạt động hoàn hảo và đã được nghiệm thu thực tế).

---

## Review: T-3.1 - Phát triển tiện ích mã hóa mật khẩu

### Date
2026-06-14

### Summary
Phát triển tiện ích mã hóa và so sánh mật khẩu an toàn sử dụng thư viện `bcrypt`, cấu hình framework kiểm thử Jest cho backend và viết các test cases kiểm tra đầy đủ các kịch bản thành công cũng như các kịch bản biên/lỗi.

### Files Changed
- `backend/package.json` (Chỉnh sửa: Thêm scripts test, dependencies `bcrypt`, và devDependencies `jest`, `ts-jest`, `@types/bcrypt`, `@types/jest`)
- `backend/jest.config.js` (Tạo mới: Cấu hình Jest chạy test trong `src`, loại trừ `dist` và `node_modules`)
- `backend/src/modules/auth/helpers/bcrypt.helper.ts` (Tạo mới: Lớp utility `BcryptHelper`)
- `backend/src/modules/auth/helpers/bcrypt.helper.spec.ts` (Tạo mới: Unit test cho `BcryptHelper` với 9 test cases)

### What Went Well
- Tiện ích `BcryptHelper` được viết type-safe và clean code, không sử dụng `any`, không lạm dụng `eslint-disable`.
- Đã cấu hình và tích hợp thành công framework kiểm thử Jest cùng `ts-jest` cho backend TypeScript.
- Viết đầy đủ kịch bản kiểm thử (unit test) đạt độ bao phủ cao (9/9 cases).
- Xử lý tốt các tình huống biên như mật khẩu rỗng và xử lý an toàn lỗi giải mã mật khẩu không hợp lệ, không gây crash ứng dụng.

### Issues Found
- Cảnh báo của Prettier định dạng file chưa chuẩn ban đầu và lỗi ESLint `error is defined but never used` khi catch lỗi trong method `comparePassword`. Đã xử lý triệt để bằng cách chạy `npm run format` định dạng lại các file và sửa thành optional catch binding `catch {}` trong file `bcrypt.helper.ts`.
- Ghi nhận cảnh báo `EBADENGINE` và `npm audit vulnerabilities` khi cài đặt các packages do phiên bản Node hiện tại (`v22.12.0`) lệch nhẹ so với engine đề xuất. Tuy nhiên, việc này chưa cần xử lý trong phạm vi task này để tránh thay đổi dependency ngoài phạm vi.

### Security Review
- Authentication: Chuẩn bị cơ sở bảo mật cho luồng đăng ký/đăng nhập.
- Authorization: N/A.
- Data validation: Mật khẩu rỗng bị phát hiện và throw error lập tức.
- Sensitive data: Salt rounds mặc định là `10` theo đúng yêu cầu nghiệp vụ. Đảm bảo tuyệt đối không log plain password hoặc password hash trong code.

### Performance Review
- N/A.

### Test Review
- Unit tests: Viết đầy đủ unit tests và chạy pass 9/9 cases:
  1. `hashPassword` trả về string hash.
  2. Hash không trùng với plain password.
  3. Cùng một password hash nhiều lần tạo hash khác nhau do random salt.
  4. Mật khẩu trống hoặc chỉ chứa khoảng trắng bị reject.
  5. `comparePassword` trả về `true` với mật khẩu chính xác.
  6. `comparePassword` trả về `false` với mật khẩu sai.
  7. Mật khẩu rỗng khi compare bị reject.
  8. Hash rỗng trả về `false` an toàn.
  9. Hash sai định dạng trả về `false` an toàn, không crash.
- Integration tests: N/A.
- Negative tests: Đã phủ kín các test cases cho mật khẩu trống, hash trống và hash lỗi định dạng.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Tiện ích hoạt động tốt, pass tất cả các kiểm tra format, lint, unit test và build trên máy thật).

---

## Review: T-3.2 - Viết logic TokenService sinh/xác thực JWT

### Date
2026-06-14

### Summary
Phát triển dịch vụ `TokenService` sử dụng thư viện `jsonwebtoken` để sinh và xác thực Access Token (hạn 15 phút) và Refresh Token (hạn 7 ngày). Triển khai cấu trúc cấu hình động, giúp nạp linh hoạt cấu hình từ biến môi trường trong runtime và hỗ trợ inject cấu hình tùy biến trong các Unit Test mà không dùng secret thật.

### Files Changed
- `backend/package.json` (Chỉnh sửa: Thêm `jsonwebtoken` vào `dependencies`, `@types/jsonwebtoken` vào `devDependencies`)
- `backend/src/modules/auth/services/token.service.ts` (Tạo mới: Dịch vụ `TokenService`)
- `backend/src/modules/auth/services/token.service.spec.ts` (Tạo mới: Unit test cho `TokenService`)

### What Went Well
- Class `TokenService` được viết type-safe và clean code, ném ra các lỗi `AppError` chuẩn hóa của dự án.
- Thiết lập phương thức `resolveExpiresIn` để chuyển đổi và validate an toàn dữ liệu từ biến môi trường (convert số nguyên sang `number`, kiểm soát kiểu `SignOptions['expiresIn']` của jsonwebtoken một cách chặt chẽ).
- Tích hợp Jest unit tests đầy đủ, sử dụng Jest Fake Timers (`jest.useFakeTimers()`, `jest.setSystemTime()`) để giả lập và kiểm tra lỗi hết hạn của token cực kỳ an toàn, chính xác và hoàn toàn không bị flaky.
- Toàn bộ 23/23 tests pass sạch sẽ (bao gồm 9 test cases của `BcryptHelper` và 14 test cases của `TokenService`).

### Issues Found
- Phát hiện lỗi build TypeScript tại thuộc tính `expiresIn` do khai báo kiểu dữ liệu `string | number` quá rộng so với kiểu `SignOptions['expiresIn']` (đòi hỏi `StringValue | number | undefined`). Đã khắc phục hoàn toàn bằng cách sử dụng kiểu dữ liệu `SignOptions['expiresIn']` và xử lý validate an toàn thông qua helper `resolveExpiresIn`.
- Cảnh báo `EBADENGINE` and `npm audit vulnerabilities` khi cài đặt các packages do phiên bản Node hiện tại lệch nhẹ so với engine đề xuất. Tuy nhiên, việc này chưa cần xử lý trong phạm vi task này để tránh thay đổi dependency ngoài phạm vi.

### Security Review
- Authentication: Hỗ trợ sinh và xác thực token JWT, làm nền tảng cho Authentication của toàn bộ hệ thống.
- Authorization: N/A.
- Data validation: Xác thực token payload rỗng, token hết hạn, token sai chữ ký và token malformed đều được bắt gọn và trả về mã lỗi thích hợp.
- Sensitive data: Tuyệt đối không log thông tin nhạy cảm (JWT Secret, Access Token, Refresh Token). Unit test sử dụng mock secret giả (`test_access_secret`, `test_refresh_secret`).

### Performance Review
- N/A.

### Test Review
- Unit tests: Viết đầy đủ unit tests và chạy pass 14/14 test cases cho `TokenService`:
  1. `generateAccessToken` tạo token dạng string.
  2. `generateRefreshToken` tạo token dạng string.
  3. `generateAuthTokens` trả về đủ cả `accessToken` và `refreshToken`.
  4. `verifyAccessToken` trả về đúng `userId` với token hợp lệ.
  5. `verifyRefreshToken` trả về đúng `userId` với token hợp lệ.
  6. Access token không thể được verify bằng refresh secret.
  7. Refresh token không thể được verify bằng access secret.
  8. Token bị sửa đổi/malformed throw lỗi `INVALID_TOKEN` (HTTP 401).
  9. Token hết hạn throw lỗi `TOKEN_EXPIRED` (HTTP 401).
  10. Thiếu cấu hình JWT (thiếu secret, thiếu expiresIn) throw lỗi `CONFIG_ERROR` (HTTP 500).
- Integration tests: N/A.
- Negative tests: Đã phủ kín các test cases cho token hết hạn, sai chữ ký, malformed và lỗi cấu hình.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Dịch vụ TokenService hoạt động tốt, pass tất cả các kiểm tra format, lint, unit test và build trên máy thật).

---

## Review: T-3.3 - Endpoint Đăng ký tài khoản (POST /api/v1/auth/register)

### Date
2026-06-14

### Summary
Phát triển hoàn chỉnh API đăng ký tài khoản người dùng `/api/v1/auth/register`, bao gồm định nghĩa Sequelize model `User` tương ứng bảng `users`, xây dựng validator schema Zod `registerSchema` (tự động trim và normalize lowercase username/email), viết `AuthService` xử lý logic kiểm tra trùng lặp và băm mật khẩu, viết `AuthController` điều phối, mount route tương ứng và viết integration test kiểm định chất lượng end-to-end API.

### Files Changed
- `backend/package.json` (Chỉnh sửa: Thêm `supertest` và `@types/supertest` vào devDependencies)
- `backend/src/app.ts` (Chỉnh sửa: Đăng ký router `authRoutes` tại đường dẫn `/api/v1/auth`)
- `backend/src/shared/models/user.model.ts` (Tạo mới: Sequelize model `User`)
- `backend/src/modules/auth/validators/auth.validator.ts` (Tạo mới: Schema Zod validator)
- `backend/src/modules/auth/services/auth.service.ts` (Tạo mới: Xử lý logic đăng ký tài khoản)
- `backend/src/modules/auth/controllers/auth.controller.ts` (Tạo mới: Xử lý request/response HTTP)
- `backend/src/modules/auth/routes/auth.routes.ts` (Tạo mới: Định nghĩa route)
- `backend/src/modules/auth/routes/auth.routes.spec.ts` (Tạo mới: Integration test cho API đăng ký)

### What Went Well
- API hoạt động tốt, trả về HTTP status `201 Created` và định dạng JSON thành công chuẩn với thông tin user (đã loại bỏ `password_hash`) cùng bộ tokens (Access/Refresh).
- Tích hợp thành công middleware `validateRequest` tập trung để kiểm định dữ liệu đầu vào.
- Thiết kế integration test hoàn thiện, sử dụng `supertest` giả lập request, tự động xóa sạch dữ liệu user test được tạo trong suite bằng hook `afterAll` với `{ force: true }` để bypass paranoid soft delete, đảm bảo không bẩn cơ sở dữ liệu dev.
- Toàn bộ 29/29 tests pass sạch sẽ (bao gồm 9 tests của `BcryptHelper`, 14 tests của `TokenService` và 6 tests của `Auth Registration Integration Tests`).

### Issues Found & Resolved
- **Lỗi cú pháp `src/app.ts`**: Do thiếu dấu kết thúc hàm `);` của endpoint `/api/test-validation` và thiếu dấu đóng block dev routes. Đã xử lý khôi phục lại cú pháp chuẩn của Express.
- **Lỗi kiểu dữ liệu `validateRequest` trong `auth.routes.ts`**: Truyền sai ZodObject vào middleware `validateRequest` vốn mong đợi một `ValidationSchemas` object. Đã xử lý bằng cách tách schema body thành `registerBodySchema` và khai báo `registerSchema = { body: registerBodySchema }`.
- **Lỗi `notNull Violation: User.id cannot be null`**: Do hook `beforeValidate` của Model không tự động gán giá trị ID tại application layer khi Sequelize build query. Đã xử lý bằng cách khai báo `defaultValue: DataTypes.UUIDV4` trực tiếp tại cấu hình trường `id` của model attribute, giúp Sequelize tự động sinh UUID an toàn.
- **Cảnh báo shadow getter/setter của Sequelize**: Khai báo các thuộc tính `id!`, `username!` dạng public class fields gây shadow getters/setters của Sequelize. Đã xử lý bằng cách thay thế sang từ khóa `declare` (`declare id: string`, v.v.).
- **Lỗi Jest open handle**: Kết nối tới cơ sở dữ liệu MySQL của Sequelize instance bị giữ lại sau test suite. Đã xử lý bằng cách import `sequelize` và gọi `await sequelize.close()` trong block `finally` của `afterAll` hook tại file spec.
- **Cảnh báo cài đặt package**: Ghi nhận các cảnh báo `EBADENGINE` (Node version lệch nhẹ), npm audit vulnerabilities và các deprecated packages (npmlog, rimraf, tar...). Tuy nhiên, việc này chưa cần xử lý trong phạm vi task này để tránh thay đổi dependency ngoài phạm vi.

### Security Review
- Authentication: Nền tảng đăng ký tài khoản cấp token.
- Authorization: N/A.
- Data validation: Zod validator bắt chặt định dạng email, mật khẩu tối thiểu 6 ký tự, username chỉ chứa chữ/số/dấu gạch dưới.
- Sensitive data: Tuyệt đối không log thông tin nhạy cảm. Không trả về `password_hash` cho Client trong DTO.

### Performance Review
- Database: Tận dụng các Unique Index trên `username` và `email` của bảng `users` được thiết lập ở migration T-2.2 giúp truy vấn kiểm tra trùng lặp tối ưu nhất.

### Test Review
- Unit/Integration tests: Chạy pass 6/6 test cases của Integration Test Suite:
  1. Đăng ký thành công trả về HTTP 201 cùng DTO an toàn (đầy đủ tokens, không rò rỉ `password_hash`).
  2. Định dạng email không hợp lệ trả về HTTP 400 (`VALIDATION_ERROR`).
  3. Mật khẩu quá ngắn (< 6 kí tự) trả về HTTP 400 (`VALIDATION_ERROR`).
  4. Username sai định dạng (có khoảng trắng/kí tự đặc biệt) trả về HTTP 400 (`VALIDATION_ERROR`).
  5. Đăng ký email đã tồn tại trả về HTTP 400 (`EMAIL_ALREADY_EXISTS`).
  6. Đăng ký username đã tồn tại trả về HTTP 400 (`USERNAME_ALREADY_EXISTS`).

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Endpoint Đăng ký hoạt động tốt, pass tất cả các kiểm tra format, lint, unit/integration test, build và chạy thực tế thành công).

---

## Review: T-3.3-refactor - Tách UserRepository cho Auth Register

### Date
2026-06-15

### Summary
Phát hiện và khắc phục lỗi lệch kiến trúc tại task T-3.3, trong đó `AuthService` gọi trực tiếp Sequelize model `User.findOne` và `User.create`. Đã tiến hành tách lớp `UserRepository` trong module `users` để đóng gói các truy vấn cơ sở dữ liệu và ánh xạ dữ liệu đầu vào.

### Files Changed
- `backend/src/modules/users/repositories/user.repository.ts` (Tạo mới)
- `backend/src/modules/auth/services/auth.service.ts` (Chỉnh sửa)

### What Went Well
- Tách thành công `UserRepository` với đầy đủ các phương thức truy vấn cần thiết (`findByEmail`, `findByUsername`, `create`).
- Loại bỏ hoàn toàn sự phụ thuộc trực tiếp vào Sequelize model `User` trong lớp `AuthService`.
- Luồng kiến trúc hiện tại tuân thủ chính xác thiết kế: `Route -> Controller -> Service -> Repository -> Model/Database`.
- Ánh xạ rõ ràng các trường dữ liệu từ camelCase sang snake_case ở tầng Repository (`passwordHash` -> `password_hash`, `isActive` -> `is_active`).
- Toàn bộ các kiểm tra chất lượng, định dạng code và kiểm thử tự động đều thành công tốt đẹp.

### Issues Found
- Không có.

### Security Review
- Authentication: N/A.
- Authorization: N/A.
- Data validation: Đảm bảo dữ liệu an toàn, không trả `password_hash` ra response, không log password hoặc token.

### Performance Review
- Query: Sử dụng các phương thức tìm kiếm tối ưu qua `UserRepository`.
- Pagination: N/A.

### Test Review
Nghiệm thu toàn bộ kiểm thử trên môi trường thực tế:
- `npm run format` & `npm run format:check` vượt qua thành công (pass).
- `npm run lint` vượt qua thành công mà không có lỗi hay cảnh báo (pass).
- Chạy kiểm thử tự động `npm run test` thành công tốt đẹp với **3 test suites** và **29 tests** pass sạch sẽ (bao gồm 6 tests cho endpoint register).
- `npm run build` biên dịch dự án TypeScript thành công không gặp lỗi.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Refactor thành công, hệ thống hoạt động ổn định và tuân thủ đúng Layered Architecture).

---

## Review: T-3.4 - Endpoint Đăng nhập (POST /api/v1/auth/login)

### Date
2026-06-15

### Summary
Phát triển thành công endpoint đăng nhập người dùng `/api/v1/auth/login`. Đảm bảo tuân thủ nghiêm ngặt mô hình kiến trúc phân tầng Layered Architecture: `Route -> Validation Middleware -> Controller -> Service -> Repository -> Model/Database`.

### Files Changed
- `backend/src/modules/users/repositories/user.repository.ts` (Chỉnh sửa: Thêm `findByIdentity`, `updateLastLogin`)
- `backend/src/modules/auth/validators/auth.validator.ts` (Chỉnh sửa: Thêm `loginBodySchema`, `loginSchema`)
- `backend/src/modules/auth/services/auth.service.ts` (Chỉnh sửa: Thêm interface `LoginDto`, phương thức `login`)
- `backend/src/modules/auth/controllers/auth.controller.ts` (Chỉnh sửa: Thêm phương thức `login`)
- `backend/src/modules/auth/routes/auth.routes.ts` (Chỉnh sửa: Khai báo route `/login`)
- `backend/src/modules/auth/routes/auth.routes.spec.ts` (Chỉnh sửa: Thêm 7 test cases cho endpoint login)

### What Went Well
- Luồng hoạt động hoàn toàn chính xác theo Layered Architecture: `AuthService` và `AuthController` không import hay gọi trực tiếp Sequelize model `User`. Mọi thao tác truy vấn và ghi cơ sở dữ liệu được bao bọc an toàn trong `UserRepository`.
- Sử dụng Zod validate chặt chẽ dữ liệu đầu vào (`identity`, `password`).
- Hỗ trợ đăng nhập linh hoạt bằng cả email hoặc username (identity).
- Login thành công trả về HTTP 200, cấp cặp JWT Access Token và Refresh Token, đồng thời cập nhật chính xác cột `last_login_at` trong DB.
- Trả về DTO an toàn cho client, loại bỏ hoàn toàn password_hash khỏi response.
- Không log các thông tin nhạy cảm như mật khẩu hay token.

### Issues Found
- Không có.

### Security Review
- Authentication: Cung cấp API login cấp token xác thực cho session.
- Authorization: Kiểm tra kỹ trạng thái tài khoản `is_active` trước khi cấp phép đăng nhập.
- Data validation: Dữ liệu đầu vào được validate và sanitize chặt chẽ (trim, lowercase email/username).
- Sensitive data: Không trả về mật khẩu mã hóa trong response.

### Performance Review
- Query: Truy vấn tìm kiếm user thông qua `UserRepository.findByIdentity` tối ưu nhất nhờ unique indexes của DB trên `email` và `username`.

### Test Review
Nghiệm thu toàn bộ kiểm thử trên môi trường thực tế:
- `npm run format` & `npm run format:check` vượt qua thành công (pass).
- `npm run lint` vượt qua thành công (pass).
- `npm run test` chạy thành công **3 test suites** và **36 tests** pass sạch sẽ (gồm 29 tests cũ và thêm 7 tests mới cho API login).
- `npm run build` biên dịch TypeScript pass 100%.
- `npm run dev` khởi chạy dev server thành công.
- Lưu ý: Các console log báo lỗi trong quá trình chạy Jest test suite là các hành vi ném lỗi có chủ đích khi thực hiện các Negative Test Cases (sai password, inactive user, identity không tồn tại).

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Endpoint Đăng nhập hoạt động tốt, tuân thủ kiến trúc phân tầng Layered Architecture và hoàn thành đầy đủ yêu cầu).

---

## Review: T-3.4-refactor-docs - Chuẩn hóa Auth DTO và siết lại Architecture Docs

### Date
2026-06-15

### Summary
Tiến hành tách biệt các interface/types đại diện cho DTO (`RegisterDto`, `LoginDto`, `AuthResponseDto`) từ `AuthService` sang một file riêng `dtos/auth.dto.ts`. Đồng thời rà soát và siết chặt các quy định về ranh giới giữa các lớp trong tài liệu kiến trúc hệ thống (`docs/05-architecture.md`) và quy tắc viết code backend (`docs/10-coding-rule.md`).

### Files Changed
- `backend/src/modules/auth/dtos/auth.dto.ts` (Tạo mới)
- `backend/src/modules/auth/services/auth.service.ts` (Chỉnh sửa)
- `docs/05-architecture.md` (Chỉnh sửa)
- `docs/10-coding-rule.md` (Chỉnh sửa)
- `docs/11-task.md` (Chỉnh sửa)
- `docs/12-review.md` (Chỉnh sửa)

### What Went Well
- Tách DTO sạch sẽ sang file riêng giúp code trong `AuthService` chỉ tập trung vào business logic đăng ký/đăng nhập.
- Làm rõ ràng ranh giới Layered Architecture trong tài liệu:
  * Quy trình chuẩn: `Route -> Validation Middleware -> Controller -> Service -> Repository -> Model/Database`.
  * Gắn validation middleware tại Route. Controller và Service tuyệt đối không được gọi hay import Sequelize Model.
  * Chỉ duy nhất Repository được quyền thực hiện các truy vấn cơ sở dữ liệu qua Sequelize Model.
  * Khuyến khích tách DTO/type ra file riêng để tái sử dụng.
- Tất cả unit tests và integration tests (36/36) pass sạch sẽ. Định dạng code (format) và linting hoàn toàn sạch lỗi.

### Issues Found
- Không có.

### Security Review
- N/A.

### Performance Review
- N/A.

### Test Review
Nghiệm thu toàn bộ kiểm thử trên môi trường thực tế:
- `npm run format` & `npm run format:check` vượt qua thành công (pass).
- `npm run lint` vượt qua thành công (pass).
- `npm run test` chạy thành công **3 test suites** và **36 tests** pass sạch sẽ.
- `npm run build` biên dịch TypeScript pass 100%.

### Documentation Updated
- Yes
- Files: `docs/05-architecture.md`, `docs/10-coding-rule.md`, `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Refactor cấu trúc code DTO và siết chặt tài liệu kiến trúc hoàn thành xuất sắc, đảm bảo chất lượng codebase sạch sẽ).

---

## Review: T-3.5 - Endpoint Refresh Token và Đăng xuất

### Date
2026-06-15

### Summary
Triển khai hoàn chỉnh cơ chế bảo mật phiên làm việc sử dụng Refresh Token kết hợp cơ chế Refresh Token Rotation (RTR) và tính năng Đăng xuất an toàn.

### Files Changed
- `backend/src/shared/database/migrations/20260615000000-create-refresh-tokens.js` (Tạo mới migration)
- `backend/src/shared/models/refresh-token.model.ts` (Tạo mới model)
- `backend/src/modules/auth/repositories/refresh-token.repository.ts` (Tạo mới repository)
- `backend/src/modules/auth/dtos/auth.dto.ts` (Chỉnh sửa để thêm RefreshDto, LogoutDto)
- `backend/src/modules/auth/validators/auth.validator.ts` (Chỉnh sửa để thêm refreshSchema, logoutSchema)
- `backend/src/modules/auth/services/token.service.ts` (Chỉnh sửa để refresh token có jti claim và quản lý hạn dùng)
- `backend/src/modules/auth/services/auth.service.ts` (Chỉnh sửa để tích hợp lưu token ở login/register, xử lý xoay vòng token RTR và thu hồi khi logout)
- `backend/src/modules/auth/controllers/auth.controller.ts` (Chỉnh sửa thêm controller refresh và logout)
- `backend/src/modules/auth/routes/auth.routes.ts` (Chỉnh sửa cấu hình endpoint)
- `backend/src/modules/auth/routes/auth.routes.spec.ts` (Chỉnh sửa tích hợp các test cases của T-3.5)

### What Went Well
- Đã cấu hình và khởi chạy migration tạo bảng `refresh_tokens` lưu phiên làm việc của refresh token thông qua định danh duy nhất UUID (`jti`).
- Đã thiết lập model `RefreshToken` và repository `RefreshTokenRepository` đúng kiến trúc phân lớp Backend.
- `TokenService` đã tự động sinh claim `jti` bằng UUID của Node (`crypto.randomUUID()`) trong payload refresh token.
- Quá trình đăng ký và đăng nhập được cập nhật đồng bộ để tạo và lưu thông tin UUID `jti` của refresh token vào cơ sở dữ liệu.
- Tích hợp thành công và an toàn hai API cốt lõi:
  - `POST /api/v1/auth/refresh`: Dùng cho cơ chế làm mới access token & refresh token.
  - `POST /api/v1/auth/logout`: Thu hồi token khi người dùng đăng xuất.
- Cơ chế Refresh Token Rotation (RTR) đã hoạt động trơn tru:
  - Token cũ bị xoay vòng, xóa khỏi database ngay sau khi refresh thành công.
  - Hành vi cố tình tái sử dụng token cũ lập tức trả về HTTP 401 với code `INVALID_TOKEN`.
- Tính năng đăng xuất an toàn đã hoạt động:
  - Logout sẽ thực hiện thu hồi/xóa refresh token khỏi database thay vì chỉ xóa ở phía client.
  - Tái sử dụng refresh token đã bị logout lập tức trả về HTTP 401 với code `INVALID_TOKEN`.
- Bảo mật thông tin được đảm bảo tuyệt đối, response DTO trả về cho client hoàn toàn không rò rỉ các trường nhạy cảm: `jti`, `refreshTokenId`, `refreshTokenExpiresAt`, `password_hash`.
- Đảm bảo nghiêm ngặt ranh giới kiến trúc: Service và Controller hoàn toàn không import hay gọi trực tiếp Sequelize Model; tầng duy nhất giao tiếp database là Repository.
- Biên dịch TypeScript (build) thành công 100%.

### Technical Notes
- **Phân chia trách nhiệm xác thực**:
  - `jwt.verify` chịu trách nhiệm kiểm tra tính hợp lệ về mặt mật mã (signature) và thời hạn hết hạn (`exp`) của refresh token phía client gửi lên.
  - Cơ sở dữ liệu chịu trách nhiệm kiểm tra xem phiên làm việc tương ứng với token đó có còn tồn tại và được server công nhận hay không (tránh các trường hợp token đã bị rotate/logout trước đó).
- **Xử lý timezone trong database**:
  - Do kiểu dữ liệu `DATETIME` trong MySQL không lưu trữ thông tin múi giờ, việc sử dụng điều kiện `expires_at > now` trực tiếp trong câu lệnh SQL `destroy` dễ phát sinh sai số hoặc so lệch múi giờ trên các môi trường local khác nhau.
  - Giải pháp tối ưu và an toàn nhất là xóa bản ghi trực tiếp theo `id` (claim `jti`). Vì chữ ký và thời hạn của JWT đã được xác thực an toàn ở tầng ứng dụng bằng `jsonwebtoken`, việc truy vấn xóa trực tiếp theo `id` là hoàn toàn chính xác và tránh được các lỗi so sánh ngày giờ ở database.

### Issues Found
- Không có. Các log cảnh báo lỗi `console.error` hiển thị trong Jest là hành vi ném lỗi mong muốn và có chủ đích từ các trường hợp kiểm thử negative test cases (như kiểm tra các trường hợp truyền token malformed hoặc rỗng).

### Security Review
- Áp dụng thành công cơ chế Refresh Token Rotation (RTR) bảo vệ người dùng trước nguy cơ rò rỉ token.
- Không rò rỉ bất kỳ siêu dữ liệu nội bộ nào (`password_hash`, `jti`, `refreshTokenExpiresAt`, `refreshTokenId`).

### Performance Review
- Cột `user_id` và `expires_at` của bảng `refresh_tokens` đã được đánh chỉ mục (index) giúp tăng tốc độ truy vấn và tối ưu hóa cho các thao tác dọn dẹp định kỳ sau này.

### Test Review
Nghiệm thu toàn bộ kiểm thử trên môi trường thực tế:
- `npm run format` & `npm run format:check` vượt qua thành công (pass).
- `npm run lint` vượt qua thành công (pass).
- `npm run test` chạy thành công **3 test suites** và **42 tests** pass sạch sẽ 100%.
- `npm run build` biên dịch TypeScript pass 100%.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Endpoint Refresh Token và Đăng xuất hoàn thành nghiệm thu xuất sắc trên máy thật, toàn bộ test suite pass 42/42 và sạch lỗi lint/format/build).



