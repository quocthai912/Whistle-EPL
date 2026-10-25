# Cổng tích hợp media bên ngoài

**Chính sách hiện hành:** Giữ INT-01 cho media, điều chỉnh bởi LS-01, Nhóm trưởng xác nhận ngày 2026-10-26 (Asia/Bangkok). Chưa duyệt nhà cung cấp; không cho tích hợp API ở giai đoạn Context.

## INT-01 - Nghiệm thu trước nghiên cứu và tích hợp API

1. Kiến trúc mở rộng được cho media ngoài, trong khi nghiệp vụ CLB, Logo, hồ sơ và ảnh cầu thủ cốt lõi độc lập.
2. Xây dựng, kiểm thử và nghiệm thu độc lập chức năng cốt lõi đó trước khi nghiên cứu, thử nghiệm và chọn API hỗ trợ ảnh. Kết nối ngoài không phải tiên quyết nghiệm thu cốt lõi.
3. Highlightly vẫn là ứng viên ưu tiên thử nghiệm sau. API-FOOTBALL và football-data.org là ứng viên tham khảo. Các tên đến từ chỉ đạo Nhóm trưởng, không phải xác minh hoặc phê duyệt nhà cung cấp hiện tại.
4. Nghiên cứu/chọn vẫn sau nghiệm thu cốt lõi độc lập; chưa chọn nhà cung cấp, SDK hoặc tích hợp lúc này.
5. Vẫn cần vận hành ổn định khi API lỗi, quyền sử dụng ảnh/dữ liệu, nguồn gốc, kiểm tra và áp dụng đúng thẩm quyền.
6. Bổ sung media sau này không cho tự ghi lịch, biên bản, Official Results, bảng xếp hạng hoặc thống kê.

Xem [ADR 0016](../../../docs/adr/0016-core-acceptance-before-external-integration.md) cho cổng ban đầu và [ADR 0017](../../../docs/adr/0017-live-score-excluded-from-first-version.md) cho quyết định phạm vi thay thế phần Live Score.

## V2-EXT-01 - Live Match Tracking / Live Score

**Trạng thái:** EXCLUDED_FROM_FIRST_VERSION. **Phỏng vấn:** CANCELLED. **Quyết định:** LS-01, Nhóm trưởng và thành viên phê duyệt, thông báo ngày 2026-10-26.

Live Score từng được cân nhắc sau Q36. Nhóm đã bỏ triển khai, thiết kế chi tiết, câu hỏi đối chiếu/nhà cung cấp/cập nhật, kế hoạch tích hợp và nghiệm thu bắt buộc khỏi phạm vi phiên bản đầu hiện tại. Không tiếp tục phỏng vấn hoặc thiết kế trong Context v2. Không tự biến thành cam kết Future Enhancements; chỉ xét lại khi nhóm có quyết định mới.

Lý do nhóm nêu: nhu cầu gọi API liên tục, chưa có phương án miễn phí được xác minh đáp ứng cập nhật liên tục ổn định, và độ phức tạp đồng bộ, đối chiếu, lỗi, độ trễ, phụ thuộc nhà cung cấp không tương xứng SE104. Đây là căn cứ nhóm thông báo, không phải nghiên cứu nhà cung cấp mới.

Loại bỏ không bỏ khả năng mở rộng media ngoài hoặc yêu cầu media cốt lõi độc lập. Thảo luận cũ giữ ở Git/ADR, không tạo việc còn chờ hiện tại. [Hoãn trận](../use-cases/scheduling.md#postpone-01---quản-lý-hoãn-trận-phiên-bản-đầu) và [dashboard](../use-cases/publication.md#dashboard-01---dashboard-tổng-quan-mùa-giải) là chức năng nội bộ phiên bản đầu, không thay thế Live Score.

Yêu cầu media bắt buộc vẫn tại [quản lý media](media.md).
