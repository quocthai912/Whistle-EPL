# Xác thực và quản trị: UC01-UC04

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Luồng UC hiện hành giữ mã/trang nguồn và tích hợp làm rõ được duyệt rõ. Quy tắc chính thức của miền được liên kết bên dưới; bằng chứng duyệt/nguồn/lý do ở ADR English. Đây là tài liệu Context, không phải feature Specification sinh mới. Hình phân tích không phải API/schema đã duyệt. Xem [nguồn](../sources.md).

## UC01

Quy tắc hiện hành: [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản).

**Đăng nhập**

Nguồn: §2.4.1.1, tr.67-69 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Nguồn: §2.4.1.2, tr.69-71 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Quy tắc hiện hành: [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải), [D004](administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải), [D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa), [D009](administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản), [D010](administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa), [D031](administration.md#d031---mỗi-người-một-tài-khoản-nội-bộ-cá-nhân), [D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung), [D037](administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung), [D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng), [D039](administration.md#d039---vô-hiệu-hóa-phiên-khi-thay-đổi-quyền-quản-lý-hồ-sơ-gốc-dùng-chung), [D040](administration.md#d040---cho-phép-quản-trị-viên-tự-giảm-quyền-nghiệp-vụ), [D041](administration.md#d041---giữ-phân-công-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-tài-khoản-bị-khóa).

**Quản lý tài khoản và vai trò**

Nguồn: §2.4.1.3, tr.72-74 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Nguồn: §2.4.1.4, tr.75-76 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](../open-decisions.md).

### D003 - Quyền nghiệp vụ theo phạm vi mùa giải

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d003-english-evidence).

- **Nguồn:** O08; BM-02, PDF tr.23; QĐ4.1, PDF tr.9; phạm vi trách nhiệm tại §1.3.3 tr.35 và §2.1 tr.53.

- **Quyết định:** Vai trò nghiệp vụ được cấp theo mùa được phân công. Có vai trò nghiệp vụ trong một mùa không đồng nghĩa có quyền truy cập nghiệp vụ nội bộ của mùa khác. Quản trị tài khoản hệ thống có phạm vi toàn hệ thống và không tự cấp quyền phê duyệt nghiệp vụ. Người xem công khai được truy cập thông tin công khai đã công bố mà không cần tài khoản.

- **Hệ quả:** Yêu cầu nội bộ phải được kiểm tra theo vai trò và phạm vi mùa áp dụng cho người thao tác, cùng các điều kiện nghiệp vụ của thao tác. Chỉ ẩn/hiện giao diện là chưa đủ. Ma trận quyền và schema chi tiết vẫn cần thiết kế.

### D004 - Nhiều vai trò nghiệp vụ trong cùng mùa giải

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d004-english-evidence).

- **Nguồn:** O08; BM-02, PDF tr.23; sáu tác nhân tại §1.3.3 tr.35 và §2.1 tr.53; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải).

- **Quyết định:** Một tài khoản có thể được cấp nhiều vai trò nghiệp vụ trong cùng mùa giải. Mỗi thao tác vẫn phải có quyền tương ứng trong mùa được phân công và đáp ứng các điều kiện nghiệp vụ áp dụng. Kiêm nhiều vai trò không tự cho phép tự duyệt.

- **Hệ quả:** Thiết kế tài khoản/phân công và kiểm tra quyền phải hỗ trợ nhiều vai trò theo mùa. Giữ nguyên sáu tác nhân nghiệp vụ và 25 UC; quan hệ tài khoản-vai trò không tạo tác nhân mới.

### D005 - Tách biệt trách nhiệm lập và phê duyệt

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d005-english-evidence).

- **Nguồn:** O07/O08; QĐ6, PDF tr.11; UC06 tr.79-82, UC08 tr.85-88, UC13-UC14 tr.100-106 và UC18-UC19 tr.115-121; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D004](administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải).

