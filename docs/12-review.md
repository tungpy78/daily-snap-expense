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

---

## Review: T-3.6 - Phát triển authMiddleware chặn truy cập trái phép

### Date
2026-06-15

### Summary
Triển khai hoàn chỉnh middleware xác thực yêu cầu (`authMiddleware`) thông qua việc kiểm tra và giải mã Access Token (JWT), gán thông tin định danh của người dùng vào đối tượng request phục vụ các API private phía sau.

### Files Changed
- `backend/src/types/express.d.ts` (Tạo mới để khai báo kiểu dữ liệu cho req.user)
- `backend/src/modules/users/repositories/user.repository.ts` (Thêm phương thức findById)
- `backend/src/middlewares/auth.middleware.ts` (Tạo mới middleware)
- `backend/src/app.ts` (Đăng ký route test và import authMiddleware)
- `backend/src/middlewares/auth.middleware.spec.ts` (Tạo mới integration tests cho middleware)

### What Went Well
- Đã cấu hình Express Request augmentation thành công để khai báo thuộc tính `req.user` an toàn dạng DTO (plain object), bảo vệ ranh giới kiến trúc phần mềm.
- Đã thêm phương thức `UserRepository.findById` trong Repository của User Module để truy xuất thông tin người dùng bằng Primary Key.
- Middleware `authMiddleware` đã được xây dựng hoàn chỉnh:
  - Đọc và phân tích token từ header `Authorization: Bearer <accessToken>`.
  - Thực hiện xác thực access token qua `TokenService.verifyAccessToken`.
  - Lấy thông tin user bằng phương thức `UserRepository.findById` (hoàn toàn không import trực tiếp Sequelize model `User` trong middleware).
  - Kiểm tra xem người dùng có tồn tại trong cơ sở dữ liệu và đang hoạt động (`is_active = true`) hay không.
  - Gán DTO sạch của người dùng gồm `id`, `username`, `email`, `role` vào `req.user` để các middleware/controller phía sau sử dụng.
- Đã đăng ký test route `/api/test-auth` nằm trong khối điều kiện môi trường non-production (`process.env.NODE_ENV !== 'production'`) đảm bảo an toàn cho môi trường production.
- Đã xây dựng bộ kiểm thử tích hợp (integration tests) bao phủ toàn bộ các kịch bản lỗi biên và kịch bản thành công:
  - Thiếu Authorization header.
  - Sai định dạng Bearer token.
  - Token sai chữ ký/signature.
  - Token hết hạn sử dụng.
  - Người dùng tương ứng không tồn tại trong database.
  - Tài khoản người dùng bị khóa/inactive.
  - Xác thực thành công và trả về DTO đúng.
- Đã sửa lỗi đường dẫn tương đối (import path) trong file test `auth.middleware.spec.ts` từ `../../` thành `../` giúp quá trình biên dịch (build) thành công.

### Technical Notes
- Middleware hoạt động như một lớp lọc trung gian và tuyệt đối tuân thủ Layered Architecture: không trực tiếp truy xuất Sequelize Model mà đi qua tầng Repository, đồng thời chỉ truyền dữ liệu plain object (DTO) thay vì truyền đối tượng Sequelize Model Instance vào `req.user`.

### Issues Found
- Lỗi import path ban đầu của file `auth.middleware.spec.ts` (sử dụng sai `../../` thay vì `../`) làm lỗi build đã được phát hiện và xử lý triệt để.
- Các log cảnh báo lỗi `console.error` hiển thị trong Jest là hành vi ném lỗi mong muốn và có chủ đích từ các trường hợp kiểm thử negative test cases (như kiểm tra token sai định dạng, token hết hạn, user inactive).

### Security Review
- Middleware chặn và xử lý kịp thời toàn bộ các trường hợp token không hợp lệ, token hết hạn, user không tồn tại hoặc bị inactive, đảm bảo an toàn tuyệt đối trước khi yêu cầu đi vào controller.

### Performance Review
- Truy vấn `findById` sử dụng khóa chính `findByPk` tận dụng tối đa Index Cluster của MySQL, đảm bảo hiệu năng truy vấn danh tính user cực kỳ nhanh trên mỗi request.

### Test Review
Nghiệm thu toàn bộ kiểm thử trên môi trường thực tế:
- `npm run format` & `npm run format:check` vượt qua thành công (pass).
- `npm run lint` vượt qua thành công (pass).
- `npm run test` chạy thành công **4 test suites** và **50 tests** pass sạch sẽ 100% (gồm 42 tests cũ và thêm 8 tests mới cho authMiddleware).
- `npm run build` biên dịch TypeScript pass 100%.

### Documentation Updated
- Yes
- Files: `docs/11-task.md`, `docs/12-review.md`

### Decision
- Approved (Middleware hoạt động tốt, pass toàn bộ 50/50 test cases, sạch lỗi lint/format/build).

---

## Review: T-4.1 - API lấy thông tin Profile cá nhân

### Date
2026-06-15

### Summary
Phát triển hoàn chỉnh API lấy thông tin Profile cá nhân (`GET /api/v1/users/profile`) cho người dùng đã đăng nhập, bảo vệ bởi `authMiddleware`, đảm bảo dữ liệu phản hồi an toàn qua DTO và tuân thủ nghiêm ngặt mô hình phân tầng Layered Architecture.

### Files Changed
- `backend/src/modules/users/dtos/user.dto.ts` (Tạo mới DTO)
- `backend/src/modules/users/services/user.service.ts` (Tạo mới Service)
- `backend/src/modules/users/controllers/user.controller.ts` (Tạo mới Controller)
- `backend/src/modules/users/routes/user.routes.ts` (Tạo mới Router)
- `backend/src/modules/users/routes/user.routes.spec.ts` (Tạo mới Integration test suite)
- `backend/src/app.ts` (Đăng ký router `/api/v1/users`)

### Architecture
Tuân thủ luồng backend chuẩn:
`Route -> authMiddleware -> Controller -> Service -> Repository -> Model/Database`
Trong đó:
- Route `/profile` gắn `authMiddleware` bảo vệ.
- Controller tiếp nhận request, lấy `req.user.id` và gọi tới `UserService.getUserProfile(userId)`. Controller hoàn toàn không chứa business logic và không import Sequelize Model.
- Service xử lý logic nghiệp vụ, gọi `UserRepository.findById` để lấy thông tin. Service hoàn toàn không import Sequelize Model.
- Repository (`UserRepository`) là tầng duy nhất giao tiếp, import và query trên Sequelize `User` model.

### DTO response an toàn
API trả về DTO an toàn có cấu trúc:
```ts
{
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}
```
Cam kết bảo mật:
- Không trả về `password_hash`, `passwordHash` để tránh rò rỉ thông tin đăng nhập.
- Không trả về `deleted_at`, `deletedAt` là metadata lưu vết soft delete.
- Không trả về `role` (vì tài liệu API T-4.1 không yêu cầu).
- Không trả về tokens (`accessToken`, `refreshToken`) và refresh token metadata.

### Error handling
- Thiếu header Authorization hoặc không gửi token -> Trả về mã lỗi HTTP 401 `UNAUTHORIZED`.
- Token không đúng định dạng/malformed -> Trả về mã lỗi HTTP 401 `INVALID_TOKEN`.
- Token hết hạn sử dụng -> Trả về mã lỗi HTTP 401 `TOKEN_EXPIRED`.
- User tương ứng bị vô hiệu hóa (`is_active = false`) -> Bị chặn bởi `authMiddleware`, trả về mã lỗi HTTP 401 `USER_INACTIVE`.
- User không tồn tại trong DB khi service truy vấn -> Trả về mã lỗi HTTP 404 `USER_NOT_FOUND`.

### Test cases
Đã bổ sung 5 integration test cases bao phủ toàn diện cho endpoint `GET /api/v1/users/profile`:
1. Không có Authorization header -> HTTP 401.
2. Token malformed -> HTTP 401.
3. Token hết hạn -> HTTP 401 `TOKEN_EXPIRED`.
4. Token hợp lệ -> HTTP 200 và phản hồi đúng cấu trúc DTO an toàn.
5. User bị inactive -> HTTP 401 `USER_INACTIVE`.
Các test case có cơ chế dọn dẹp dữ liệu test khỏi database (`force: true` hard delete) và đóng kết nối Sequelize an toàn sau khi hoàn thành.

### Technical Notes
1. **Tránh treo Jest và Open Handles**: Không sử dụng `jest.useFakeTimers()` trong integration test tích hợp Supertest/Sequelize vì dễ gây nghẽn luồng bất đồng bộ, làm các test cases sau hoặc hook `afterAll` bị timeout.
2. **Ký expired token deterministic**: Test case hết hạn token được giải quyết bằng cách ký trực tiếp bằng `jsonwebtoken` với tham số `{ expiresIn: '-1s' }`.
3. **Tránh lỗi chữ ký không hợp lệ (INVALID_TOKEN)**: Đảm bảo lấy đúng thuộc tính `accessSecret` từ singleton instance của `tokenService` tại runtime để ký expired token. Việc này giúp tránh sự không đồng nhất về cấu hình môi trường giữa thời điểm import module và thời điểm chạy `beforeAll`.
4. **Xử lý mapping thuộc tính Sequelize**: Do Sequelize map cột `created_at` sang thuộc tính `createdAt` (camelCase) ở JS runtime object, việc truy xuất `user.created_at` trực tiếp ở JS sẽ trả về `undefined` và gây crash lỗi 500 khi gọi `.toISOString()`. Đã khắc phục bằng cách sử dụng `user.getDataValue('created_at')` và kiểm tra kiểu dữ liệu để parse bằng `new Date` an toàn trước khi map.

### Kết quả nghiệm thu
Nghiệm thu toàn bộ trên máy thật thành công 100%:
- `npm run format`: pass.
- `npm run format:check`: pass.
- `npm run lint`: pass.
- `npm run test`: pass. (5 test suites, 55 tests pass).
- `npm run build`: pass.
- Hoàn toàn sạch lỗi timeout và rò rỉ tài nguyên (worker leak/open handles).

---

## Review: T-4.2 - Tích hợp Multer và thiết lập lớp trừu tượng StorageService

### Date
2026-06-15

### Summary
Tích hợp thành công thư viện Multer để xử lý dữ liệu ảnh multipart/form-data bằng memory storage, thiết lập lớp lưu trữ trừu tượng `StorageService` cùng nhà cung cấp lưu trữ cục bộ `LocalStorageProvider` an toàn, chống Path Traversal, phục vụ cho các nghiệp vụ tải ảnh tiếp theo.

### Packages
Đã cài đặt các packages mới:
- `multer` (dependencies)
- `@types/multer` (devDependencies)
Ghi nhận các cảnh báo (Warnings) trong quá trình cài đặt:
- Cảnh báo unsupported engine `npm EBADENGINE` được ghi nhận nhưng không xử lý để tránh thay đổi Node version của máy chủ/dev.
- Cảnh báo `npm audit` được ghi nhận nhưng cam kết không chạy `npm audit fix --force` để bảo toàn tính ổn định của các packages khác.
- Cảnh báo deprecation/vulnerability của Multer 1.x được ghi nhận nhưng không tự ý nâng lên Multer 2 để tránh phá vỡ kiến trúc và gây breaking changes ngoài phạm vi task.

### Files Changed
- `backend/src/shared/storage/storage.service.ts` (Tạo mới interface StorageService)
- `backend/src/shared/storage/local-storage.provider.ts` (Tạo mới LocalStorageProvider)
- `backend/src/shared/storage/local-storage.provider.spec.ts` (Tạo mới unit tests cho Provider)
- `backend/src/middlewares/upload.middleware.ts` (Tạo mới upload middleware factory)
- `backend/src/middlewares/upload.middleware.spec.ts` (Tạo mới unit tests cho Middleware)
- `backend/package.json` (Chỉnh sửa để thêm các dependencies)
- `backend/package-lock.json` (Cập nhật tự động sau khi chạy npm install)
*Đã kiểm tra file `src/app.ts` và xác nhận cơ chế static serve `/public` đã được thiết lập chính xác từ trước, hoàn toàn không cần chỉnh sửa logic.*

