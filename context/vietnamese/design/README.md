# Whistle-EPL - Bối cảnh thiết kế - Context Package v2

**Trạng thái gói:** DRAFT - đang phỏng vấn; chưa phê duyệt toàn bộ.

Phần bổ sung thiết kế này dựa trên [Context v1 đã phê duyệt](../README.md). V1 tiếp tục là nền tảng nghiệp vụ được phê duyệt; phê duyệt, yêu cầu, trạng thái Phase và checkbox của v1 giữ nguyên. Những quyết định xác nhận bên dưới không chứng minh triển khai, nghiệm thu hoặc bất kỳ Phase nào đã đủ điều kiện thực hiện. Bản Vietnamese và [English](../../english/design/README.md) là hai cách thể hiện tương đương của phần bổ sung này.

## Quy ước lưu tài liệu

Nhóm trưởng xác nhận ngày 2026-10-25: tài liệu thiết kế được lưu tại `context/english/design/` và `context/vietnamese/design/`; phiên bản gói là thông tin trong tài liệu thay vì tên thư mục. Duy trì hai bản ngôn ngữ tương đương về nghĩa. `docs/adr/` và toàn bộ bản ghi ADR chỉ dùng tiếng Anh; tài liệu thiết kế tiếng Việt liên kết đến cùng bản ghi tiếng Anh.

## Quyết định đã xác nhận

### D001 - Backend nguyên khối chia module nghiệp vụ, có phân lớp

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Q1 của cuộc phỏng vấn đề xuất phương án A; Nhóm trưởng trả lời “Tôi chọn A.”.
- **Nguồn:** O12; CN-01-CN-04, PDF tr.26; ràng buộc dữ liệu tập trung tại §1.2.6.1; nhóm ba thành viên và kế hoạch nguồn tại §1.5 tr.50-52.
- **Quyết định:** Một backend triển khai như một đơn vị, tổ chức theo module nghiệp vụ và phân rõ trách nhiệm tiếp nhận yêu cầu, xử lý nghiệp vụ, truy cập dữ liệu; một CSDL quan hệ tập trung.
- **Phương án đã thảo luận:** Backend nguyên khối chia module và phân lớp; backend nguyên khối chỉ chia theo lớp kỹ thuật; nhiều dịch vụ triển khai độc lập.
- **Cơ sở và hệ quả:** Ranh giới module nghiệp vụ giúp tổ chức trách nhiệm thành viên; một backend/CSDL giúp việc triển khai và giao dịch liên chức năng khả thi hơn. Cần giữ kỷ luật phụ thuộc giữa module. Danh sách module, quy tắc phụ thuộc và ranh giới giao dịch cụ thể vẫn cần xác nhận.
- **Bản ghi:** [ADR 0001](../../../docs/adr/0001-modular-layered-backend.md).
- **Phase chịu ảnh hưởng:** Nền tảng PHASE 1 và thiết kế/tích hợp PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D002 bên dưới chốt stack và kiểu REST API. Cách render/triển khai frontend, schema/ERD, hợp đồng API chi tiết, xác thực/phiên, băm mật khẩu, mã hóa ký tự, bảo vệ truyền dữ liệu, nhật ký, xử lý xung đột và thiết kế giao dịch vẫn còn mở. D001 chốt hình thức kiến trúc backend thuộc O12.

### D002 - Technology Stack và kiểu API đã phê duyệt

- **Trạng thái:** APPROVED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q2, Nhóm trưởng xác nhận phương án A và chính thức phê duyệt Technology Stack là quyết định đã chốt cho Context Package v2.
- **Nguồn:** O12; CN-01-CN-04, PDF tr.26; xác nhận Q2. Nguyên tắc lựa chọn ưu tiên công nghệ nhóm đã thực hành, phù hợp ràng buộc môn học. Xác nhận này không xác lập kinh nghiệm cụ thể của từng thành viên hoặc các ràng buộc môn học bổ sung.
- **Quyết định:** Frontend: React + TypeScript. Backend: NestJS + TypeScript. Database: PostgreSQL. ORM: Prisma ORM. Kiểu API: REST API. Kiến trúc: Modular Monolith kết hợp Layered Architecture, nhất quán với D001.
- **Phương án/cơ sở:** Q2 so sánh việc ưu tiên công nghệ đã thực hành với chọn stack mới làm mục tiêu học tập. Nhóm trưởng chọn A và cung cấp stack chính thức; cuộc phỏng vấn chưa so sánh hay phê duyệt stack thay thế cụ thể nào.
- **Hệ quả:** Thiết kế Chương 3 và lập kế hoạch triển khai sau này sử dụng stack đã phê duyệt. Ranh giới module, schema PostgreSQL, ánh xạ Prisma và hợp đồng REST cần được thiết kế nhất quán với stack này.
- **Bản ghi:** [ADR 0002](../../../docs/adr/0002-approved-technology-stack.md).
- **Phase chịu ảnh hưởng:** PHASE 1-PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Phiên bản sản phẩm/thư viện/runtime, cách render và routing frontend, công cụ build/UI/kiểm thử, hosting và mô hình triển khai, đường dẫn/payload/lỗi API, xác thực/phiên, băm mật khẩu, schema/ERD, giao dịch/xung đột, mã hóa ký tự, bảo vệ truyền dữ liệu và công cụ vận hành. Phê duyệt stack không ngầm chốt các nội dung này.

### D003 - Quyền nghiệp vụ theo phạm vi mùa giải

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q3, Nhóm trưởng xác nhận phương án A: “Có, tôi xác nhận phương án A.”.
- **Nguồn:** O08; BM-02, PDF tr.23; QĐ4.1, PDF tr.9; phạm vi trách nhiệm tại §1.3.3 tr.35 và §2.1 tr.53.
- **Quyết định:** Vai trò nghiệp vụ được cấp theo mùa được phân công. Có vai trò nghiệp vụ trong một mùa không đồng nghĩa có quyền truy cập nghiệp vụ nội bộ của mùa khác. Quản trị tài khoản hệ thống có phạm vi toàn hệ thống và không tự cấp quyền phê duyệt nghiệp vụ. Người xem công khai được truy cập thông tin công khai đã công bố mà không cần tài khoản.
- **Phương án/cơ sở:** Vai trò nghiệp vụ theo mùa so với vai trò nghiệp vụ áp dụng cho mọi mùa. Phạm vi được chọn làm rõ phân công và hạn chế thao tác ngoài mùa phụ trách, đổi lại cần quản lý phân công theo mùa.
- **Hệ quả:** Yêu cầu nội bộ phải được kiểm tra theo vai trò và phạm vi mùa áp dụng cho người thao tác, cùng các điều kiện nghiệp vụ của thao tác. Chỉ ẩn/hiện giao diện là chưa đủ. Ma trận quyền và schema chi tiết vẫn cần thiết kế.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md).
- **Phase chịu ảnh hưởng:** Nền tảng quyền PHASE 1 và các luồng/kiểm chứng phân quyền PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D004 chốt nhiều vai trò, D005 chốt tách trách nhiệm lập và duyệt, D006 chốt thẩm quyền phân công và D007 chốt vô hiệu hóa phiên sau thay đổi truy cập. D008 chốt khởi tạo quản trị viên đầu tiên. D012 chốt phạm vi Nhân viên kết quả, không phân công từng trận. D013 chọn ủy quyền theo thao tác/mùa/thời hạn, D014 chốt trách nhiệm quản lý và còn mở chi tiết vòng đời. Tạo mùa và quyền đối với hồ sơ gốc CLB/cầu thủ/sân dùng chung vẫn còn mở, cùng toàn bộ ma trận trường công khai/nội bộ thuộc O04.

### D004 - Nhiều vai trò nghiệp vụ trong cùng mùa giải

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q4, Nhóm trưởng chọn phương án A: “tôi chọn phương án A.”.
- **Nguồn:** O08; BM-02, PDF tr.23; sáu tác nhân tại §1.3.3 tr.35 và §2.1 tr.53; D003.
- **Quyết định:** Một tài khoản có thể được cấp nhiều vai trò nghiệp vụ trong cùng mùa giải. Mỗi thao tác vẫn phải có quyền tương ứng trong mùa được phân công và đáp ứng các điều kiện nghiệp vụ áp dụng. Kiêm nhiều vai trò không tự cho phép tự duyệt.
- **Phương án/cơ sở:** Cho phép nhiều vai trò trên một tài khoản trong một mùa so với giới hạn mỗi tài khoản một vai trò trong mỗi mùa. Nhiều vai trò hỗ trợ kiêm nhiệm trong nhóm nhỏ và truy vết qua một tài khoản, đồng thời đòi hỏi kiểm soát quyền cộng dồn và xung đột trách nhiệm.
- **Hệ quả:** Thiết kế tài khoản/phân công và kiểm tra quyền phải hỗ trợ nhiều vai trò theo mùa. Giữ nguyên sáu tác nhân nghiệp vụ và 25 UC; quan hệ tài khoản-vai trò không tạo tác nhân mới.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#multiple-roles-per-season).
- **Phase chịu ảnh hưởng:** Quản trị vai trò PHASE 1 và các luồng phân quyền phụ thuộc tại PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D005 chốt tách trách nhiệm lập và duyệt, D006 chốt thẩm quyền phân công và D007 chốt vô hiệu hóa phiên sau thay đổi truy cập. D012 chốt phạm vi trận của Nhân viên kết quả. D013 chọn mô hình ủy quyền. Quyền thao tác chi tiết và quản lý ủy quyền vẫn còn mở.

### D005 - Tách biệt trách nhiệm lập và phê duyệt

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q5, Nhóm trưởng chọn phương án A và giải thích rằng việc trình duyệt và phê duyệt ngay từ đầu nhằm tách biệt rõ các trách nhiệm này.
- **Nguồn:** O07/O08; QĐ6, PDF tr.11; UC06 tr.79-82, UC08 tr.85-88, UC13-UC14 tr.100-106 và UC18-UC19 tr.115-121; D003/D004.
- **Quyết định:** Người lập và người duyệt phải khác nhau đối với quy định mùa giải, hồ sơ tham gia của CLB, lịch và yêu cầu điều chỉnh lịch, xác nhận kết quả chính thức và sửa kết quả đã xác nhận. Bất kỳ người nào đã lập hoặc sửa nội dung của phiên bản trình duyệt đều không được duyệt phiên bản đó, kể cả khi có vai trò được phép phê duyệt. Người duyệt phải có thẩm quyền phù hợp trong mùa được xử lý.
- **Luồng sửa kết quả:** Đề xuất sửa kết quả chính thức phải được trình để người khác có thẩm quyền phê duyệt trước khi áp dụng. Đây là nội dung cụ thể hóa UC19 được xác nhận rõ trong v2, không khẳng định v1 đã quy định bước phê duyệt riêng này. Kết quả chính thức hiện hành tiếp tục có hiệu lực trong thời gian chờ duyệt; sửa đổi được duyệt phải tuân thủ kiểm tra, lịch sử và tính toán lại nhất quán theo UC19/UC20.
- **Phương án/cơ sở:** Bắt buộc tách người, tự duyệt khi đủ vai trò hoặc chỉ tách người ở một số thao tác. Nhóm trưởng xác nhận bắt buộc tách người xuyên suốt các luồng phê duyệt đã liệt kê vì trình duyệt và phê duyệt là hai trách nhiệm riêng.
- **Hệ quả:** Hỗ trợ nhiều vai trò không được bỏ qua quy tắc tách người. Lịch sử phiên bản phải xác định người lập/sửa nội dung để kiểm tra điều kiện được duyệt. Cần ít nhất hai người khác nhau có thẩm quyền phù hợp để hoàn tất một luồng phê duyệt. Các thao tác lưu thông thường không có bước duyệt tiếp tục theo quyền áp dụng.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#separation-of-preparation-and-approval).
- **Phase chịu ảnh hưởng:** Nền tảng quyền PHASE 1, quy định PHASE 2, hồ sơ CLB PHASE 3, lịch PHASE 4, kết quả PHASE 5 và tích hợp/nghiệm thu PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Trạng thái/chuyển trạng thái chi tiết, quy tắc sửa/trình lại phiên bản đã gửi, quản lý ủy quyền và hiệu lực phân công và điều kiện được duyệt sau thu hồi quyền. Quyết định này không tự thêm bước duyệt vào thao tác lưu thông thường khác hoặc chốt chính sách duyệt tin tức/báo cáo.

