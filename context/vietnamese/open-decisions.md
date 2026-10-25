# Quyết định chưa giải quyết

Sổ này chỉ chứa công việc chưa chốt. Mã O giữ nguồn truy vết; mỗi dòng OPEN cho phần còn lại được nêu, không phải chính sách đã duyệt. Xem [chỉ mục quyết định](design/README.md#quyết-định-đã-xác-nhận) cho [D001](design/architecture.md#d001---backend-nguyên-khối-chia-module-nghiệp-vụ-có-phân-lớp)-[D068](use-cases/publication.md#d068---dashboard-tổng-quan-mùa-giải-công-khai) và tài liệu sở hữu cho quy tắc hiện hành. Làm rõ hợp đồng không tự đòi thêm lượt duyệt nghiệp vụ.

| Mã | Nguồn | Công việc còn lại |
|---|---|---|
| O01 | QĐ1.3-1.4 p.6; UC11 p.95 | Giá trị U21/khoảng tuổi mùa đầu cụ thể và kiểm tra trường/định dạng căn cứ chi tiết. |
| O02 | QĐ1.5-1.6 p.7; UC08/10/11 | Lịch cụ thể; mã ngoại lệ/thao tác; sửa/hủy kế hoạch đăng ký tương lai, kiểm tra hạn mức qua khoảng kế hoạch, đóng mùa và hợp đồng hiệu chỉnh chi tiết. |
| O03 | QĐ2.4-2.5 p.7; UC13 p.101 | Giá trị phút kế hoạch mùa đầu và thực thi thời gian/schema/đồng thời chi tiết. |
| O04 | BM4.2-4.3 pp.8-9; BM-05 pp.21/23 | Hợp đồng trường UI/API/xuất tệp, lọc nội dung nhật ký/lịch sử, phạm vi/lịch sử riêng ảnh cầu thủ và phân phối media công khai cụ thể. |
| O05 | QĐ5.3/5.5 p.10; BM5.3 | Tính đối đầu/nhóm nhiều CLB, tham số suất dự giải/xuống hạng, ghi nhận/phân định playoff, duyệt và mở lại tổng kết mùa. |
| O06 | QĐ5.7 p.11; UC20 p.122 | Hợp đồng tổng hợp/hiệu chỉnh/báo cáo giữ sạch lưới và giải thưởng chi tiết. |
| O07 | QĐ6 p.11; UC06 pp.80-81 | Thiếu bản hiệu lực ban đầu, kiểm tra căn cứ/xung đột, lỗi kỹ thuật/thử lại khi kích hoạt, hợp đồng vòng đời/thời gian chính xác và chi tiết công bố quy định còn lại. |
| O08 | PDF pp.42-46/60; UC03/08/13/14/17-19 | Ma trận thao tác đầy đủ, quyền tạo mùa đầu, vòng đời tài khoản/mật khẩu còn lại, mã luồng/lỗi chính xác và hợp đồng việc đang chờ/đồng thời. |
| O09 | BM1-BM3; PDF pp.37-38; UC07-UC20 | Kiểu/độ dài/chuẩn hóa/danh mục vị trí còn lại, sinh mã nghiệp vụ, xử lý sự kiện nghi trùng, định dạng tham chiếu nguồn và trường bản chụp/hiệu chỉnh/API cụ thể. |
| O10 | TH-02 p.13; UC13 pp.101-102 | Thuật toán sinh và hợp đồng kỹ thuật sinh lại/phiên bản/định danh trận. |
| O11 | TT-03 p.19; HQ-04 p.16; UC22 p.128 | Bộ dữ liệu, chọn CSV/XLSX, định dạng báo cáo, mẫu/cột, quyền, chính sách trùng/lỗi/nhập một phần và ảnh trong tệp xuất. |
| O12 | CN-01-CN-04 p.26; BM-03 p.23; TT-04 p.19 | Ranh giới/phụ thuộc mô-đun, ERD/schema/kiểu khóa, hợp đồng REST/xác thực/phiên/băm mật khẩu/mã hóa ký tự/truyền tải/nhật ký/giao dịch/lỗi chi tiết. |
| O13 | HQ-01-04 p.16; TT-01 p.19; BM-01 p.23; TD-01 p.29 | Môi trường triển khai/trình duyệt/tải/đo và dữ liệu đại diện, gồm số lượng cụ thể trong quy mô hàng trăm cầu thủ và ảnh có quyền sử dụng. Giữ ngưỡng nguồn. |
| O14 | BM-06/BM-07 p.24; TH-06 p.14 | Đường lưu trữ/triển khai bền vững, backup/restore metadata cùng tệp, quyền, kiểm chứng và giữ/dọn nhật ký/media. Giữ 24 giờ/7 bản/30 phút. |
| O15 | UC24-25 pp.134-139; Figs.2.53-2.55 | Trường/trạng thái tin, thu hồi, gắn mùa/tin chung và quyền công bố. Media CLB/cầu thủ không tự cho phép tệp tin tức, email, push hoặc bình luận. |
| O16 | Figs.2.27/2.28 p.97; 2.42/2.44/2.45/2.49/2.51 | Đối chiếu Chương 3: UC11 là kiểm tra qua UC10, giữ sạch lưới/chỉ số nguồn; sơ đồ phân tích không phải API/schema đã duyệt. |

## Câu hỏi media, hoãn trận và dashboard

- Định dạng/giới hạn byte/pixel, thao tác/lưu giữ/lịch sử và hợp đồng phân phối ảnh cầu thủ còn mở.
- Thu nhận/nguồn gốc media, hợp đồng API và vận hành còn mở theo INT-01. Highlightly ưu tiên; API-FOOTBALL và football-data.org tham khảo. Nghiên cứu/chọn nhà cung cấp chờ nghiệm thu cốt lõi độc lập.

## Giải quyết và cập nhật

Chỉ giữ việc chưa giải quyết ở đây. Phạm vi/lịch sử đã duyệt nằm ở [điều hướng thiết kế](design/README.md); LS-01 đã đóng, không tạo việc phỏng vấn/triển khai/nghiệm thu bắt buộc. Giữ PDF/Git và trạng thái Phase theo bằng chứng.
