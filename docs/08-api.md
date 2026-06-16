# Đặc tả API (API Specification)

## Định dạng phản hồi chuẩn (Standard Response Format)

### 1. Phản hồi thành công (Success Response)
```json
{
  "success": true,
  "data": {
    // Dữ liệu trả về cụ thể cho từng API
  }
}
```

### 2. Phản hồi lỗi chuẩn (Error Response)
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Thông tin lỗi mô tả bằng tiếng Việt để hiển thị trực tiếp lên UI.",
    "details": null // Có thể chứa danh sách lỗi validate chi tiết từ Zod
  }
}
```

---

## Danh sách API chi tiết

### 1. Nhóm API Authentication
* **Quyền hạn (Permission)**: Tất cả người dùng (Public/Guest).

#### Đăng ký tài khoản (Register)
* **Endpoint**: `POST /api/v1/auth/register`
* **Request Body**:
```json
{
  "username": "hoangduong",
  "email": "duong@example.com",
  "password": "securepassword123"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "username": "hoangduong",
      "email": "duong@example.com",
      "avatarUrl": null
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

#### Đăng nhập (Login)
* **Endpoint**: `POST /api/v1/auth/login`
* **Request Body**:
```json
{
  "identity": "duong@example.com", // Có thể là email hoặc username
  "password": "securepassword123"
}
```
* **Response (200 OK)**:
*(Tương tự định dạng response của Đăng ký)*

#### Làm mới Token (Refresh Token)
* **Endpoint**: `POST /api/v1/auth/refresh`
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
}
```

#### Đăng xuất (Logout)
* **Endpoint**: `POST /api/v1/auth/logout`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsIn..."
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Đăng xuất thành công."
  }
}
```

---

### 2. Nhóm API User / Profile
* **Quyền hạn (Permission)**: Đã đăng nhập (Authenticated User).

#### Lấy thông tin cá nhân (Get Profile)
* **Endpoint**: `GET /api/v1/users/profile`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "username": "hoangduong",
      "email": "duong@example.com",
      "avatarUrl": "https://storage.api.com/avatars/hoangduong.jpg",
      "createdAt": "2026-06-13T15:00:00Z"
    }
  }
}
```

#### Cập nhật thông tin cá nhân (Update Profile)
* **Endpoint**: `PUT /api/v1/users/profile`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body (Multipart Form-Data)**:
  - `username` (Text, optional)
  - `avatar` (File, optional)
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6",
      "username": "hoangduong-new",
      "avatarUrl": "https://storage.api.com/avatars/hoangduong-new.jpg"
    }
  }
}
```

---

### 3. Nhóm API Snap / Photo Journal
* **Quyền hạn (Permission)**: Đã đăng nhập (Authenticated User).

#### Tạo Snap mới đính kèm chi tiêu (Create Snap)
* **Endpoint**: `POST /api/v1/snaps`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body (Multipart Form-Data)**:
  - `image` (File, required) - File ảnh nhị phân được nén bởi client.
  - `caption` (Text, optional) - Caption cho snap.
  - `isPrivate` (Text, Boolean, default "true") - Trạng thái riêng tư.
  - `expenses` (Text, optional) - Chuỗi JSON String đại diện cho mảng chi tiêu đính kèm. 
    *Ví dụ định dạng chuỗi JSON*: `'[{"amount": 50000, "categoryId": "food-uuid-xxxx", "note": "Mua trà sữa"}]'`
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "snap": {
      "id": "snap-uuid-1111",
      "imageUrl": "http://localhost:5000/public/uploads/snaps/image-1111.jpg",
      "caption": "Buổi chiều mát mẻ",
      "isPrivate": true,
      "createdAt": "2026-06-13T15:30:00Z"
    },
    "expenses": [
      {
        "id": "expense-uuid-2222",
        "amount": 50000.00,
        "categoryId": "food-uuid-xxxx",
        "note": "Mua trà sữa",
        "date": "2026-06-13"
      }
    ]
  }
}
```

#### Lấy dòng thời gian cá nhân (Get Timeline)
* **Endpoint**: `GET /api/v1/snaps/timeline`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Query Parameters**:
  - `startDate` (YYYY-MM-DD, optional)
  - `endDate` (YYYY-MM-DD, optional)
  - `search` (String, optional)
  - `limit` (Number, default 10)
  - `offset` (Number, default 0)
* **Response (200 OK)**:
*(Lưu ý: Chỉ trả về những snap chưa bị xóa mềm - deleted_at IS NULL)*
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "id": "snap-uuid-1111",
        "imageUrl": "http://localhost:5000/public/uploads/snaps/image-1111.jpg",
        "caption": "Buổi chiều mát mẻ",
        "isPrivate": true,
        "createdAt": "2026-06-13T15:30:00Z",
        "expenses": [
          {
            "id": "expense-uuid-2222",
            "amount": 50000.00,
            "categoryName": "Food",
            "note": "Mua trà sữa"
          }
        ],
        "reactions": []
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 10,
      "offset": 0
    }
  }
}
```

