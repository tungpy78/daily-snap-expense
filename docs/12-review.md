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