### D006 - Quản trị viên hệ thống quản lý phân công vai trò theo mùa

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q6, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”.
- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D003-D005.
- **Quyết định:** Chỉ Quản trị viên hệ thống được cấp hoặc thu hồi vai trò nghiệp vụ và phạm vi mùa tương ứng. Ban tổ chức / Người quản lý mùa giải không được trực tiếp thay đổi phân công vai trò. Quyền quản trị tài khoản không tự cấp quyền phê duyệt nghiệp vụ.
- **Phương án/cơ sở:** Chỉ quản trị viên quản lý phân công so với cho phép Người quản lý mùa giải phân vai trò nhân viên trong mùa phụ trách. Lựa chọn được chốt giữ một đầu mối quản trị chịu trách nhiệm và nhất quán với UC03, đổi lại cần phối hợp với quản trị viên khi thay đổi nhân sự.
- **Hệ quả:** Thay đổi vai trò/phạm vi mùa được quản lý qua UC03, kiểm tra ở server và ghi nhật ký theo BM-06. Phê duyệt nghiệp vụ tiếp tục tuân thủ D003-D005. Quyết định này không tạo thêm luồng yêu cầu phân công nhân sự.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#seasonal-role-assignment-administration).
- **Phase chịu ảnh hưởng:** Quản trị tài khoản/vai trò PHASE 1 và các luồng phân quyền phụ thuộc tại PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D007 chốt vô hiệu hóa phiên sau thay đổi vai trò/phạm vi mùa hoặc khóa tài khoản. D008 chốt khởi tạo quản trị viên đầu tiên. D009 chốt cấm tự khóa/tự gỡ quyền quản trị và bảo vệ quản trị viên hoạt động cuối cùng. D010 cấm tự cấp thêm hoặc mở rộng quyền nghiệp vụ theo mùa. D012 chốt phạm vi trận của Nhân viên kết quả. D013 chọn mô hình ủy quyền; cách quản lý và thứ tự giao dịch đang chạy vẫn chưa chốt.

### D007 - Vô hiệu hóa phiên khi đổi quyền hoặc khóa tài khoản

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Sau khi thảo luận các phương án Q7 và cách thông báo, Nhóm trưởng xác nhận phương án A: “Hợp lý, chọn A thôi.”.
- **Nguồn:** O08/O12; UC01-UC03, PDF tr.67-74; BM-01/BM-02, tr.23; D003/D006.
- **Quyết định:** Lưu thành công thay đổi vai trò hoặc phạm vi mùa của tài khoản, kể cả cấp thêm quyền, hoặc khóa tài khoản sẽ vô hiệu hóa toàn bộ phiên hiện có của tài khoản đó. Ở yêu cầu nội bộ tiếp theo, server từ chối phiên cũ và ứng dụng thông báo tài khoản hoặc quyền đã thay đổi, yêu cầu đăng nhập lại. Tài khoản bị khóa không được đăng nhập; mở khóa không khôi phục phiên cũ.
- **Thông báo:** Nội dung tiếng Việt đã xác nhận: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” Nghĩa tiếng Anh: “Your session is no longer valid because your account or access permissions have changed. Please log in again.” Thông báo hiển thị khi ứng dụng nhận phản hồi từ server; quyết định này không yêu cầu cơ chế thông báo tức thời.
- **Phương án/cơ sở:** Vô hiệu hóa toàn bộ phiên hiện có so với giữ phiên và áp dụng quyền hiện hành ở các yêu cầu tiếp theo. Cả hai phương án đều phải từ chối thao tác không có quyền hiện hành. Nhóm trưởng chọn vô hiệu hóa để người dùng nhận biết rõ ranh giới và được thông báo đăng nhập lại.
- **Hệ quả:** Phiên cũ không được tái sử dụng cho truy cập nội bộ sau khi bị vô hiệu hóa. Thao tác đã hoàn tất thành công và lịch sử trước đó không tự bị hủy bởi thay đổi quyền. Đây là hợp đồng hành vi, không chọn cookie/JWT, nơi lưu phiên hoặc hạ tầng bổ trợ.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#session-invalidation-after-access-changes).
- **Phase chịu ảnh hưởng:** Quản trị tài khoản/phiên/vai trò PHASE 1 và các luồng nội bộ/kiểm chứng PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Cách triển khai xác thực/phiên, hợp đồng lỗi API cụ thể, xử lý dữ liệu biểu mẫu chưa lưu và thứ tự xử lý giao dịch đang chạy đồng thời với thay đổi quyền. Chính sách đồng thời phải được thiết kế rõ; chỉ vô hiệu hóa phiên chưa giải quyết yêu cầu đã bắt đầu xử lý. D008 chốt khởi tạo quản trị viên đầu tiên; D009 chốt cấm tự khóa/tự gỡ quyền quản trị và bảo vệ quản trị viên hoạt động cuối cùng. D010 cấm tự cấp thêm hoặc mở rộng quyền nghiệp vụ theo mùa; D011 chốt khôi phục khẩn cấp quyền quản trị.

### D008 - Khởi tạo Quản trị viên hệ thống đầu tiên bằng CLI trên server

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Nhóm trưởng xác nhận rõ phương án A của Q8, dùng CLI trên server, và bổ sung các điều kiện bắt buộc được ghi bên dưới.
- **Nguồn:** O08; UC03, PDF tr.72-74; BM-03/BM-06, tr.23-24; CN-03, tr.26; D003/D006.
- **Quyết định:** Khởi tạo Quản trị viên hệ thống đầu tiên bằng CLI chạy trên server. Chỉ được khởi tạo khi chưa tồn tại tài khoản Quản trị viên hệ thống, kể cả tài khoản bị khóa. Chạy đồng thời không được vượt qua điều kiện này: tạo tối đa một quản trị viên qua khởi tạo, không để trạng thái khởi tạo dở dang.
- **Bảo vệ thông tin đăng nhập:** Người cài đặt cung cấp tên đăng nhập và mật khẩu; không có thông tin đăng nhập mặc định. Nhập mật khẩu an toàn, không để mật khẩu xuất hiện trong command-line arguments, logs hoặc repository. Băm mật khẩu trước khi lưu; thuật toán băm chưa chốt.
- **Ranh giới truy cập:** Không cung cấp API hoặc trang web công khai để khởi tạo. Tài khoản ban đầu có quyền quản trị hệ thống; vai trò nghiệp vụ theo mùa được quản lý riêng. Sau khởi tạo, quản lý tài khoản thông thường qua UC03.
- **Phương án/cơ sở:** CLI trên server so với trang thiết lập lần đầu. Nhóm trưởng chọn CLI cùng điều kiện rõ về thông tin đăng nhập và xử lý đồng thời, tránh điểm khởi tạo công khai và chấp nhận bước chạy lệnh trên server khi cài đặt.
- **Bản ghi:** [ADR 0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md).
- **Phase chịu ảnh hưởng:** Nền tảng/thiết lập tài khoản PHASE 1 và kiểm chứng cài mới/vận hành PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Lệnh CLI khởi tạo và cách nhập an toàn cụ thể, cơ chế xử lý đồng thời, tham số băm mật khẩu và chi tiết nhật ký khởi tạo vẫn còn mở. D011 chốt luồng khôi phục khẩn cấp riêng. Không được đặt lại, thay thế hoặc bổ sung tài khoản quản trị đã tồn tại qua luồng khởi tạo này; khôi phục khẩn cấp tuân thủ D011.

### D009 - Bảo vệ quyền quản trị và cấm tự khóa tài khoản

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q9, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”.
- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D006-D008.
- **Quyết định:** Quản trị viên hệ thống không được tự khóa tài khoản hoặc tự thu hồi vai trò Quản trị viên hệ thống của mình. Từ chối mọi thao tác khóa tài khoản hoặc thu hồi vai trò quản trị khiến không còn Quản trị viên hệ thống hoạt động. Quản trị viên hệ thống hoạt động là tài khoản không bị khóa/vô hiệu hóa và còn vai trò Quản trị viên hệ thống.
- **Xử lý đồng thời:** Bảo đảm luôn còn ít nhất một quản trị viên hoạt động khi có thao tác đồng thời, kể cả trường hợp các quản trị viên cùng khóa hoặc gỡ quyền quản trị của nhau. Chỉ kiểm tra số tài khoản đã đọc trước đó là chưa đủ; cơ chế đồng thời cụ thể vẫn cần thiết kế.
- **Phương án/cơ sở:** Cấm tự khóa/tự gỡ quyền quản trị so với cho phép nếu còn quản trị viên khác hoạt động. Nhóm trưởng chọn cấm để quy tắc rõ ràng và tránh vô tình tự mất quyền quản trị, chấp nhận việc cần quản trị viên khác xử lý ngừng tài khoản hoặc gỡ vai trò quản trị của mình.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-access-safeguards).
- **Phase chịu ảnh hưởng:** Quản trị tài khoản/vai trò PHASE 1 và kiểm chứng đồng thời/tích hợp PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D010 chốt việc quản trị viên tự cấp quyền nghiệp vụ theo mùa. Đổi mật khẩu và cách triển khai giao dịch/đồng thời cụ thể vẫn còn mở. D011 chốt khôi phục khẩn cấp. D009 không cấm thay đổi hồ sơ/mật khẩu thông thường hoặc xác lập cơ chế khôi phục.

