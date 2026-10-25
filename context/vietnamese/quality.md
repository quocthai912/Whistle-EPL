# Yêu cầu chất lượng và ràng buộc đã có trong báo cáo

Nguồn: §1.2.2-1.2.8 tr.11-32. Giữ 34 mã yêu cầu gốc. Mô tả/tiêu chí dưới đây được trình bày gọn từ bảng chi tiết; mọi ngưỡng số giữ nguyên. Đọc cùng [Progress Checker](progress-checker.md) để biết Phase chịu trách nhiệm; thiết kế đã duyệt nằm ở [điều hướng thiết kế](design/README.md), lựa chọn còn lại ở [quyết định mở](open-decisions.md). Các yêu cầu xuyên suốt phải được kiểm tra trong Phase chức năng và hồi quy ở PHASE 10.

## Tiến hóa - TH (Bảng 1.2, chi tiết tr.13-14)

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| TH-01 | Cấu hình giới hạn danh sách, tiêu chí đào tạo nội địa, U21 và thời hạn đăng ký theo mùa mà không sửa mã chức năng tiếp nhận. Đổi cấu hình mùa mới phải kiểm tra theo quy định mới, từ chối hồ sơ sai, giữ nguyên đăng ký mùa trước | Cao |
| TH-02 | Điều chỉnh số CLB, số lượt/thể thức theo mùa; phiên bản đầu hỗ trợ vòng tròn hai lượt. Mặc định 20 CLB phải tạo đúng 38 vòng, 380 trận, mỗi cặp hai lượt hoán đổi sân nhà/khách, kiểm tra xung đột. Cấu hình/thể thức chưa hỗ trợ phải thông báo và từ chối tạo lịch sai | Trung bình |
| TH-03 | Điểm thắng/hòa/thua và thứ tự tiêu chí xếp hạng được cấu hình theo điều lệ duyệt. Khi mùa giải được phép điều chỉnh, tính BXH theo cấu hình mới hợp lệ, không tự đổi kết quả mùa khác | Cao |
| TH-04 | Bổ sung/cập nhật/ngừng dùng CLB, sân, loại bàn thắng, loại thẻ; nghiệp vụ mới dùng thông tin hợp lệ, dữ liệu lịch sử tham chiếu thông tin cũ vẫn tra cứu được | Cao |
| TH-05 | Quản lý độc lập hồ sơ, lịch, kết quả, BXH, quy định nhiều mùa mà không thiết kế lại toàn bộ. Kiểm thử ít nhất 10 mùa tương đương 3.800 trận; cập nhật một mùa không đổi mùa khác; tra cứu đối chiếu HQ-03 | Cao |
| TH-06 | Lưu giá trị trước/sau, thời điểm áp dụng và người thực hiện khi đổi quy định/dữ liệu quan trọng. Sau điều chỉnh hợp lệ quy định, lịch hoặc kết quả chính thức, người có quyền phải tra cứu được nội dung, người, thời điểm; lịch sử được bảo toàn | Cao |

## Hiệu quả - HQ (Bảng 1.3, chi tiết tr.16)

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| HQ-01 | Tra cứu CLB, cầu thủ, lịch, kết quả và BXH: ít nhất 95% yêu cầu thông thường phản hồi trong 2 giây, dữ liệu một mùa EPL, 20 người dùng đồng thời, môi trường kiểm thử xác định | Cao |
| HQ-02 | Xác nhận/điều chỉnh kết quả hợp lệ tự động cập nhật thống kê, giảm thao tác thủ công. Ít nhất 95% thao tác cập nhật hoàn thành trong 2 giây; BXH/thống kê chính xác sau xử lý, không mâu thuẫn hoặc cập nhật dở dang | Cao |
| HQ-03 | Dữ liệu tối thiểu 10 mùa/3.800 trận: ít nhất 95% tra cứu lịch sử theo mùa trong 2 giây, cùng tải tra cứu của HQ-01, dữ liệu vẫn chính xác | Cao |
| HQ-04 | Tổng hợp, tạo và xuất từng báo cáo theo định dạng hỗ trợ không quá 5 giây với dữ liệu đủ một mùa/380 trận; nội dung khớp kết quả/thống kê đã xác nhận | Trung bình |

