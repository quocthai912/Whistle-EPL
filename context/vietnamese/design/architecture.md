# Kiến trúc và hợp đồng kỹ thuật dùng chung

Sở hữu stack, phân lớp, biểu diễn thời gian và kiểm tra quyền cuối đã duyệt. Chỉ quyết định bên dưới được chọn; mô-đun, ERD/schema, công nghệ phiên và triển khai vẫn chờ thiết kế. Xem [công việc mở](../open-decisions.md).

### D001 - Backend nguyên khối chia module nghiệp vụ, có phân lớp

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0001-modular-layered-backend.md#d001-english-evidence).

- **Nguồn:** O12; CN-01-CN-04, PDF tr.26; ràng buộc dữ liệu tập trung tại §1.2.6.1; nhóm ba thành viên và kế hoạch nguồn tại §1.5 tr.50-52.

- **Quyết định:** Một backend triển khai như một đơn vị, tổ chức theo module nghiệp vụ và phân rõ trách nhiệm tiếp nhận yêu cầu, xử lý nghiệp vụ, truy cập dữ liệu; một CSDL quan hệ tập trung.

### D002 - Technology Stack và kiểu API đã phê duyệt

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0002-approved-technology-stack.md#d002-english-evidence).

- **Nguồn:** O12; CN-01-CN-04, PDF tr.26; xác nhận Q2. Nguyên tắc lựa chọn ưu tiên công nghệ nhóm đã thực hành, phù hợp ràng buộc môn học. Xác nhận này không xác lập kinh nghiệm cụ thể của từng thành viên hoặc các ràng buộc môn học bổ sung.

- **Quyết định:** Frontend: React + TypeScript. Backend: NestJS + TypeScript. Database: PostgreSQL. ORM: Prisma ORM. Kiểu API: REST API. Kiến trúc: Modular Monolith kết hợp Layered Architecture, nhất quán với [D001](architecture.md#d001---backend-nguyên-khối-chia-module-nghiệp-vụ-có-phân-lớp).

- **Hệ quả:** Thiết kế Chương 3 và lập kế hoạch triển khai sau này sử dụng stack đã phê duyệt. Ranh giới module, schema PostgreSQL, ánh xạ Prisma và hợp đồng REST cần được thiết kế nhất quán với stack này.

### D024 - Thời điểm theo UTC, nhập/hiển thị thống nhất múi giờ Việt Nam

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md#d024-english-evidence).

- **Nguồn:** O03/O12 và nội dung xuyên suốt O07/O08; TT-04, PDF tr.19; yêu cầu thời gian trong lịch/đăng ký/quy định/ủy quyền. Đây là chính sách thiết kế v2 được xác nhận rõ, không phải múi giờ được PDF quy định.

- **Quyết định:** Lưu và so sánh các thời điểm cụ thể theo UTC. Nhập và hiển thị thời gian thống nhất theo Asia/Ho_Chi_Minh trên toàn hệ thống, gồm lịch thi đấu, hạn đăng ký, hiệu lực quy định/ủy quyền và lịch sử hoạt động. Ghi nhãn múi giờ rõ ràng và không tự đổi theo múi giờ thiết bị người dùng.

- **Giá trị chỉ có ngày:** Giữ nguyên các ngày không kèm giờ, như ngày sinh và mốc ngày sinh U21, dưới dạng ngày lịch không chuyển múi giờ. Quyết định này không chọn giá trị ngày chốt hoặc hạn đăng ký cụ thể theo mùa.

### D030 - Kiểm tra lại phiên và quyền hiện hành tại điểm quyết định cuối của thao tác ghi

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0007-final-authorization-check-for-writes.md#d030-english-evidence).

- **Nguồn:** O07/O08/O12; BM-01/BM-02 và CN-02, PDF tr.23/26; AT-02/AT-03, tr.32; [D007](../use-cases/administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)-[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc).

- **Quyết định:** Với thao tác ghi nội bộ, kiểm tra quyền khi nhận yêu cầu và kiểm tra lại phiên, quyền hiện hành, thời hạn tại điểm quyết định cuối bên trong giao dịch trước khi ghi nhận thay đổi thành công. Có quyền hợp lệ khi bắt đầu chưa đủ nếu phiên/quyền không còn hợp lệ tại điểm cuối đó.

- **Thất bại và nhất quán:** Nếu kiểm tra cuối không đạt, từ chối và hủy giao dịch nghiệp vụ đó, không để dữ liệu, thống kê hoặc trạng thái nghiệp vụ dở dang. Thu hồi quyền và ghi dữ liệu đồng thời phải có thứ tự nhất quán, để kiểm tra quyền cũ không ghi vượt qua thu hồi đã có hiệu lực. Thao tác đã hoàn tất hợp lệ trước đó được giữ nguyên; thu hồi không hủy ngược.

- **Ví dụ biên:** Yêu cầu nhận lúc 11:59:59 dùng quyền hết hạn lúc 12:00 phải bị từ chối nếu kiểm tra quyền cuối xảy ra lúc 12:00:01. Biên khoảng thời gian theo [D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc).