### D010 - Cấm quản trị viên tự cấp quyền nghiệp vụ theo mùa

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q10, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D003-D006/D009.
- **Quyết định:** Quản trị viên hệ thống không được tự cấp thêm vai trò nghiệp vụ theo mùa hoặc mở rộng phạm vi mùa của chính mình. Quản trị viên vẫn có thể giữ vai trò nghiệp vụ, nhưng việc cấp thêm hoặc mở rộng phân công phải do Quản trị viên hệ thống khác thực hiện qua UC03. Quản trị viên duy nhất vẫn được cấp vai trò nghiệp vụ cho các nhân viên khác.
- **Phương án/cơ sở:** Cấm tự cấp/mở rộng quyền so với cho phép và ghi đầy đủ nhật ký. Quy tắc được chọn tách người cấp quyền và người nhận, đổi lại cần quản trị viên khác khi một quản trị viên muốn có thêm quyền nghiệp vụ.
- **Hệ quả:** Phân quyền ở server phải kiểm tra người nhận phân công cùng vai trò/phạm vi được yêu cầu. Thay đổi thành công áp dụng vô hiệu hóa phiên D007 và nhật ký BM-06. Thao tác nghiệp vụ sau đó vẫn tuân thủ tách người lập/người duyệt D005; việc quản trị viên khác cấp vai trò không đồng nghĩa đã duyệt nội dung nghiệp vụ nào.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-granting-of-business-permissions).
- **Phase chịu ảnh hưởng:** Quản lý phân công PHASE 1 và các luồng phụ thuộc/kiểm chứng PHASE 2-PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D011 chốt khôi phục khẩn cấp quyền quản trị. Quy tắc đổi mật khẩu, tự giảm quyền nghiệp vụ và hợp đồng phân công/schema/đồng thời cụ thể vẫn còn mở. Quyết định này không cấm quản trị viên giữ vai trò nghiệp vụ hoặc yêu cầu quản trị viên thứ hai khi cấp vai trò cho nhân viên khác.

