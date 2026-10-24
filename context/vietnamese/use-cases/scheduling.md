# Sân vận động và lịch thi đấu: UC12-UC15

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Các bản ghi dưới đây chuyển bảng đặc tả từ PDF sang Markdown, giữ nội dung và thứ tự bước; chỉ bỏ header/footer và nối dòng. Không phải feature Specification mới. Trang và hình tham chiếu dùng quy ước [nguồn](../sources.md). Sơ đồ lớp/sequence là mô hình phân tích trong báo cáo, chưa xác lập API, schema hay cấu trúc mã nguồn.

## UC12

**Quản lý sân vận động**

Nguồn: §2.4.1.12, tr.97-99 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép quản lý thông tin các sân vận động được sử dụng trong lịch thi đấu. Dữ liệu sân cần đủ để xác định sân được lựa chọn cho một trận và kiểm tra xung đột lịch sử dụng sân.

**Mô tả:**

Tạo, cập nhật và tra cứu thông tin sân vận động.

**Tác nhân:**

Nhân viên phụ trách lịch thi đấu.

**Tiền điều kiện:**

Người dùng đã đăng nhập và có quyền quản lý sân.

**Hậu điều kiện:**

Thông tin sân được lưu hợp lệ và có thể được sử dụng khi lập lịch.

**Luồng chính:**

1. Người dùng mở chức năng quản lý sân.
2. Hệ thống hiển thị danh sách sân.
3. Người dùng chọn tạo mới, cập nhật hoặc tra cứu.
4. Hệ thống tiếp nhận thông tin.
5. Hệ thống kiểm tra dữ liệu bắt buộc và trùng lặp.
6. Người dùng xác nhận.
7. Hệ thống lưu hoặc hiển thị dữ liệu.
8. Hệ thống thông báo kết quả.

**Luồng thay thế:**

Người dùng tra cứu sân: hệ thống hiển thị các sân phù hợp.

**Ngoại lệ:**

1. Thông tin sân không hợp lệ: từ chối lưu.
2. Sân đang được tham chiếu bởi lịch thi đấu: kiểm tra các ràng buộc trước khi cho phép thay đổi ảnh hưởng đến lịch.
3. Lỗi lưu dữ liệu: giữ nguyên thông tin hiện có.

## UC13

**Lập lịch thi đấu**

Nguồn: §2.4.1.13, tr.100-103 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền xây dựng lịch thi đấu cho mùa giải. Lịch phải đáp ứng thể thức cơ sở gồm 20 câu lạc bộ, 38 vòng và 380 trận, bảo đảm mỗi cặp câu lạc bộ gặp nhau hai lượt theo hình thức sân nhà và sân khách. Hệ thống phải kiểm tra xung đột lịch giữa câu lạc bộ và sân vận động.

**Mô tả:**

Tạo và kiểm tra lịch thi đấu cho một mùa giải theo thể thức đã được phê duyệt.

**Tác nhân:**

Nhân viên phụ trách lịch thi đấu; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Mùa giải đã tồn tại.
2. Danh sách câu lạc bộ tham dự đã được xác định.
3. Các sân vận động cần thiết đã có dữ liệu.
4. Thể thức mùa giải đã được cấu hình.

**Hậu điều kiện:**

1. Lịch thi đấu hợp lệ được lưu và chuyển sang trạng thái chờ phê duyệt trước khi công bố chính thức.
2. Mỗi trận gắn với mùa giải, vòng đấu, các câu lạc bộ, thời gian và sân tương ứng.
3. Lịch sử thao tác được ghi nhận.

**Luồng chính:**

1. Nhân viên chọn mùa giải cần lập lịch.
2. Hệ thống tải danh sách câu lạc bộ, thể thức và sân vận động.
3. Nhân viên nhập hoặc thiết lập lịch thi đấu theo chức năng được triển khai.
4. Hệ thống kiểm tra số vòng và số trận theo thể thức.
5. Hệ thống kiểm tra lượt sân nhà/sân khách của từng cặp câu lạc bộ.
6. Hệ thống kiểm tra một câu lạc bộ có bị xếp thi đấu hai trận cùng thời điểm hay không.
7. Hệ thống kiểm tra xung đột sử dụng sân.
8. Hệ thống hiển thị kết quả kiểm tra.
9. Nhân viên điều chỉnh các mục không hợp lệ và yêu cầu kiểm tra lại.
10. Khi lịch hợp lệ, nhân viên xác nhận lưu lịch và trình Ban tổ chức phê duyệt.
11. Hệ thống lưu lịch ở trạng thái chờ phê duyệt và ghi nhận nhật ký.

**Luồng thay thế:**

