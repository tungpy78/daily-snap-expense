# Công nghệ sử dụng (Technology Stack)

## Ứng dụng di động (Frontend)
* **Framework**: React Native với Expo Managed Workflow.
  - **Template khởi tạo**: `blank-typescript`.
  - **Expo SDK**: Latest/SDK 56 (tại thời điểm khởi tạo).
  - **TypeScript**: Được cấu hình và bật sẵn.
  - **Thư mục dự án**: `mobile/`.
* **Navigation**: React Navigation (Hỗ trợ Native-stack navigation, tab bar và giao diện modal).
* **Quản lý Form**: React Hook Form (Tối ưu hiệu năng và quản lý state cho form nhập liệu).
* **Validation**: Zod (Định nghĩa schema validate dữ liệu form và payload API).
* **HTTP Client**: Axios (Cấu hình intercepter xử lý tự động đính kèm và refresh JWT).
* **Quản lý State (State Management)**: Zustand (Nhẹ, quản lý state dựa trên hook đơn giản và hiệu quả).

## Backend API
* **Runtime**: Node.js
* **Framework**: Express.js (Sử dụng cấu hình TypeScript cho toàn bộ routing, middleware, và controller).
* **Database ORM**: Sequelize (ORM hoạt động dựa trên Promise, hỗ trợ migration và DB hooks).
* **Database Engine**: PostgreSQL hoặc MySQL (Hệ quản trị cơ sở dữ liệu quan hệ đảm bảo tính toàn vẹn dữ liệu).
* **Authentication**: JSON Web Token (JWT) kết hợp cơ chế băm mật khẩu bảo mật qua `bcrypt`.
* **Validation**: Zod (Sử dụng middleware validate schema cho payload request).
* **Xử lý ảnh & Tải lên**: Multer (Xử lý upload dữ liệu dạng multi-part form) và lưu trữ cục bộ server (MVP) trước khi chuyển đổi sang Cloudinary/AWS S3 (Production).
* **Testing**: Jest & Supertest (Hỗ trợ viết Unit Test và Integration Test cho backend).

## Cơ sở hạ tầng & Dịch vụ tích hợp
* **Lưu trữ file (MVP)**: Lưu trữ cục bộ trên server (Local server storage) kết hợp định tuyến thư mục tĩnh (static files directory).
* **Lưu trữ file (Production)**: AWS S3 hoặc Cloudinary.
* **Thông báo (Tương lai)**: Expo Push Notifications.
* **Quét hóa đơn OCR (Tương lai)**: Google Cloud Vision API hoặc Tesseract OCR.