Chỉ tiêu phải đo trên môi trường xác định và đối chiếu môi trường triển khai dự kiến (§1.2.3.1 tr.14). Không thêm mốc thời gian cho tạo lịch khi báo cáo chưa định lượng.

## Tương thích - TT (Bảng 1.4, chi tiết tr.19-20)

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| TT-01 | Đăng nhập, hồ sơ, lập lịch, kết quả, tra cứu, báo cáo, quy định hoạt động đúng trên cả Google Chrome và Microsoft Edge, hiển thị/xử lý nhất quán, không lỗi tương thích cản thao tác | Cao |
| TT-02 | Quản trị ưu tiên máy tính; tra cứu trên 360 × 800, 768 × 1024 và 1366 × 768 pixel phải đủ nội dung cần thiết, thao tác chính dùng được, tương tác không bị che. Bảng rộng được cuộn ngang trong bảng | Cao |
| TT-03 | Chọn định dạng nhập/xuất CSV hoặc XLSX ở v2. Với từng định dạng hỗ trợ, tệp tối thiểu 100 bản ghi hợp lệ phải xử lý đủ, bảo toàn 100% giá trị trường đối chiếu. Phát hiện/thông báo sai cấu trúc, thiếu trường, giá trị sai; không phát sinh dữ liệu nghiệp vụ sai | Trung bình |
| TT-04 | Mã hóa ký tự thống nhất (UTF-8 là ví dụ); tiếng Việt có dấu phải lưu, tìm kiếm, hiển thị, xuất đúng. Ngày giờ, tỷ số, định danh giữ giá trị/định dạng khi trao đổi | Cao |
| TT-05 | Khả năng mở rộng nhận/cung cấp dữ liệu API ngoài. Cốt lõi vẫn vận hành khi không kết nối. **Nếu triển khai tích hợp**, kiểm tra/chuẩn hóa cấu trúc, xử lý dữ liệu sai và giữ bước kiểm tra/xác nhận nghiệp vụ. Không bắt buộc xây tích hợp trong v1 sản phẩm | Thấp |

## Bảo mật - BM có dấu gạch nối (Bảng 1.5, chi tiết tr.23-24)