- **Quyết định:** Người lập và người duyệt phải khác nhau đối với quy định mùa giải, hồ sơ tham gia của CLB, lịch và yêu cầu điều chỉnh lịch, xác nhận kết quả chính thức và sửa kết quả đã xác nhận. Bất kỳ người nào đã lập hoặc sửa nội dung của phiên bản trình duyệt đều không được duyệt phiên bản đó, kể cả khi có vai trò được phép phê duyệt. Người duyệt phải có thẩm quyền phù hợp trong mùa được xử lý.

- **Luồng sửa kết quả:** Đề xuất sửa kết quả chính thức phải được trình để người khác có thẩm quyền phê duyệt trước khi áp dụng. Đây là nội dung cụ thể hóa UC19 được xác nhận rõ trong v2, không khẳng định v1 đã quy định bước phê duyệt riêng này. Kết quả chính thức hiện hành tiếp tục có hiệu lực trong thời gian chờ duyệt; sửa đổi được duyệt phải tuân thủ kiểm tra, lịch sử và tính toán lại nhất quán theo UC19/UC20.

- **Hệ quả:** Hỗ trợ nhiều vai trò không được bỏ qua quy tắc tách người. Lịch sử phiên bản phải xác định người lập/sửa nội dung để kiểm tra điều kiện được duyệt. Cần ít nhất hai người khác nhau có thẩm quyền phù hợp để hoàn tất một luồng phê duyệt. Các thao tác lưu thông thường không có bước duyệt tiếp tục theo quyền áp dụng.

### D006 - Quản trị viên hệ thống quản lý phân công vai trò theo mùa

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d006-english-evidence).

- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)-[D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt).

- **Quyết định:** Chỉ Quản trị viên hệ thống được cấp hoặc thu hồi vai trò nghiệp vụ và phạm vi mùa tương ứng. Ban tổ chức / Người quản lý mùa giải không được trực tiếp thay đổi phân công vai trò. Quyền quản trị tài khoản không tự cấp quyền phê duyệt nghiệp vụ.

- **Hệ quả:** Thay đổi vai trò/phạm vi mùa được quản lý qua UC03, kiểm tra ở server và ghi nhật ký theo BM-06. Phê duyệt nghiệp vụ tiếp tục tuân thủ [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)-[D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt). Quyết định này không tạo thêm luồng yêu cầu phân công nhân sự.

### D007 - Vô hiệu hóa phiên khi đổi quyền hoặc khóa tài khoản

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d007-english-evidence).

- **Nguồn:** O08/O12; UC01-UC03, PDF tr.67-74; BM-01/BM-02, tr.23; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa).

- **Quyết định:** Lưu thành công thay đổi vai trò hoặc phạm vi mùa của tài khoản, kể cả cấp thêm quyền, hoặc khóa tài khoản sẽ vô hiệu hóa toàn bộ phiên hiện có của tài khoản đó. Ở yêu cầu nội bộ tiếp theo, server từ chối phiên cũ và ứng dụng thông báo tài khoản hoặc quyền đã thay đổi, yêu cầu đăng nhập lại. Tài khoản bị khóa không được đăng nhập; mở khóa không khôi phục phiên cũ.

- **Thông báo:** Nội dung tiếng Việt đã xác nhận: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” Nghĩa tiếng Anh: “Your session is no longer valid because your account or access permissions have changed. Please log in again.” Thông báo hiển thị khi ứng dụng nhận phản hồi từ server; quyết định này không yêu cầu cơ chế thông báo tức thời.

- **Hệ quả:** Phiên cũ không được tái sử dụng cho truy cập nội bộ sau khi bị vô hiệu hóa. Thao tác đã hoàn tất thành công và lịch sử trước đó không tự bị hủy bởi thay đổi quyền. Đây là hợp đồng hành vi, không chọn cookie/JWT, nơi lưu phiên hoặc hạ tầng bổ trợ.

### D008 - Khởi tạo Quản trị viên hệ thống đầu tiên bằng CLI trên server

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d008-english-evidence).

- **Nguồn:** O08; UC03, PDF tr.72-74; BM-03/BM-06, tr.23-24; CN-03, tr.26; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa).

