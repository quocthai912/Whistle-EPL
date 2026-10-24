# Tổng quan và mô hình nghiệp vụ

Nguồn: PDF §1.1 tr.4–5; §1.3 tr.33–39; §1.4 tr.39–49; §1.5 tr.50–52; §2.1 tr.53. Quy ước nguồn tại [sources.md](sources.md).

Whistle-EPL mô phỏng quản lý Giải bóng đá Ngoại hạng Anh theo từng mùa giải: tập trung dữ liệu, hỗ trợ tổ chức, theo dõi, tra cứu, cập nhật nhất quán và truy vết thay đổi quan trọng. Phần mềm hỗ trợ nghiệp vụ, không thay thế toàn bộ hoạt động điều hành bóng đá thực tế. Mục tiêu học tập là vận dụng quy trình công nghệ phần mềm từ khảo sát đến thiết kế và triển khai, tìm hiểu Client–Server và xử lý yêu cầu đồng thời (§1.1.2).

## Phạm vi

Bao gồm quản lý mùa giải và quy định, câu lạc bộ, sân vận động, hồ sơ cầu thủ, hồ sơ đăng ký CLB và đăng ký cầu thủ theo mùa; lập và điều chỉnh lịch; biên bản, tỷ số, cầu thủ ra sân, bàn thắng, thẻ vàng/đỏ; xác nhận và điều chỉnh kết quả; tự động tổng hợp BXH, ghi bàn, giữ sạch lưới; tra cứu, lập/xuất báo cáo; tài khoản, phân quyền, nhật ký, sao lưu/khôi phục. Tin tức/thông báo thuộc phạm vi UC24–UC25 (§2.2.5 tr.58 và §2.4.1.24–25 tr.134–139), dù không xuất hiện thành một dòng trong Bảng 1.1.

Ngoài phạm vi hiện tại: tài chính/thương mại phức tạp, bán vé trực tuyến, truyền hình/VAR chuyên sâu (§1.1.2.2 tr.5); quyết định kỷ luật, tích lũy thẻ và đình chỉ thi đấu (§1.3.4.3 tr.39); thay thủ môn trong tính giữ sạch lưới (QĐ5.7 tr.11). Tích hợp API bóng đá bên ngoài là khả năng mở rộng có điều kiện, không bắt buộc (TT-05 tr.20). Thể thức khác vòng tròn hai lượt là mở rộng tương lai, cấu hình chưa hỗ trợ phải bị từ chối rõ ràng (TH-02 tr.13).

## Sáu tác nhân

| Tác nhân chính thức | Trách nhiệm theo §1.3.3 tr.35 và §2.1 tr.53 |
|---|---|
| Quản trị viên hệ thống | Tạo/cập nhật/khóa/mở khóa tài khoản, vai trò, phân quyền; cấu hình/danh mục và xử lý sự cố trong phạm vi được giao; tra cứu nhật ký theo thẩm quyền |
| Ban tổ chức / Người quản lý mùa giải | Mùa giải, CLB tham dự, quy định, giám sát đăng ký/lịch/kết quả; phê duyệt và xác nhận theo quyền; lập/xem/xuất báo cáo |
| Nhân viên phụ trách đăng ký | Tiếp nhận/cập nhật/thẩm định hồ sơ CLB và cầu thủ; kiểm tra điều kiện; chuyển hồ sơ đủ điều kiện để phê duyệt |
| Nhân viên phụ trách lịch thi đấu | Sân, vòng, cặp đấu, thời gian; kiểm tra xung đột; điều chỉnh trận chưa diễn ra và lịch sử theo thẩm quyền |
| Nhân viên phụ trách kết quả | Biên bản, tỷ số, danh sách ra sân, bàn thắng, thẻ; kiểm tra/gửi xác nhận; sửa dữ liệu chưa xác nhận; điều chỉnh chính thức nếu được phân quyền |
| Người tra cứu | Chỉ đọc thông tin công khai: mùa giải, CLB, cầu thủ, lịch, kết quả chính thức, BXH, thống kê, tin đã công bố |

Đại diện CLB cung cấp thông tin BM1, không được xác lập là tác nhân tự phê duyệt hồ sơ (UC08 tr.85). UC20 là xử lý nội bộ được UC18/UC19 gọi; UC11 là kiểm tra qua UC10, không thêm một tác nhân hệ thống hay màn hình cập nhật điểm tùy ý.

## Đối tượng và quan hệ nghiệp vụ

§1.3.4.1 tr.37–38 và Hình 1.2 tr.38 xác định: Mùa giải, Quy định mùa giải, Câu lạc bộ, Sân vận động, Cầu thủ, Hồ sơ đăng ký câu lạc bộ, Đăng ký cầu thủ theo mùa giải, Vòng đấu, Trận đấu, Biên bản và kết quả trận đấu, Danh sách cầu thủ ra sân, Sự kiện bàn thắng, Sự kiện thẻ phạt, Bảng xếp hạng, Báo cáo giải đấu, Tài khoản người dùng, Lịch sử thay đổi. Tin tức/thông báo được bổ sung trong UC24–UC25 và Hình 2.53/2.55. Đây là các khái niệm nghiệp vụ, không phải bảng database.

CLB và cầu thủ có hồ sơ định danh riêng; hồ sơ tham dự và đăng ký cầu thủ gắn với CLB/mùa giải, có trạng thái và hiệu lực riêng. Hồ sơ CLB theo mùa mang người đại diện, HLV, sân nhà. Sân có thể được nhiều CLB sử dụng (QĐ2.5). Mùa giải tổ chức vòng đấu và trận đấu; trận tham chiếu hai CLB và sân; biên bản gắn trận, danh sách ra sân và sự kiện. Kết quả chính thức sinh thống kê/BXH; báo cáo tổng hợp từ dữ liệu đó. Lịch sử gắn người thực hiện và đối tượng thay đổi. Thông tin cần quản lý chi tiết nằm trong các BM, UC và bảng đối tượng tr.37–38; không suy ra khóa, kiểu cột hay cardinality kỹ thuật.