BM-01 là yêu cầu bảo mật; BM1 là biểu mẫu. Giữ cách viết để tránh nhầm hai hệ mã.

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| BM-01 | Đăng nhập hợp lệ mới vào nội bộ; đăng xuất/hết hạn vô hiệu phiên cũ. Tối thiểu 100 lượt đăng nhập, 20 người đồng thời, ít nhất 95% phản hồi xác thực trong 3 giây. Từ chối thông tin sai; phiên hết hạn sau tối đa 30 phút không hoạt động | Cao |
| BM-02 | Quyền theo vai trò và phạm vi trách nhiệm, kiểm tra ở máy chủ. Vượt quyền qua giao diện, đường dẫn trực tiếp hoặc yêu cầu API bị từ chối và không đổi dữ liệu; ẩn nút trên UI không đủ | Cao |
| BM-03 | Dùng thuật toán băm mật khẩu chuyên dụng, Argon2id hoặc bcrypt là ví dụ chưa chọn. Kiểm tra không có mật khẩu gốc trong CSDL; xác thực đúng/sai chính xác; giao diện, phản hồi và nhật ký không lộ mật khẩu | Cao |
| BM-04 | Kiểm tra đầu vào ở máy chủ: thiếu trường, sai kiểu/quy định phải từ chối có thông báo. Truy vấn an toàn, tránh ghép trực tiếp đầu vào vào SQL. Kiểm thử SQL injection/nội dung nguy hiểm không thay đổi trái phép CSDL hoặc thực thi mã ngoài ý muốn | Cao |
| BM-05 | Tách thông tin công khai khỏi hồ sơ, liên hệ, nội bộ; [D032](use-cases/publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ) cho công khai ngày sinh cầu thủ trong tra cứu mùa được duyệt; liên hệ và trường nội bộ khác vẫn hạn chế (mặc định nguồn §1.2.5.3 tr.21). Lưu dữ liệu nghiệp vụ/cá nhân tập trung phía máy chủ, không công khai truy cập trực tiếp CSDL. Tối thiểu 10 trường hợp trái quyền qua UI/API đều từ chối, không trả dữ liệu nhạy cảm; công khai chỉ trường đã công bố | Cao |
| BM-06 | Tự ghi nhật ký thao tác quan trọng thành công: lịch, kết quả chính thức, quy định, phân quyền. Có người, thời điểm, hành động, đối tượng và dữ liệu thay đổi; tra cứu được trước/sau. Người không có quyền không được sửa/xóa nhật ký. Lý do/thời điểm áp dụng khi nghiệp vụ yêu cầu (§1.2.5.4 tr.21) | Cao |
| BM-07 | Sao lưu CSDL tự động ít nhất một lần/24 giờ, giữ ít nhất 7 bản gần nhất ở vị trí riêng có giới hạn quyền. Giả lập mất/hỏng dữ liệu đủ một mùa: phục hồi từ bản hợp lệ trong 30 phút, khớp thời điểm sao lưu, toàn vẹn quan hệ | Cao |

Việc truyền dữ liệu cần được bảo vệ phù hợp môi trường triển khai (§1.2.5.3 tr.21); cơ chế cụ thể chưa chọn.

## Công nghệ - CN (Bảng 1.6, chi tiết tr.26)

| Mã | Ràng buộc có sẵn và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| CN-01 | Ứng dụng web Client-Server, tách giao diện/xử lý máy chủ, thống nhất ngôn ngữ/thư viện/công cụ phù hợp môi trường. Cài/khởi chạy được tại môi trường xác định, dùng chức năng chính và trao đổi với máy chủ qua trình duyệt, không cài ứng dụng riêng | Cao |
| CN-02 | CSDL **quan hệ**, tập trung theo §1.2.6.1; ràng buộc toàn vẹn và giao dịch cho dữ liệu mùa/CLB/cầu thủ/trận/kết quả. Từ chối dữ liệu sai quan hệ; xác nhận/điều chỉnh kết quả lỗi không được lưu trạng thái cập nhật một phần | Cao |
| CN-03 | Quản lý phiên bản, phụ thuộc/cấu hình và tài liệu cài đặt-cấu hình-khởi chạy. Trên môi trường mới đủ tiên quyết, làm theo hướng dẫn phải cài, kết nối CSDL và khởi chạy thành công | Cao |
| CN-04 | Phân lớp/mô-đun với trách nhiệm rõ: giao diện, nghiệp vụ, truy cập dữ liệu. Cấu hình quy tắc và mở rộng thành phần phải qua kiểm thử duy trì chức năng liên quan, không gây lỗi nghiệp vụ hiện có | Cao |

Đây là ràng buộc đã nêu, không phải lựa chọn thiết kế mới. Framework, sản phẩm CSDL, mô hình module, ERD/schema, API và môi trường cụ thể chờ v2.

