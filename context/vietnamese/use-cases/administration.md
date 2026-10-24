# Xác thực và quản trị: UC01–UC04

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Các bản ghi dưới đây chuyển bảng đặc tả từ PDF sang Markdown, giữ nội dung và thứ tự bước; chỉ bỏ header/footer và nối dòng. Không phải feature Specification mới. Trang và hình tham chiếu dùng quy ước [nguồn](../sources.md). Sơ đồ lớp/sequence là mô hình phân tích trong báo cáo, chưa xác lập API, schema hay cấu trúc mã nguồn.

## UC01

**Đăng nhập**

Nguồn: §2.4.1.1, tr.67–69 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng nội bộ xác thực danh tính để truy cập các chức năng quản lý giải đấu. Quyền sử dụng được xác định theo vai trò đã cấp. Người tra cứu công khai không cần đăng nhập để xem những dữ liệu được phép công bố.

**Mô tả:**

Xác thực người dùng và cho phép truy cập chức năng theo quyền hạn

**Tác nhân:**

Quản trị viên hệ thống, Quản lý giải đấu và nhân viên nghiệp vụ được cấp tài khoản

**Tiền điều kiện:**

1. Người dùng đã có tài khoản.
2. Hệ thống có thể xử lý yêu cầu xác thực.

**Hậu điều kiện:**

1. Danh tính người dùng được xác thực.
2. Người dùng được cấp quyền truy cập theo vai trò.
3. Sự kiện đăng nhập được ghi nhận theo yêu cầu bảo mật.

**Luồng chính:**

1. Người dùng mở chức năng đăng nhập.
2. Hệ thống hiển thị biểu mẫu.
3. Người dùng nhập thông tin tài khoản và mật khẩu.
4. Hệ thống kiểm tra dữ liệu đầu vào.
5. Hệ thống xác minh thông tin đăng nhập.
6. Hệ thống kiểm tra trạng thái tài khoản và quyền hạn.
7. Hệ thống khởi tạo phiên đăng nhập hợp lệ và ghi nhận sự kiện đăng nhập.
8. Hệ thống chuyển người dùng đến giao diện phù hợp.

**Luồng thay thế:**

1. Dữ liệu bắt buộc bị bỏ trống hoặc sai định dạng: hệ thống yêu cầu nhập lại.

**Ngoại lệ:**

1. Thông tin đăng nhập không chính xác: từ chối đăng nhập và thông báo phù hợp.
2. Tài khoản bị khóa hoặc vô hiệu hóa: từ chối truy cập.
3. Lỗi xác thực hoặc lưu trữ: thông báo không thể xử lý, không tạo trạng thái đăng nhập hợp lệ.

## UC02

**Đăng xuất**

Nguồn: §2.4.1.2, tr.69–71 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người dùng kết thúc phiên làm việc hiện tại. Sau khi đăng xuất, phiên đã kết thúc không được tiếp tục sử dụng để thực hiện các thao tác nội bộ.

**Mô tả:**

Kết thúc phiên làm việc đã được xác thực.

**Tác nhân:**

Người dùng nội bộ đang đăng nhập.

**Tiền điều kiện:**

Người dùng có phiên đăng nhập hiện hành.

**Hậu điều kiện:**

1. Phiên làm việc được kết thúc theo cơ chế xác thực của hệ thống.
2. Người dùng được chuyển về giao diện chưa đăng nhập.
3. Sự kiện đăng xuất được ghi nhận theo chính sách nhật ký.

**Luồng chính:**

1. Người dùng chọn Đăng xuất.
2. Hệ thống kiểm tra phiên hiện tại.
3. Hệ thống kết thúc hoặc vô hiệu hóa phiên theo cơ chế được triển khai.
4. Hệ thống ghi nhận sự kiện.
5. Hệ thống chuyển về giao diện chưa đăng nhập.

**Luồng thay thế:**

Phiên đã hết hạn: hệ thống đưa người dùng về trạng thái chưa đăng nhập và thông báo phù hợp.