#### Xóa Snap (Delete Snap - Soft Delete)
* **Endpoint**: `DELETE /api/v1/snaps/:id`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Response (200 OK)**:
  - *Mô tả*: Cập nhật cột `deleted_at` của snap thành ngày giờ hiện tại. Snap sẽ không còn xuất hiện trên timeline cá nhân hoặc feed của bạn bè. Các bản ghi chi tiêu trong bảng `expenses` liên kết với snap này thông qua `snap_id` **vẫn được giữ lại** và không bị thay đổi để đảm bảo dữ liệu thống kê tài chính chính xác.
```json
{
  "success": true,
  "data": {
    "message": "Đã xóa khoảnh khắc thành công. Các chi tiêu liên kết vẫn được giữ lại."
  }
}
```

---

### 4. Nhóm API Expense
* **Quyền hạn (Permission)**: Đã đăng nhập (Authenticated User - chỉ được tương tác trên chi tiêu do mình sở hữu).

#### Lấy danh sách chi tiêu (List Expenses)
* **Endpoint**: `GET /api/v1/expenses`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Query Parameters**:
  - `startDate` (YYYY-MM-DD, optional)
  - `endDate` (YYYY-MM-DD, optional)
  - `categoryId` (UUID, optional)
  - `limit` (Number, default 20)
  - `offset` (Number, default 0)
* **Response (200 OK)**:
  - *Lưu ý về Snap liên kết đã bị xóa mềm*: Nếu một khoản chi tiêu liên kết với một Snap đã bị xóa mềm (`deleted_at IS NOT NULL`), hệ thống vẫn trả về `snapId` cũ để lưu vết lịch sử, nhưng thuộc tính `snap` hoặc `snapDetails` đi kèm sẽ trả về `snapDeleted: true` và `imageUrl: null` để báo hiệu cho Client không cố gắng tải hoặc hiển thị ảnh này.
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "expense-uuid-9999",
        "amount": 120000.00,
        "categoryId": "trans-uuid-3333",
        "note": "Đổ xăng xe máy",
        "date": "2026-06-13",
        "snapId": "snap-uuid-deleted",
        "snapDetails": {
          "snapDeleted": true,
          "imageUrl": null
        },
        "createdAt": "2026-06-13T15:35:00Z"
      },
      {
        "id": "expense-uuid-8888",
        "amount": 50000.00,
        "categoryId": "food-uuid-xxxx",
        "note": "Ăn bánh ngọt",
        "date": "2026-06-13",
        "snapId": "snap-uuid-active",
        "snapDetails": {
          "snapDeleted": false,
          "imageUrl": "http://localhost:5000/public/uploads/snaps/active-snap.jpg"
        },
        "createdAt": "2026-06-13T12:00:00Z"
      }
    ],
    "pagination": {
      "total": 2,
      "limit": 20,
      "offset": 0
    }
  }
}
```

#### Thêm chi tiêu thủ công không cần ảnh (Create Expense)
* **Endpoint**: `POST /api/v1/expenses`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "amount": 120000,
  "categoryId": "trans-uuid-3333",
  "note": "Đổ xăng xe máy",
  "date": "2026-06-13",
  "snapId": null // Truyền UUID nếu muốn gắn vào snap có sẵn
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "expense-uuid-9999",
      "amount": 120000.00,
      "categoryId": "trans-uuid-3333",
      "note": "Đổ xăng xe máy",
      "date": "2026-06-13",
      "snapId": null,
      "createdAt": "2026-06-13T15:35:00Z"
    }
  }
}
```

#### Cập nhật chi tiêu (Update Expense)
* **Endpoint**: `PUT /api/v1/expenses/:id`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
*(Các trường truyền lên tương tự API tạo mới, cho phép cập nhật từng phần)*
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "expense": {
      "id": "expense-uuid-9999",
      "amount": 150000.00, // Đã thay đổi
      "categoryId": "trans-uuid-3333",
      "note": "Đổ xăng xe máy & Thay nhớt",
      "date": "2026-06-13"
    }
  }
}
```

#### Xóa chi tiêu (Delete Expense - Soft Delete)
* **Endpoint**: `DELETE /api/v1/expenses/:id`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Response (200 OK)**:
  - *Mô tả*: Cập nhật cột `deleted_at` của chi tiêu thành ngày giờ hiện tại. Khoản chi tiêu này sẽ bị ẩn khỏi mọi danh sách hiển thị, timeline và bị loại trừ khỏi biểu đồ thống kê tài chính.
```json
{
  "success": true,
  "data": {
    "message": "Đã xóa khoản chi tiêu thành công."
  }
}
```

---

### 5. Nhóm API Category
* **Quyền hạn (Permission)**: Đã đăng nhập (Authenticated User).

#### Lấy danh sách danh mục (List Categories)
* **Endpoint**: `GET /api/v1/categories`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "cat-system-food",
        "name": "Food",
        "color": "#FF5733",
        "icon": "fast-food-outline",
        "isDefault": true // Danh mục hệ thống
      },
      {
        "id": "cat-custom-hobbies",
        "name": "Nuôi thú cưng",
        "color": "#4CAF50",
        "icon": "paw-outline",
        "isDefault": false // Danh mục tự tạo
      }
    ]
  }
}
```

