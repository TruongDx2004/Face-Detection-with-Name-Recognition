Thêm chức năng sự kiện & thông báo tới sinh viên.
Dưới đây là kế hoạch phát triển chi tiết theo từng giai đoạn, đảm bảo có thể làm từng bước và mở rộng sau này.
🧩 Tên chức năng:

Thông báo & Sự kiện của Nhà trường

🎯 Mục tiêu:

Cho phép nhà trường (admin) đăng tải thông báo, tin tức, hoặc sự kiện đến toàn bộ sinh viên hoặc một nhóm đối tượng cụ thể.
Sinh viên có thể xem thông báo, chi tiết sự kiện, và đăng ký tham gia ngay trên ứng dụng.

🧱 Mô tả chi tiết:
1️⃣ Phía Admin (Nhà trường)

Thêm mới thông báo/sự kiện gồm các thông tin:

Tiêu đề

Nội dung chi tiết

Ngày đăng

Thời gian và địa điểm tổ chức (nếu là sự kiện)

Hạn đăng ký (nếu có)

Hình ảnh minh họa (tùy chọn)

Phân loại loại thông tin:

Thông báo chung

Sự kiện / Hoạt động ngoại khóa

Quản lý danh sách sự kiện đã tạo:

Sửa, xóa, hoặc ẩn thông tin

Xem danh sách sinh viên đã đăng ký tham gia

2️⃣ Phía Sinh viên (Người dùng ứng dụng)

Xem danh sách thông báo/sự kiện mới nhất (hiển thị theo thứ tự thời gian).

Nhấn vào từng mục để xem chi tiết nội dung.

Đăng ký tham gia sự kiện (nếu có nút đăng ký và sự kiện còn hạn).

Nhận thông báo đẩy (push notification) khi có thông báo/sự kiện mới.

Theo dõi trạng thái đăng ký (đã đăng ký / hết hạn / đầy người tham gia).

🧭 TỔNG QUAN MỤC TIÊU

Xây dựng hệ thống quản lý sự kiện & thông báo cho ứng dụng sinh viên gồm 2 vai trò:

👨‍💼 Admin (nhà trường): tạo, chỉnh sửa, xoá, quản lý sự kiện.

👨‍🎓 Sinh viên: xem thông báo, xem chi tiết sự kiện, đăng ký tham gia.

🧱 GIAI ĐOẠN 1 — Thiết kế cấu trúc dữ liệu & chuẩn bị môi trường
🎯 Mục tiêu:

Tạo mô hình dữ liệu thống nhất, dễ mở rộng, lưu được cả sự kiện và thông báo.
🧩 GIAI ĐOẠN 2 — Giao diện & chức năng Admin tạo sự kiện
🎯 Mục tiêu:

Admin có thể nhập thông tin → tạo sự kiện mới → lưu lên DB / Firestore.
📱 GIAI ĐOẠN 3 — Giao diện sinh viên xem & đăng ký sự kiện
🎯 Mục tiêu:

Sinh viên thấy được danh sách sự kiện và có thể đăng ký tham gia.
📊 GIAI ĐOẠN 4 — Báo cáo & Quản lý nâng cao (Admin)
🎯 Mục tiêu:

Admin có thể xem thống kê:

Số lượng sinh viên tham gia từng sự kiện.

Danh sách người tham gia.

Trạng thái sự kiện (đang mở / đã kết thúc).