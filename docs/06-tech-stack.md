# Công nghệ sử dụng (Technology Stack)

## Ứng dụng di động (Frontend)
* **Framework**: React Native với Expo Managed Workflow.
  - **Expo SDK**: SDK 54 (Hạ cấp từ SDK 56 để tương thích với Expo Go trên thiết bị thật).
  - **Phiên bản cốt lõi**:
    - `expo@54.0.35`
    - `react-native@0.81.5`
    - `react@19.1.0`
  - **Lý do sử dụng SDK 54**: Ban đầu mobile app được khởi tạo với SDK 56, nhưng ứng dụng Expo Go trên thiết bị thật của người dùng không hỗ trợ runtime này (báo incompatible). Dự án đã được chuyển về SDK 54 để cho phép nghiệm thu trực tiếp bằng Expo Go trên điện thoại thật.
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
    - `expo-camera` (Camera preview/chụp ảnh nội bộ trong app)
  - **Secure token storage**:
    - `expo-secure-store`
* **Quy tắc cài đặt**:
  - Các package native được cài bằng `npx expo install` để đảm bảo tương thích Expo SDK 54.
  - Các package JavaScript thuần được cài bằng `npm install`.
  - `expo-secure-store` tự thêm plugin vào `mobile/app.json`, đây là thay đổi hợp lệ và được giữ lại để cấu hình môi trường native.
* **Cấu hình Mobile API Client**:
  - **Công nghệ**: Sử dụng Axios làm HTTP client tập trung.
  - **Cấu hình base URL**: [**`mobile/src/config/env.ts`**](file:///d:/vibe%20Coding/mobile/src/config/env.ts).
    - `API_BASE_URL` mặc định hiện tại trỏ tới Android emulator: `http://10.0.2.2:5001/api/v1`.
    - Khi test bằng thiết bị thật trong cùng mạng Wi-Fi, cần đổi `API_BASE_URL` sang LAN IP của máy chạy backend, ví dụ: `http://192.168.1.100:5001/api/v1`.
  - **Lưu trữ Token**: [**`mobile/src/services/token.ts`**](file:///d:/vibe%20Coding/mobile/src/services/token.ts), sử dụng `expo-secure-store` để lưu trữ Access Token và Refresh Token bảo mật.
  - **Axios Instance & Interceptors**: [**`mobile/src/services/api.ts`**](file:///d:/vibe%20Coding/mobile/src/services/api.ts). Tích hợp Request Interceptor tự động đính kèm token và Response Interceptor tự động thực hiện luồng Refresh Token khi gặp lỗi HTTP 401.
* **Cấu hình Mobile UI Core**:
  - **Định nghĩa Theme Tokens**: Được định nghĩa tại [**`mobile/src/theme/theme.ts`**](file:///d:/vibe%20Coding/mobile/src/theme/theme.ts), bao gồm các token:
    - `colors/palette`
    - `spacing`
    - `borderRadius`
    - `typography`
    - `shadows/elevation`
  - **UI Core Components**: Được đặt tại thư mục `mobile/src/components/`, bao gồm các component nền tảng:
    - [**`GlassButton`**](file:///d:/vibe%20Coding/mobile/src/components/GlassButton.tsx)
    - [**`GlassInput`**](file:///d:/vibe%20Coding/mobile/src/components/GlassInput.tsx)
    - [**`GlassCard`**](file:///d:/vibe%20Coding/mobile/src/components/GlassCard.tsx)
  - **Định hướng giao diện**:
    - Thiết kế theo chủ đề **Sleek Dark Mode**.
    - Hiệu ứng **Glassmorphism** được giả lập bằng màu nền bán trong suốt (`rgba background`), border bán trong suốt và shadow/elevation nhẹ.
    - Không sử dụng các thư viện blur/backdrop-filter bên ngoài.
    - Không cài thêm bất kỳ thư viện UI/blur/gradient/font/icon nào trong phạm vi task này.

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
