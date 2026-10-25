# Danh sách quyết định Context v2 chờ xử lý

Danh sách này ghi công việc v2 được hoãn, tách khỏi [16 quyết định mở v1](../open-decisions.md) và [quyết định v2 đã xác nhận](README.md#quyết-định-đã-xác-nhận). Cải tiến được ghi chờ không phải thiết kế kỹ thuật đã duyệt, yêu cầu đã hoàn tất hoặc cam kết triển khai. Bản Vietnamese và [English](../../english/design/pending-decisions.md) tương đương về nghĩa.

## V2-EXT-01 - Live Match Tracking / Live Score

- **Trạng thái:** PENDING_INTERVIEW. Nhóm trưởng yêu cầu ngày 2026-10-25 (Asia/Bangkok), sau Q36.
- **Ý định:** Bổ sung Live Match Tracking / Live Score như một cải tiến Context v2. Ghi nhận ý định ngay; chưa phỏng vấn nhóm này hoặc chốt thiết kế.
- **Giới hạn người dùng chỉ định:** Live Score lấy từ EPL API chỉ là dữ liệu tham khảo. Không thay thế Official Result và không tự động cập nhật BXH hoặc thống kê chính thức khác. Ranh giới thẩm quyền và xác nhận/hiệu chỉnh kết quả chính thức hiện có vẫn được phân biệt rõ.
- **Thứ tự xử lý:** Tiếp tục phỏng vấn nền tảng grill-with-docs hiện tại theo quan hệ phụ thuộc. Chủ động đưa nhóm này vào sau khi hoàn thành các nhóm quyết định nền tảng và trước tổng kết/đề xuất phê duyệt toàn bộ Context v2. Đây là nhắc việc phỏng vấn bắt buộc, không phải chọn chi tiết triển khai.
- **Quan hệ với nguồn:** Đây là cải tiến v2 mới do Nhóm trưởng yêu cầu, liên quan nhánh tích hợp ngoài tùy chọn TT-05. Không phải yêu cầu đã có trong Chương 1-2 hoặc thay đổi hồi tố v1. Chưa gán Oxx, UC hoặc Phase dự án mới tại thời điểm này.
- **Thiết kế chưa chốt:** Nhà cung cấp/danh tính API và hợp đồng, phạm vi, ánh xạ trận nội bộ, độ mới/cách cập nhật, lỗi, UI/công khai, bảo mật, lưu trữ và chi tiết vận hành/nghiệm thu đều còn mở. “EPL API” chỉ nhóm nguồn được yêu cầu, chưa chọn nhà cung cấp. Chưa chọn công nghệ, cách triển khai hoặc cơ chế làm mới.
- **Ranh giới tài liệu:** Không sửa Context v1 đã duyệt hoặc báo cáo Chương 1-2 vì cải tiến này. Giữ danh sách chờ và thiết kế sau này trong phần bổ sung v2 song ngữ; chỉ tạo ADR khi quyết định thiết kế phù hợp đã thực sự được xác nhận.
- **Mốc tiếp tục:** Q36 đã xác nhận; chưa hỏi Q37. Không chuyển sang Live Score ở Q37. Quay lại danh sách này trước khi tổng kết gói để phê duyệt.