- **Quyết định:** Khởi tạo Quản trị viên hệ thống đầu tiên bằng CLI chạy trên server. Chỉ được khởi tạo khi chưa tồn tại tài khoản Quản trị viên hệ thống, kể cả tài khoản bị khóa. Chạy đồng thời không được vượt qua điều kiện này: tạo tối đa một quản trị viên qua khởi tạo, không để trạng thái khởi tạo dở dang.

- **Bảo vệ thông tin đăng nhập:** Người cài đặt cung cấp tên đăng nhập và mật khẩu; không có thông tin đăng nhập mặc định. Nhập mật khẩu an toàn, không để mật khẩu xuất hiện trong command-line arguments, logs hoặc repository. Băm mật khẩu trước khi lưu; thuật toán băm chưa chốt.

- **Ranh giới truy cập:** Không cung cấp API hoặc trang web công khai để khởi tạo. Tài khoản ban đầu có quyền quản trị hệ thống; vai trò nghiệp vụ theo mùa được quản lý riêng. Sau khởi tạo, quản lý tài khoản thông thường qua UC03.

### D009 - Bảo vệ quyền quản trị và cấm tự khóa tài khoản

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d009-english-evidence).

- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)-[D008](administration.md#d008---khởi-tạo-quản-trị-viên-hệ-thống-đầu-tiên-bằng-cli-trên-server).

- **Quyết định:** Quản trị viên hệ thống không được tự khóa tài khoản hoặc tự thu hồi vai trò Quản trị viên hệ thống của mình. Từ chối mọi thao tác khóa tài khoản hoặc thu hồi vai trò quản trị khiến không còn Quản trị viên hệ thống hoạt động. Quản trị viên hệ thống hoạt động là tài khoản không bị khóa/vô hiệu hóa và còn vai trò Quản trị viên hệ thống.

- **Xử lý đồng thời:** Bảo đảm luôn còn ít nhất một quản trị viên hoạt động khi có thao tác đồng thời, kể cả trường hợp các quản trị viên cùng khóa hoặc gỡ quyền quản trị của nhau. Chỉ kiểm tra số tài khoản đã đọc trước đó là chưa đủ; cơ chế đồng thời cụ thể vẫn cần thiết kế.

### D010 - Cấm quản trị viên tự cấp quyền nghiệp vụ theo mùa

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d010-english-evidence).

- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)-[D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)/[D009](administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản).

- **Quyết định:** Quản trị viên hệ thống không được tự cấp thêm vai trò nghiệp vụ theo mùa hoặc mở rộng phạm vi mùa của chính mình. Quản trị viên vẫn có thể giữ vai trò nghiệp vụ, nhưng việc cấp thêm hoặc mở rộng phân công phải do Quản trị viên hệ thống khác thực hiện qua UC03. Quản trị viên duy nhất vẫn được cấp vai trò nghiệp vụ cho các nhân viên khác.

- **Hệ quả:** Phân quyền ở server phải kiểm tra người nhận phân công cùng vai trò/phạm vi được yêu cầu. Thay đổi thành công áp dụng vô hiệu hóa phiên [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản) và nhật ký BM-06. Thao tác nghiệp vụ sau đó vẫn tuân thủ tách người lập/người duyệt [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt); việc quản trị viên khác cấp vai trò không đồng nghĩa đã duyệt nội dung nghiệp vụ nào.

### D011 - CLI khôi phục khẩn cấp cho quản trị viên đã tồn tại

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d011-english-evidence).

- **Nguồn:** O08/O12; UC03, PDF tr.72-74; BM-02/BM-03/BM-06, tr.23-24; [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)-[D010](administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa). Đây là nội dung vận hành được phê duyệt rõ trong v2, không phải tác nhân hoặc UC bổ sung.

- **Quyết định:** Cung cấp CLI khôi phục khẩn cấp riêng trên server cho người vận hành có quyền truy cập server. Lệnh cho phép đặt lại mật khẩu và/hoặc mở khóa tài khoản đã tồn tại và đã có vai trò Quản trị viên hệ thống. Không được tạo tài khoản, cấp vai trò Quản trị viên hệ thống hoặc thay đổi quyền nghiệp vụ theo mùa. Không cung cấp API hoặc trang web công khai cho luồng khôi phục khẩn cấp này.