### D011 - CLI khôi phục khẩn cấp cho quản trị viên đã tồn tại

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q11, Nhóm trưởng đồng ý phương án A, gồm phạm vi khôi phục và các điều kiện bảo vệ đã đề xuất.
- **Nguồn:** O08/O12; UC03, PDF tr.72-74; BM-02/BM-03/BM-06, tr.23-24; D007-D010. Đây là nội dung vận hành được phê duyệt rõ trong v2, không phải tác nhân hoặc UC bổ sung.
- **Quyết định:** Cung cấp CLI khôi phục khẩn cấp riêng trên server cho người vận hành có quyền truy cập server. Lệnh được đặt lại mật khẩu và/hoặc mở khóa tài khoản đã tồn tại và đã có vai trò Quản trị viên hệ thống. Không được tạo tài khoản, cấp vai trò Quản trị viên hệ thống hoặc thay đổi quyền nghiệp vụ theo mùa. Không cung cấp API hoặc trang web công khai cho luồng khôi phục khẩn cấp này.
- **Bảo vệ mật khẩu/phiên:** Nhập mật khẩu thay thế an toàn, không qua command-line arguments, logs hoặc repository, và băm trước khi lưu. Khôi phục thành công vô hiệu hóa toàn bộ phiên hiện có của tài khoản đích.
- **Nhật ký:** Bắt buộc có lý do khôi phục và ghi định danh người thực hiện, thời gian, tài khoản đích, loại thao tác; không ghi mật khẩu.
- **Phương án/cơ sở:** CLI khôi phục riêng trên server so với chỉ dựa vào quản trị viên khác. Lựa chọn được chốt hỗ trợ khôi phục khi không quản trị viên nào đăng nhập được, đổi lại phải bảo vệ quyền chạy lệnh và ghi nhận thao tác khôi phục. Khởi tạo D008 vẫn là luồng riêng và không được dùng khi đã tồn tại tài khoản quản trị viên.
- **Bản ghi:** [ADR 0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#emergency-recovery-of-existing-administrators).
- **Phase chịu ảnh hưởng:** Vận hành tài khoản/phiên PHASE 1 và kiểm chứng vận hành PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Lệnh và hợp đồng quyền server/người vận hành cụ thể, cách xác định người thực hiện, nhập an toàn, thuật toán/tham số băm, tính nguyên tử của khôi phục/nhật ký/vô hiệu hóa phiên và xử lý khôi phục đồng thời. Đổi/đặt lại mật khẩu thông thường và tự giảm quyền nghiệp vụ không được chốt bởi luồng khẩn cấp này.

### D012 - Nhân viên kết quả xử lý toàn mùa, không phân công từng trận

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q12, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08; UC16-UC17, PDF tr.109-114; BM-02/BM-06, tr.23-24; AT-02, tr.32; D003/D005.
- **Quyết định:** Nhân viên kết quả được lập và cập nhật biên bản/kết quả chưa chính thức cho mọi trận trong mùa được phân công, khi trạng thái trận và kiểm tra nghiệp vụ cho phép. Phiên bản đầu không yêu cầu phân công riêng từng trận hoặc cơ chế quản lý giao trận.
- **Ranh giới quyền:** Phạm vi này không tự cấp quyền xác nhận kết quả chính thức hoặc sửa kết quả đã xác nhận. Các thao tác đó cần quyền tương ứng và tuân thủ tách người lập/người duyệt D005. Không mở quyền sang mùa khác hoặc cấp thêm quyền cho vai trò khác.
- **Phương án/cơ sở:** Nhân viên kết quả xử lý toàn mùa so với phân công từng trận. Quyền toàn mùa giúp nhóm nhỏ phối hợp và thay thế nhân sự mà không cần duy trì phân công trận, đổi lại không giới hạn trách nhiệm nhập liệu đến từng trận bằng phân quyền.
- **Hệ quả:** Lịch sử ghi rõ người thực hiện từng thay đổi và ngăn ghi đè âm thầm khi sửa đồng thời. Phạm vi mùa không bỏ qua kiểm tra nghiệp vụ hoặc xử lý xung đột.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#results-officer-match-scope).
- **Phase chịu ảnh hưởng:** Phân quyền PHASE 1, biên bản/kết quả chưa chính thức PHASE 5 và kiểm chứng tích hợp/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Quyền thao tác chi tiết, trạng thái/chuyển trạng thái, quản lý ủy quyền, quy tắc người phụ trách/phiên bản biên bản và hợp đồng đồng thời cụ thể. D013 chốt mô hình ủy quyền. Thẩm quyền sửa kết quả đã xác nhận vẫn là quyết định quyền riêng.

### D013 - Ủy quyền nghiệp vụ riêng theo thao tác, mùa và thời hạn

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q13, Nhóm trưởng chọn phương án B: “Tôi chọn phương án B.”.
- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC14 tr.103-106 và UC19 tr.118-121; D003-D006/D010.
- **Quyết định:** Biểu diễn ủy quyền nghiệp vụ riêng, xác định thao tác được phép, mùa áp dụng và thời hạn hiệu lực. Không dùng phương án A đã đề xuất là cấp vai trò hiện có rộng hơn làm cơ chế ủy quyền duy nhất.
- **Phương án/đánh đổi:** Ủy quyền qua vai trò theo mùa hiện có so với ủy quyền cụ thể theo thao tác/mùa/thời hạn. Mô hình được chọn có thể cấp đúng thao tác cần dùng mà không cấp toàn bộ vai trò rộng hơn, nhưng cần quy tắc rõ về cấp, hết hạn, thu hồi và kiểm tra quyền. Nhóm trưởng chưa chọn các quy tắc đó.
- **Ranh giới:** Ủy quyền không bỏ qua tách người lập/người duyệt D005. Thẩm quyền quản lý phân công vai trò/phạm vi mùa D006 và cấm tự cấp quyền D010 vẫn giữ nguyên; riêng D013 chưa quyết định ai cấp ủy quyền hoặc cách áp dụng các giới hạn này khi quản lý ủy quyền. Không thêm tác nhân hoặc UC mới.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md). Nghĩa nghiệp vụ được ghi trong [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Phân quyền PHASE 1, thẩm quyền quy định PHASE 2, điều chỉnh lịch PHASE 4, sửa kết quả chính thức PHASE 5 và tích hợp/kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D014 chốt trách nhiệm đề nghị và ghi nhận cấp/thu hồi. D015 cấm ủy quyền lại và yêu cầu quyền trực tiếp từ vai trò. D018-D019 chốt điều kiện người nhận và danh sách vai trò/thao tác. Trạng thái yêu cầu chi tiết, biên thời hạn/múi giờ, vòng đời/nhật ký và hệ quả với phiên, yêu cầu chờ duyệt, giao dịch đang chạy khi thay đổi hoặc hết hạn ủy quyền. Không ngầm chấp nhận quy tắc quản lý/vòng đời đã đề xuất cho phương án A bị từ chối.

### D014 - Ban tổ chức đề nghị ủy quyền, Quản trị viên ghi nhận cấp/thu hồi

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q14, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC03 tr.72-74, UC14 tr.103-106 và UC19 tr.118-121; D006/D013.
- **Quyết định:** Ban tổ chức / Người quản lý mùa giải đề nghị ủy quyền nghiệp vụ, xác định người nhận, thao tác, mùa, thời hạn và căn cứ. Quản trị viên hệ thống kiểm tra các điều kiện áp dụng và ghi nhận việc cấp hoặc thu hồi trên hệ thống. Người quản lý mùa giải không trực tiếp thực hiện cấp/thu hồi ủy quyền.
- **Phương án/cơ sở:** Ban tổ chức đề nghị rồi quản trị viên ghi nhận so với Người quản lý mùa giải trực tiếp cấp/thu hồi. Nhóm trưởng chọn tập trung thao tác quản lý truy cập tại một đầu mối, chấp nhận phối hợp với quản trị viên khi thay đổi ủy quyền.
- **Ranh giới:** Ghi nhận ủy quyền không phải phê duyệt nội dung nghiệp vụ; D005 vẫn áp dụng. Phân công vai trò/phạm vi mùa tiếp tục theo D006; ủy quyền vẫn cụ thể theo thao tác/mùa/thời hạn D013. Quyết định này chưa chọn trạng thái yêu cầu, người được nhận, quy tắc tự ủy quyền hoặc ủy quyền lại.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#delegation-administration-responsibilities).
- **Phase chịu ảnh hưởng:** Quản trị truy cập PHASE 1, thao tác được ủy quyền PHASE 2/PHASE 4/PHASE 5 và tích hợp/kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Vòng đời đề nghị/thu hồi chi tiết, giới hạn thẩm quyền còn lại, người được nhận, hợp đồng nhật ký/phiên/hết hạn và thay đổi đồng thời. D014 phân trách nhiệm, không xem bước kiểm tra của quản trị viên là phê duyệt nội dung nghiệp vụ.

### D015 - Ủy quyền một cấp dựa trên quyền trực tiếp từ vai trò

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q15, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC14 tr.103-106 và UC19 tr.118-121; D003/D013/D014.
- **Quyết định:** Ủy quyền nghiệp vụ chỉ có một cấp. Người đề nghị phải dựa trên quyền có trực tiếp từ vai trò của chính mình trong mùa tương ứng, giới hạn ở thao tác được phép ủy quyền. Quyền nhận qua ủy quyền không được dùng làm căn cứ ủy quyền tiếp.
- **Thay người và quyền độc lập:** Nếu cần thay người nhận, lập đề nghị ủy quyền mới theo D014. Nếu người nhận đồng thời có quyền trực tiếp từ vai trò, đề nghị dựa trên quyền trực tiếp đó không phải ủy quyền lại; vẫn phải đáp ứng cùng các kiểm tra điều kiện.
- **Phương án/cơ sở:** Cấm ủy quyền lại so với cho phép chuỗi ủy quyền giới hạn theo thao tác/mùa/thời hạn được nhận. Mô hình được chọn giúp căn cứ quyền, thời hạn và trách nhiệm đơn giản hơn, đổi lại cần đề nghị mới từ người có quyền trực tiếp khi thay người nhận.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#single-level-delegation-from-direct-role-authority). Xem [quyền nghiệp vụ trực tiếp](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Phân quyền PHASE 1, thao tác được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D016 chốt cấm tự đề nghị/tự ghi nhận. D018-D019 chốt vai trò/thao tác được nhận. D020 chốt chấm dứt khi mất điều kiện bắt buộc, gồm quyền trực tiếp của người đề nghị. Biên thời hạn, hợp đồng nhật ký/phiên/vòng đời và đồng thời vẫn còn mở.

### D016 - Người nhận không tự đề nghị hoặc ghi nhận cấp ủy quyền cho mình

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q16, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D010/D013-D015.
- **Quyết định:** Người nhận ủy quyền phải khác người đề nghị và khác Quản trị viên hệ thống ghi nhận cấp quyền. Kiêm nhiều vai trò không được bỏ qua hai giới hạn này. Quản trị viên chỉ được nhận ủy quyền hợp lệ khi người khác đề nghị và quản trị viên khác ghi nhận cấp.
- **Phương án/cơ sở:** Cấm tự đề nghị/tự ghi nhận so với cho phép quản trị viên tự ghi nhận cấp cho mình sau đề nghị của Người quản lý mùa giải khác. Nhóm trưởng chọn tách người nhận khỏi việc xin/cấp quyền, nhất quán với D010, chấp nhận cần quản trị viên khác khi người nhận là quản trị viên.
- **Cập nhật tiếp theo:** D017 yêu cầu người đề nghị và quản trị viên ghi nhận phải khác nhau. D016 không cấm quản trị viên nhận ủy quyền hoặc mở rộng danh sách người/thao tác được phép nhận.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#recipient-separation-from-proposal-and-grant-recording).
- **Phase chịu ảnh hưởng:** Phân quyền ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Hệ quả khi mất điều kiện người nhận/thao tác, vòng đời yêu cầu, nhật ký/phiên/hết hạn và triển khai đồng thời. D017 chốt tách người đề nghị/người ghi nhận.

### D017 - Ba người khác nhau khi cấp ủy quyền

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q17, Nhóm trưởng chọn phương án A: “tôi chọn A.”.
- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D004/D014/D016.
- **Quyết định:** Người đề nghị ủy quyền phải khác Quản trị viên hệ thống kiểm tra và ghi nhận cấp. Kết hợp D016, mỗi lần cấp ủy quyền cần ba người khác nhau: người đề nghị, người ghi nhận và người nhận. Kiêm nhiều vai trò không được bỏ qua các giới hạn này.
- **Phương án/cơ sở:** Bắt buộc người đề nghị khác người ghi nhận so với cho phép một người có đủ hai vai trò thực hiện cả hai trách nhiệm. Nhóm trưởng chọn có bước kiểm tra độc lập trước khi cấp quyền, chấp nhận việc phối hợp ba người.
- **Hệ quả:** Backend phải kiểm tra các điều kiện tách người khi ghi nhận cấp. Ghi nhận ủy quyền vẫn khác với duyệt nội dung nghiệp vụ; D005 áp dụng riêng khi phê duyệt nghiệp vụ sau đó. Đây là quy tắc bổ sung cho việc cấp ủy quyền, không khẳng định D014 đã yêu cầu tách người.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#three-person-separation-for-delegation-grants).
- **Phase chịu ảnh hưởng:** Quản lý ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Hệ quả khi mất điều kiện người nhận/thao tác, hợp đồng vòng đời/thời gian/phiên/nhật ký và đồng thời, cách biểu diễn/kiểm tra định danh người qua các tài khoản. D021 cho phép quản trị viên trực tiếp thu hồi, không cần quy trình ba người khi cấp.

### D018 - Người nhận phải có vai trò nghiệp vụ trong mùa đích trước khi nhận ủy quyền

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q18, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; BM-02, PDF tr.23; UC03 tr.72-74; D003/D006/D013-D017.
- **Quyết định:** Người nhận phải có tài khoản hoạt động và ít nhất một vai trò nghiệp vụ được phân công trong mùa đích trước khi nhận ủy quyền. Ủy quyền bổ sung thao tác cụ thể, không thay thế phân công nhân sự theo mùa. Tài khoản chỉ giữ vai trò Quản trị viên hệ thống chưa đủ điều kiện, cần được phân công riêng vai trò nghiệp vụ trong mùa đó qua UC03.
- **Phương án/cơ sở:** Yêu cầu đã có phân công nghiệp vụ theo mùa so với cho phép mọi tài khoản nội bộ hoạt động nhận quyền truy cập mùa chỉ qua ủy quyền. Chính sách được chọn tách phân công nhân sự khỏi quyền ủy quyền bổ sung, đổi lại cần hoàn tất phân công UC03 trước khi cấp ủy quyền.
- **Ranh giới:** D018 là điều kiện tiên quyết, không cho phép mọi vai trò trong mùa nhận mọi thao tác ủy quyền. D019 bên dưới chốt ma trận vai trò/thao tác của phiên bản đầu. Các điều kiện thẩm quyền và tách người D015-D017 tiếp tục áp dụng.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#prior-seasonal-business-assignment-for-recipients).
- **Phase chịu ảnh hưởng:** Phân quyền phân công/ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Chi tiết vòng đời trạng thái tài khoản và hợp đồng yêu cầu/thời gian/phiên/nhật ký/đồng thời. D019 chốt ma trận vai trò/thao tác; D020 chốt chấm dứt khi mất điều kiện bắt buộc.

### D019 - Ma trận thao tác và vai trò được nhận ủy quyền trong phiên bản đầu

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q19, Nhóm trưởng chọn phương án A: “Chọn A là hợp lý.”.
- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC06 tr.79-82, UC14 tr.103-106, UC19 tr.118-121; ranh giới phê duyệt tại UC08/UC13/UC18/UC22/UC24; D005/D013-D018.
- **Quyết định:** Phiên bản đầu chỉ cho ủy quyền các thao tác và vai trò người nhận trong bảng dưới. Người nhận phải giữ vai trò được liệt kê trong mùa đích và đáp ứng D015-D018. Đây là nội dung thiết kế v2 đã xác nhận, không khẳng định v1 đã có ma trận chi tiết này.

| Thao tác được ủy quyền | Vai trò nghiệp vụ người nhận trong mùa | Giới hạn |
|---|---|---|
| Soạn/sửa đề xuất thay đổi quy định mùa giải - UC06 | Nhân viên đăng ký, Nhân viên lịch thi đấu hoặc Nhân viên kết quả | Không bao gồm phê duyệt quy định |
| Phê duyệt đề nghị điều chỉnh lịch - UC14 | Nhân viên lịch thi đấu | Không được duyệt phiên bản trình duyệt mình đã lập/sửa |
| Lập/sửa đề xuất sửa kết quả chính thức - UC19 | Nhân viên kết quả | Không được áp dụng trực tiếp; người khác có thẩm quyền phải duyệt |

- **Thẩm quyền phê duyệt/công bố giữ lại:** Duyệt quy định, duyệt hồ sơ tham gia CLB, duyệt lịch ban đầu, xác nhận kết quả chính thức, duyệt sửa kết quả chính thức, xác nhận tổng kết mùa và công bố/thu hồi tin tức giữ ở Ban tổ chức / Người quản lý mùa giải, không cấp qua cơ chế ủy quyền này trong phiên bản đầu. Quản trị tài khoản nằm ngoài ủy quyền nghiệp vụ. Quyết định này không cho phép thao tác ủy quyền nào khác.
- **Phương án/cơ sở:** Danh sách vai trò/thao tác giới hạn so với xem xét phạm vi phê duyệt được ủy quyền rộng hơn. Nhóm trưởng chọn danh sách giới hạn, phân biệt lập đề xuất, phê duyệt và áp dụng thay đổi, chấp nhận việc Ban tổ chức vẫn trực tiếp xử lý các thao tác được giữ lại.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#first-version-delegation-matrix).
- **Phase chịu ảnh hưởng:** Phân quyền PHASE 1, đề xuất quy định PHASE 2, điều chỉnh lịch PHASE 4, sửa kết quả chính thức PHASE 5; thẩm quyền giữ lại PHASE 3/PHASE 7/PHASE 8; tích hợp/kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D020 chốt chấm dứt khi mất điều kiện. Vòng đời/thời gian/phiên/nhật ký ủy quyền còn lại, đồng thời và hợp đồng API/UI/schema chi tiết vẫn còn mở. Ma trận này không thay thế toàn bộ ma trận quyền vai trò/thao tác cơ bản.

### D020 - Chấm dứt ủy quyền khi mất điều kiện, không tự khôi phục

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q20, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; D003/D015/D018/D019.
- **Quyết định:** Ủy quyền đã cấp chấm dứt khi người đề nghị mất quyền nghiệp vụ trực tiếp tương ứng trong mùa hoặc tài khoản bị khóa/vô hiệu hóa, hoặc khi người nhận không còn vai trò phù hợp với thao tác trong mùa hoặc tài khoản bị khóa/vô hiệu hóa. Kiểm tra quyền/vai trò liên quan; mất một vai trò phụ không liên quan không tự đồng nghĩa mất điều kiện bắt buộc.
- **Không tự khôi phục:** Mở khóa hoặc cấp lại vai trò không khôi phục ủy quyền đã chấm dứt. Muốn tiếp tục dùng quyền được ủy quyền phải lập đề nghị và cấp mới theo D014-D018 cùng ma trận thao tác/vai trò D019. Giữ lịch sử và lý do chấm dứt; không tự hủy thao tác đã hoàn tất hợp lệ trước đó.
- **Phương án/cơ sở:** Chấm dứt không tự khôi phục so với tạm ngưng rồi tự có hiệu lực lại khi điều kiện phục hồi trước hết hạn. Nhóm trưởng chọn ranh giới rõ để quyền ủy quyền cũ không tự trở lại ngoài dự kiến, chấp nhận cần cấp mới.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#termination-on-loss-of-required-eligibility).
- **Phase chịu ảnh hưởng:** Vòng đời truy cập/phân công PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D021 chốt thu hồi trực tiếp bởi quản trị viên; D022 chốt vô hiệu hóa phiên người nhận. Trạng thái vòng đời cụ thể, biên thời hạn, triển khai phiên, yêu cầu chờ duyệt và thứ tự giao dịch đang chạy đồng thời với thay đổi điều kiện. D020 ngăn tiếp tục dựa vào ủy quyền đã chấm dứt nhưng không chọn công nghệ phiên hoặc quyết định kết quả giao dịch đã bắt đầu xử lý.

### D021 - Quản trị viên trực tiếp thu hồi ủy quyền nghiệp vụ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q21, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D014/D016/D017/D020.
- **Quyết định:** Quản trị viên hệ thống được trực tiếp thu hồi ủy quyền nghiệp vụ mà không chờ đề nghị hoặc quy trình ba người khi cấp, kể cả ủy quyền mà chính mình đang nhận. Ban tổ chức hoặc người nhận có thể đề nghị chấm dứt, nhưng Quản trị viên hệ thống thực hiện thu hồi. Quản trị viên cũng được chủ động thu hồi.
- **Lịch sử và hiệu lực:** Bắt buộc ghi người thực hiện, thời điểm, ủy quyền bị thu hồi và lý do. Sau khi lưu thu hồi thành công, không thao tác nào được tiếp tục dựa trên ủy quyền đó. Thu hồi không tự đảo ngược; muốn cấp lại phải theo quy trình cấp mới. Các quyền độc lập khác không bị gỡ chỉ vì thu hồi một ủy quyền.
- **Phương án/cơ sở:** Quản trị viên trực tiếp thu hồi so với yêu cầu tách ba người đề nghị/kiểm tra như khi cấp. Nhóm trưởng chọn dừng quyền kịp thời mà không cần tập hợp ba người, chấp nhận nguy cơ gián đoạn công việc nếu thu hồi nhầm và yêu cầu lý do có thể truy vết.
- **Ranh giới:** Đây là nội dung cụ thể hóa rõ quy trình thu hồi D014. D016/D017 vẫn bắt buộc khi cấp; các giới hạn đó không chặn thu hồi trực tiếp này. D009 vẫn cấm tự gỡ vai trò Quản trị viên hệ thống: tự thu hồi ủy quyền nghiệp vụ là thao tác khác.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#direct-administrative-revocation).
- **Phase chịu ảnh hưởng:** Quản lý ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D022 chốt vô hiệu hóa phiên người nhận. Trạng thái yêu cầu/thu hồi và hợp đồng UI/API, triển khai phiên, biên thời hạn, công việc nghiệp vụ chờ xử lý và thứ tự giao dịch đang chạy, triển khai/lưu giữ nhật ký và xử lý cấp/thu hồi đồng thời.

### D022 - Vô hiệu hóa phiên người nhận khi ủy quyền bắt đầu hoặc kết thúc hiệu lực

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q22, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08/O12; BM-01/BM-02, PDF tr.23; D007/D013/D020/D021.
- **Quyết định:** Vô hiệu hóa toàn bộ phiên hiện có của người nhận khi ủy quyền bắt đầu hiệu lực, hết hạn, bị thu hồi hoặc chấm dứt do mất điều kiện theo D020. Yêu cầu nội bộ tiếp theo từ phiên cũ bị từ chối và hiển thị thông báo đăng nhập lại đã chốt tại D007.
- **Bắt đầu trong tương lai:** Ghi nhận trước một ủy quyền có thời điểm bắt đầu trong tương lai không vô hiệu hóa phiên ngay lúc ghi nhận. Vô hiệu hóa các phiên hiện có của người nhận khi ủy quyền thực sự bắt đầu hiệu lực.
- **Phương án/cơ sở:** Vô hiệu hóa phiên khi quyền ủy quyền thay đổi hiệu lực so với giữ phiên, kiểm tra quyền hiện hành và thông báo. Nhóm trưởng chọn hành vi nhất quán với D007 và ranh giới quyền rõ cho người dùng, chấp nhận đăng nhập lại kể cả khi hết hạn theo lịch.
- **Ranh giới:** Quyết định này áp dụng cho phiên người nhận; không vô hiệu hóa phiên người đề nghị/người ghi nhận chỉ vì quản lý ủy quyền của người khác. Các điều kiện thay đổi tài khoản/vai trò D007 vẫn áp dụng độc lập. Không yêu cầu thông báo tức thời: ứng dụng hiển thị khi nhận phản hồi server.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#recipient-session-invalidation-at-effective-delegation-changes).
- **Phase chịu ảnh hưởng:** Phiên/vòng đời ủy quyền PHASE 1, luồng nội bộ PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D023 chốt biên khoảng hiệu lực và chính sách bắt đầu/gia hạn. D024 chốt chính sách múi giờ chung. Cách phát hiện bắt đầu/hết hạn và triển khai phiên, hợp đồng API/lỗi cụ thể, vòng đời/nhật ký, ủy quyền chồng lấn, công việc chờ xử lý và thứ tự giao dịch đồng thời/đang chạy. D022 không chọn scheduler, cookie/JWT hoặc nơi lưu phiên.

### D023 - Thời điểm bắt đầu/kết thúc cụ thể, không bao gồm mốc kết thúc

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q23, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”.
- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; D013/D022. Chi tiết biên thời gian này là lựa chọn thiết kế v2 đã xác nhận, không phải giá trị mặc định từ nguồn.
- **Quyết định:** Mỗi ủy quyền có ngày/giờ bắt đầu và kết thúc xác định; kết thúc phải sau bắt đầu. Khoảng hiệu lực là [bắt đầu, kết thúc): dùng được đúng mốc bắt đầu và không dùng được từ đúng mốc kết thúc trở đi, đồng thời phải đáp ứng các điều kiện quyền/điều kiện nhận khác.
- **Bắt đầu và gia hạn:** Hỗ trợ bắt đầu ngay khi ghi nhận cấp thành công hoặc hẹn bắt đầu trong tương lai. Không cấp ủy quyền hồi tố. Khi chọn bắt đầu ngay, server xác định mốc bắt đầu lúc ghi nhận cấp thành công. Hết hạn không tự gia hạn; muốn tiếp tục phải cấp mới.
- **Phương án/cơ sở:** Ngày/giờ bắt đầu/kết thúc cụ thể so với khoảng ủy quyền trọn ngày. Nhóm trưởng chọn thời điểm cụ thể để hỗ trợ ủy quyền ngắn và xác định rõ biên phân quyền/phiên, chấp nhận nhập thời gian chính xác hơn.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#explicit-startend-instants-and-exclusive-end).
- **Phase chịu ảnh hưởng:** Thời gian ủy quyền/phiên PHASE 1, thao tác được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng biên PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D024 chốt chính sách múi giờ chung; D025 chốt không đặt trần số ngày cố định; D026 cho phép thời hạn ngoài ngày mùa khi đáp ứng điều kiện nghiệp vụ/vòng đời mùa. Độ chính xác thời gian và triển khai bắt đầu/hết hạn, cơ chế ngăn chồng lấn theo D027, vòng đời yêu cầu và thứ tự giao dịch đồng thời/đang chạy vẫn còn mở.

### D024 - Thời điểm theo UTC, nhập/hiển thị thống nhất múi giờ Việt Nam

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q24, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O03/O12 và nội dung xuyên suốt O07/O08; TT-04, PDF tr.19; yêu cầu thời gian trong lịch/đăng ký/quy định/ủy quyền. Đây là chính sách thiết kế v2 được xác nhận rõ, không phải múi giờ được PDF quy định.
- **Quyết định:** Lưu và so sánh các thời điểm cụ thể theo UTC. Nhập và hiển thị thời gian thống nhất theo Asia/Ho_Chi_Minh trên toàn hệ thống, gồm lịch thi đấu, hạn đăng ký, hiệu lực quy định/ủy quyền và lịch sử hoạt động. Ghi nhãn múi giờ rõ ràng và không tự đổi theo múi giờ thiết bị người dùng.
- **Giá trị chỉ có ngày:** Giữ nguyên các ngày không kèm giờ, như ngày sinh và mốc ngày sinh U21, dưới dạng ngày lịch không chuyển múi giờ. Quyết định này không chọn giá trị ngày chốt hoặc hạn đăng ký cụ thể theo mùa.
- **Phương án/cơ sở:** Nhập/hiển thị giờ Việt Nam, giờ Europe/London hoặc theo thiết bị từng người dùng. Nhóm trưởng chọn một múi giờ Việt Nam để vận hành, demo và kiểm chứng tại Việt Nam thuận tiện, chấp nhận giờ hiển thị khác giờ địa phương tại sân ở Anh.
- **Bản ghi:** [ADR 0006](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md).
- **Phase chịu ảnh hưởng:** Xử lý thời gian chung PHASE 1; nhập/xử lý/xuất ngày giờ PHASE 2-PHASE 9; kiểm chứng tích hợp/biên PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Kiểu cột CSDL, định dạng API, độ chính xác thời gian, thư viện thời gian, cơ chế bắt đầu/hết hạn/phiên, khoảng thời gian lịch, ngày theo mùa cụ thể và quy tắc biên riêng từng nghiệp vụ. Biên khoảng ủy quyền tiếp tục theo D023; D024 không mở rộng quy tắc khoảng đó cho mọi khoảng nghiệp vụ khác.

### D025 - Thời hạn ủy quyền hữu hạn, không có trần số ngày cố định

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Nhóm trưởng xác nhận rõ phương án A của Q25: “Tôi xác nhận phương án A cho Q25.”.
- **Nguồn:** O07/O08; D013/D014/D020-D023. PDF không quy định trần ủy quyền 7 hoặc 30 ngày; đây là lựa chọn chính sách v2 đã xác nhận.
- **Quyết định:** Không đặt số ngày tối đa cố định cho mỗi ủy quyền trong phiên bản đầu. Mọi ủy quyền vẫn phải có thời điểm kết thúc xác định; không cho ủy quyền vô thời hạn. Người đề nghị nêu căn cứ và thời hạn, quản trị viên kiểm tra tính phù hợp trước khi cấp.
- **Phương án/cơ sở:** Không đặt trần cố định so với giới hạn 30 ngày mỗi lần cấp. Nhóm trưởng chọn chính sách thời hạn hữu hạn đơn giản hơn, hỗ trợ công việc ngắn hoặc dài mà không lặp quy trình ba người chỉ vì chạm một mốc thời lượng tùy chọn; thời hạn dài cần được kiểm tra phù hợp khi đề nghị/cấp.
- **Ranh giới:** Tiếp tục bắt buộc chấm dứt D020, thu hồi D021, xử lý phiên D022 và hết hạn/cấp mới D023. D026 chốt quan hệ với ngày mùa; điều kiện vòng đời mùa chi tiết vẫn còn mở.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#finite-periods-without-a-fixed-numerical-duration-cap).
- **Phase chịu ảnh hưởng:** Kiểm tra ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Điều kiện vòng đời mùa chi tiết, cơ chế ngăn chồng lấn theo D027, trạng thái yêu cầu, độ chính xác/triển khai thời gian, công việc chờ xử lý và hợp đồng đồng thời/đang chạy. D025 không chọn thêm công nghệ hoặc cơ chế cấu hình thời lượng.

### D026 - Thời hạn ủy quyền có thể nằm ngoài ngày bắt đầu/kết thúc mùa

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q26, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”.
- **Nguồn:** O07/O08; quản lý mùa UC05, PDF tr.77-78; đề xuất quy định UC06 tr.79-82 và sửa kết quả chính thức UC19 tr.118-121; D019/D023/D025.
- **Quyết định:** Khoảng ủy quyền có thể bắt đầu trước ngày bắt đầu mùa hoặc kéo dài sau ngày kết thúc mùa, phục vụ chuẩn bị và xử lý sau mùa hợp lệ. Vẫn chỉ áp dụng cho mùa đích và khoảng hiệu lực xác định. Ngày kết thúc mùa không tự cắt ngắn ủy quyền, và ủy quyền không tự gia hạn.
- **Ranh giới nghiệp vụ:** Chỉ được thực hiện thao tác khi vòng đời mùa và điều kiện nghiệp vụ của thao tác cho phép. Ủy quyền không vượt qua các điều kiện đó. Quy tắc chi tiết cho mùa đã tổng kết/lưu trữ vẫn cần xác nhận; D026 không tự chọn trạng thái mùa hoặc chính sách mở lại.
- **Phương án/cơ sở:** Thời hạn độc lập với ngày mùa nhưng chịu điều kiện nghiệp vụ/vòng đời so với bắt buộc toàn bộ khoảng ủy quyền nằm giữa ngày bắt đầu/kết thúc mùa. Nhóm trưởng chọn hỗ trợ chuẩn bị trước mùa và xử lý sau mùa, chấp nhận kiểm tra vòng đời/thao tác rõ ràng.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#delegation-periods-outside-season-dates).
- **Phase chịu ảnh hưởng:** Phân quyền PHASE 1, luồng mùa/quy định PHASE 2, thao tác được ủy quyền PHASE 4/PHASE 5 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Điều kiện vòng đời/lưu trữ/mở lại mùa, hệ quả thay đổi vòng đời đối với ủy quyền, cơ chế ngăn chồng lấn theo D027, trạng thái yêu cầu, độ chính xác/triển khai, công việc chờ xử lý và hợp đồng đồng thời/đang chạy.

### D027 - Cấm ủy quyền cùng người nhận, thao tác và mùa chồng lấn thời gian

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q27, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; D013/D020/D021/D023.
- **Quyết định:** Không cấp các khoảng ủy quyền chồng lấn cho cùng người nhận, thao tác và mùa, kể cả khi người đề nghị khác nhau. Kiểm tra với các ủy quyền đã cấp còn có thể có hiệu lực, gồm bản hẹn bắt đầu trong tương lai. Khác thao tác hoặc khác mùa không tự tạo xung đột chỉ vì thời gian trùng nhau.
- **Quy tắc biên:** Cho phép các khoảng nối tiếp theo D023, như 09:00-12:00 rồi 12:00-14:00. Ủy quyền đã thu hồi/chấm dứt không cản cấp mới cho thời gian sau khi chấm dứt, đồng thời giữ lịch sử. Phải ngăn cấp xung đột khi có yêu cầu đồng thời; cơ chế kỹ thuật vẫn còn mở.
- **Phương án/cơ sở:** Cấm chồng lấn so với cho phép nhiều nguồn cấp độc lập cùng thời gian. Nhóm trưởng chọn căn cứ quyền rõ và thu hồi/truy vết đơn giản hơn, chấp nhận việc thay thế khoảng trùng có thể cần đổi thời hạn đề nghị hoặc thu hồi bản trước.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#non-overlapping-grants-for-the-same-recipient-operation-and-season).
- **Phase chịu ảnh hưởng:** Kiểm tra ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng biên/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D028 chốt khóa bản trình và cấp đúng nội dung. Trạng thái/biểu diễn phiên bản cụ thể, phản hồi xung đột chi tiết, biểu diễn nhật ký/khoảng hiệu lực, cơ chế bảo đảm và hợp đồng chờ xử lý/đồng thời/đang chạy. D027 không chọn ràng buộc CSDL hoặc công nghệ khóa.

### D028 - Khóa phiên bản đề nghị đã gửi, cấp đúng nội dung đã trình

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q28, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; D014/D017/D023/D027.
- **Quyết định:** Người đề nghị được sửa bản nháp. Khi gửi, nội dung phiên bản đó được khóa. Quản trị viên kiểm tra rồi cấp đúng nội dung hoặc trả lại/từ chối kèm lý do. Quản trị viên không được đổi tham số trước khi cấp, kể cả thu hẹp thời hạn.
- **Chỉnh sửa và kiểm tra:** Sửa và trình lại tạo phiên bản trình mới, giữ lịch sử phiên bản trước. Trước khi cấp, kiểm tra lại quyền hiện hành, thời hạn, tách người và xung đột khoảng thời gian. Nếu bản trình chọn bắt đầu ngay khi cấp, server điền thời điểm ghi nhận cấp thành công theo D023; đây không phải quản trị viên thay đổi thời hạn.
- **Ủy quyền đã cấp:** Không sửa trực tiếp ủy quyền đã cấp. Muốn thay đổi phải thu hồi và thực hiện quy trình cấp mới, tuân thủ toàn bộ điều kiện đã chốt.
- **Phương án/cơ sở:** Khóa bản trình và trả lại/chỉnh sửa so với cho quản trị viên điều chỉnh thu hẹp quyền có lý do/lịch sử. Nhóm trưởng chọn nội dung đề nghị/cấp nhất quán và trách nhiệm rõ, chấp nhận thêm lượt trao đổi khi cần sửa.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#locked-submitted-versions-and-exact-content-granting).
- **Phase chịu ảnh hưởng:** Quản lý ủy quyền PHASE 1, luồng được ủy quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng lịch sử/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D029 chốt trạng thái/chuyển trạng thái nghiệp vụ và quy tắc hủy/trả lại/từ chối. Biểu diễn phiên bản, phản hồi xung đột, công việc chờ xử lý và thứ tự giao dịch đồng thời/đang chạy vẫn còn mở. D028 không chọn cách lưu trữ hoặc công nghệ khóa.

### D029 - Tách vòng đời đề nghị và ủy quyền đã cấp

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q29, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận bộ trạng thái và chuyển trạng thái đã đề xuất.
- **Nguồn:** O07/O08; D014/D020-D023/D028. Đây là trạng thái nghiệp vụ v2 đã xác nhận; chưa chọn cách triển khai CSDL/schema.
- **Quyết định:** Theo dõi riêng kết quả xử lý đề nghị và vòng đời hiện tại của ủy quyền đã cấp. Đề nghị xử lý cấp thành công vẫn là Đã cấp khi ủy quyền liên quan sau đó hết hạn hoặc bị thu hồi.

| Trạng thái đề nghị | Ý nghĩa |
|---|---|
| Nháp | Người đề nghị đang soạn nội dung được chỉnh sửa |
| Chờ xử lý | Phiên bản đã gửi được khóa, chờ quản trị viên xử lý |
| Trả lại | Quản trị viên yêu cầu sửa, có lý do |
| Từ chối | Quản trị viên quyết định không cấp, có lý do |
| Đã hủy | Người đề nghị rút trước khi cấp |
| Đã cấp | Kiểm tra và ghi nhận cấp thành công |

| Trạng thái ủy quyền đã cấp | Ý nghĩa |
|---|---|
| Chờ hiệu lực | Đã cấp, chưa tới thời điểm bắt đầu |
| Có hiệu lực | Trong khoảng hiệu lực và đáp ứng điều kiện bắt buộc |
| Hết hạn | Đã tới thời điểm kết thúc |
| Đã thu hồi | Quản trị viên chủ động thu hồi |
| Chấm dứt do mất điều kiện | Kết thúc theo D020 |

- **Chuyển trạng thái đề nghị:** Nháp -> Chờ xử lý khi gửi. Chờ xử lý -> Trả lại / Từ chối / Đã cấp do quản trị viên xử lý. Trả lại -> Chờ xử lý khi người đề nghị sửa và gửi phiên bản mới. Người đề nghị được hủy từ Nháp, Chờ xử lý hoặc Trả lại. Từ chối, Đã hủy và Đã cấp kết thúc đề nghị đó; muốn đề nghị khác phải tạo mới.
- **Chuyển trạng thái ủy quyền:** Cấp thành công bắt đầu ở Chờ hiệu lực hoặc Có hiệu lực theo mốc bắt đầu. Chờ hiệu lực chuyển Có hiệu lực khi tới mốc và đủ điều kiện. Hết hạn, Đã thu hồi và Chấm dứt do mất điều kiện là kết thúc, không quay lại Có hiệu lực. Quy tắc thời gian/chấm dứt/thu hồi đã chốt xác định các chuyển trạng thái áp dụng.
- **Kiểm tra cấp không đạt:** Không tạo ủy quyền hoặc đánh dấu đề nghị Đã cấp. Giữ Chờ xử lý và báo lỗi; quản trị viên có thể tiếp tục trả lại hoặc từ chối.
- **Phương án/cơ sở:** Hai vòng đời so với một vòng đời chung. Nhóm trưởng chọn phân biệt rõ xử lý đề nghị thành công và quyền được cấp có đang dùng được hay không.
- **Bản ghi:** [ADR 0005](../../../docs/adr/0005-action-scoped-business-delegation.md#separate-proposal-and-granted-delegation-lifecycles).
- **Phase chịu ảnh hưởng:** Luồng ủy quyền PHASE 1, thao tác được phân quyền PHASE 2/PHASE 4/PHASE 5 và kiểm chứng chuyển trạng thái/lịch sử PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Cách lưu/mã trạng thái, thiết kế phiên bản/schema, hợp đồng UI/API, triển khai nhật ký/chuyển trạng thái, thứ tự khi có nhiều nguyên nhân kết thúc cùng lúc, công việc nghiệp vụ chờ xử lý và cơ chế bảo đảm đồng thời/đang chạy. Quyết định này áp dụng cho đề nghị cấp; thu hồi trực tiếp D021 không cần đề nghị ba người mới.

### D030 - Kiểm tra lại phiên và quyền hiện hành tại điểm quyết định cuối của thao tác ghi

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Nhóm trưởng xác nhận rõ phương án A của Q30: “Tôi xác nhận phương án A.”.
- **Nguồn:** O07/O08/O12; BM-01/BM-02 và CN-02, PDF tr.23/26; AT-02/AT-03, tr.32; D007/D020-D023.
- **Quyết định:** Với thao tác ghi nội bộ, kiểm tra quyền khi nhận yêu cầu và kiểm tra lại phiên, quyền hiện hành, thời hạn tại điểm quyết định cuối bên trong giao dịch trước khi ghi nhận thay đổi thành công. Có quyền hợp lệ khi bắt đầu chưa đủ nếu phiên/quyền không còn hợp lệ tại điểm cuối đó.
- **Thất bại và nhất quán:** Nếu kiểm tra cuối không đạt, từ chối và hủy giao dịch nghiệp vụ đó, không để dữ liệu, thống kê hoặc trạng thái nghiệp vụ dở dang. Thu hồi quyền và ghi dữ liệu đồng thời phải có thứ tự nhất quán, để kiểm tra quyền cũ không ghi vượt qua thu hồi đã có hiệu lực. Thao tác đã hoàn tất hợp lệ trước đó được giữ nguyên; thu hồi không hủy ngược.
- **Ví dụ biên:** Yêu cầu nhận lúc 11:59:59 dùng quyền hết hạn lúc 12:00 phải bị từ chối nếu kiểm tra quyền cuối xảy ra lúc 12:00:01. Biên khoảng thời gian theo D023.
- **Phương án/cơ sở:** Kiểm tra lại cuối giao dịch so với chỉ xét quyền khi nhận yêu cầu. Nhóm trưởng chọn quyền hiện hành tại điểm quyết định cuối, chấp nhận phối hợp phân quyền, giao dịch và thay đổi quyền đồng thời.
- **Bản ghi:** [ADR 0007](../../../docs/adr/0007-final-authorization-check-for-writes.md).
- **Phase chịu ảnh hưởng:** Nền tảng phiên/phân quyền chung PHASE 1, thao tác ghi nội bộ PHASE 2-PHASE 9 và kiểm chứng lỗi/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Điểm bảo đảm/sắp thứ tự cụ thể, cơ chế giao dịch/isolation/khóa, cách đọc thời gian/quyền có thẩm quyền, hợp đồng lỗi, thử lại và xử lý công việc chờ. D030 chốt chính sách hành vi, không chọn mức isolation, loại khóa hoặc công nghệ triển khai khác.

### D031 - Mỗi người một tài khoản nội bộ cá nhân

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q31, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”.
- **Nguồn:** O08/O12; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; D004/D005/D017.
- **Quyết định:** Mỗi người có một tài khoản nội bộ cá nhân trên toàn hệ thống; không dùng chung tài khoản/thông tin đăng nhập. Kiêm nhiệm hoặc đổi trách nhiệm được xử lý bằng phân công vai trò trên tài khoản đó, không tạo tài khoản riêng cho cùng người.
- **Danh tính và tách người:** Quản trị viên đối chiếu danh tính khi tạo tài khoản và ngăn tạo thêm cho người đã có. Kiểm tra tách người dựa trên tài khoản cá nhân gắn với người đó theo chính sách một-một này. Trường định danh và cách phát hiện trùng vẫn cần thiết kế; chỉ tên đăng nhập duy nhất chưa đủ chứng minh người duy nhất.
- **Phương án/cơ sở:** Một tài khoản cá nhân mỗi người so với nhiều tài khoản liên kết tới định danh người riêng. Nhóm trưởng chọn trách nhiệm và kiểm tra tách người đơn giản hơn, nhất quán với hỗ trợ nhiều vai trò, chấp nhận đối chiếu danh tính/trùng khi cấp tài khoản.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#one-personal-internal-account-per-person); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Quản trị tài khoản/vai trò PHASE 1, thao tác nội bộ có truy vết người thực hiện PHASE 2-PHASE 9 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Trường định danh bắt buộc, phát hiện trùng, lưu trữ/ràng buộc và quy tắc vòng đời tài khoản/mật khẩu. D031 không chọn phân hệ nhân sự riêng, nhà cung cấp danh tính hoặc thu thập giấy tờ định danh nhà nước.

### D032 - Phạm vi công khai gồm ngày sinh cầu thủ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q32, Nhóm trưởng chọn phương án A và bổ sung rõ ngày sinh cầu thủ là thông tin được công khai.
- **Nguồn:** O04; BM4.1-BM4.4, PDF tr.8-9; QĐ4.1-QĐ4.6, tr.9; BM-05 và §1.2.5.3, tr.21/23; UC15/UC21/UC23/UC25.
- **Quyết định:** Công khai thông tin tra cứu theo mùa trong bảng dưới, gồm đầy đủ ngày sinh của cầu thủ. Giữ các giới hạn khác của phương án A đã đề xuất. Ngoại lệ ngày sinh áp dụng cho cầu thủ thuộc phạm vi tra cứu mùa công khai, không mở truy cập mọi hồ sơ cầu thủ/đăng ký.

| Nhóm | Thông tin công khai |
|---|---|
| Mùa giải | Tên giải/mùa, số CLB, số vòng, tổng số trận, ngày bắt đầu/kết thúc |
| CLB tham gia mùa | Tên, tên viết tắt, huấn luyện viên, sân nhà, số cầu thủ đăng ký hợp lệ |
| Cầu thủ trong mùa | Họ tên, ngày sinh, quốc tịch, vị trí, CLB, số áo, diện đăng ký |
| Lịch/kết quả | Lịch đã công bố: vòng, hai CLB, ngày/giờ và sân; tỷ số chỉ sau xác nhận chính thức |
| Thống kê | BXH, danh sách ghi bàn và thống kê giữ sạch lưới từ kết quả chính thức |
| Tin tức | Nội dung đã công bố; trường chi tiết còn chốt tại O15 |

- **Ranh giới nội bộ:** Thông tin đại diện CLB, liên hệ, bằng chứng đào tạo/homegrown, nội dung hồ sơ/xét duyệt, bản nháp, kết quả chưa xác nhận, lý do thay đổi và nhật ký hệ thống giữ nội bộ theo quyền phù hợp. Trường chưa được duyệt công khai giữ nội bộ. Ngày sinh cầu thủ là ngoại lệ rõ đối với danh sách nội bộ đề xuất ban đầu ở Q32 A.
- **Thay đổi mặc định theo nguồn:** BM-05 v1 ghi ngày sinh cần quyền phù hợp. Nhóm trưởng thay đổi rõ mặc định đó cho ngày sinh cầu thủ trong v2. Giữ nguyên bản chép nguồn và phê duyệt v1; Specification/nghiệm thu sau này phải truy vết ngoại lệ đã duyệt, không khẳng định công khai ngày sinh vốn là mặc định v1. Quyết định này không công khai liên hệ hoặc dữ liệu nội bộ khác.
- **Phạm vi cung cấp:** Backend phải áp dụng thống nhất phạm vi công khai cho dữ liệu UI/API công khai và tệp phục vụ công khai nếu có. Quyết định này không tự cho phép tạo chức năng xuất tệp công khai. Phạm vi xem/xuất nội bộ vẫn cần thiết kế.
- **Phương án/cơ sở:** Q32 A giữ đại diện và ngày sinh nội bộ; B công khai thêm tên đại diện. Nhóm trưởng chọn A đã điều chỉnh, công khai ngày sinh cầu thủ và vẫn giữ thông tin đại diện nội bộ. Không phê duyệt ngoại lệ nào khác.
- **Bản ghi:** [ADR 0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md).
- **Phase chịu ảnh hưởng:** Ranh giới truy cập dữ liệu PHASE 1, hồ sơ/đăng ký PHASE 3, tra cứu công khai PHASE 6, phạm vi tệp PHASE 7/PHASE 9, xuất bản PHASE 8 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D033 chốt nhóm dữ liệu xem nội bộ theo trách nhiệm. Schema API/xuất tệp theo trường, nội dung nhật ký, trường tin tức chi tiết, mặc định xuất bản và chi tiết điều kiện tra cứu công khai vẫn còn mở. O04 mới chốt một phần.

### D033 - Xem dữ liệu nội bộ theo trách nhiệm nghiệp vụ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q33, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, gồm ma trận và các giới hạn đi kèm.
- **Nguồn:** O04/O08; BM-02/BM-05/BM-06, PDF tr.23-24; UC03/UC04, các UC đăng ký/lịch/kết quả; D003/D004/D019/D032.
- **Quyết định:** Đăng nhập và được phân công trong mùa không tự cho phép xem mọi thông tin nội bộ. Áp dụng phạm vi xem theo trách nhiệm sau.

| Nhóm dữ liệu nội bộ | Vai trò được xem trong mùa phụ trách |
|---|---|
| Hồ sơ tham gia CLB, đại diện và liên hệ | Ban tổ chức / Người quản lý mùa giải; Nhân viên đăng ký |
| Hồ sơ đăng ký cầu thủ và bằng chứng homegrown | Ban tổ chức / Người quản lý mùa giải; Nhân viên đăng ký |
| Lịch nháp và đề nghị điều chỉnh chưa duyệt | Ban tổ chức / Người quản lý mùa giải; Nhân viên lịch thi đấu |
| Biên bản, kết quả chưa chính thức và đề xuất sửa kết quả | Ban tổ chức / Người quản lý mùa giải; Nhân viên kết quả |
| Đề xuất thay đổi quy định | Ban tổ chức / Người quản lý mùa giải; nhân viên có ủy quyền tương ứng theo D019 |
| Quản trị tài khoản và tra cứu nhật ký toàn hệ thống | Quản trị viên hệ thống theo UC03/UC04 |

- **Nhiều vai trò và ủy quyền:** Người kiêm vai trò được xem theo các vai trò thực sự được phân công trong mùa. Ủy quyền chỉ bổ sung dữ liệu cần cho thao tác. Chức năng cần kiểm tra đủ điều kiện có thể nhận kết quả và lý do cần thiết, không mặc nhiên nhận toàn bộ hồ sơ nguồn.
- **Quản trị và lịch sử:** Quản trị viên hệ thống không tự có quyền xem mọi màn hình hồ sơ nghiệp vụ; làm nghiệp vụ cần vai trò tương ứng. Lịch sử gắn đối tượng được xem trong phạm vi quyền của đối tượng; tra cứu nhật ký toàn hệ thống vẫn theo UC04. Trường nhật ký và quyền xuất tệp cụ thể còn mở, nên UC04 không ngầm cấp mọi màn hình nghiệp vụ hoặc nội dung nhật ký không giới hạn.
- **Phương án/cơ sở:** Xem theo trách nhiệm so với mọi vai trò nghiệp vụ đều xem toàn bộ nội bộ trong mùa, còn sửa/duyệt tách riêng. Nhóm trưởng chọn phạm vi dữ liệu đi cùng trách nhiệm và kiểm tra UI/API ở server.
- **Bản ghi:** [ADR 0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#responsibility-based-internal-viewing).
- **Phase chịu ảnh hưởng:** Phân quyền/truy cập nhật ký PHASE 1, hồ sơ nghiệp vụ PHASE 2-PHASE 5, tra cứu PHASE 6, xuất nội bộ PHASE 7-PHASE 9 và kiểm chứng truy cập PHASE 10. Không đổi trạng thái Phase.
- **Cập nhật tiếp theo:** D034 chốt cấp riêng quyền quản lý hồ sơ gốc dùng chung. Schema trường/API/xuất tệp chi tiết, lọc nội dung nhật ký/lịch sử và ma trận thao tác đọc/ghi còn lại vẫn mở. Ngày sinh cầu thủ công khai theo D032 vẫn công khai.

### D034 - Cấp riêng quyền quản lý hồ sơ gốc dùng chung

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q34, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O04/O08/O12; UC03 tr.72-74, UC07 tr.82-84, UC09 tr.88-90 và UC12 tr.97-99; hồ sơ dùng chung tại PDF §1.3.4.1 tr.37-38; D003/D006/D033.
- **Quyết định:** Phân biệt quyền quản lý dùng chung cho hồ sơ gốc CLB, sân và cầu thủ. Quản trị viên hệ thống cấp/thu hồi riêng qua UC03 cho nhân sự đảm nhiệm trách nhiệm nghiệp vụ tương ứng; chỉ có vai trò theo mùa không tự có quyền quản lý hồ sơ dùng chung.

| Nhóm hồ sơ dùng chung | Trách nhiệm nghiệp vụ tương ứng |
|---|---|
| Hồ sơ gốc CLB - UC07 | Ban tổ chức / Người quản lý mùa giải |
| Hồ sơ gốc sân - UC12 | Nhân viên lịch thi đấu |
| Hồ sơ gốc cầu thủ - UC09 | Nhân viên đăng ký |

- **Phạm vi:** Các quyền này áp dụng cho hồ sơ gốc dùng chung, không mở quyền xử lý hồ sơ tham gia hoặc hồ sơ nội bộ của các mùa khác. Đây là phần cụ thể hóa phạm vi dữ liệu dùng chung còn mở tại D003, bên cạnh phân quyền nghiệp vụ theo mùa. Giữ tác nhân/UC hiện có; không thêm tác nhân mới.
- **Phương án/cơ sở:** Cấp riêng quyền dùng chung so với tự suy ra từ vai trò tương ứng trong bất kỳ mùa nào. Nhóm trưởng chọn ranh giới phân công dữ liệu dùng chung rõ ràng, chấp nhận thêm cấu hình quyền.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#separately-assigned-shared-master-management-permissions).
- **Phase chịu ảnh hưởng:** UC03/phân quyền PHASE 1, CLB/sân PHASE 2, hồ sơ cầu thủ PHASE 3 và kiểm chứng truy cập/lịch sử PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Biểu diễn quyền và vòng đời vai trò đủ điều kiện, quy tắc tự cấp/thay đổi phiên đối với quyền dùng chung này, truy cập theo trường, chi tiết bản chụp theo D035 và ràng buộc ghi chi tiết. D034 không phê duyệt xóa phá vỡ dữ liệu hoặc thao tác mới ngoài UC và quy tắc toàn vẹn áp dụng.

### D035 - Định danh gốc ổn định và bản chụp chọn lọc thông tin nghiệp vụ chính thức

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q35, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O12; AT-04, PDF tr.32; TH-05/TH-06, tr.13-14; phân biệt đối tượng gốc/theo mùa tại §1.3.4.1 tr.37-38; D034.
- **Quyết định:** Giữ định danh ổn định cho CLB, sân và cầu thủ xuyên mùa. Tại mốc ghi nhận nghiệp vụ chính thức, lưu bản chụp chọn lọc những thông tin cần để tái hiện hồ sơ/báo cáo lịch sử tương ứng. Cập nhật hồ sơ gốc không tự ghi đè thông tin lịch sử đã ghi nhận chính thức.
- **Hiệu chỉnh chính thức:** Thay đổi dữ liệu nghiệp vụ chính thức thực hiện qua quy trình có thẩm quyền tương ứng, kèm lý do và lịch sử. Không chụp mọi trường một cách đại trà; trường và mốc chụp cụ thể vẫn cần thiết kế.
- **Phương án/cơ sở:** Định danh gốc ổn định kết hợp bản chụp nghiệp vụ chọn lọc so với phiên bản hóa mọi thay đổi hồ sơ gốc và tham chiếu phiên bản tương ứng. Nhóm trưởng chọn tái hiện bối cảnh lịch sử chính thức đơn giản hơn, chấp nhận lặp dữ liệu chọn lọc và cần định nghĩa trường/mốc chụp.
- **Ví dụ ranh giới:** CLB đổi tên ở mùa sau không được âm thầm thay tên đã dùng chính thức trong báo cáo mùa trước, đồng thời vẫn nhận diện cùng một CLB. D036 bên dưới chốt chính sách sửa sai chung cho thông tin gốc từng bị nhập sai, gồm sai ngày sinh.
- **Bản ghi:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md).
- **Phase chịu ảnh hưởng:** Hồ sơ gốc CLB/sân PHASE 2, cầu thủ/đăng ký PHASE 3, lịch PHASE 4, kết quả chính thức PHASE 5, tra cứu/báo cáo lịch sử PHASE 6/PHASE 7 và kiểm chứng toàn vẹn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Bộ trường/mốc/schema bản chụp, luồng tác động/rà soát chi tiết theo D036, quan hệ với phiên bản quy định và tạo lại báo cáo, cách hiển thị/API và cơ chế nhất quán/đồng thời. Chưa chọn kiểu định danh, cấu trúc lưu trữ hoặc công nghệ phiên bản hóa thời gian toàn bộ.

### D036 - Sửa dữ liệu gốc bị sai và rà soát riêng nghiệp vụ bị ảnh hưởng

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Nhóm trưởng chốt rõ phương án A của Q36 trước khi yêu cầu nghỉ và đưa Live Match Tracking / Live Score vào danh sách phỏng vấn sau.
- **Nguồn:** O09/O12; UC07 tr.82-84, UC09 tr.88-90 và UC12 tr.97-99; QĐ4.5, PDF tr.9; TH-06 và AT-03/AT-04, tr.14/32; D034/D035.
- **Quyết định:** Người có quyền quản lý hồ sơ gốc được sửa thông tin bị nhập sai, kèm lý do và căn cứ. Giữ giá trị trước/sau, người sửa, thời điểm và xác định hồ sơ/nghiệp vụ liên quan cần rà soát. Không yêu cầu phê duyệt toàn bộ phương án hiệu chỉnh phía sau trước khi sửa hồ sơ gốc.
- **Ranh giới lịch sử:** Giữ bản chụp và quyết định chính thức trước đó cho tới khi được hiệu chỉnh qua quy trình nghiệp vụ có thẩm quyền tương ứng. Sửa hồ sơ gốc không tự hủy đăng ký, sửa kết quả chính thức hoặc thay đổi thống kê.
- **Nghiệp vụ mới:** Kiểm tra lại điều kiện bị ảnh hưởng bằng thông tin đã sửa khi xử lý nghiệp vụ mới; không dựa vào kết quả kiểm tra đã lỗi thời. Ví dụ, sửa ngày sinh có thể đòi hỏi rà soát đăng ký U21 trước đó, không tự viết lại quyết định lịch sử chính thức.
- **Phương án/cơ sở:** Sửa gốc có truy vết rồi rà soát riêng nghiệp vụ liên quan so với chặn sửa có tác động cho tới khi duyệt phương án hiệu chỉnh. Nhóm trưởng chọn sửa kịp thông tin hiện tại và giữ lịch sử chính thức, chấp nhận giai đoạn hồ sơ liên quan chờ rà soát.
- **Bản ghi:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#correction-of-erroneous-master-data-and-separate-impact-review).
- **Phase chịu ảnh hưởng:** Hồ sơ gốc/quy định PHASE 2, hồ sơ/đăng ký PHASE 3, lịch PHASE 4, kết quả chính thức PHASE 5, tra cứu/báo cáo PHASE 6/PHASE 7 và kiểm chứng tích hợp/toàn vẹn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Ánh xạ trường/hồ sơ bị ảnh hưởng, định dạng căn cứ, người phụ trách/trạng thái rà soát, xử lý đăng ký không còn đủ điều kiện, quy tắc hiệu chỉnh lịch sử/hiển thị công khai, chi tiết bản chụp và hợp đồng giao dịch/đồng thời. Chưa chọn cơ chế tải tệp, xử lý kỷ luật tự động hoặc mã trạng thái luồng mới.

## Cải tiến v2 chờ quyết định

Xem [danh sách quyết định chờ xử lý](pending-decisions.md). V2-EXT-01 ghi nhận cải tiến Live Match Tracking / Live Score do Nhóm trưởng yêu cầu và ranh giới dữ liệu tham khảo đã chỉ định. Hoãn phỏng vấn thiết kế tới khi xong các nhóm quyết định nền tảng hiện tại, và phải chủ động đưa ra trước tổng kết/đề xuất phê duyệt gói v2. Đây không phải D037, không phải Oxx đã giải quyết và chưa phải thiết kế triển khai được duyệt.

## Độ bao phủ quyết định

Cả 16 vấn đề nguồn vẫn **OPEN** cho đến khi các quyết định thành phần được xác nhận. O12 được chốt một phần qua D001, D002, D007, D011, D022, D024, D030, D031 và D034-D036. O03 được chốt một phần qua chính sách múi giờ D024; khoảng thời gian trận/sân và quy tắc biên vẫn còn mở. O04 được chốt một phần qua D032-D034, gồm ngoại lệ rõ cho ngày sinh cầu thủ và xem nội bộ theo trách nhiệm; phạm vi trường/tệp/nhật ký chi tiết vẫn còn mở. O08 được chốt một phần qua D003-D023, D025-D031 và D033-D034. O07 được chốt một phần qua quy tắc tách người duyệt quy định tại D005 và mô hình/trách nhiệm/giới hạn thẩm quyền/ma trận người nhận/chính sách chấm dứt/thu hồi/phiên/thời gian ủy quyền D013-D023 và D025-D030; hiệu lực quy định và chính sách thay đổi trong mùa vẫn còn mở. O09 được chốt một phần qua chính sách sửa sai chung D036; trường bắt buộc, định danh và quy tắc hiệu chỉnh chi tiết vẫn mở. Chưa vấn đề nào RESOLVED. O01-O02, O05-O06, O10-O11 và O13-O16 chưa có nội dung giải quyết được xác nhận trong v2. Yêu cầu Live Score mới được ghi chờ riêng tại V2-EXT-01, không tính là giải quyết vấn đề v1. [Sổ v1](../open-decisions.md) được giữ làm mốc nguồn; phần bổ sung này ghi các xác nhận phát sinh sau đó.

## Thứ tự phỏng vấn

1. Kiến trúc, ràng buộc công nghệ, stack/CSDL và môi trường nền - O12, một phần O13.
2. Thẩm quyền, phạm vi, vòng đời, khả năng xem dữ liệu và hiệu lực quy định - O08, O04, O07.
3. Đăng ký theo mùa, bằng chứng, thời hạn, định danh và trường bắt buộc - O01, O02, các quyết định O09 tương ứng.
4. Tự động hóa lịch, bản nháp, cấu hình hỗ trợ, khoảng thời gian và xung đột - O03, O10.
5. Biên bản/sự kiện, xác nhận và sửa kết quả - các quyết định O09 và O08 còn lại.
6. Xếp hạng, kết thúc mùa, thống kê thủ môn và giải thưởng - O05, O06.
7. Xuất bản tin tức và trao đổi tệp - O15, O11.
8. Hoàn thiện thiết kế Chương 3: ERD/từ điển dữ liệu, ràng buộc CSDL, giao dịch, API, phiên, giao diện và luồng xử lý - hoàn tất O12; đối chiếu O16 xuyên suốt.
9. Triển khai, backup/restore, lưu giữ dữ liệu và phương pháp đo - hoàn tất O13, O14.
10. Phỏng vấn Live Match Tracking / Live Score được hoãn - V2-EXT-01, sau các nhóm nền tảng phía trên và trước tổng kết/phê duyệt gói.
11. Rà soát nhất quán liên tài liệu, tổng kết và phê duyệt rõ toàn bộ gói.

Hỏi nhánh phụ thuộc sau khi các quyết định tiên quyết đã được xác nhận. Ghi từng xác nhận kèm nguồn, phương án, cơ sở, người/ngày duyệt và tài liệu/Phase chịu ảnh hưởng. Chỉ giải quyết một Oxx khi đã bao phủ toàn bộ phạm vi của nó. Glossary nghiệp vụ dùng cho thuật ngữ miền; thuật ngữ triển khai kiến trúc thuộc tài liệu thiết kế. Phê duyệt toàn bộ gói cần xác nhận riêng của Nhóm trưởng sau phỏng vấn và rà soát tính nhất quán.

Công việc này giới hạn ở tài liệu Context/thiết kế. Cuộc phỏng vấn không cho phép tạo code, feature Specifications, Plans, Tasks, Issues, commit hoặc push.

## Mốc tiếp tục

Q1-Q36 đã được xác nhận thành D001-D036; toàn bộ gói vẫn DRAFT. Nhóm trưởng yêu cầu nghỉ trước Q37. Tiếp tục phỏng vấn nền tảng hiện tại từ Q37, mỗi lượt một câu chi tiết, xác định lại điều kiện tiên quyết từ các quyết định chưa chốt. Không bắt đầu V2-EXT-01 ở Q37 chỉ vì vừa được đưa vào danh sách; phỏng vấn nhóm này sau các nhóm nền tảng và trước tổng kết/phê duyệt. Chưa ghi câu hỏi hoặc câu trả lời Q37. Chỉ được yêu cầu đề xuất commit message; chưa cho phép commit/push.
