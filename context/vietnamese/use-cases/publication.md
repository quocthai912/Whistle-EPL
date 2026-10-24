# Tra cứu, báo cáo và tin tức: UC21–UC25

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Các bản ghi dưới đây chuyển bảng đặc tả từ PDF sang Markdown, giữ nội dung và thứ tự bước; chỉ bỏ header/footer và nối dòng. Không phải feature Specification mới. Trang và hình tham chiếu dùng quy ước [nguồn](../sources.md). Sơ đồ lớp/sequence là mô hình phân tích trong báo cáo, chưa xác lập API, schema hay cấu trúc mã nguồn.

## UC21

**Tra cứu thông tin trận đấu**

Nguồn: §2.4.1.21, tr.123–126 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng tra cứu thông tin trận đấu theo mùa giải, vòng đấu hoặc câu lạc bộ, bao gồm cặp đấu, thời gian, sân thi đấu và kết quả tương ứng. Hệ thống cung cấp thông tin theo phạm vi quyền truy cập, trong đó tỷ số trận đấu chỉ được công khai sau khi kết quả đã được xác nhận chính thức.

**Mô tả:**

Tra cứu thông tin trận đấu theo mùa giải, vòng đấu hoặc câu lạc bộ; chỉ công khai tỷ số khi kết quả đã được xác nhận.

**Tác nhân:**

Người tra cứu; Nhân viên phụ trách kết quả; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Hệ thống có dữ liệu trận đấu thuộc mùa giải cần tra cứu.

**Hậu điều kiện:**

Hệ thống hiển thị dữ liệu phù hợp với điều kiện tra cứu; không thay đổi dữ liệu nghiệp vụ.

**Luồng chính:**

1. Người dùng mở chức năng tra cứu thông tin trận đấu.
2. Hệ thống yêu cầu chọn mùa giải hoặc điều kiện lọc.
3. Người dùng nhập điều kiện.
4. Hệ thống lấy dữ liệu tương ứng.
5. Hệ thống kiểm tra trạng thái công bố và quyền truy cập.
6. Hệ thống hiển thị kết quả.

**Luồng thay thế:**

Người dùng không nhập điều kiện chi tiết: hệ thống hiển thị dữ liệu theo phạm vi mặc định.

**Ngoại lệ:**

1. Không có dữ liệu phù hợp: thông báo không tìm thấy.
2. Kết quả trận đấu chưa được xác nhận: không công khai tỷ số; vẫn cho phép hiển thị thông tin trận đấu đã được công bố.
3. Lỗi truy vấn: thông báo không thể tải dữ liệu.

## UC22

**Lập và xuất báo cáo giải đấu**

Nguồn: §2.4.1.22, tr.127–130 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền lập báo cáo từ dữ liệu đã được xác nhận và các quy định áp dụng cho mùa giải. Chức năng này phải đáp ứng ba báo cáo BM5.1, BM5.2 và BM5.3. Báo cáo không được tự tạo dữ liệu thiếu căn cứ hoặc dùng kết quả nháp thay cho kết quả chính thức.

**Mô tả:**

Tổng hợp, hiển thị và xuất báo cáo giải đấu theo mẫu nghiệp vụ được yêu cầu.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Người dùng có quyền lập báo cáo.
2. Mùa giải cần báo cáo đã tồn tại.
3. Dữ liệu nguồn cần thiết có thể truy cập.

**Hậu điều kiện:**

Báo cáo được tổng hợp từ dữ liệu nguồn hợp lệ, có thể xem trước và xuất thành tệp theo định dạng hệ thống hỗ trợ.

**Luồng chính:**

1. Người dùng mở chức năng lập báo cáo.
2. Hệ thống yêu cầu chọn mùa giải và loại báo cáo.
3. Người dùng chọn một trong các loại báo cáo được hỗ trợ.
4. Hệ thống kiểm tra quyền và mức độ đầy đủ của dữ liệu nguồn.
5. Hệ thống tổng hợp dữ liệu theo quy tắc tương ứng.
6. Hệ thống hiển thị bản xem trước.
7. Người dùng xác nhận xuất báo cáo theo định dạng được hệ thống hỗ trợ.
8. Hệ thống tạo tệp báo cáo và cung cấp cho người dùng tải xuống.

**Luồng thay thế:**

1. Dữ liệu chưa đủ điều kiện tổng kết mùa giải: hệ thống thông báo các dữ liệu hoặc điều kiện còn thiếu.
2. Người dùng đổi loại báo cáo: hệ thống thực hiện tổng hợp lại theo loại được chọn.

**Ngoại lệ:**

1. Không đủ quyền: từ chối lập báo cáo.
2. Dữ liệu nguồn không nhất quán: không xuất báo cáo như dữ liệu chính thức.
3. Lỗi tổng hợp hoặc xuất: thông báo lỗi và không trả về tệp không hoàn chỉnh như báo cáo thành công.

## UC23

**Tra cứu thông tin và thống kê câu lạc bộ, cầu thủ**