- **Bảo vệ mật khẩu/phiên:** Nhập mật khẩu thay thế an toàn, không qua command-line arguments, logs hoặc repository, và băm trước khi lưu. Khôi phục thành công vô hiệu hóa toàn bộ phiên hiện có của tài khoản đích.

- **Nhật ký:** Bắt buộc có lý do khôi phục và ghi định danh người thực hiện, thời gian, tài khoản đích, loại thao tác; không ghi mật khẩu.

### D012 - Nhân viên kết quả xử lý toàn mùa, không phân công từng trận

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d012-english-evidence).

- **Nguồn:** O08; UC16-UC17, PDF tr.109-114; BM-02/BM-06, tr.23-24; AT-02, tr.32; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt).

- **Quyết định:** Nhân viên kết quả được lập và cập nhật biên bản/kết quả chưa chính thức cho mọi trận trong mùa được phân công, khi trạng thái trận và kiểm tra nghiệp vụ cho phép. Phiên bản đầu không yêu cầu phân công riêng từng trận hoặc cơ chế quản lý giao trận.

- **Ranh giới quyền:** Phạm vi này không tự cấp quyền xác nhận kết quả chính thức hoặc sửa kết quả đã xác nhận. Các thao tác đó cần quyền tương ứng và tuân thủ tách người lập/người duyệt [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt). Không mở quyền sang mùa khác hoặc cấp thêm quyền cho vai trò khác.

- **Hệ quả:** Lịch sử ghi rõ người thực hiện từng thay đổi và ngăn ghi đè âm thầm khi sửa đồng thời. Phạm vi mùa không bỏ qua kiểm tra nghiệp vụ hoặc xử lý xung đột.

### D031 - Mỗi người một tài khoản nội bộ cá nhân

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d031-english-evidence).

- **Nguồn:** O08/O12; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D004](administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải)/[D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D017](../design/access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền).

- **Quyết định:** Mỗi người có một tài khoản nội bộ cá nhân trên toàn hệ thống; không dùng chung tài khoản/thông tin đăng nhập. Kiêm nhiệm hoặc đổi trách nhiệm được xử lý bằng phân công vai trò trên tài khoản đó, không tạo tài khoản riêng cho cùng người.

- **Danh tính và tách người:** Quản trị viên đối chiếu danh tính khi tạo tài khoản và ngăn tạo thêm cho người đã có. Kiểm tra tách người dựa trên tài khoản cá nhân gắn với người đó theo chính sách một-một này. Trường định danh và cách phát hiện trùng vẫn cần thiết kế; chỉ tên đăng nhập duy nhất chưa đủ chứng minh người duy nhất.

### D034 - Cấp riêng quyền quản lý hồ sơ gốc dùng chung

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d034-english-evidence).

- **Nguồn:** O04/O08/O12; UC03 tr.72-74, UC07 tr.82-84, UC09 tr.88-90 và UC12 tr.97-99; hồ sơ dùng chung tại PDF §1.3.4.1 tr.37-38; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D006](administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)/[D033](publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ).

- **Quyết định:** Phân biệt quyền quản lý dùng chung cho hồ sơ gốc CLB, sân và cầu thủ. Quản trị viên hệ thống cấp/thu hồi riêng qua UC03 cho nhân sự đảm nhiệm trách nhiệm nghiệp vụ tương ứng; chỉ có vai trò theo mùa không tự có quyền quản lý hồ sơ dùng chung.

| Nhóm hồ sơ dùng chung | Trách nhiệm nghiệp vụ tương ứng |
|---|---|
| Hồ sơ gốc CLB - UC07 | Ban tổ chức / Người quản lý mùa giải |
| Hồ sơ gốc sân - UC12 | Nhân viên lịch thi đấu |
| Hồ sơ gốc cầu thủ - UC09 | Nhân viên đăng ký |