Những thông tin nghiệp vụ được Bảng §1.3.4.1 yêu cầu quản lý, ngoài các trường đã kê trong [biểu mẫu](business.md), được ghi lại dưới đây để không mất nội dung chỉ xuất hiện ở bảng đối tượng. Đây là thuộc tính nghiệp vụ, chưa phải thiết kế database.

| Đối tượng | Thông tin bổ sung theo tr.37–38 |
|---|---|
| Mùa giải | Mã, tên, thời gian bắt đầu/kết thúc, trạng thái |
| Quy định mùa giải | Mùa áp dụng, điều kiện đăng ký, thể thức, cách tính điểm, tiêu chí xếp hạng, thời điểm hiệu lực, trạng thái phê duyệt |
| Câu lạc bộ | Mã, tên, tên viết tắt, thông tin liên hệ, trạng thái hoạt động |
| Sân vận động | Mã, tên, địa điểm, CLB sử dụng, trạng thái hoạt động |
| Cầu thủ | Mã, họ tên, ngày sinh, quốc tịch, vị trí thi đấu, thông tin hồ sơ cần thiết |
| Hồ sơ đăng ký CLB | Mùa, CLB, người đại diện, HLV, sân nhà, ngày đăng ký, trạng thái hồ sơ |
| Đăng ký cầu thủ theo mùa | Cầu thủ, CLB, mùa, số áo, diện đăng ký, thông tin đào tạo nội địa, thời gian hiệu lực, trạng thái |
| Vòng đấu | Mã, mùa, số thứ tự vòng, trạng thái tổ chức |
| Trận đấu | Mã, mùa, vòng, chủ nhà/khách, ngày giờ, sân, trạng thái |
| Biên bản và kết quả | Trận, tỷ số, trạng thái xác nhận, thông tin trọng tài, người cập nhật, thời điểm xác nhận |
| Danh sách ra sân | Trận, cầu thủ, CLB, vị trí thi đấu, số áo |
| Sự kiện bàn thắng | Trận, cầu thủ, CLB, loại, thời điểm ghi bàn |
| Sự kiện thẻ phạt | Trận, cầu thủ, CLB, loại vàng/đỏ, thời điểm nhận thẻ |
| BXH | Mùa, CLB, số trận/thắng/hòa/thua, bàn thắng/thua, hiệu số, điểm, hạng |
| Báo cáo giải đấu | Mùa, loại báo cáo, thời điểm tổng hợp, trạng thái xác nhận, dữ liệu thống kê liên quan |
| Tài khoản người dùng | Mã, tên đăng nhập, thông tin xác thực được bảo vệ, vai trò, trạng thái |
| Lịch sử thay đổi | Mã bản ghi, người, thời điểm, thao tác, đối tượng liên quan, trước/sau |

## Chuỗi xử lý và phụ thuộc

Mùa giải + quy định có hiệu lực → hồ sơ CLB/cầu thủ → kiểm tra và phê duyệt đăng ký → lịch hợp lệ, phê duyệt/công bố → biên bản/kết quả chưa chính thức → xác nhận sau khi trận kết thúc → cập nhật tự động BXH/thống kê → tra cứu và báo cáo → đủ toàn bộ kết quả và phân hạng mới tổng kết/lưu trữ mùa giải. Hồ sơ sai trả bổ sung; lịch xung đột trả điều chỉnh; biên bản sai trả sửa trước xác nhận (§1.4.2–3 tr.41–47).

UC10 «include» UC11 (Hình 2.3 tr.61–62); UC18 và UC19 «include» UC20 (Hình 2.2 tr.60). Điều chỉnh lịch yêu cầu phê duyệt/ủy quyền; “Yêu cầu ủy quyền” trong hình không có mã UC độc lập trong danh sách 25 UC. Phân quyền bao gồm quản lý vai trò trong phân rã UC03 (Hình 2.6 tr.66). Xác thực, quyền, kiểm tra đầu vào, lịch sử và tách mùa giải áp dụng xuyên suốt.

Điều chỉnh UC14 giữ lịch hiện hành khi đang chờ duyệt. UC19 giữ lịch sử kết quả trước–sau và cập nhật lại thống kê/báo cáo; không sửa kết quả chính thức bằng UC17. Dữ liệu nháp/chờ xác nhận không được dùng như kết quả công khai. Thiếu quy định có hiệu lực phải báo thiếu căn cứ, không lấy quy định mùa khác.

## Kế hoạch trong báo cáo

§1.5 chốt Modified Waterfall cho nhóm ba thành viên, dự kiến 10 tuần: khảo sát tuần 1; phân tích/đặc tả 25 UC tuần 2; thiết kế tuần 3–5; cài đặt/tích hợp tuần 6–8; kiểm thử/nghiệm thu tuần 9–10. Có thể quay lại giai đoạn trước khi sai sót/thay đổi được xem xét; theo dõi hằng tuần và rà soát đầu ra ở mốc chuyển giao. Đây là kế hoạch trong báo cáo, không phải tiến độ đã thực hiện hoặc hạn lịch mới. Các Phase nghiệp vụ trong [Progress Checker](progress-checker.md) chia phạm vi triển khai trong quy trình đó, không thay thế năm giai đoạn hay tự gán thành viên/thời hạn.
