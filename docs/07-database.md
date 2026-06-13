# Thiết kế Cơ sở dữ liệu (Database Schema)

## Giải thích lý do thiết kế (Design Rationale)
Hệ thống sử dụng cơ sở dữ liệu quan hệ (**PostgreSQL / MySQL**) để lưu trữ dữ liệu. Các lý do lựa chọn bao gồm:
* **Tính toàn vẹn dữ liệu**: Đảm bảo các ràng buộc khóa ngoại (foreign key constraints), tránh dữ liệu mồ côi (ví dụ: một khoản chi tiêu không thuộc về user nào).
* **Hỗ trợ Transactions**: Cần thiết khi thực hiện lưu đồng thời ảnh snap và các chi tiêu đính kèm. Nếu lưu chi tiêu lỗi, luồng lưu ảnh snap phải rollback để tránh sai lệch dữ liệu.
* **Khả năng JOIN hiệu quả**: Rất quan trọng khi truy vấn dòng thời gian hiển thị đồng thời Snaps, Expenses, Categories và Reactions của bạn bè.
* **Tách biệt dữ liệu nhị phân**: Database chỉ lưu trữ đường dẫn ảnh (`image_url` dạng VARCHAR/TEXT) để tối ưu dung lượng và tốc độ truy vấn cơ sở dữ liệu. Toàn bộ file ảnh nhị phân (binary image) được lưu trữ trên ổ đĩa của server (local file system) hoặc Cloud Storage (AWS S3/Cloudinary), không lưu trực tiếp dạng BLOB trong cơ sở dữ liệu.

---

## Danh sách bảng chính

### 1. Bảng `users` (Người dùng)
Lưu trữ thông tin tài khoản người dùng hệ thống.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh duy nhất cho user. |
| `username` | VARCHAR(50) | Unique, Not Null | Tên đăng nhập hiển thị, viết liền không dấu. |
| `email` | VARCHAR(100) | Unique, Not Null | Địa chỉ email dùng để login/liên lạc. |
| `password_hash` | VARCHAR(255) | Not Null | Mật khẩu đã được mã hóa bằng bcrypt. |
| `avatar_url` | VARCHAR(255) | Nullable | Link ảnh đại diện (avatar). |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian tạo tài khoản. |
| `updated_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian cập nhật tài khoản gần nhất. |

* **Indexes**:
  - Unique Index trên `username`.
  - Unique Index trên `email`.

---

### 2. Bảng `categories` (Danh mục chi tiêu)
Phân loại các khoản chi tiêu.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh duy nhất cho danh mục. |
| `user_id` | UUID | Foreign Key -> `users(id)`, Nullable | Khóa ngoại. Nếu `NULL` thì đây là danh mục hệ thống mặc định. |
| `name` | VARCHAR(50) | Not Null | Tên danh mục (ví dụ: Ăn uống, Di chuyển). |
| `color` | VARCHAR(7) | Nullable | Mã màu Hex hiển thị trên biểu đồ (ví dụ: #FF5733). |
| `icon` | VARCHAR(50) | Nullable | Tên icon đại diện cho danh mục. |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian tạo. |
| `updated_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian cập nhật. |

* **Indexes**:
  - Index trên `user_id` để tối ưu hóa truy vấn các danh mục riêng của người dùng.

---

