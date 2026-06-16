# Công nghệ sử dụng (Technology Stack)

## Ứng dụng di động (Frontend)
* **Framework**: React Native với Expo Managed Workflow.
  - **Template khởi tạo**: `blank-typescript`.
  - **Expo SDK**: Latest/SDK 56 (tại thời điểm khởi tạo).
  - **TypeScript**: Được cấu hình và bật sẵn.
  - **Thư mục dự án**: `mobile/`.
* **Dependencies**:
  - **Navigation**:
    - `@react-navigation/native`
    - `@react-navigation/native-stack`
    - `react-native-screens`
    - `react-native-safe-area-context`
  - **API client**:
    - `axios`
  - **State management**:
    - `zustand`
  - **Form & validation**:
    - `react-hook-form`
    - `zod`
  - **Media/image**:
    - `expo-image-picker`
    - `expo-image-manipulator`
  - **Secure token storage**:
    - `expo-secure-store`
* **Quy tắc cài đặt**:
  - Các package native được cài bằng `npx expo install` để đảm bảo tương thích Expo SDK 56.
  - Các package JavaScript thuần được cài bằng `npm install`.
  - `expo-secure-store` tự thêm plugin vào `mobile/app.json`, đây là thay đổi hợp lệ và được giữ lại để cấu hình môi trường native.

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