1. Người dùng nhập lịch theo từng phần: hệ thống kiểm tra các trận đã nhập và tính nhất quán của lịch tổng thể.
2. Lịch chưa đủ dữ liệu: hệ thống lưu nháp nếu chức năng lưu nháp được hỗ trợ; lịch nháp không được xem là lịch chính thức.
3. Ban tổ chức phê duyệt lịch đã trình: hệ thống chuyển lịch sang trạng thái được phép công bố; nếu không chấp thuận, lịch tiếp tục ở trạng thái chưa công bố và được trả về để điều chỉnh.

**Ngoại lệ:**

1. Sai số vòng hoặc số trận: từ chối xác nhận lịch.
2. Trùng thời gian thi đấu của cùng câu lạc bộ hoặc xung đột sân: thông báo các trận liên quan.
3. Cặp câu lạc bộ không đủ hai lượt sân nhà/sân khách theo thể thức: yêu cầu sửa.
4. Lỗi lưu dữ liệu: không để lại lịch chính thức chỉ được lưu một phần.

## UC14

**Điều chỉnh lịch thi đấu**

Nguồn: §2.4.1.14, tr.103-106 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền thay đổi thời gian hoặc sân của trận đấu theo quy định. Việc điều chỉnh phải kiểm tra lại xung đột, không làm mất lịch sử và không được làm sai lệch thông tin của trận đã diễn ra hoặc dữ liệu kết quả đã được xác nhận.

**Mô tả:**

Thay đổi thông tin lịch thi đấu của trận đáp ứng điều kiện điều chỉnh.

**Tác nhân:**

Nhân viên phụ trách lịch thi đấu; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Trận đấu đã có trong lịch.
2. Người dùng có quyền điều chỉnh.
3. Trận đấu đáp ứng điều kiện được phép thay đổi theo quy định.

**Hậu điều kiện:**

1. Lịch mới được lưu hợp lệ.
2. Lịch sử trước và sau điều chỉnh được bảo toàn.
3. Thông tin lịch hiện hành phản ánh giá trị mới.

**Luồng chính:**

1. Người dùng tìm và chọn trận cần điều chỉnh.
2. Hệ thống hiển thị lịch hiện tại và trạng thái trận.
3. Người dùng nhập thời gian hoặc sân mới cùng thông tin lý do theo quy trình đã xác định.
4. Hệ thống kiểm tra quyền và điều kiện điều chỉnh.
5. Hệ thống kiểm tra xung đột câu lạc bộ và sân.
6. Hệ thống hiển thị thông tin trước và sau thay đổi.
7. Người dùng xác nhận đề xuất điều chỉnh; việc thay đổi phải được phê duyệt hoặc ủy quyền hợp lệ theo thẩm quyền.
8. Hệ thống lưu lịch mới và lịch sử điều chỉnh.
9. Hệ thống thông báo kết quả.

**Luồng thay thế:**

1. Người dùng hủy trước khi xác nhận: hệ thống không thay đổi lịch.
2. Điều chỉnh cần phê duyệt: hệ thống ghi nhận yêu cầu ở trạng thái chờ, giữ nguyên lịch hiện hành cho đến khi có quyết định hợp lệ.

**Ngoại lệ:**

1. Trận đã diễn ra hoặc không đủ điều kiện điều chỉnh: từ chối.
2. Lịch mới xung đột: yêu cầu chọn thời gian hoặc sân khác.
3. Dữ liệu lịch đã bị thay đổi đồng thời: yêu cầu tải lại và kiểm tra trước khi lưu.
4. Lỗi lưu trữ: bảo toàn lịch cũ.

## UC15

**Tra cứu lịch thi đấu**

Nguồn: §2.4.1.15, tr.106-108 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng tra cứu lịch thi đấu đã được công bố theo mùa giải, câu lạc bộ, vòng đấu hoặc thời gian. Chức năng này chỉ đọc dữ liệu lịch được phép công khai và không làm thay đổi lịch thi đấu.

**Mô tả:**

Tìm kiếm và xem lịch thi đấu theo điều kiện lọc.

**Tác nhân:**

Người tra cứu; Nhân viên phụ trách lịch thi đấu; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Hệ thống có dữ liệu lịch thi đấu được phép công bố.

**Hậu điều kiện:**

Lịch phù hợp với điều kiện tìm kiếm được hiển thị.

**Luồng chính:**

1. Người dùng mở chức năng tra cứu lịch.
2. Hệ thống hiển thị điều kiện lọc.
3. Người dùng chọn mùa giải và điều kiện tra cứu.
4. Hệ thống kiểm tra quyền truy cập nếu có dữ liệu không công khai.
5. Hệ thống tìm lịch phù hợp.
6. Hệ thống hiển thị các trận và thông tin lịch được phép công bố.

**Luồng thay thế:**

Người dùng không chọn bộ lọc chi tiết: hệ thống hiển thị lịch theo phạm vi mặc định được xác định.

**Ngoại lệ:**

1. Không có kết quả: thông báo phù hợp.
2. Dữ liệu lịch không thể tải: thông báo lỗi mà không thay đổi dữ liệu.