### 3. Bảng `snaps` (Nhật ký hình ảnh)
Lưu trữ các khoảnh khắc hình ảnh người dùng chụp.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh duy nhất cho snap. |
| `user_id` | UUID | Foreign Key -> `users(id)`, Not Null | Khóa ngoại tham chiếu đến người sở hữu snap. |
| `image_url` | VARCHAR(255) | Not Null | Đường dẫn tĩnh của file ảnh hoặc URL Cloud. |
| `caption` | TEXT | Nullable | Mô tả ngắn hoặc cảm nghĩ đính kèm snap. |
| `is_private` | BOOLEAN | Not Null, Default: TRUE | Trạng thái riêng tư (TRUE: chỉ mình tôi, FALSE: bạn bè có thể xem). |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Ngày chụp snap. |
| `updated_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian cập nhật snap gần nhất. |
| `deleted_at` | TIMESTAMP | Nullable | Cờ đánh dấu đã xóa (Soft Delete). |

* **Quy tắc Soft Delete**:
  - Khi người dùng xóa Snap, hệ thống chỉ cập nhật trường `deleted_at` bằng thời gian hiện tại thay vì xóa cứng dòng dữ liệu.
  - Các API timeline và friend feed phải tự động bỏ qua các bản ghi snap có `deleted_at IS NOT NULL`.
  - Các khoản chi tiêu trong bảng `expenses` liên kết với snap bị xóa (thông qua `snap_id`) sẽ **không bị xóa** và không bị thay đổi dữ liệu chi tiêu để tránh mất mát dữ liệu tài chính.

* **Indexes**:
  - Index trên `user_id` kết hợp với `created_at` để truy vấn dòng thời gian cá nhân của user sắp xếp theo thời gian.

---

### 4. Bảng `expenses` (Giao dịch chi tiêu)
Lưu trữ thông tin chi tiết các khoản chi tiêu.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh duy nhất cho khoản chi. |
| `user_id` | UUID | Foreign Key -> `users(id)`, Not Null | Khóa ngoại tham chiếu đến người chi tiêu. |
| `snap_id` | UUID | Foreign Key -> `snaps(id)`, Nullable | Khóa ngoại tham chiếu đến snap đính kèm (nếu có). |
| `category_id` | UUID | Foreign Key -> `categories(id)`, Not Null | Khóa ngoại phân loại danh mục chi tiêu. |
| `amount` | DECIMAL(12, 2) | Not Null | Số tiền chi tiêu, bắt buộc lớn hơn 0. |
| `note` | TEXT | Nullable | Chi tiết cụ thể khoản chi. |
| `date` | DATE | Not Null, Default: CURRENT_DATE | Ngày thực hiện giao dịch chi tiêu (dùng để thống kê). |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian tạo bản ghi. |
| `updated_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian sửa đổi gần nhất. |
| `deleted_at` | TIMESTAMP | Nullable | Cờ đánh dấu đã xóa (Soft Delete). |

* **Quy tắc Soft Delete**:
  - Khi người dùng xóa chi tiêu, hệ thống chỉ cập nhật trường `deleted_at` bằng thời gian hiện tại thay vì xóa cứng dòng dữ liệu.
  - Các API thống kê và timeline phải tự động bỏ qua các bản ghi có `deleted_at IS NOT NULL`.

* **Indexes**:
  - Index trên `user_id` và `date` để tính toán nhanh số liệu thống kê ngày/tháng của từng người dùng.
  - Index trên `snap_id` để truy xuất nhanh các khoản chi đính kèm của một snap.

---

### 5. Bảng `friendships` (Quan hệ bạn bè)
Lưu trữ mối quan hệ kết nối giữa các người dùng.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh mối quan hệ. |
| `sender_id` | UUID | Foreign Key -> `users(id)`, Not Null | Người gửi yêu cầu kết bạn. |
| `receiver_id` | UUID | Foreign Key -> `users(id)`, Not Null | Người nhận yêu cầu kết bạn. |
| `status` | VARCHAR(20) | Not Null, Default: 'PENDING' | Trạng thái: `PENDING`, `ACCEPTED`, `DECLINED`. |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian gửi lời mời. |
| `updated_at` | TIMESTAMP | Not Null, Default: NOW | Thời gian chấp nhận/từ chối lời mời. |

* **Ràng buộc duy nhất (Unique Constraint)**:
  - Thiết lập khóa unique ghép đôi giữa (`sender_id`, `receiver_id`) để không xảy ra trường hợp gửi trùng lặp lời mời kết bạn.
* **Indexes**:
  - Index trên `sender_id` và `receiver_id` để hiển thị nhanh danh sách bạn bè của một user.

---

### 6. Bảng `reactions` (Emoji tương tác)
Lưu trữ các emoji phản hồi của bạn bè đối với snap.
* **Cấu trúc**:

| Tên cột | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Định danh duy nhất cho reaction. |
| `snap_id` | UUID | Foreign Key -> `snaps(id)`, Not Null | Snap nhận được reaction. Xóa Snap sẽ xóa Reactions (Cascade). |
| `user_id` | UUID | Foreign Key -> `users(id)`, Not Null | Người dùng thả emoji. |
| `emoji` | VARCHAR(10) | Not Null | Emoji unicode tương tác (ví dụ: 👍, ❤️, 😂, v.v.). |
| `created_at` | TIMESTAMP | Not Null, Default: NOW | Thời điểm thả emoji. |

* **Indexes**:
  - Index trên `snap_id` để lấy nhanh toàn bộ reaction của một snap khi hiển thị trên feed.