- **Phạm vi:** Các quyền này áp dụng cho hồ sơ gốc dùng chung, không mở quyền xử lý hồ sơ tham gia hoặc hồ sơ nội bộ của các mùa khác. Đây là phần cụ thể hóa phạm vi dữ liệu dùng chung còn mở tại [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải), bên cạnh phân quyền nghiệp vụ theo mùa. Giữ tác nhân/UC hiện có; không thêm tác nhân mới.

### D037 - Cấm Quản trị viên tự cấp quyền quản lý hồ sơ gốc dùng chung

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d037-english-evidence).

- **Nguồn:** O08/O12; UC03 và [D010](administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa)/[D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung). Mở rộng nguyên tắc cấm tự cấp đã chốt sang quyền quản lý hồ sơ gốc dùng chung được cấp riêng.

- **Quyết định:** Quản trị viên hệ thống không được tự cấp hoặc mở rộng quyền quản lý hồ sơ gốc CLB, sân hoặc cầu thủ cho chính mình. Quản trị viên khác phải thực hiện việc cấp qua UC03. Có vai trò nghiệp vụ tương ứng không cho phép tự cấp quyền.

- **Ranh giới quản trị:** Quản trị viên duy nhất vẫn được cấp các quyền này cho nhân sự khác đủ điều kiện. Muốn nhận thêm quyền quản lý dùng chung cho chính mình cần Quản trị viên thứ hai. Kiểm tra hạn chế tại backend và lưu lịch sử cấp quyền.

### D038 - Chấm dứt quyền quản lý hồ sơ gốc dùng chung khi mất phân công vai trò tương ứng cuối cùng

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d038-english-evidence).

- **Nguồn:** O08/O12; UC03 và [D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)/[D037](administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung).

- **Quyết định:** Quyền quản lý hồ sơ gốc CLB yêu cầu phân công vai trò Người quản lý mùa giải ở ít nhất một mùa; quản lý sân yêu cầu vai trò Nhân viên lịch thi đấu ở ít nhất một mùa; quản lý cầu thủ yêu cầu vai trò Nhân viên đăng ký ở ít nhất một mùa. Vai trò tương ứng tiếp tục là điều kiện sau khi quyền dùng chung được cấp riêng.

- **Chấm dứt và cấp lại:** Thu hồi phân công vai trò tương ứng cuối cùng của người đó làm chấm dứt quyền quản lý dùng chung liên quan và lưu lịch sử. Phân công lại vai trò tương ứng không khôi phục quyền này; cần cấp riêng lần mới theo [D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)/[D037](administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung). Còn phân công tương ứng ở mùa khác thì không chấm dứt theo điều kiện này.

- **Ranh giới:** Mất vai trò là bị thu hồi phân công, không chỉ là mùa đã đến ngày kết thúc. Chính sách đóng/lưu trữ mùa vẫn chưa chốt. Quyết định này không mở quyền truy cập hồ sơ nội bộ của các mùa khác.

### D039 - Vô hiệu hóa phiên khi thay đổi quyền quản lý hồ sơ gốc dùng chung

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d039-english-evidence).