Nguồn: §2.4.1.23, tr.130–133 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng tra cứu thông tin và thống kê của câu lạc bộ, cầu thủ theo mùa giải và phạm vi truy cập. Các thống kê phải được tổng hợp từ dữ liệu nghiệp vụ hợp lệ, đặc biệt là kết quả trận đấu đã được xác nhận và các sự kiện liên quan.

**Mô tả:**

Tìm kiếm và xem thông tin, thống kê câu lạc bộ, cầu thủ theo mùa giải và điều kiện lọc.

**Tác nhân:**

Người tra cứu; Nhân viên phụ trách đăng ký; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Có dữ liệu câu lạc bộ, cầu thủ thuộc mùa giải cần tra cứu; dữ liệu thống kê được tổng hợp từ nguồn hợp lệ.

**Hậu điều kiện:**

Thông tin và thống kê được hiển thị theo điều kiện tìm kiếm và phạm vi truy cập.

**Luồng chính:**

1. Người dùng chọn tra cứu thông tin hoặc thống kê câu lạc bộ, cầu thủ.
2. Hệ thống yêu cầu chọn mùa giải và điều kiện lọc.
3. Người dùng nhập hoặc chọn điều kiện.
4. Hệ thống truy xuất thông tin câu lạc bộ, cầu thủ và dữ liệu kết quả chính thức liên quan khi cần tổng hợp thống kê.
5. Hệ thống tổng hợp thông tin, tính hoặc truy xuất các chỉ số thống kê được hỗ trợ.
6. Hệ thống kiểm tra phạm vi dữ liệu được phép truy cập và công bố.
7. Hệ thống hiển thị thông tin và thống kê phù hợp.

**Luồng thay thế:**

Không có điều kiện lọc chi tiết: hệ thống hiển thị thống kê trong phạm vi mặc định.

**Ngoại lệ:**

1. Không có dữ liệu: thông báo không tìm thấy kết quả.
2. Dữ liệu chưa đủ điều kiện tổng hợp: thông báo giới hạn dữ liệu.
3. Lỗi truy vấn: thông báo không thể tải thống kê.

## UC24

**Quản lý tin tức và thông báo giải đấu**

Nguồn: §2.4.1.24, tr.134–136 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép Ban tổ chức tạo, cập nhật và quản lý trạng thái tin tức, thông báo liên quan đến giải đấu Ngoại hạng Anh (Premier League). Nội dung có thể được lưu ở trạng thái nháp hoặc công bố theo thẩm quyền; chỉ những nội dung đã công bố mới được hiển thị công khai.

**Mô tả:**

Tạo, cập nhật, quản lý trạng thái và công bố tin tức, thông báo giải đấu.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Người thực hiện đã đăng nhập và có quyền quản lý tin tức, thông báo giải đấu.

**Hậu điều kiện:**

Nội dung được lưu ở trạng thái phù hợp; chỉ nội dung đã công bố mới được hiển thị công khai.

**Luồng chính:**

1. Người dùng mở chức năng quản lý tin tức và thông báo giải đấu.
2. Hệ thống hiển thị các thông báo hiện có.
3. Người dùng tạo mới hoặc cập nhật nội dung.
4. Hệ thống kiểm tra quyền quản lý và thông tin bắt buộc.
5. Người dùng xác nhận lưu.
6. Hệ thống lưu nội dung và thông báo kết quả.

**Luồng thay thế:**

1. Người dùng chỉ xem danh sách thông báo: hệ thống hiển thị nội dung theo quyền.
2. Người dùng chọn công bố nội dung đã lưu: hệ thống kiểm tra quyền công bố, cập nhật trạng thái thành đã công bố và ghi nhận thao tác.

**Ngoại lệ:**

1. Người dùng không có quyền quản lý: từ chối thao tác.
2. Nội dung thiếu thông tin bắt buộc: yêu cầu điều chỉnh.
3. Người dùng không có quyền công bố: hệ thống từ chối công bố và giữ nguyên trạng thái nội dung.

## UC25

**Xem tin tức và thông báo giải đấu**

Nguồn: §2.4.1.25, tr.136–139 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng tra cứu và xem danh sách, nội dung tin tức và thông báo đã được Ban tổ chức công bố. Chỉ những nội dung ở trạng thái đã công bố mới được hiển thị công khai.

**Mô tả:**

Hiển thị danh sách và nội dung tin tức, thông báo đã được công bố.

**Tác nhân:**

Người tra cứu.

**Tiền điều kiện:**

Chức năng xem tin tức và thông báo đang hoạt động.

**Hậu điều kiện:**

Người dùng xem được nội dung được phép công khai.

**Luồng chính:**

1. Người dùng mở chức năng xem tin tức và thông báo giải đấu.
2. Hệ thống hiển thị danh sách tin tức và thông báo đã được công bố.
3. Người dùng chọn một tin tức hoặc thông báo cần xem.
4. Hệ thống kiểm tra trạng thái công bố.
5. Hệ thống hiển thị nội dung.

**Luồng thay thế:**

Không có tin tức hoặc thông báo được công bố: hệ thống hiển thị trạng thái danh sách trống.

**Ngoại lệ:**

1. Nội dung không còn được phép công bố: hệ thống không hiển thị nội dung đó.
2. Lỗi truy vấn: thông báo không thể tải dữ liệu.

