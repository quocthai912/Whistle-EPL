# Logo CLB và ảnh hồ sơ cầu thủ

**Trạng thái:** LOGO-01 APPROVED; phạm vi ảnh CLB/cầu thủ CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok). Chi tiết thiết kế ảnh cầu thủ bên dưới vẫn mở. Chưa xác lập triển khai/nghiệm thu.

Đây là nội dung Context Package hiện hành. V1 là mốc Git đã duyệt, không phải bộ tài liệu riêng cần giữ bất biến trong working tree. PDF nguồn không đổi.

## Phạm vi phiên bản đầu

- Hỗ trợ mùa Premier League đầy đủ 20 CLB, mỗi CLB có Logo được quản lý riêng, và hàng trăm hồ sơ cầu thủ có ảnh hồ sơ được quản lý. Giữ cấu hình nhỏ hơn [D060](../use-cases/scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu); nghiệm thu phiên bản đầu phải bao phủ đủ 20 CLB.
- Logo thuộc hồ sơ CLB gốc dùng chung theo UC07; ảnh cầu thủ gắn hồ sơ cầu thủ theo UC09. Đây là dữ liệu thực, không phải ánh xạ Frontend hoặc mockup trang trí.
- Giao diện cầu thủ kết hợp dữ liệu hồ sơ với CLB, số áo và đăng ký theo mùa tương ứng. Giữ phân biệt hồ sơ gốc/đăng ký [D035](../business.md#d035---định-danh-gốc-ổn-định-và-bản-chụp-chọn-lọc-thông-tin-nghiệp-vụ-chính-thức)/[D056](../use-cases/registration.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán); không tự biến CLB/số áo thành thuộc tính định danh cố định của hồ sơ gốc cầu thủ.
- Backend, tham chiếu cơ sở dữ liệu và Frontend phải quản lý/hiển thị ảnh với fallback khi thiếu hoặc không tải được. Dùng cách hiển thị nhất quán tại danh sách, hồ sơ CLB/cầu thủ, lịch, kết quả, bảng xếp hạng và tra cứu phù hợp.
- Nghiệp vụ cốt lõi và quản lý ảnh hoạt động độc lập API ngoài. Không hardcode danh sách CLB/cầu thủ trong Frontend.
- Hồ sơ mới/chưa hoàn chỉnh có thể dùng fallback. Tuy nhiên, nghiệm thu dữ liệu mùa đầy đủ phải chứng minh Logo thật cho cả 20 CLB tham gia và quản lý ảnh cầu thủ ở quy mô hàng trăm hồ sơ. Số cầu thủ kiểm thử cụ thể và nguồn ảnh có quyền sử dụng còn cần xác định.
- Không yêu cầu màu áo hoặc ảnh trang phục theo mùa trong phạm vi phiên bản đầu này. Yêu cầu ảnh trong tệp xuất thuộc hợp đồng báo cáo/xuất tệp.

## LOGO-01 - Thiết kế Logo đã phê duyệt

**Xác nhận:** Nhóm trưởng phê duyệt rõ toàn bộ gói nền và phương án A, giữ mọi quy tắc đề xuất. Quyết định này riêng với [D001](architecture.md#d001---backend-nguyên-khối-chia-module-nghiệp-vụ-có-phân-lớp)-[D068](../use-cases/publication.md#d068---dashboard-tổng-quan-mùa-giải-công-khai).

- Lưu tệp Logo bền vững trên Server, ngoài repository và vùng tệp thực thi; PostgreSQL lưu tham chiếu/metadata. Backend quản lý nhận/phân phối ảnh. Không chọn dịch vụ cloud hoặc nền tảng tệp chung.
- Nhận PNG, JPEG và WebP tĩnh, tối đa 2 MiB (2.097.152 byte), mỗi chiều tối đa 2048 pixel. Từ chối SVG, GIF và ảnh động.
- Kiểm tra dung lượng, loại tệp thực, giải mã và kích thước; chuẩn hóa ảnh phía Server và sinh tên tệp mới. Chỉ phần mở rộng hoặc MIME do client gửi chưa đủ. Chưa chọn thư viện/phiên bản ảnh cụ thể.
- Quyền quản lý CLB dùng chung được cấp riêng theo [D034](../use-cases/administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung) cho phép tải, thay và gỡ về fallback. [D037](../use-cases/administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)-[D041](../use-cases/administration.md#d041---giữ-phân-công-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-tài-khoản-bị-khóa), kiểm tra phiên và kiểm tra quyền cuối [D030](architecture.md#d030---kiểm-tra-lại-phiên-và-quyền-hiện-hành-tại-điểm-quyết-định-cuối-của-thao-tác-ghi) vẫn áp dụng. Lưu người, thời điểm và tham chiếu trước/sau. Vai trò theo mùa hoặc Quản trị viên không tự có quyền nghiệp vụ.
- Chỉ đổi tham chiếu khi ảnh mới đã hợp lệ và lưu thành công; lỗi giữ Logo cũ. Hiển thị dùng chung, giữ tỷ lệ, có tên CLB thay thế và fallback khi thiếu/tải lỗi.
- Backup/restore gồm metadata và tệp Logo thực; chỉ backup cơ sở dữ liệu chưa đủ. Lịch/công cụ vận hành cụ thể còn thuộc thiết kế vận hành đang chờ.
- Dùng Logo CLB hiện tại nhất quán cả trên trang mùa cũ. Đây là ngoại lệ/bổ sung chỉ cho Logo đối với tra cứu mô tả theo mùa [D059](../business.md#d059---dữ-liệu-đăng-ký-bắt-buộc-và-mốc-chụp-thông-tin-chính-thức). Giữ nhật ký đổi, không yêu cầu giữ ảnh cũ để tái hiện từng mùa. Tên, bản chụp chính thức, kết quả và thống kê vẫn theo bảo toàn lịch sử đã duyệt.
- Thiếu Logo có fallback, không bắt buộc phải có ảnh cho mọi lần lưu hồ sơ.

**Đánh đổi:** Chọn nhận diện hiện tại thay vì bản chụp ảnh lịch sử để lưu trữ/hiển thị phiên bản đầu đơn giản, nhất quán. Chấp nhận trang mùa cũ có thể dùng Logo hôm nay. Ngoại lệ không tự áp dụng cho ảnh cầu thủ.

## Phạm vi ảnh cầu thủ và quyết định còn mở

Nhóm trưởng xác nhận ảnh cầu thủ được quản lý là chức năng bắt buộc phiên bản đầu. UC09 dùng thẩm quyền quản lý hồ sơ cầu thủ hiện có; quyền Logo CLB không cấp quyền sửa cầu thủ.

Duyệt LOGO-01 không tự chọn: giới hạn tệp/dung lượng giống Logo cho ảnh cầu thủ, hiển thị ảnh hiện tại hay lịch sử, thao tác ảnh cụ thể và lưu giữ. Dùng lại cơ chế media đã duyệt là ứng viên thiết kế; chỉ chốt chính sách đáng kể sau xác nhận. Chưa chọn nhà cung cấp, thư viện ảnh hoặc endpoint tải ảnh.

## Use Case hiện có và Phase sở hữu

UC07 sở hữu thao tác Logo CLB, UC09 sở hữu ảnh hồ sơ cầu thủ. Xem [luồng UC](../use-cases/registration.md) và [Progress Checker](../progress-checker.md) hiện hành để biết nơi sở hữu/bằng chứng nghiệm thu. Giữ sáu tác nhân và 25 Use Case.

## Ranh giới tích hợp ngoài

Cổng chỉ dành cho media đã chốt tại [chính sách tích hợp](integrations.md). LS-01 loại Live Score khỏi phiên bản đầu và hủy phỏng vấn/thiết kế; bổ sung media vẫn cần nghiệm thu độc lập trước nghiên cứu/chọn API. Nhận diện hiện tại không cho phép nguồn ngoài tự ghi đè hoặc bỏ qua quyền/kiểm tra ảnh. Dữ liệu/hình ảnh phải tuân thủ quyền sử dụng.

Nguồn kỹ thuật: [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), hỗ trợ kiểm tra nhiều lớp và lưu trữ/truy cập có kiểm soát; giới hạn dự án phía trên đến từ phê duyệt LOGO-01.

Xem [ADR 0015](../../../docs/adr/0015-managed-club-logos-in-first-version.md), [glossary](../GLOSSARY.md) và [điều hướng quyết định](README.md).