- **Nguồn:** O08/O12; UC03 và [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D022](../design/access-control.md#d022---vô-hiệu-hóa-phiên-người-nhận-khi-ủy-quyền-bắt-đầu-hoặc-kết-thúc-hiệu-lực)/[D030](../design/architecture.md#d030---kiểm-tra-lại-phiên-và-quyền-hiện-hành-tại-điểm-quyết-định-cuối-của-thao-tác-ghi)/[D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)/[D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng).

- **Quyết định:** Cấp thêm, mở rộng, thu hồi hoặc chấm dứt thành công quyền quản lý hồ sơ gốc dùng chung làm vô hiệu hóa toàn bộ phiên hiện có của người nhận bị ảnh hưởng, gồm chấm dứt theo [D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng). Yêu cầu nội bộ tiếp theo dùng phiên cũ bị từ chối; người dùng phải đăng nhập lại với quyền hiện tại.

- **Thông báo:** Hiển thị thông báo [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản): “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” Không yêu cầu hạ tầng thông báo thời gian thực.

- **Thao tác ghi đang xử lý:** [D030](../design/architecture.md#d030---kiểm-tra-lại-phiên-và-quyền-hiện-hành-tại-điểm-quyết-định-cuối-của-thao-tác-ghi) vẫn yêu cầu kiểm tra lại quyền/phiên tại điểm quyết định cuối trong giao dịch nghiệp vụ. Thay đổi quyền/phiên và thao tác ghi đồng thời phải có thứ tự nhất quán; không hoàn tác thao tác đã hoàn tất hợp lệ trước đó.

### D040 - Cho phép Quản trị viên tự giảm quyền nghiệp vụ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d040-english-evidence).

- **Nguồn:** O08/O12; UC03 và [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D009](administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản)/[D010](administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa)/[D037](administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)-[D039](administration.md#d039---vô-hiệu-hóa-phiên-khi-thay-đổi-quyền-quản-lý-hồ-sơ-gốc-dùng-chung).

- **Quyết định:** Qua UC03, Quản trị viên hệ thống được tự bỏ vai trò nghiệp vụ theo mùa, thu hẹp phạm vi mùa hoặc thu hồi quyền quản lý hồ sơ gốc dùng chung của chính mình. Thao tác chỉ được giảm quyền, không kèm cấp mới hoặc mở rộng quyền cho bản thân.

- **Hệ quả:** Lưu lịch sử thay đổi. Mất phân công vai trò tương ứng cuối cùng thì chấm dứt quyền dùng chung liên quan theo [D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng). Áp dụng vô hiệu hóa phiên theo [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D039](administration.md#d039---vô-hiệu-hóa-phiên-khi-thay-đổi-quyền-quản-lý-hồ-sơ-gốc-dùng-chung) và kiểm tra quyền cuối theo [D030](../design/architecture.md#d030---kiểm-tra-lại-phiên-và-quyền-hiện-hành-tại-điểm-quyết-định-cuối-của-thao-tác-ghi). Cấp lại sau đó cần Quản trị viên khác theo [D010](administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa)/[D037](administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung). Giữ lịch sử và trách nhiệm đối với thao tác trước đó.

- **Ranh giới quản trị:** [D009](administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản) vẫn cấm tự khóa tài khoản và tự thu hồi vai trò Quản trị viên hệ thống. [D040](administration.md#d040---cho-phép-quản-trị-viên-tự-giảm-quyền-nghiệp-vụ) chỉ cho phép giảm quyền nghiệp vụ.

### D041 - Giữ phân công quyền quản lý hồ sơ gốc dùng chung khi tài khoản bị khóa

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0003-season-scoped-business-permissions.md#d041-english-evidence).

- **Nguồn:** O08/O12; UC03 và [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D020](../design/access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)/[D034](administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)/[D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng)-[D040](administration.md#d040---cho-phép-quản-trị-viên-tự-giảm-quyền-nghiệp-vụ).

- **Quyết định:** Khóa tài khoản ngăn đăng nhập và mọi việc sử dụng quyền, đồng thời vô hiệu hóa toàn bộ phiên theo [D007](administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản). Chỉ riêng việc khóa không xóa phân công vai trò hoặc chấm dứt quyền quản lý hồ sơ gốc dùng chung được cấp riêng.

- **Mở khóa:** Yêu cầu đăng nhập mới; phiên cũ không được khôi phục. Người dùng chỉ được sử dụng quyền vẫn hợp lệ tại thời điểm đó. Thu hồi phân công vai trò tương ứng cuối cùng trong lúc khóa vẫn làm chấm dứt quyền dùng chung theo [D038](administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng); mở khóa không khôi phục quyền đó.

- **Ranh giới ủy quyền:** Ủy quyền nghiệp vụ vẫn theo [D020](../design/access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục): ủy quyền đã chấm dứt do khóa tài khoản không tự phục hồi khi mở khóa. Giữ phân công quyền dùng chung không thay đổi chính sách này.