### StorageService
Interface định nghĩa lớp trừu tượng dùng chung:
```typescript
export interface StorageService {
  uploadImage(file: Express.Multer.File, folderPath: string): Promise<string>;
  deleteImage(imageUrl: string): Promise<void>;
}
```

### LocalStorageProvider
- **uploadImage**: Nhận file từ `file.buffer`. Sử dụng UUID làm tên file ngẫu nhiên để tránh trùng tên. Chỉ chấp nhận các định dạng `.jpg`, `.jpeg`, `.png`. Ghi tệp tin vào thư mục `public/uploads/<folderPath>`. Trả về URL tuyệt đối dạng `${BACKEND_URL}/public/uploads/...` (tự động xử lý tránh double slash và fallback về `http://localhost:5001`).
- **deleteImage**: Phân tích URL để xóa file vật lý tương ứng nếu tồn tại, xử lý an toàn không crash nếu file không tồn tại.

### Security notes
Các cơ chế bảo mật nghiêm ngặt chống tấn công Path Traversal:
- Chặn `folderPath` chứa kí tự quay lui thư mục (`..`).
- Chặn absolute path và ký tự Windows backslash (`\`).
- Chỉ cho phép các ký tự an toàn thông qua regex: `/^[a-zA-Z0-9_/-]+$/`.
- Sử dụng `path.resolve` và bắt buộc đường dẫn đích phải nằm trong upload root directory (sử dụng `.startsWith(uploadRoot)`).
- Chặn path traversal khi xóa ảnh: URL gửi xóa không thuộc upload root `/public/uploads` sẽ bị bỏ qua an toàn và không thực thi hành vi xóa ngoài phạm vi.

### Upload middleware
- Sử dụng `multer.memoryStorage()`.
- Giới hạn kích thước file tối đa 5MB.
- Xác thực định dạng dựa trên cả extension của `originalname` (`.jpg`, `.jpeg`, `.png`) và `mimetype` (`image/jpeg`, `image/png`).
- Trả về lỗi `INVALID_FILE_TYPE` (HTTP 400) nếu sai định dạng.
- Trả về lỗi `FILE_TOO_LARGE` (HTTP 400) nếu file quá lớn.
- Cho phép đi tiếp nếu không gửi kèm file (để controller nghiệp vụ tự xử lý).

### Test cases
Đã bổ sung các test cases unit test chất lượng:
- **LocalStorageProvider**:
  - Tải ảnh thành công, lưu file thật trên đĩa, trả URL tuyệt đối chuẩn.
  - Từ chối định dạng không hợp lệ.
  - Chặn các đường dẫn folderPath nguy hiểm chứa `..`, absolute path, backslash, hoặc ký tự lạ.
  - Xóa ảnh thành công, file không còn trên đĩa.
  - Xóa ảnh không tồn tại chạy an toàn không crash.
  - Chặn URL độc hại/path traversal khi delete.
  - Hook dọn dẹp sạch sẽ toàn bộ thư mục/file rác phát sinh trong quá trình chạy test.
- **Upload middleware**:
  - Upload `.png`, `.jpg` (với mimetype `image/jpeg`), `.jpeg` hợp lệ pass qua middleware.
  - Upload `.txt` trả 400 `INVALID_FILE_TYPE`.
  - Upload mimetype sai trả 400 `INVALID_FILE_TYPE`.
  - Upload file vượt quá 5MB trả 400 `FILE_TOO_LARGE`.
  - Không gửi file vẫn pass qua middleware bình thường (optional file).

### Technical notes
Các lỗi được phát hiện và xử lý kịp thời trong quá trình phát triển:
1. Regex validate folderPath bị ESLint cảnh báo `no-useless-escape` với ký tự gạch chéo `/`. Đã chỉnh sửa thành `/^[a-zA-Z0-9_/-]+$/` để pass lint.
2. Kiểu dữ liệu `NodeJS.ReadableStream` dùng trong mock file test gây lỗi compile typescript do thiếu thuộc tính của `Readable`. Đã xử lý bằng cách import `Readable` từ `stream` và mock bằng `Readable.from([])`.
3. Sửa mimetype kỳ vọng trong test ảnh `.jpg` thành `image/jpeg` đúng với tiêu chuẩn thực tế của driver Multer thay vì `image/jpg`.

### Kết quả nghiệm thu
Nghiệm thu toàn bộ trên máy thật thành công 100:
- `npm run format`: pass.
- `npm run format:check`: pass.
- `npm run lint`: pass.
- `npm run test`: pass (7 test suites, 71 tests pass).
- `npm run build`: pass.
- Sạch lỗi treo Jest, worker leak, hay open handles.

---

## Review: T-4.3 - API Cập nhật Profile

### Date
2026-06-15

### Summary
Triển khai hoàn chỉnh API Cập nhật Profile (`PUT /api/v1/users/profile`) cho phép người dùng thay đổi tên hiển thị (username) và tải lên hình ảnh đại diện (avatar) thông qua middleware upload và dịch vụ `StorageService` cục bộ.

### Files Changed
- `src/modules/users/validators/user.validator.ts`
- `src/modules/users/dtos/user.dto.ts`
- `src/modules/users/repositories/user.repository.ts`
- `src/modules/users/services/user.service.ts`
- `src/modules/users/controllers/user.controller.ts`
- `src/modules/users/routes/user.routes.ts`
- `src/modules/users/routes/user.routes.spec.ts`

### Middleware Order
Tuân thủ nghiêm ngặt thứ tự middleware bắt buộc:
`Route -> authMiddleware -> uploadImageMiddleware('avatar') -> validateRequest(updateProfileSchema) -> Controller -> Service -> Repository -> Model/Database`
*Lý do:* Multer (`uploadImageMiddleware`) cần chạy trước Zod (`validateRequest`) để parse dữ liệu text fields (như `username`) từ multipart form-data vào `req.body`.

### Validator
`updateProfileSchema` quy định:
- `username`: optional, trim khoảng trắng, chuyển về lowercase, tối thiểu 3 ký tự, tối đa 50 ký tự, chỉ cho phép chữ cái, số, dấu gạch dưới.
- Controller kiểm tra: Yêu cầu bắt buộc ít nhất một trong hai trường `username` hoặc `avatar` phải có.

### Service Flow
1. Lấy thông tin user hiện tại bằng `UserRepository.findById`.
2. Kiểm tra tồn tại của user.
3. Nếu có username: chuẩn hóa, so sánh và kiểm tra trùng lặp với người dùng khác. Hỗ trợ trường hợp gửi trùng username hiện tại của chính mình.
4. Chỉ thực hiện upload avatar sau khi validate username thành công.
5. Nếu có avatar: upload avatar mới vào thư mục `avatars` qua `LocalStorageProvider` và nhận `newAvatarUrl`.
6. Thực hiện update DB.
7. Nếu DB update lỗi: tự động xóa file avatar mới vừa tải lên.
8. Nếu DB update thành công: tự động xóa file avatar cũ nếu tồn tại. Lỗi xóa file cũ được catch an toàn không làm fail request chính.
9. Không import Sequelize Model trong Service layer.

### Repository
- Mở rộng phương thức `updateProfileById(userId, data)` để thực hiện update profile.
- Repository vẫn là tầng duy nhất query trên Sequelize User Model.

### Response DTO
Response chỉ trả safe DTO:
```json
{
  "id": "string",
  "username": "string",
  "avatarUrl": "string | null"
}
```
*Không trả về*: `email`, `password_hash`, `role`, `is_active`, `deleted_at`, `created_at`, `updated_at`, hay tokens.

### Error Handling
- Không gửi username/avatar -> 400.
- Username không hợp lệ -> 400 `VALIDATION_ERROR`.
- Username trùng -> 400 `USERNAME_ALREADY_EXISTS`.
- Avatar sai định dạng -> 400 `INVALID_FILE_TYPE`.
- Avatar quá 5MB -> 400 `FILE_TOO_LARGE`.
- Thiếu/sai token -> 401 `UNAUTHORIZED` / `INVALID_TOKEN`.

### Test Cases
Bổ sung 15 integration test cases trong `user.routes.spec.ts`:
1. Cập nhật chỉ username thành công.
2. Cập nhật chỉ avatar thành công.
3. Cập nhật cả username và avatar thành công.
4. Không gửi username và avatar -> 400.
5. Username quá ngắn -> 400.
6. Username quá dài -> 400.
7. Username chứa ký tự đặc biệt -> 400.
8. Username trùng user khác -> 400 `USERNAME_ALREADY_EXISTS`.
9. Gửi lại username hiện tại của chính mình -> thành công.
10. Avatar sai định dạng -> 400 `INVALID_FILE_TYPE`.
11. Avatar quá 5MB -> 400 `FILE_TOO_LARGE`.
12. Thiếu Authorization header -> 401.
13. Token không hợp lệ -> 401.
14. Avatar cũ được xóa sau khi cập nhật avatar mới.
15. Nếu DB update lỗi sau khi upload avatar mới -> avatar mới được cleanup.
16. Dọn dẹp tài khoản test/file ảnh test sau suite (`afterAll`).

### Technical Notes
Trong quá trình nghiệm thu, linter báo lỗi do khai báo biến `err` không dùng tới trong block `catch (err) {}`. Đã sửa lại bằng Optional Catch Binding `catch {}`.

### Kết quả nghiệm thu
Nghiệm thu thành công 100% trên máy thật:
- `npm run format`: pass
- `npm run format:check`: pass
- `npm run lint`: pass
- `npm run test`: pass (7 test suites, 86 tests pass)
- `npm run build`: pass
- `npm run dev`: pass

---

## Review: T-5.1 - Tạo migration cho bảng categories

### Date
2026-06-15

### Summary
Triển khai file database migration để khởi tạo cấu trúc bảng `categories` nhằm quản lý danh mục chi tiêu mặc định của hệ thống và danh mục tùy chỉnh của từng người dùng.

### Files Changed
- `backend/src/shared/database/migrations/20260615155500-create-categories.js`

### Schema bảng categories
Bảng `categories` bao gồm các cột sau:
- `id`: UUID (Primary Key, Not Null)
- `user_id`: UUID (Nullable) - Khóa ngoại liên kết tới bảng `users(id)`.
- `name`: STRING(50) (Not Null) - Tên danh mục.
- `color`: STRING(7) (Nullable) - Mã màu hex.
- `icon`: STRING(50) (Nullable) - Tên icon hiển thị.
- `created_at`: DATE (Not Null, Default: CURRENT_TIMESTAMP)
- `updated_at`: DATE (Not Null, Default: CURRENT_TIMESTAMP)

### Foreign key
Ràng buộc trên cột `user_id`:
- Khóa ngoại tham chiếu đến: `users(id)`
- `onUpdate`: `CASCADE`
- `onDelete`: `CASCADE`
- *Ý nghĩa:* Khi một người dùng bị xóa, các danh mục tùy chỉnh (`user_id != NULL`) của người dùng đó cũng sẽ tự động bị xóa theo. Các danh mục mặc định hệ thống (`user_id = NULL`) không bị ảnh hưởng.

### Index
Đã tạo index thường trên cột `user_id` của bảng `categories` để tối ưu hóa truy vấn danh mục riêng của người dùng:
- Tên index: `categories_user_id_index`
- Không sử dụng unique constraint hay index phức tạp vì không có yêu cầu đặc thù trong docs.

### Down migration
- Rollback sạch bảng thông qua:
```js
await queryInterface.dropTable('categories');
```

### Kết quả nghiệm thu
Nghiệm thu thành công 100% các câu lệnh kiểm tra trên máy thật:
- Migration up: pass (`20260615155500-create-categories.js`)
- Migration status: pass
- Migration undo (rollback): pass
- Migration re-run: pass
- format: pass
- format:check: pass
- lint: pass
- test: 7 suites passed, 86 tests passed
- build: pass

---

## Review: T-5.2 - Viết Seed dữ liệu danh mục mặc định của hệ thống

### Date
2026-06-15

### Summary
Triển khai file seeder của Sequelize để khởi tạo 7 danh mục chi tiêu mặc định hệ thống (Ăn uống, Di chuyển, Mua sắm, Giải trí, Học tập, Sức khỏe, Khác) trong cơ sở dữ liệu với `user_id = NULL`.

### Files Changed
- `backend/src/shared/database/seeders/20260615161000-default-categories.js`

### Danh sách category mặc định
7 danh mục mặc định hệ thống:
- Ăn uống (color: `#FF5733`, icon: `fast-food-outline`)
- Di chuyển (color: `#3399FF`, icon: `car-outline`)
- Mua sắm (color: `#FF3399`, icon: `cart-outline`)
- Giải trí (color: `#CC33FF`, icon: `game-controller-outline`)
- Học tập (color: `#33FF99`, icon: `book-outline`)
- Sức khỏe (color: `#FF3333`, icon: `heart-outline`)
- Khác (color: `#999999`, icon: `ellipsis-horizontal-outline`)

### UUID cố định
- Ăn uống: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88001`
- Di chuyển: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88002`
- Mua sắm: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88003`
- Giải trí: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88004`
- Học tập: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88005`
- Sức khỏe: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88006`
- Khác: `ca7e1c2d-8e50-4a8b-bb57-d3da90a88007`

### Idempotency
- Trong hàm `up`: Xóa trước đúng 7 danh mục bằng danh sách UUID cố định, sau đó tiến hành insert lại dữ liệu mới. Tránh xóa hàng loạt theo `user_id = NULL` để không làm mất các danh mục hệ thống khác phát sinh trong tương lai.

### Rollback
- Trong hàm `down`: Chỉ thực hiện xóa đúng 7 danh mục bằng danh sách UUID cố định trên, không ảnh hưởng tới các danh mục tùy chỉnh của user và các danh mục hệ thống khác ngoài phạm vi.

### Technical Note
- Phát hiện và sửa đổi lệch pha về mặt ngôn ngữ: Ban đầu seeder dùng tên danh mục tiếng Anh (`Food`, `Transport`, ...). Sau khi rà soát nghiệp vụ (FR-4.1 và các User Stories khác), seeder đã được cập nhật chuẩn xác sang tiếng Việt (`Ăn uống`, `Di chuyển`, ...). Dữ liệu thực tế đã được xác minh thành công trong DB.

### Kết quả nghiệm thu
Nghiệm thu thành công 100% trên máy thật:
- Seed undo: pass
- Seed all: pass
- DB data check: pass
- format: pass
- format:check: pass
- lint: pass
- test: 7 suites passed, 86 tests passed
- build: pass

---

## Review: T-5.3 - API Lấy danh sách danh mục chi tiêu

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
GET /api/v1/categories
```
* Endpoint protected bằng `authMiddleware`.
* API trả về danh sách category khả dụng của user hiện tại.
* Danh sách bao gồm:
  * category hệ thống có `user_id = NULL`
  * category custom của chính user hiện tại
* Không trả category custom của user khác.
* Không tạo API POST/PUT/DELETE category trong task này.

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route chỉ gắn `authMiddleware`.
* Controller gọi Service, không chứa business logic.
* Service gọi Repository, không query Sequelize Model trực tiếp.
* Repository là tầng duy nhất import/query `Category` Sequelize Model.

### Files tạo mới/sửa đổi
Ghi nhận đã tạo:
* `src/shared/models/category.model.ts`
* `src/modules/categories/dtos/category.dto.ts`
* `src/modules/categories/repositories/category.repository.ts`
* `src/modules/categories/services/category.service.ts`
* `src/modules/categories/controllers/category.controller.ts`
* `src/modules/categories/routes/category.routes.ts`
* `src/modules/categories/routes/category.routes.spec.ts`

Ghi nhận đã sửa:
* `src/app.ts`

### Category model
Ghi nhận model map đúng bảng `categories`:
* `id`
* `user_id`
* `name`
* `color`
* `icon`
* `created_at`
* `updated_at`

Không thêm `deleted_at`.

### Repository query
Ghi nhận repository query theo điều kiện:
```txt
user_id IS NULL OR user_id = currentUserId
```
Không trả category custom của user khác.
Có order ổn định để tránh flaky test.

### Response DTO
Ghi nhận response format:
```ts
{
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
}
```
`isDefault = true` when `user_id === null`.

Không trả:
* `user_id`
* `created_at`
* `updated_at`
* `deleted_at`

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không có Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. Token hợp lệ -> 200.
4. Response có category hệ thống với `isDefault: true`.
5. Response có category custom của user hiện tại với `isDefault: false`.
6. Response không chứa category custom của user khác.
7. Response không leak `user_id`, `created_at`, `updated_at`.
8. User không có custom category vẫn nhận được category hệ thống.
9. User2 chỉ thấy custom category của user2 và không thấy custom category của user1.

### Technical note
Ghi nhận lỗi đã sửa trong quá trình nghiệm thu:
* `token2` trong `category.routes.spec.ts` bị khai báo nhưng chưa dùng.
* Đã bổ sung test riêng cho user2 để dùng `token2` có ý nghĩa và tăng coverage kiểm thử phân quyền dữ liệu.

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
test: 8 suites passed, 91 tests passed
build: pass
```

---

## Review: T-5.4 - API Tạo danh mục tùy chỉnh

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
POST /api/v1/categories
```
* Endpoint protected bằng `authMiddleware`.
* Có validation bằng `validateRequest(createCategorySchema)`.
* API cho phép user tạo category custom của riêng mình.
* Không tạo migration mới.
* Không sửa migration T-5.1.
* Không sửa seeder T-5.2.
* Không tạo API update/delete category trong task này.

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> validateRequest -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route gắn `authMiddleware` và `validateRequest`.
* Controller gọi Service, không chứa business logic.
* Service gọi Repository, không query Sequelize Model trực tiếp.
* Repository là tầng duy nhất import/query `Category` Sequelize Model.

### Files tạo mới/sửa đổi
Ghi nhận tạo mới:
* `src/modules/categories/validators/category.validator.ts`

Ghi nhận sửa:
* `src/modules/categories/dtos/category.dto.ts`
* `src/modules/categories/repositories/category.repository.ts`
* `src/modules/categories/services/category.service.ts`
* `src/modules/categories/controllers/category.controller.ts`
* `src/modules/categories/routes/category.routes.ts`
* `src/modules/categories/routes/category.routes.spec.ts`
* `src/shared/models/category.model.ts`

### Validator
Ghi nhận `createCategorySchema`:
* `name`: required, trim, 1-50 ký tự, hỗ trợ tiếng Việt có dấu.
* `color`: optional/nullable, nếu có phải đúng hex `#RRGGBB`.
* `icon`: optional/nullable, tối đa 50 ký tự.
* Chuỗi rỗng của `color` và `icon` được normalize thành `null`.

### Duplicate rule
Ghi nhận rule chống trùng:
```txt
user_id IS NULL OR user_id = currentUserId
```
Ý nghĩa:
* User không được tạo category trùng tên với category hệ thống.
* User không được tạo category trùng tên với custom category của chính họ.
* User khác nhau được phép có custom category trùng tên.
* Check trùng có trim và case-insensitive.

Khi trùng, trả:
```txt
400 CATEGORY_ALREADY_EXISTS
```

### Response DTO
Ghi nhận response trả safe DTO:
```ts
{
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isDefault: false;
}
```
Không trả:
* `user_id`
* `created_at`
* `updated_at`
* `deleted_at`

### Type/DTO refactor
Ghi nhận đã refactor DTO/interface dùng chung về:
```txt
src/modules/categories/dtos/category.dto.ts
```
Bao gồm:
* `CategoryDto`
* `CreateCategoryDto`
* `CreateCategoryData`

Service/repository dùng `import type`.

### Sequelize model typing
Ghi nhận đã sửa lỗi TypeScript bằng cách khai báo rõ:
```ts
CategoryAttributes
CategoryCreationAttributes
Category extends Model<CategoryAttributes, CategoryCreationAttributes>
```
Và repository `create` truyền object tường minh:
```ts
Category.create({
  user_id,
  name,
  color,
  icon,
})
```

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không gửi Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. Tạo category custom thành công -> 201 Created.
4. Response trả safe DTO và `isDefault: false`.
5. DB ghi đúng `user_id = currentUserId`.
6. Không leak `user_id`, `created_at`, `updated_at`.
7. `name` rỗng hoặc chỉ khoảng trắng -> 400 `VALIDATION_ERROR`.
8. `name` quá 50 ký tự -> 400 `VALIDATION_ERROR`.
9. `color` sai hex -> 400 `VALIDATION_ERROR`.
10. Trùng tên category hệ thống -> 400 `CATEGORY_ALREADY_EXISTS`.
11. Trùng tên custom category của chính user -> 400 `CATEGORY_ALREADY_EXISTS`.
12. Duplicate case-insensitive -> 400 `CATEGORY_ALREADY_EXISTS`.
13. Cho phép tạo trùng tên custom category của user khác -> 201 Created.
14. Chuỗi rỗng của `color` và `icon` được normalize thành `null`.
15. Cleanup sạch dữ liệu test sau suite.

### Technical note
Ghi nhận lỗi đã sửa trong quá trình nghiệm thu:
* Lỗi TypeScript ở `Category.create(data)` do Category model chưa khai báo generic Attributes/CreationAttributes rõ ràng.
* Đã sửa bằng cách typing lại `Category` model và sửa repository create method.

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
test: 8 suites passed, 103 tests passed
build: pass
```

---

## Review: T-6.1 - Tạo migration cho bảng expenses (Có soft delete)

### Date
2026-06-15

### Tóm tắt triển khai
* Đã tạo migration:
```txt
20260615191500-create-expenses.js
```
* Migration tạo bảng:
```txt
expenses
```
* Task này chỉ tạo database schema.
* Không tạo Expense model.
* Không tạo repository/service/controller/route/validator.
* Không tạo API expense.
* Không sửa auth/users/categories/profile/storage.
* Không sửa `.env`.

### Schema bảng expenses
Ghi nhận các cột:
```txt
id          UUID PRIMARY KEY NOT NULL
user_id     UUID NOT NULL
snap_id     UUID NULL
category_id UUID NOT NULL
amount      DECIMAL(12, 2) NOT NULL
note        TEXT NULL
date        DATEONLY NOT NULL DEFAULT (CURRENT_DATE)
created_at  DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at  DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
deleted_at  DATE NULL
```

### Soft delete
Ghi nhận bảng có cột:
```txt
deleted_at DATE NULL
```
Cột này phục vụ soft delete cho các task expense sau.

### Foreign keys

#### user_id
Ghi nhận:
```txt
user_id -> users(id)
onUpdate: CASCADE
onDelete: CASCADE
```
Ý nghĩa: khi user bị xóa, expense của user đó bị xóa theo.

#### category_id
Ghi nhận:
```txt
category_id -> categories(id)
onUpdate: CASCADE
onDelete: RESTRICT
```
Ý nghĩa: không cho xóa category nếu vẫn còn expense tham chiếu tới category đó.

#### snap_id
Ghi nhận:
```txt
snap_id UUID NULL
```
Chưa thêm foreign key cho `snap_id` vì bảng `snaps` chưa được tạo ở milestone hiện tại. FK cho `snap_id` sẽ được xử lý sau khi bảng `snaps` tồn tại.

### Indexes
Ghi nhận đã tạo:
```txt
expenses_user_id_date_index trên user_id, date
expenses_snap_id_index trên snap_id
```
Mục đích:
* `expenses_user_id_date_index`: tối ưu truy vấn lịch sử và thống kê chi tiêu theo user/ngày.
* `expenses_snap_id_index`: hỗ trợ truy vấn expense gắn với snap sau này.

### Down migration
Ghi nhận rollback dùng:
```js
await queryInterface.dropTable('expenses');
```
Rollback đã được nghiệm thu bằng:
```bash
npx sequelize-cli db:migrate:undo
```
Sau đó migrate lại thành công bằng:
```bash
npx sequelize-cli db:migrate
```

### Technical note
Ghi nhận lỗi đã phát hiện và sửa trong quá trình nghiệm thu:
* Ban đầu migration dùng:
```sql
DEFAULT CURRENT_DATE
```
* MySQL báo syntax error.
* Đã sửa thành:
```sql
DEFAULT (CURRENT_DATE)
```
* Sau khi sửa, migration chạy thành công.

### Kết quả nghiệm thu
Ghi nhận:
```txt
Migration status before: expenses down
Migration up: pass
Migration status after: expenses up
Migration undo: pass
Migration re-run: pass
format: pass
format:check: pass
lint: pass
test: 8 suites passed, 103 tests passed
build: pass
```

---

## Review: T-6.2 - API Thêm chi tiêu thủ công

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
POST /api/v1/expenses
```
* Endpoint protected bằng `authMiddleware`.
* Có validation bằng `validateRequest(createExpenseSchema)`.
* API cho phép user tạo expense thủ công, không upload ảnh.
* Không tạo migration mới.
* Không sửa migration/seeder cũ.
* Không tạo API list/update/delete expense trong task này.

### Refactor root router
Ghi nhận đã tạo:
```txt
src/routes/index.ts
```
Mục đích:
* Đăng ký tập trung các module routes.
* `app.ts` không mount từng module route trực tiếp nữa.
* `app.ts` chỉ mount:
```ts
app.use('/api/v1', apiV1Routes);
```
Các endpoint cũ vẫn giữ nguyên:
```txt
/api/v1/auth
/api/v1/users
/api/v1/categories
```
Endpoint mới:
```txt
/api/v1/expenses
```

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> validateRequest -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route gắn `authMiddleware` và `validateRequest`.
* Controller gọi Service, không chứa business logic.
* Service gọi Repository, không query Sequelize Model trực tiếp.
* Repository là tầng duy nhất import/query `Expense` Sequelize Model.
* Service dùng `CategoryRepository` để kiểm tra quyền dùng category.

### Files tạo mới/sửa đổi
Ghi nhận tạo mới:
```txt
src/routes/index.ts
src/shared/models/expense.model.ts
src/modules/expenses/dtos/expense.dto.ts
src/modules/expenses/validators/expense.validator.ts
src/modules/expenses/repositories/expense.repository.ts
src/modules/expenses/services/expense.service.ts
src/modules/expenses/controllers/expense.controller.ts
src/modules/expenses/routes/expense.routes.ts
src/modules/expenses/routes/expense.routes.spec.ts
```
Ghi nhận sửa:
```txt
src/app.ts
src/modules/categories/repositories/category.repository.ts
```

### Expense model
Ghi nhận model `Expense` map đúng bảng `expenses`:
```txt
id
user_id
snap_id
category_id
amount
note
date
created_at
updated_at
deleted_at
```
Ghi nhận có soft delete:
```ts
paranoid: true
deletedAt: 'deleted_at'
createdAt: 'created_at'
updatedAt: 'updated_at'
```
Ghi nhận model có khai báo rõ:
```txt
ExpenseAttributes
ExpenseCreationAttributes
Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes>
```

### Validator
Ghi nhận `createExpenseSchema`:
* `amount`: required, number, > 0.
* `categoryId`: required, UUID.
* `note`: optional/nullable, max 1000 ký tự.
* `date`: optional, format `YYYY-MM-DD`.
* `snapId`: optional/nullable, UUID nếu có.

### Category permission rule
Ghi nhận trước khi tạo expense, service kiểm tra category:
```txt
category không tồn tại -> 400 CATEGORY_NOT_FOUND
category custom của user khác -> 403 FORBIDDEN
category hệ thống user_id = NULL -> cho phép
category custom của chính user -> cho phép
```

### Create expense flow
Ghi nhận service xử lý:
* Normalize `note`: trim, chuỗi rỗng -> `null`.
* Nếu không gửi `date`, tự gán ngày hiện tại dạng `YYYY-MM-DD`.
* Nếu không gửi `snapId`, gán `null`.
* Gọi `ExpenseRepository.create`.
* Map sang safe DTO.

### Response DTO
Ghi nhận response thành công:
```ts
{
  id: string;
  amount: number;
  categoryId: string;
  note: string | null;
  date: string;
  snapId: string | null;
  createdAt: string;
}
```
Không trả:
```txt
user_id
category_id
snap_id
deleted_at
updated_at
```
Lưu ý: `snapId` là field client-facing, còn `snap_id` là DB/internal field.

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không có Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. `amount` thiếu/null/<=0 -> 400 `VALIDATION_ERROR`.
4. `categoryId` thiếu/sai UUID -> 400 `VALIDATION_ERROR`.
5. `note` quá 1000 ký tự -> 400 `VALIDATION_ERROR`.
6. `date` sai format `YYYY-MM-DD` -> 400 `VALIDATION_ERROR`.
7. `snapId` sai UUID -> 400 `VALIDATION_ERROR`.
8. `categoryId` không tồn tại -> 400 `CATEGORY_NOT_FOUND`.
9. `categoryId` là custom category của user khác -> 403 `FORBIDDEN`.
10. Tạo expense với category hệ thống -> 201.
11. Tạo expense với custom category của chính user -> 201.
12. Không gửi `date` -> hệ thống gán ngày hiện tại.
13. Response là safe DTO, không leak internal fields.
14. DB ghi đúng `user_id`, `category_id`, `amount`, `date`, `snap_id`.
15. User2 tạo expense với system category -> 201.
16. User2 tạo expense với custom category của user2 -> 201.
17. User2 không tạo được expense với custom category của user1 -> 403.
18. Cleanup sạch dữ liệu test sau suite.

### Technical note
Ghi nhận lỗi đã sửa trong quá trình nghiệm thu:
* `token2` trong `expense.routes.spec.ts` khai báo nhưng chưa dùng.
* Đã bổ sung test user2 để dùng `token2` có ý nghĩa và tăng coverage phân quyền.
* `DataTypes.literal` không tồn tại trong Sequelize.
* Đã sửa bằng cách import trực tiếp `literal` từ `sequelize` và dùng:
```ts
defaultValue: literal('(CURRENT_DATE)')
```

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
test: 9 suites passed, 118 tests passed
build: pass
```

---

## Review: T-6.3 - API Lấy danh sách chi tiêu

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
GET /api/v1/expenses
```
* Endpoint protected bằng `authMiddleware`.
* Có validation query bằng `validateRequest(listExpensesSchema)`.
* API cho phép user lấy danh sách chi tiêu cá nhân.
* Hỗ trợ phân trang và filter.
* Không tạo migration mới.
* Không tạo API update/delete expense.
* Không tạo Snap model/repository/service.

### Query params
Ghi nhận API hỗ trợ:
```txt
startDate: YYYY-MM-DD, optional
endDate: YYYY-MM-DD, optional
categoryId: UUID, optional
limit: number, default 20, min 1, max 100
offset: number, default 0, min 0
```
Ghi nhận validator xử lý:
* Query param từ Express là string nên đã preprocess/transform `limit` và `offset` sang number.
* Validate `startDate <= endDate` nếu truyền cả hai.
* Query sai format trả `400 VALIDATION_ERROR`.

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> validateRequest -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route gắn `authMiddleware` và `validateRequest(listExpensesSchema)`.
* Controller lấy `req.user.id` và validated query, gọi service.
* Service xử lý mapping safe DTO và snapDetails.
* Repository query DB qua Expense model.
* Service không query Sequelize model trực tiếp.
* Controller không chứa business logic.

### Files đã sửa
Ghi nhận các file đã mở rộng:
```txt
src/modules/expenses/dtos/expense.dto.ts
src/modules/expenses/validators/expense.validator.ts
src/modules/expenses/repositories/expense.repository.ts
src/modules/expenses/services/expense.service.ts
src/modules/expenses/controllers/expense.controller.ts
src/modules/expenses/routes/expense.routes.ts
src/modules/expenses/routes/expense.routes.spec.ts
```

### DTO
Ghi nhận đã thêm các DTO/type:
```txt
ExpenseSnapDetailsDto
ExpenseListItemDto
ExpenseListQueryDto
ExpenseListResponseDto
```
Response item gồm:
```txt
id
amount
categoryId
note
date
snapId
snapDetails
createdAt
```
Không leak internal fields:
```txt
user_id
category_id
snap_id
deleted_at
updated_at
```

### Repository query
Ghi nhận repository method list dùng điều kiện bắt buộc:
```txt
user_id = currentUserId
```
Optional filters:
```txt
category_id = categoryId
date >= startDate
date <= endDate
```
Ghi nhận không check quyền category khi filter `categoryId`, để tránh leak dữ liệu. Nếu filter bằng category của user khác thì kết quả tự nhiên là empty list.

### Pagination
Ghi nhận response có metadata:
```txt
total
limit
offset
```
Ghi nhận `limit` default là 20, max 100. `offset` default là 0.

### Soft delete
Ghi nhận Expense model dùng `paranoid: true`.
API list không bật `paranoid: false`, nên:
* Expense đã soft delete không xuất hiện trong `expenses`.
* Expense đã soft delete không được tính vào `pagination.total`.

### Order
Ghi nhận order ổn định:
```txt
date DESC
created_at DESC
id DESC
```

### snapDetails logic
Vì bảng `snaps` chưa tồn tại, ghi nhận logic tạm thời:
```txt
Nếu snapId === null:
  snapDetails = null

Nếu snapId !== null:
  snapDetails = {
    snapDeleted: true,
    imageUrl: null
  }
```
Không tạo Snap model/repository/service trong task này.

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không có Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. `startDate` sai format -> 400 `VALIDATION_ERROR`.
4. `endDate` sai format -> 400 `VALIDATION_ERROR`.
5. `startDate > endDate` -> 400 `VALIDATION_ERROR`.
6. `categoryId` sai UUID -> 400 `VALIDATION_ERROR`.
7. `limit` không phải số nguyên -> 400 `VALIDATION_ERROR`.
8. `limit <= 0` -> 400 `VALIDATION_ERROR`.
9. `limit > 100` -> 400 `VALIDATION_ERROR`.
10. `offset` không phải số nguyên -> 400 `VALIDATION_ERROR`.
11. `offset < 0` -> 400 `VALIDATION_ERROR`.
12. Lấy danh sách thành công -> 200.
13. Chỉ trả expense của user hiện tại.
14. Pagination đúng `total`, `limit`, `offset`.
15. Filter theo `categoryId` đúng.
16. Filter theo `startDate`, `endDate` đúng.
17. Kết hợp nhiều filter đúng.
18. Soft deleted expense không xuất hiện và không tính vào total.
19. `snapId = null` -> `snapDetails = null`.
20. `snapId != null` -> `snapDetails = { snapDeleted: true, imageUrl: null }`.
21. Response không leak internal fields.
22. Order ổn định theo `date DESC`, `created_at DESC`, `id DESC`.
23. Cleanup sạch dữ liệu test.

### Technical note
Ghi nhận các lỗi đã sửa trong quá trình nghiệm thu:
* Có warning `no-explicit-any` trong `expense.routes.spec.ts`.
* Đã thay `any` bằng DTO/type cụ thể, dùng `ExpenseListItemDto` và `Record<string, unknown>` khi cần kiểm tra field leak.
* Test soft delete ban đầu mâu thuẫn expectation: `expenses.length = 0` nhưng `pagination.total = 5`.
* Đã sửa theo hướng test danh sách tổng: seeded 6 expense, soft delete 1, API trả 5 active expenses và không chứa `softDeletedExpenseId`.
* Đã chống flaky order bằng cách seed `created_at` rõ ràng, tránh UUID random làm thứ tự không ổn định.
* Đã tách dữ liệu GET tests để tránh bị ô nhiễm bởi POST tests trước đó.

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
expense test riêng: 1 suite passed, 36 tests passed
full test: 9 suites passed, 139 tests passed
build: pass
```

---

## Review: T-6.4 - API Cập nhật chi tiêu

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
PUT /api/v1/expenses/:id
```
* Endpoint protected bằng `authMiddleware`.
* Có validation bằng `validateRequest(updateExpenseSchema)`.
* API cho phép user cập nhật expense do chính user sở hữu.
* Hỗ trợ partial update.
* Không tạo migration mới.
* Không tạo API delete expense.
* Không tạo Snap model/repository/service.

### Request
Params:
```txt
id: UUID, required
```
Body optional fields:
```txt
amount?: number > 0
categoryId?: UUID
note?: string | null, max 1000
date?: YYYY-MM-DD
snapId?: UUID | null
```
Ghi nhận rule:
```txt
Body rỗng {} -> 400 VALIDATION_ERROR
```

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> validateRequest -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route gắn `authMiddleware` và `validateRequest(updateExpenseSchema)`.
* Controller lấy `req.user.id`, `params.id`, validated body rồi gọi service.
* Service kiểm tra quyền sở hữu expense, kiểm tra category nếu có update `categoryId`, normalize dữ liệu và gọi repository.
* Repository là tầng duy nhất thao tác trực tiếp với `Expense` Sequelize model.
* Service không gọi `Expense` model trực tiếp.
* Service không gọi `expense.save()` trực tiếp.

### Files đã sửa
Ghi nhận các file đã mở rộng:
```txt
src/modules/expenses/dtos/expense.dto.ts
src/modules/expenses/validators/expense.validator.ts
src/modules/expenses/repositories/expense.repository.ts
src/modules/expenses/services/expense.service.ts
src/modules/expenses/controllers/expense.controller.ts
src/modules/expenses/routes/expense.routes.ts
src/modules/expenses/routes/expense.routes.spec.ts
```

### DTO
Ghi nhận đã thêm:
```txt
UpdateExpenseDto
UpdateExpenseData
```
Không khai báo DTO dùng chung trong service/controller/repository.

### Validator
Ghi nhận `updateExpenseSchema` validate cả:
```txt
params.id
body
```
Các rule chính:
* `params.id` phải là UUID.
* `amount` nếu có phải > 0.
* `categoryId` nếu có phải là UUID.
* `note` nếu có tối đa 1000 ký tự, có thể null.
* `date` nếu có phải đúng `YYYY-MM-DD`.
* `snapId` nếu có phải là UUID hoặc null.
* Body rỗng không được chấp nhận.

### Repository
Ghi nhận đã thêm:
```txt
findById
updateById
```
Repository chịu trách nhiệm query/update `Expense`.
Không bật `paranoid: false`, nên expense đã soft delete không được update.

### Service logic
Ghi nhận flow update:
1. Tìm expense theo id.
2. Nếu không tồn tại hoặc đã soft delete -> `404 EXPENSE_NOT_FOUND`.
3. Nếu expense không thuộc user hiện tại -> `403 FORBIDDEN`.
4. Nếu update `categoryId`, kiểm tra category:
   * Không tồn tại -> `400 CATEGORY_NOT_FOUND`.
   * Custom category của user khác -> `403 FORBIDDEN`.
   * System category `user_id = null` -> cho phép.
   * Custom category của chính user -> cho phép.
5. Normalize:
   * `note` string được trim.
   * `note` chuỗi rỗng -> `null`.
   * `snapId` omitted -> không đổi.
   * `snapId: null` -> set `snap_id = null`.
   * `categoryId` -> `category_id`.
   * `snapId` -> `snap_id`.
6. Gọi repository update.
7. Map response sang safe DTO.

### Response DTO
Response thành công:
```txt
id
amount
categoryId
note
date
snapId
createdAt
```
Không leak internal fields:
```txt
user_id
category_id
snap_id
deleted_at
updated_at
```
`amount` trả về dạng number, không phải DECIMAL string.

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không có Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. `params.id` sai UUID -> 400 `VALIDATION_ERROR`.
4. Body rỗng `{}` -> 400 `VALIDATION_ERROR`.
5. `amount <= 0` -> 400 `VALIDATION_ERROR`.
6. `categoryId` sai UUID -> 400 `VALIDATION_ERROR`.
7. `date` sai format `YYYY-MM-DD` -> 400 `VALIDATION_ERROR`.
8. `snapId` sai UUID -> 400 `VALIDATION_ERROR`.
9. `note` quá 1000 ký tự -> 400 `VALIDATION_ERROR`.
10. Expense không tồn tại -> 404 `EXPENSE_NOT_FOUND`.
11. User A update expense của User B -> 403 `FORBIDDEN`.
12. Không update được soft deleted expense -> 404 `EXPENSE_NOT_FOUND`.
13. Update thành công toàn bộ các field hợp lệ -> 200.
14. Update thành công partial field -> 200.
15. Update `note` chuỗi rỗng -> `note: null`.
16. Update `snapId: null` -> `snapId: null`.
17. Update `categoryId` là system category -> 200.
18. Update `categoryId` là custom category của chính user -> 200.
19. Update `categoryId` là custom category của user khác -> 403 `FORBIDDEN`.
20. Response safe DTO, không leak internal fields.
21. DB thật sự được cập nhật đúng các field.
22. Cleanup sạch dữ liệu test.

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
test: 9 suites passed, 158 tests passed
build: pass
```

---

## Review: T-6.5 - API Xóa chi tiêu

### Date
2026-06-15

### Tóm tắt triển khai
* Đã thêm endpoint:
```txt
DELETE /api/v1/expenses/:id
```
* Endpoint protected bằng `authMiddleware`.
* Có validation bằng `validateRequest(deleteExpenseSchema)`.
* API cho phép user xóa mềm expense do chính user sở hữu.
* Không hard delete.
* Không tạo migration mới.
* Không tạo API mới ngoài DELETE expense.
* Không tạo Snap model/repository/service.

### Request
Params:
```txt
id: UUID, required
```
Body:
```txt
Không sử dụng.
```
Nếu `id` sai UUID:
```txt
400 VALIDATION_ERROR
```

### Response
Response thành công:
```json
{
  "success": true,
  "data": {
    "message": "Đã xóa khoản chi tiêu thành công."
  }
}
```

### Kiến trúc
Ghi nhận tuân thủ luồng:
```txt
Route -> authMiddleware -> validateRequest -> Controller -> Service -> Repository -> Model/Database
```
Trong đó:
* Route gắn `authMiddleware` và `validateRequest(deleteExpenseSchema)`.
* Controller lấy `req.user.id`, `params.id`, gọi service.
* Service kiểm tra expense tồn tại, kiểm tra quyền sở hữu, gọi repository để xóa.
* Repository là tầng duy nhất gọi `Expense.destroy`.
* Service không gọi `Expense` model trực tiếp.
* Service không gọi `expense.destroy()` trực tiếp.

### Files đã sửa
Ghi nhận các file đã mở rộng:
```txt
src/modules/expenses/dtos/expense.dto.ts
src/modules/expenses/validators/expense.validator.ts
src/modules/expenses/repositories/expense.repository.ts
src/modules/expenses/services/expense.service.ts
src/modules/expenses/controllers/expense.controller.ts
src/modules/expenses/routes/expense.routes.ts
src/modules/expenses/routes/expense.routes.spec.ts
```

### DTO
Ghi nhận đã thêm:
```txt
DeleteExpenseResponseDto
```

### Validator
Ghi nhận đã thêm:
```txt
deleteExpenseSchema
```
Schema validate:
```txt
params.id
```
`params.id` phải là UUID.

### Repository
Ghi nhận đã thêm:
```txt
deleteById
```
Repository gọi:
```txt
Expense.destroy({ where: { id } })
```
Vì `Expense` model đang `paranoid: true`, thao tác này là soft delete và cập nhật `deleted_at`.

### Service logic
Ghi nhận flow xóa:
1. Tìm expense bằng repository `findById`.
2. Nếu không tồn tại hoặc đã soft delete -> `404 EXPENSE_NOT_FOUND`.
3. Nếu expense không thuộc user hiện tại -> `403 FORBIDDEN`.
4. Gọi repository `deleteById`.
5. Nếu kết quả delete là `0`, trả `404 EXPENSE_NOT_FOUND`.
6. Trả message thành công.

### Soft delete rule
Ghi nhận API code không bật:
```txt
paranoid: false
```
`paranoid: false` chỉ được dùng trong integration test để verify DB sau khi xóa.

Sau khi xóa:
* Expense không còn xuất hiện trong `GET /api/v1/expenses`.
* `pagination.total` không tính expense đã soft delete.
* Bản ghi vẫn tồn tại trong DB khi query với `paranoid: false`.
* `deleted_at` có timestamp.

### Test cases
Ghi nhận integration tests đã bao phủ:
1. Không có Authorization header -> 401 `UNAUTHORIZED`.
2. Token không hợp lệ -> 401 `INVALID_TOKEN`.
3. `params.id` sai UUID -> 400 `VALIDATION_ERROR`.
4. Expense không tồn tại -> 404 `EXPENSE_NOT_FOUND`.
5. User A xóa expense của User B -> 403 `FORBIDDEN`.
6. Xóa thành công expense hợp lệ -> 200.
7. Response đúng message: `Đã xóa khoản chi tiêu thành công.`
8. DB thật sự cập nhật `deleted_at` sau khi xóa.
9. Gọi DELETE lần thứ 2 với cùng id -> 404 `EXPENSE_NOT_FOUND`.
10. Expense đã xóa không còn xuất hiện trong `GET /api/v1/expenses`.
11. `pagination.total` của GET list không tính expense đã soft delete.
12. Không hard delete: test dùng `paranoid: false` để xác nhận bản ghi vẫn còn trong DB nhưng có `deleted_at`.
13. Cleanup sạch dữ liệu test.

### Kết quả nghiệm thu
```txt
format: pass
format:check: pass
lint: pass
test: 9 suites passed, 166 tests passed
build: pass
```

---

## Review: T-7.1 - Tạo migration cho bảng snaps (Có soft delete)

### Date
2026-06-15

### Tóm tắt triển khai
* Đã tạo migration:
```txt
migrations/20260615215000-create-snaps.js
```
* Đã tạo bảng:
```txt
snaps
```
* Bảng `snaps` hỗ trợ soft delete qua cột:
```txt
deleted_at
```
* Đã bổ sung foreign key:
```txt
expenses.snap_id -> snaps.id
```
* Không tạo Snap model.
* Không tạo Snap repository/service/controller/validator.
* Không tạo API Snap.
* Không sửa business logic.

### Schema bảng snaps
Ghi nhận các cột:
```txt
id          UUID PRIMARY KEY NOT NULL
user_id     UUID NOT NULL
image_url   STRING(255) NOT NULL
caption     TEXT NULL
is_private  BOOLEAN NOT NULL DEFAULT true
created_at  DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at  DATE NOT NULL DEFAULT CURRENT_TIMESTAMP
deleted_at  DATE NULL
```
Foreign key:
```txt
user_id -> users(id)
onUpdate: CASCADE
onDelete: CASCADE
```
Index:
```txt
snaps_user_id_created_at_index
columns: user_id, created_at
```

### Foreign key expenses.snap_id
Ghi nhận constraint:
```txt
expenses_snap_id_fk
```
Liên kết:
```txt
expenses.snap_id -> snaps.id
```
Rule:
```txt
onUpdate: CASCADE
onDelete: SET NULL
```

### Xử lý dữ liệu orphan snap_id
Ghi nhận trong migration `up` có xử lý dữ liệu tạm từ các task T-6.x:
```sql
UPDATE expenses
SET snap_id = NULL
WHERE snap_id IS NOT NULL;
```
Lý do:
* Trước T-7.1, bảng `snaps` chưa tồn tại.
* Một số expense test/data có thể có `snap_id` dummy UUID.
* Khi thêm FK, các `snap_id` không tồn tại trong `snaps` sẽ làm migration fail.
* Vì vậy cần reset orphan `snap_id` về `NULL` trước khi add foreign key.

### Thứ tự migration up
Ghi nhận thứ tự đúng:
1. `createTable('snaps')`
2. `addIndex('snaps', ['user_id', 'created_at'], name: 'snaps_user_id_created_at_index')`
3. `UPDATE expenses SET snap_id = NULL WHERE snap_id IS NOT NULL`
4. `addConstraint` `expenses.snap_id -> snaps.id` với name `expenses_snap_id_fk`

### Thứ tự migration down
Ghi nhận rollback đúng:
1. Kiểm tra constraint `expenses_snap_id_fk` có tồn tại không
2. Nếu tồn tại thì `removeConstraint('expenses', 'expenses_snap_id_fk')`
3. `dropTable('snaps')`

Ghi nhận lỗi đã gặp và đã sửa:
```txt
ERROR: Cannot drop index 'snaps_user_id_created_at_index': needed in a foreign key constraint
```
Nguyên nhân:
* MySQL dùng index `snaps_user_id_created_at_index` để hỗ trợ FK `snaps.user_id -> users.id`.
* Không được remove index này thủ công khi FK còn tồn tại.
* Khi `dropTable('snaps')`, MySQL tự dọn index/constraint thuộc bảng `snaps`.

Cách sửa:
```txt
Bỏ removeIndex trong down.
Chỉ remove FK expenses_snap_id_fk nếu còn tồn tại, rồi dropTable('snaps').
```

### Sửa test data sau khi có FK
Ghi nhận đã sửa `src/modules/expenses/routes/expense.routes.spec.ts` để phù hợp FK mới:
* Không còn dùng `snapId` dummy UUID không tồn tại.
* Seed bản ghi trong bảng `snaps` trước khi tạo expense có `snap_id`.
* Không tạo Snap model.
* Dùng raw query trong test setup.
* Cleanup đúng thứ tự:
  1. Xóa expenses trước.
  2. Xóa snaps sau.
  3. Xóa categories/users sau cùng.

Ghi nhận test IDs:
```txt
testGetSnapId: 11111111-1111-1111-1111-111111111111
testPutSnapId: 55555555-5555-5555-5555-555555555555

### Kết quả nghiệm thu
```txt
migration undo: pass
migration migrate lại: pass
expense test riêng: 1 suite passed, 63 tests passed
format: pass
format:check: pass
lint: pass
full test: 9 suites passed, 166 tests passed
build: pass
```

---

## Review: T-7.2 - Tích hợp upload ảnh snap thông qua LocalStorageProvider

### Date
2026-06-15

### Tóm tắt triển khai
* Đã tạo Sequelize model:
```txt
src/shared/models/snap.model.ts
```
* Model `Snap` map đúng bảng:
```txt
snaps
```
* Đã thêm test upload ảnh snap bằng `LocalStorageProvider`:
```txt
src/shared/storage/snap-upload.spec.ts
```
* Đã chỉnh sửa `Expense` model để thiết lập association với `Snap`:
```txt
src/shared/models/expense.model.ts
```
* Không tạo Snap API.
* Không tạo Snap route.
* Không tạo Snap controller/service/repository/validator.
* Không tạo migration mới.
* Không sửa `.env`.

### Snap model
Ghi nhận model `Snap` có các field:
```txt
id: string
user_id: string
image_url: string
caption: string | null
is_private: boolean
created_at: Date
updated_at: Date
deleted_at: Date | null
```
Config model:
```txt
tableName: snaps
timestamps: true
createdAt: created_at
updatedAt: updated_at
paranoid: true
deletedAt: deleted_at
underscored: true
```
Ghi nhận đã khai báo rõ:
```txt
SnapAttributes
SnapCreationAttributes
```
và dùng `Optional` của Sequelize cho creation attributes phù hợp.

### Association
Ghi nhận association đã được thiết lập ở mức model:
```txt
Snap belongsTo User qua user_id
User hasMany Snap qua user_id
Expense belongsTo Snap qua snap_id
Snap hasMany Expense qua snap_id
```
Ghi nhận build TypeScript đã pass, không có lỗi circular import.

### Storage upload test
Ghi nhận file test:
```txt
src/shared/storage/snap-upload.spec.ts
```
Test trực tiếp:
```txt
LocalStorageProvider
```
Không dùng:
```txt
API
Supertest
uploadImageMiddleware
```
Các trường hợp đã bao phủ:
1. Upload ảnh `.jpg` vào folder `snaps`.
2. Upload ảnh `.jpeg` vào folder `snaps`.
3. Upload ảnh `.png` vào folder `snaps`.
4. URL trả về chứa static path:
```txt
/public/uploads/snaps/
```
5. File thật sự tồn tại trên disk sau upload.
6. `deleteImage(imageUrl)` xóa được file đã upload.
7. File sai extension như `.txt` bị chặn.
8. Cleanup sạch file test sau khi chạy.

### Kết quả nghiệm thu
```txt
snap-upload test riêng: 1 suite passed, 5 tests passed
format: pass
format:check: pass
lint: pass
full test: 10 suites passed, 171 tests passed
build: pass
```

---

## Review: T-7.3 - API Đăng Snap kèm Chi tiêu (POST /api/v1/snaps)

### Date
2026-06-15

### Summary
Triển khai hoàn chỉnh API đăng Snap kèm chi tiêu (`POST /api/v1/snaps`), cho phép người dùng tải lên hình ảnh Snap cùng với các trường metadata (`caption`, `isPrivate`) và mảng chi tiêu liên kết (`expenses` dưới dạng chuỗi JSON). API được bảo vệ bởi `authMiddleware` và xử lý multipart/form-data qua `uploadImageMiddleware`. Quá trình tạo Snap và các chi tiêu liên quan được bọc trong một **Sequelize Transaction** tại `SnapService` để đảm bảo dữ liệu toàn vẹn, thực hiện rollback và xóa file ảnh khỏi disk nếu gặp lỗi ghi database.

### Files Changed
- `backend/src/modules/snaps/routes/snap.routes.ts` (Tạo mới)
- `backend/src/modules/snaps/controllers/snap.controller.ts` (Tạo mới)
- `backend/src/modules/snaps/services/snap.service.ts` (Tạo mới)
- `backend/src/modules/snaps/repositories/snap.repository.ts` (Tạo mới)
- `backend/src/modules/snaps/validators/snap.validator.ts` (Tạo mới)
- `backend/src/modules/snaps/routes/snap.routes.spec.ts` (Tạo mới)
- `backend/src/routes/index.ts` (Sửa đổi: Đăng ký router snap)
- `backend/src/modules/expenses/routes/expense.routes.spec.ts` (Sửa đổi: Cô lập clean up để chạy song song)

### What Went Well
- Triển khai đúng chuẩn Layered Architecture: `Route -> AuthMiddleware -> UploadMiddleware -> ValidationMiddleware -> Controller -> Service -> Repository -> Model`.
- Triển khai cơ chế transaction toàn vẹn tại `SnapService`. Khi việc tạo chi tiêu đính kèm thất bại, snap record được rollback hoàn toàn và file ảnh đã lưu trên disk được tự động xóa bỏ qua helper dọn dẹp.
- Khắc phục triệt để lỗi ô nhiễm chéo giữa các test suite khi chạy parallel thông qua việc sử dụng UUID suffix cho test data và áp dụng scoped cleanup giới hạn theo ID/User tạo trong suite.

### Issues Found & Resolved
- *Lỗi validation `isPrivate`*: Ban đầu validation schema dùng preprocess trả về `undefined` cho các chuỗi không hợp lệ, kích hoạt giá trị mặc định `true` của Zod khiến request invalid được chấp nhận (trả về 201). Đã sửa lại để preprocess trả về giá trị gốc nếu không phải chuỗi rỗng/undefined, cho phép Zod bắt lỗi validation và trả về `400 VALIDATION_ERROR`.
- *Lỗi ô nhiễm dữ liệu khi chạy test parallel*: Do suite snap và suite expense sử dụng các email/username tĩnh trùng lặp và gọi hàm xóa toàn bảng `Expense.destroy({ where: {} })`. Đã sửa lại toàn bộ hai spec file để sử dụng suffix UUID ngẫu nhiên và dọn dẹp dữ liệu theo phạm vi ID/User được tạo cụ thể.
- *Lỗi mock rollback file upload test*: Test case ban đầu truyền categoryId giả làm lỗi validate trước khi Multer lưu file, nên không thực sự test được việc xóa file trên disk. Đã chuyển sang sử dụng `jest.spyOn(ExpenseService, 'createManualExpense')` để mock ném lỗi sau khi snap và file đã được upload lưu trữ thành công.

### Security Review
- Authentication: Bắt buộc đi qua `authMiddleware` xác thực JWT.
- Authorization: Kiểm tra kỹ quyền sở hữu đối với các custom categories đính kèm của chi tiêu (nếu category thuộc người dùng khác thì ném lỗi `403 Forbidden`).
- Data validation: Xác thực kiểu dữ liệu và định dạng file `.jpg/.jpeg/.png` chặt chẽ ở tầng middleware trước khi chuyển đến controller.

### Performance Review
- Database: Tận dụng transaction giúp tránh mồ côi dữ liệu. Đã sử dụng index cho các truy vấn kiểm tra quyền sở hữu category.
- File handling: Sử dụng local storage lưu trữ file và dọn dẹp tệp tin dư thừa/lỗi kịp thời để tránh tràn ổ cứng.

### Test Review
- Unit tests: N/A.
- Integration tests: Viết integration tests toàn diện (21 cases) bao phủ mọi kịch bản lỗi validation, thiếu quyền, sai định dạng file, thành công và rollback.
- Chạy thử nghiệm trên máy thật:
  - Lệnh test riêng lẻ: `npx jest src/modules/snaps/routes/snap.routes.spec.ts --runInBand --verbose` -> Pass.
  - Lệnh test parallel: `npm run test` -> Pass (11 suites passed, 192 tests passed).

### Documentation Updated
- Yes.
- Files: `docs/10-coding-rule.md`, `docs/11-task.md`, `docs/12-review.md`.

### Decision
- Approved.
```

---

## Review: T-7.4 - API Lấy dòng thời gian cá nhân (GET /api/v1/snaps/timeline)

### Date
2026-06-15

### Tóm tắt triển khai
Đã triển khai endpoint:
```txt
GET /api/v1/snaps/timeline
```

Route protected:
```txt
authMiddleware
```

Route flow:
```txt
Route -> authMiddleware -> validateRequest(timelineQuerySchema) -> SnapController.getTimeline -> SnapService.getTimeline -> SnapRepository.findTimelineByUser -> Model/Database
```

Các file chính đã cập nhật:
- `src/modules/snaps/dtos/snap.dto.ts`
- `src/modules/snaps/validators/snap.validator.ts`
- `src/modules/snaps/repositories/snap.repository.ts`
- `src/modules/snaps/services/snap.service.ts`
- `src/modules/snaps/controllers/snap.controller.ts`
- `src/modules/snaps/routes/snap.routes.ts`
- `src/modules/snaps/routes/snap.routes.spec.ts`
- `src/shared/models/snap.model.ts`
- `src/shared/models/expense.model.ts`
- `src/shared/models/category.model.ts`

Không tạo migration mới.
Không sửa `app.ts`.
Không sửa `.env`.

### API behavior
Endpoint:
```txt
GET /api/v1/snaps/timeline
```

Query params:
```txt
startDate?: YYYY-MM-DD
endDate?: YYYY-MM-DD
search?: string
limit?: number, default 20, min 1, max 100
offset?: number, default 0, min 0
```

Timeline cá nhân chỉ lấy:
```txt
snaps.user_id = currentUserId
```
Không lấy snap public của user khác trong task này.

Response success:
```json
{
  "success": true,
  "data": {
    "snaps": [
      {
        "id": "snap-uuid",
        "imageUrl": "http://localhost:5001/public/uploads/snaps/image.jpg",
        "caption": "Buổi chiều mát mẻ",
        "isPrivate": true,
        "createdAt": "2026-06-13T15:30:00.000Z",
        "expenses": [
          {
            "id": "expense-uuid",
            "amount": 50000,
            "categoryId": "category-uuid",
            "categoryName": "Ăn uống",
            "note": "Mua trà sữa",
            "date": "2026-06-13"
          }
        ],
        "reactions": []
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 20,
      "offset": 0
    }
  }
}
```

Không leak internal fields:
- `user_id`
- `image_url`
- `is_private`
- `deleted_at`
- `updated_at`
- `category_id`
- `snap_id`

### Repository
Ghi nhận `SnapRepository.findTimelineByUser` xử lý:
- Lọc theo current user.
- Lọc `startDate`/`endDate` trên `created_at`.
- Search caption bằng `Op.like`.
- Include expenses.
- Include category của expense.
- Dùng `distinct: true` để tránh count sai khi Snap hasMany Expense.
- Sort `created_at` DESC, `id` DESC.
- Áp dụng limit/offset.

### Service
Ghi nhận `SnapService.getTimeline` xử lý:
- Map DTO sạch.
- Ép `amount` từ DECIMAL/string sang number.
- Map `categoryName` từ `expense.category?.name ?? null`.
- Gán `reactions: []`.
- Trả pagination gồm `total`, `limit`, `offset`.

### Validator
Ghi nhận `timelineQuerySchema` xử lý:
- `limit` default 20, min 1, max 100.
- `offset` default 0, min 0.
- `startDate`/`endDate` format `YYYY-MM-DD`.
- `startDate > endDate` -> `VALIDATION_ERROR`.
- `search` trim, empty string -> `undefined`, max 100.

### Test cases
Ghi nhận đã bổ sung test cho `GET /api/v1/snaps/timeline`, bao phủ:
1. Không gửi token -> 401.
2. Token invalid -> 401.
3. Timeline rỗng -> 200, snaps [], total 0.
4. Chỉ lấy snaps của current user.
5. Không lấy snaps của user khác.
6. Trả expenses kèm categoryName.
7. amount trả về dạng number.
8. reactions là mảng rỗng.
9. Sort createdAt DESC.
10. Pagination limit/offset.
11. Filter startDate/endDate.
12. startDate > endDate -> 400 VALIDATION_ERROR.
13. Search theo caption.
14. Soft-deleted snap không xuất hiện.
15. Response không leak internal fields.

### Test isolation
Ghi nhận test tiếp tục tuân thủ rule isolation từ T-7.3:
- Dùng randomUUID/shortId cho dữ liệu test.
- Không dùng fixed ID/email/username generic.
- Không cleanup toàn bảng.
- Cleanup theo IDs do suite tạo.
- Không xóa toàn bộ folder upload.
- Không tạo biến test không dùng.
- Không dùng `any`/`as any`/`eslint-disable`.

### Các lỗi đã gặp trong T-7.4 và cách khắc phục
1. Circular import model association:
   - Lỗi: `Expense.belongsTo(Category)` báo `Category` không phải subclass `Sequelize.Model`.
   - Nguyên nhân: `category.model.ts` import `Expense`, `expense.model.ts` import `Category` gây vòng import.
   - Cách sửa: xóa `Category.hasMany(Expense)` và xóa import `Expense` trong `category.model.ts`. Chỉ giữ `Expense.belongsTo(Category)` ở `expense.model.ts`.

2. TypeScript association typing:
   - Lỗi: `Property 'expenses' does not exist on type 'Snap'`.
   - Nguyên nhân: eager-loaded association chưa khai báo `NonAttribute` trong model.
   - Cách sửa: thêm `declare expenses?: NonAttribute<Expense[]>` trong `Snap` model và `declare category?: NonAttribute<Category | null>` trong `Expense` model.

3. no-explicit-any warnings:
   - Lỗi: còn `any` trong `snap.repository.ts` và `snap.routes.spec.ts`.
   - Cách sửa: dùng type Sequelize phù hợp trong repository; tạo interface test-local cho response body; dùng `Record<string, unknown>` khi kiểm tra field leak.

### Kết quả nghiệm thu
```txt
snap routes test riêng: 1 suite passed, 34 tests passed
full jest runInBand: 11 suites passed, 205 tests passed
format: pass
format:check: pass
lint: pass, không còn warning no-explicit-any
npm run test: 11 suites passed, 205 tests passed
build: pass
```

---

## Review: T-7.5 - API Xóa Snap (DELETE /api/v1/snaps/:id - Soft Delete)

### Date
2026-06-16

### Tóm tắt triển khai
Đã triển khai endpoint:
```txt
DELETE /api/v1/snaps/:id
```

Route protected:
```txt
authMiddleware
```

Route flow:
```txt
Route -> authMiddleware -> validateRequest(deleteSnapSchema) -> SnapController.deleteSnap -> SnapService.deleteSnap -> SnapRepository -> Model/Database
```

Các file chính đã cập nhật:
- `src/shared/models/expense.model.ts`
- `src/modules/expenses/repositories/expense.repository.ts`
- `src/modules/expenses/services/expense.service.ts`
- `src/modules/expenses/routes/expense.routes.spec.ts`
- `src/modules/snaps/dtos/snap.dto.ts`
- `src/modules/snaps/validators/snap.validator.ts`
- `src/modules/snaps/repositories/snap.repository.ts`
- `src/modules/snaps/services/snap.service.ts`
- `src/modules/snaps/controllers/snap.controller.ts`
- `src/modules/snaps/routes/snap.routes.ts`
- `src/modules/snaps/routes/snap.routes.spec.ts`

Không tạo migration mới.
Không sửa `.env`.
Không sửa `app.ts`.
Không hard delete Snap.
Không xóa file ảnh vật lý.
Không xóa Expense liên quan.
Không set null `expenses.snap_id`.

### API behavior
Endpoint:
```txt
DELETE /api/v1/snaps/:id
```

Success `200 OK`:
```json
{
  "success": true,
  "data": {
    "message": "Đã xóa khoảnh khắc thành công. Các chi tiêu liên kết vẫn được giữ lại."
  }
}
```

Error cases:
```txt
400 VALIDATION_ERROR nếu id không phải UUID
401 UNAUTHORIZED / INVALID_TOKEN nếu auth lỗi
403 FORBIDDEN nếu user cố xóa snap của user khác
404 SNAP_NOT_FOUND nếu snap không tồn tại hoặc đã bị soft-deleted
```

Soft delete behavior:
- Snap bị set `deleted_at`.
- Snap không còn xuất hiện trong `GET /api/v1/snaps/timeline`.
- Expense liên kết vẫn tồn tại.
- Expense liên kết vẫn giữ `snap_id`.
- File `image_url` không bị xóa khỏi disk.

### Expense list behavior sau T-7.5
Cập nhật `GET /api/v1/expenses` để trả `snapDetails` theo trạng thái thật của Snap:
- `expense.snap_id` null: `snapDetails = null`
- `expense.snap_id` có giá trị và snap còn active: `snapDetails = { snapDeleted: false, imageUrl: snap.image_url }`
- `expense.snap_id` có giá trị nhưng snap đã soft-deleted: `snapDetails = { snapDeleted: true, imageUrl: null }`
- `expense.snap_id` có giá trị nhưng snap không tồn tại: `snapDetails = { snapDeleted: true, imageUrl: null }`

Repository đã eager load Snap bằng `required: false` và `paranoid: false` để đọc được cả Snap đã soft-deleted.

### DTO / Validator / Service
- Thêm `DeleteSnapResponseDto`.
- Thêm `deleteSnapSchema` validate `params.id` UUID.
- Thêm `SnapRepository.findById` và `deleteById`.
- Thêm `SnapService.deleteSnap` kiểm tra tồn tại, quyền sở hữu, và soft delete.
- Thêm `SnapController.deleteSnap`.
- Thêm route `DELETE /:id`.
- Cập nhật `ExpenseService` map `snapDetails` theo trạng thái Snap thật.

### Test cases
Ghi nhận đã bổ sung test cho DELETE Snap:
1. Không gửi token -> 401.
2. Token invalid -> 401.
3. id không phải UUID -> 400 VALIDATION_ERROR.
4. Snap không tồn tại -> 404 SNAP_NOT_FOUND.
5. Snap đã soft-deleted -> 404 SNAP_NOT_FOUND.
6. User A xóa Snap của User B -> 403 FORBIDDEN.
7. User xóa Snap của chính mình -> 200 OK và message đúng.
8. Sau khi xóa, Snap có `deleted_at` trong DB khi query paranoid false.
9. Sau khi xóa, Snap không xuất hiện trong timeline.
10. Expense liên quan vẫn tồn tại.
11. Expense liên quan vẫn giữ `snap_id`.
12. `GET /api/v1/expenses` trả `snapDetails { snapDeleted: true, imageUrl: null }` với expense gắn snap đã soft-deleted.

Ghi nhận đã cập nhật `expense.routes.spec.ts`:
- Active snap -> `snapDetails { snapDeleted: false, imageUrl }`.
- Soft-deleted snap -> `snapDetails { snapDeleted: true, imageUrl: null }`.
- `snap_id` null -> `snapDetails null`.
- Count active expenses tăng từ 5 lên 6 vì expense liên kết với soft-deleted snap vẫn active theo rule T-7.5.

### Test isolation
Ghi nhận test vẫn tuân thủ:
- Không cleanup toàn bảng.
- Cleanup theo IDs do suite tạo.
- Cleanup đúng thứ tự FK: expenses -> snaps -> categories -> users.
- Không dùng fixed ID/email/username generic.
- Không dùng `any`/`as any`/`eslint-disable`.
- Không xóa toàn bộ folder upload.

### Các lỗi đã gặp trong T-7.5 và cách khắc phục
1. Test compile lỗi do TestTimelineResponseBody nằm sai scope:
   - Lỗi: Cannot find name 'TestTimelineResponseBody' và implicit any trong callback find.
   - Cách sửa: đưa TestTimelineExpenseResponse, TestTimelineSnapResponse, TestTimelineResponseBody ra top-level scope trong `snap.routes.spec.ts`.

2. Full test fail do expectation cũ của GET /expenses:
   - Lỗi: Expected 5, Received 6 ở các test default pagination, pagination total, và soft-deleted expense exclusion.
   - Nguyên nhân: T-7.5 seed thêm expense liên kết với soft-deleted snap; expense đó vẫn active theo rule “xóa Snap không xóa Expense”.
   - Cách sửa: tạo `expectedUser1ActiveExpenseCount = 6`, thay các hard-code 5 bằng hằng số này, và sửa comment test.

### Kết quả nghiệm thu
```txt
expense routes test riêng: 1 suite passed, 64 tests passed
snap routes test riêng: 1 suite passed, 42 tests passed
full jest runInBand: 11 suites passed, 214 tests passed
format: pass
format:check: pass
lint: pass, không warning no-explicit-any
npm run test: 11 suites passed, 214 tests passed
build: pass
```

---

## Review: T-8.1 - Tạo migration cho bảng friendships

### Date
2026-06-16

### Tóm tắt triển khai
Đã tạo migration:
[20260616000000-create-friendships.js](file:///d:/vibe%20Coding/backend/src/shared/database/migrations/20260616000000-create-friendships.js)

Migration tạo bảng:
`friendships`

Schema:
```txt
id UUID PK NOT NULL
sender_id UUID NOT NULL
receiver_id UUID NOT NULL
status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending'
created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Foreign keys:
- `sender_id` -> `users.id` (ON DELETE CASCADE, ON UPDATE CASCADE)
- `receiver_id` -> `users.id` (ON DELETE CASCADE, ON UPDATE CASCADE)

Constraint/index:
- `friendships_sender_id_fk`
- `friendships_receiver_id_fk`
- `friendships_sender_receiver_unique` trên `(sender_id, receiver_id)`
- `friendships_receiver_id_index` trên `receiver_id`

### Phạm vi task
Task này chỉ làm migration. Cam kết:
- Không tạo Friendship model.
- Không tạo API.
- Không tạo repository/service/controller/validator/route.
- Không sửa `app.ts`.
- Không sửa `.env`.
- Không sửa migration cũ.

### Kết quả nghiệm thu
```txt
db:migrate: pass
db:migrate:status: migration T-8.1 up
db:migrate:undo: pass
db:migrate lại: pass
format: pass
format:check: pass
lint: pass
test: 11 suites passed, 214 tests passed
build: pass
```

---

## Review: T-8.2 - API Gửi lời mời kết bạn (POST /api/v1/friends/request)

### Date
2026-06-16

### Tóm tắt triển khai
Đã triển khai hoàn thành endpoint gửi lời mời kết bạn bảo vệ qua `authMiddleware`:
`POST /api/v1/friends/request`

Route flow:
`Route -> authMiddleware -> validateRequest(sendFriendRequestSchema) -> FriendshipController.sendFriendRequest -> FriendshipService.sendFriendRequest -> FriendshipRepository -> Model/Database`

Các file chính đã tạo/cập nhật:
- `src/shared/models/friendship.model.ts`
- `src/modules/friendships/dtos/friendship.dto.ts`
- `src/modules/friendships/validators/friendship.validator.ts`
- `src/modules/friendships/repositories/friendship.repository.ts`
- `src/modules/friendships/services/friendship.service.ts`
- `src/modules/friendships/controllers/friendship.controller.ts`
- `src/modules/friendships/routes/friendship.routes.ts`
- `src/modules/friendships/routes/friendship.routes.spec.ts`
- `src/routes/index.ts`

Cam kết:
- Không tạo migration mới.
- Không sửa migration cũ.
- Không sửa `.env`.
- Không sửa `app.ts`.

### API behavior
Endpoint:
`POST /api/v1/friends/request`

Request body:
```json
{
  "receiverIdentity": "vietanh@example.com"
}
```
`receiverIdentity` hỗ trợ email hoặc username.

Success khi gửi mới:
```json
{
  "success": true,
  "data": {
    "message": "Đã gửi lời mời kết bạn thành công."
  }
}
```

Success khi auto-accept pending ngược chiều:
```json
{
  "success": true,
  "data": {
    "message": "Hai bạn đã trở thành bạn bè."
  }
}
```

Error cases:
```txt
400 VALIDATION_ERROR nếu receiverIdentity thiếu/rỗng/quá 100 ký tự
400 SENDER_AND_RECEIVER_ARE_SAME nếu tự gửi cho chính mình
404 USER_NOT_FOUND nếu receiverIdentity không tìm thấy user active
400 FRIEND_REQUEST_ALREADY_SENT nếu đã có pending cùng chiều
400 ALREADY_FRIENDS nếu 2 user đã accepted ở bất kỳ chiều nào
```

### Business logic
Được triển khai trong `FriendshipService.sendFriendRequest`:
1. Trim `receiverIdentity`.
2. Tìm receiver theo email hoặc username.
3. Không cho gửi cho chính mình.
4. Kiểm tra friendship giữa 2 user ở cả hai chiều.
5. Nếu đã accepted bất kỳ chiều nào -> `ALREADY_FRIENDS` (400).
6. Nếu pending cùng chiều -> `FRIEND_REQUEST_ALREADY_SENT` (400).
7. Nếu pending ngược chiều -> update thành `accepted` và trả message auto-accept.
8. Nếu rejected cùng chiều -> update lại `pending`.
9. Nếu rejected ngược chiều -> đảo sender/receiver sang chiều hiện tại và update status `pending`.
10. Nếu chưa có record -> tạo mới `pending`.

Service kiểm soát hoàn toàn quan hệ 2 chiều để tránh một cặp user có nhiều bản ghi ngược chiều không cần thiết trong database.

### Repository / Model
- Tạo `Friendship` model cho bảng `friendships`.
- Không dùng paranoid vì bảng không có `deleted_at`.
- Repository xử lý tìm user theo email/username.
- Repository tìm friendship giữa 2 user ở cả hai chiều.
- Repository hỗ trợ các thao tác ghi: `create`, `update`, `update direction status`.
- Service không gọi Sequelize model trực tiếp.

### Test cases
Bổ sung integration tests đầy đủ cho `POST /api/v1/friends/request`, bao phủ:
1. Không gửi token -> 401.
2. Token invalid -> 401.
3. `receiverIdentity` missing -> 400 `VALIDATION_ERROR`.
4. `receiverIdentity` rỗng hoặc chỉ space -> 400 `VALIDATION_ERROR`.
5. `receiverIdentity` quá 100 ký tự -> 400 `VALIDATION_ERROR`.
6. `receiverIdentity` không tồn tại -> 404 `USER_NOT_FOUND`.
7. Tự gửi cho chính mình bằng email -> 400 `SENDER_AND_RECEIVER_ARE_SAME`.
8. Tự gửi cho chính mình bằng username -> 400 `SENDER_AND_RECEIVER_ARE_SAME`.
9. Gửi request thành công bằng email -> 200 và tạo pending đúng `sender_id`/`receiver_id`.
10. Gửi request thành công bằng username -> 200.
11. Gửi trùng pending cùng chiều -> 400 `FRIEND_REQUEST_ALREADY_SENT`.
12. Đã accepted bất kỳ chiều nào -> 400 `ALREADY_FRIENDS`.
13. Pending ngược chiều -> auto accept, status `accepted`.
14. Rejected cùng chiều -> update lại `pending`, không tạo duplicate.
15. Rejected ngược chiều -> đảo sender/receiver sang chiều hiện tại, status `pending`, không tạo duplicate.

### Test isolation
Mã kiểm thử tuân thủ tuyệt đối các nguyên tắc cô lập dữ liệu:
- Dùng `randomUUID` cho username/email.
- Không dùng fixed email/username generic.
- Cleanup theo IDs do suite tạo.
- Không cleanup toàn bảng.
- Cleanup đúng thứ tự khóa ngoại: `friendships` -> `users`.
- Không dùng `any`/`as any`.
- Không dùng `eslint-disable`.
- Không tạo biến test không dùng.

### Lỗi đã gặp và cách khắc phục
1. Compile fail do biến test không dùng:
   - Lỗi: `TS6133: 'tokenC' is declared but its value is never read.`
   - Cách sửa: xóa hoàn toàn khai báo và phần gán `tokenC` trong `friendship.routes.spec.ts` vì không được sử dụng trong các case test nào.
   - Không dùng `void tokenC` hay comment `eslint-disable`.

### Kết quả nghiệm thu
```txt
friendship routes test riêng: 1 suite passed, 15 tests passed
full jest runInBand: 12 suites passed, 229 tests passed
format: pass
format:check: pass
lint: pass, không warning no-explicit-any
npm run test: 12 suites passed, 229 tests passed
build: pass
```

---

## Review: T-8.3 - API Phản hồi yêu cầu kết bạn (PUT /api/v1/friends/request/:id)

### Date
2026-06-16

### Tóm tắt triển khai
Đã triển khai endpoint:
`PUT /api/v1/friends/request/:id`

Route protected:
`authMiddleware`

Route flow:
`Route -> authMiddleware -> validateRequest(respondFriendRequestSchema) -> FriendshipController.respondFriendRequest -> FriendshipService.respondFriendRequest -> FriendshipRepository -> Model/Database`

Các file chính đã cập nhật:
- `src/modules/friendships/dtos/friendship.dto.ts`
- `src/modules/friendships/validators/friendship.validator.ts`
- `src/modules/friendships/repositories/friendship.repository.ts`
- `src/modules/friendships/services/friendship.service.ts`
- `src/modules/friendships/controllers/friendship.controller.ts`
- `src/modules/friendships/routes/friendship.routes.ts`
- `src/modules/friendships/routes/friendship.routes.spec.ts`

Không tạo migration mới.
Không sửa migration cũ.
Không sửa `.env`.
Không sửa `app.ts`.

### API behavior
Endpoint:
`PUT /api/v1/friends/request/:id`

Params:
- `id`: UUID của friendship record

Request body:
```json
{
  "action": "ACCEPT"
}
```

`action` hỗ trợ:
- `ACCEPT`
- `DECLINE`

Mapping:
- `ACCEPT` -> status `accepted`
- `DECLINE` -> status `rejected`

Success khi ACCEPT:
```json
{
  "success": true,
  "data": {
    "message": "Đã chấp nhận kết bạn."
  }
}
```

Success khi DECLINE:
```json
{
  "success": true,
  "data": {
    "message": "Đã từ chối kết bạn."
  }
}
```

Error cases:
- `400 VALIDATION_ERROR` nếu params.id không phải UUID
- `400 VALIDATION_ERROR` nếu body.action thiếu/rỗng/sai enum
- `404 FRIEND_REQUEST_NOT_FOUND` nếu không tìm thấy friendship id
- `403 FORBIDDEN` nếu user hiện tại không phải receiver_id
- `400 FRIEND_REQUEST_NOT_PENDING` nếu status không phải pending

### Business logic
Được triển khai trong `FriendshipService.respondFriendRequest`:
1. Tìm friendship theo id.
2. Nếu không tồn tại -> `FRIEND_REQUEST_NOT_FOUND`.
3. Nếu currentUserId không phải receiver_id -> `FORBIDDEN`.
4. Nếu status không phải pending -> `FRIEND_REQUEST_NOT_PENDING`.
5. Nếu action ACCEPT -> update status `accepted`.
6. Nếu action DECLINE -> update status `rejected`.
7. Trả message tương ứng.

Ghi rõ:
- Sender không thể tự phản hồi lời mời do chính mình gửi.
- User không liên quan không thể phản hồi.
- Request đã accepted/rejected không thể phản hồi lại.
- Request action dùng uppercase ACCEPT/DECLINE, DB status dùng lowercase accepted/rejected.

### Repository / DTO / Validator
- Bổ sung `FriendRequestAction = 'ACCEPT' | 'DECLINE'`.
- Bổ sung `RespondFriendRequestDto`.
- Bổ sung `RespondFriendRequestResponseDto`.
- Bổ sung `respondFriendRequestSchema` validate params.id UUID và body.action enum.
- Bổ sung repository method tìm friendship theo id.
- Bổ sung repository method update status theo id hoặc tái sử dụng update status hiện có.
- Service không gọi Sequelize model trực tiếp.

### Test cases
Đã bổ sung integration tests cho `PUT /api/v1/friends/request/:id`, bao phủ:
1. Không gửi token -> 401.
2. Token invalid -> 401.
3. params.id không phải UUID -> 400 VALIDATION_ERROR.
4. body.action thiếu -> 400 VALIDATION_ERROR.
5. body.action invalid -> 400 VALIDATION_ERROR.
6. Friendship id không tồn tại -> 404 FRIEND_REQUEST_NOT_FOUND.
7. Sender cố phản hồi request của chính mình -> 403 FORBIDDEN.
8. User không liên quan cố phản hồi -> 403 FORBIDDEN.
9. Receiver ACCEPT thành công -> 200, DB status = accepted.
10. Receiver DECLINE thành công -> 200, DB status = rejected.
11. Receiver cố phản hồi request đã accepted -> 400 FRIEND_REQUEST_NOT_PENDING.
12. Receiver cố phản hồi request đã rejected -> 400 FRIEND_REQUEST_NOT_PENDING.

Tổng friendship route tests hiện tại:
`27 tests passed`

### Test isolation
Mã kiểm thử tuân thủ:
- Dùng randomUUID/shortId cho username/email.
- Không dùng fixed email/username generic.
- Cleanup theo IDs do suite tạo.
- Không cleanup toàn bảng.
- Cleanup đúng thứ tự: friendships -> users.
- Không dùng any/as any.
- Không dùng eslint-disable.
- Không khai báo token/user/friendship nếu không dùng thật.
- Các test PUT dùng isolated user pairs để tránh unique constraint (sender_id, receiver_id).

### Lỗi đã gặp và cách khắc phục
1. Friendship routes test fail do unique constraint:
   - Lỗi: các test PUT tạo Friendship bằng cùng cặp userA -> userB, trong khi các test POST trước đó đã tạo relationship cùng cặp.
   - Nguyên nhân: bảng friendships có unique constraint (sender_id, receiver_id).
   - Cách sửa: cập nhật test PUT sử dụng các cặp user cô lập riêng cho từng test case, tracking user IDs/friendship IDs và cleanup theo ID cụ thể.
   - Không sửa business logic, không bỏ unique constraint, không cleanup toàn bảng.

### Kết quả nghiệm thu
```txt
friendship routes test riêng: 1 suite passed, 27 tests passed
full jest runInBand: 12 suites passed, 241 tests passed
format: pass
format:check: pass
lint: pass, không có warning no-explicit-any hoặc unused variable
npm run test: 12 suites passed, 241 tests passed
build: pass
```