## Tiện dụng - TD (Bảng 1.7, chi tiết tr.29)

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| TD-01 | Điều hướng theo nhóm hồ sơ/lịch/kết quả/tra cứu/báo cáo/quy định, nhãn/thuật ngữ nhất quán và đúng vai trò. Ít nhất 20 lượt thử với 5 người đại diện × 4 tác vụ thuộc quyền; ít nhất 80% tìm được chức năng trong 30 giây và tối đa 3 thao tác điều hướng | Cao |
| TD-02 | Hiện rõ trường bắt buộc, định dạng/hướng dẫn. Dữ liệu thiếu/sai định dạng/quy định: xác định đúng trường/điều kiện lỗi, hướng dẫn khắc phục, chặn lưu sai và giữ thông tin đã nhập hợp lệ | Cao |
| TD-03 | Điều chỉnh lịch, kết quả chính thức, quy định: hộp thoại xác nhận có nội dung và đối tượng ảnh hưởng. Hủy không đổi dữ liệu đã lưu; xác nhận chỉ thực hiện khi đủ quyền và điều kiện; cho bỏ chỉnh sửa chưa lưu | Cao |
| TD-04 | Tìm theo tên cầu thủ/CLB, lọc mùa hoặc điều kiện liên quan trả đúng tập dữ liệu. Danh sách trên 20 bản ghi phải phân trang rõ, chuyển trang không bỏ sót/trùng lặp | Cao |

## An toàn - AT (Bảng 1.8, chi tiết tr.32)

| Mã | Yêu cầu và tiêu chí kiểm chứng | Ưu tiên |
|---|---|---|
| AT-01 | Kiểm tra hồ sơ/lịch/kết quả trước ghi. Dữ liệu vi phạm bị từ chối, giữ dữ liệu hợp lệ. Gửi xác nhận cùng kết quả nhiều lần không cộng trùng trận, điểm, bàn thắng; mỗi trận tính một lần trừ điều chỉnh hợp lệ | Cao |
| AT-02 | Cập nhật liên quan nhất quán, có phát hiện/xử lý xung đột. Giả lập lỗi cập nhật kết quả không để dữ liệu/thống kê dở dang; hai người sửa cùng bản ghi không âm thầm ghi đè thay đổi đã lưu trước, phải báo và yêu cầu xử lý | Cao |
| AT-03 | Điều chỉnh lịch/kết quả chính thức/quy định phải đúng trạng thái, điều kiện, quyền và phạm vi mùa. Thử thay đổi không hợp lệ phải bị từ chối/giữ nguyên dữ liệu; thay đổi hợp lệ giữ kết quả và thống kê nhất quán | Cao |
| AT-04 | Bảo toàn liên kết mùa-CLB-cầu thủ-trận-kết quả. Chặn xóa/đổi gây mất liên kết lịch sử; hỗ trợ ngừng dùng/lưu trữ. Ngừng CLB hoặc thêm mùa không làm sai hồ sơ/lịch/kết quả/báo cáo mùa trước; lịch sử còn tra cứu đúng | Cao |
## Ràng buộc media và phụ thuộc ngoài đã xác nhận

Dùng [chính sách media](design/media.md) chính thức cho ảnh được quản lý và [cổng tích hợp](design/integrations.md) cho phụ thuộc ngoài. Kiểm chứng thuộc [Progress Checker](progress-checker.md); giữ ngưỡng chất lượng nguồn. Trang này không sao chép chính sách đó.

## Kiểm chứng hoãn trận và dashboard

Kiểm chứng [POSTPONE-01](use-cases/scheduling.md#postpone-01---quản-lý-hoãn-trận-phiên-bản-đầu) và [DASHBOARD-01](use-cases/publication.md#dashboard-01---dashboard-tổng-quan-mùa-giải) theo hợp đồng sẽ chốt: đổi trạng thái đúng quyền/có nhật ký, hiển thị hoãn không có giờ thay chưa duyệt, không tác động thống kê, dữ liệu dashboard thật/đúng quyền, thống kê chỉ chính thức, media responsive và Loading/Empty/Error rõ. Giữ ngưỡng nguồn, không chọn thư viện UI mới.

[LS-01](design/integrations.md#v2-ext-01---live-match-tracking--live-score) loại triển khai/thiết kế Live Score khỏi nghiệm thu phiên bản đầu. Media được quản lý và vận hành độc lập vẫn bắt buộc; chọn nhà cung cấp vẫn sau nghiệm thu cốt lõi.