**Ngoại lệ:**

Lỗi xử lý phiên: hệ thống thông báo và không cho phép tiếp tục thực hiện thao tác nội bộ bằng phiên không hợp lệ.

## UC03

**Quản lý tài khoản và vai trò**

Nguồn: §2.4.1.3, tr.72–74 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép quản trị viên quản lý tài khoản của người dùng nội bộ, trạng thái tài khoản và vai trò được cấp. Chức năng này phải bảo đảm người dùng chỉ được thực hiện nghiệp vụ trong phạm vi quyền hạn đã được phê duyệt.

**Mô tả:**

Tạo, cập nhật, khóa, mở khóa tài khoản và gán vai trò cho người dùng.

**Tác nhân:**

Quản trị viên hệ thống.

**Tiền điều kiện:**

1. Quản trị viên đã đăng nhập.
2. Quản trị viên có quyền quản lý tài khoản và vai trò.

**Hậu điều kiện:**

1. Thông tin tài khoản hoặc vai trò được cập nhật hợp lệ
2. Thay đổi quan trọng được ghi nhận trong nhật ký

**Luồng chính:**

1. Quản trị viên mở chức năng quản lý tài khoản.
2. Hệ thống hiển thị danh sách tài khoản.
3. Quản trị viên chọn tạo mới, chỉnh sửa, khóa, mở khóa hoặc gán vai trò.
4. Hệ thống kiểm tra dữ liệu và quyền thực hiện.
5. Quản trị viên xác nhận thay đổi.
6. Hệ thống lưu dữ liệu.
7. Hệ thống ghi nhật ký và thông báo kết quả.

**Luồng thay thế:**

Quản trị viên chỉ tra cứu tài khoản: hệ thống hiển thị thông tin trong phạm vi được phép.

**Ngoại lệ:**

1. Không đủ quyền: từ chối thao tác.
2. Thông tin tài khoản trùng hoặc không hợp lệ: yêu cầu điều chỉnh.
3. Lỗi lưu dữ liệu: không giữ lại thay đổi dở dang.

## UC04

**Tra cứu nhật ký hoạt động**

Nguồn: §2.4.1.4, tr.75–76 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền tra cứu lịch sử các thao tác quan trọng trong hệ thống, phục vụ kiểm tra, truy vết và xác định trách nhiệm. Nhật ký cần thể hiện được người thực hiện, thời điểm, đối tượng bị tác động và nội dung thay đổi phù hợp với yêu cầu bảo mật.

**Mô tả:**

Tìm kiếm và xem các bản ghi nhật ký thao tác nghiệp vụ được phép truy cập.

**Tác nhân:**

Quản trị viên hệ thống.

**Tiền điều kiện:**

1. Người dùng đã đăng nhập.
2. Người dùng có quyền tra cứu nhật ký.

**Hậu điều kiện:**

Nhật ký phù hợp với điều kiện tìm kiếm được hiển thị; dữ liệu nhật ký không bị thay đổi bởi thao tác tra cứu.

**Luồng chính:**

1. Người dùng mở chức năng tra cứu nhật ký.
2. Hệ thống hiển thị các điều kiện tìm kiếm.
3. Người dùng nhập điều kiện như thời gian, người thao tác, loại nghiệp vụ hoặc đối tượng.
4. Hệ thống kiểm tra quyền truy cập.
5. Hệ thống tìm kiếm nhật ký.
6. Hệ thống hiển thị danh sách kết quả.
7. Người dùng chọn bản ghi để xem chi tiết.

**Luồng thay thế:**

Không nhập bộ lọc: hệ thống hiển thị danh sách trong giới hạn truy vấn được phép.

**Ngoại lệ:**

1. Không đủ quyền: từ chối truy cập.
2. Không có kết quả: thông báo không tìm thấy dữ liệu phù hợp.
3. Lỗi truy vấn: thông báo không thể tải nhật ký.