#### Tạo danh mục tùy chỉnh (Create Custom Category)
* **Endpoint**: `POST /api/v1/categories`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "name": "Chăm sóc da",
  "color": "#E91E63",
  "icon": "sparkles"
}
```
* **Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "category": {
      "id": "cat-custom-skincare-uuid",
      "name": "Chăm sóc da",
      "color": "#E91E63",
      "icon": "sparkles"
    }
  }
}
```

---

### 6. Nhóm API Friend / Private Sharing
* **Quyền hạn (Permission)**: Đã đăng nhập (Authenticated User).

#### Gửi lời mời kết bạn (Send Friend Request)
* **Endpoint**: `POST /api/v1/friends/request`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "receiverIdentity": "vietanh@example.com" // Email hoặc username của bạn bè
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Đã gửi lời mời kết bạn thành công."
  }
}
```

#### Phản hồi lời mời kết bạn (Respond Request)
* **Endpoint**: `PUT /api/v1/friends/request/:id`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "action": "ACCEPT" // Hoặc "DECLINE"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Đã chấp nhận kết bạn."
  }
}
```

#### Lấy dòng thời gian của bạn bè (Get Friend Feed)
* **Endpoint**: `GET /api/v1/friends/feed`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Query Parameters**: `limit`, `offset`
* **Response (200 OK)**:
  - *Mô tả*: Lấy snaps chưa bị xóa mềm (`deleted_at IS NULL`) của bạn bè và ở chế độ công khai với bạn bè (`isPrivate = false`).
```json
{
  "success": true,
  "data": {
    "feed": [
      {
        "id": "friend-snap-uuid",
        "username": "vietanh",
        "avatarUrl": "https://storage.api.com/avatars/vietanh.jpg",
        "imageUrl": "http://localhost:5000/public/uploads/snaps/vietanh-snap.jpg",
        "caption": "Món phở sáng nay cùng bạn bè",
        "createdAt": "2026-06-13T08:15:00Z",
        "reactions": [
          {
            "username": "hoangduong",
            "emoji": "❤️"
          }
        ]
      }
    ]
  }
}
```

#### Thả Reaction cho Snap (React to Snap)
* **Endpoint**: `POST /api/v1/snaps/:id/react`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Request Body**:
```json
{
  "emoji": "👍"
}
```
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Đã thả cảm xúc thành công."
  }
}
```

---

### 7. Nhóm API Statistics
* **Quyền hạn (Permission)**: Đã đăng nhập (`authMiddleware` - chỉ tính toán dữ liệu chưa bị xóa của chính mình).

#### Lấy tóm tắt thống kê chi tiêu (Get Statistics Summary)
* **Endpoint**: `GET /api/v1/statistics`
* **Headers**: `Authorization: Bearer [accessToken]`
* **Query Parameters (Optional)**:
  - `month` (Integer, 1-12)
  - `year` (Integer, 1970-2100)
* **Behavior**:
  - Nếu không truyền `month`/`year` thì dùng tháng/năm hiện tại của server.
  - `dailyTotal` luôn tính theo ngày hiện tại của server.
  - `recentTrend` luôn tính 7 ngày gần nhất kết thúc tại ngày hiện tại của server.
  - `monthlyTotal` và `categoryBreakdown` tính theo query `month`/`year` nếu có, nếu không thì tháng/năm hiện tại.
* **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "dailyTotal": 120000,
    "monthlyTotal": 3450000,
    "categoryBreakdown": [
      {
        "categoryId": "category-uuid",
        "categoryName": "Food",
        "totalAmount": 1800000,
        "percentage": 52.17
      }
    ],
    "recentTrend": [
      { "date": "2026-06-10", "total": 150000 },
      { "date": "2026-06-11", "total": 0 }
    ]
  }
}
```
* **Error Cases**:
  - **401 UNAUTHORIZED**: Nếu thiếu token.
  - **401 INVALID_TOKEN**: Nếu token sai.
  - **400 VALIDATION_ERROR**: Nếu `month`/`year` không hợp lệ (không phải số nguyên, nằm ngoài khoảng cho phép).
