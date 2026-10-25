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
- **Còn mở:** Biểu diễn quyền, vòng đời vai trò đủ điều kiện được chốt tại D038 bên dưới, quy tắc thay đổi phiên đối với quyền dùng chung này (D037 chốt việc tự cấp), truy cập theo trường, chi tiết bản chụp theo D035 và ràng buộc ghi chi tiết. D034 không phê duyệt xóa phá vỡ dữ liệu hoặc thao tác mới ngoài UC và quy tắc toàn vẹn áp dụng.

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

### D037 - Cấm Quản trị viên tự cấp quyền quản lý hồ sơ gốc dùng chung

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q37, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08/O12; UC03 và D010/D034. Mở rộng nguyên tắc cấm tự cấp đã chốt sang quyền quản lý hồ sơ gốc dùng chung được cấp riêng.
- **Quyết định:** Quản trị viên hệ thống không được tự cấp hoặc mở rộng quyền quản lý hồ sơ gốc CLB, sân hoặc cầu thủ cho chính mình. Quản trị viên khác phải thực hiện việc cấp qua UC03. Có vai trò nghiệp vụ tương ứng không cho phép tự cấp quyền.
- **Ranh giới quản trị:** Quản trị viên duy nhất vẫn được cấp các quyền này cho nhân sự khác đủ điều kiện. Muốn nhận thêm quyền quản lý dùng chung cho chính mình cần Quản trị viên thứ hai. Kiểm tra hạn chế tại backend và lưu lịch sử cấp quyền.
- **Phương án/cơ sở:** Cấm tự cấp so với cho phép tự cấp khi Quản trị viên có trách nhiệm nghiệp vụ tương ứng, kèm nhật ký. Nhóm trưởng chọn nhất quán với D010 và tách người cấp khỏi người nhận, chấp nhận phối hợp với Quản trị viên khác.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-granting-of-shared-master-management-permissions).
- **Phase chịu ảnh hưởng:** Quản trị tài khoản/quyền PHASE 1, hồ sơ gốc CLB/sân PHASE 2, hồ sơ gốc cầu thủ PHASE 3 và kiểm chứng phân quyền PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Biểu diễn quyền cụ thể; D040 bên dưới chốt tự giảm/thu hồi quyền. D038 bên dưới chốt vòng đời vai trò đủ điều kiện; D039 chốt xử lý thay đổi phiên. D037 không chốt các nội dung này hoặc thêm luồng phê duyệt cấp quyền riêng.

### D038 - Chấm dứt quyền quản lý hồ sơ gốc dùng chung khi mất phân công vai trò tương ứng cuối cùng

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q38, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08/O12; UC03 và D034/D037.
- **Quyết định:** Quyền quản lý hồ sơ gốc CLB yêu cầu phân công vai trò Người quản lý mùa giải ở ít nhất một mùa; quản lý sân yêu cầu vai trò Nhân viên lịch thi đấu ở ít nhất một mùa; quản lý cầu thủ yêu cầu vai trò Nhân viên đăng ký ở ít nhất một mùa. Vai trò tương ứng tiếp tục là điều kiện sau khi quyền dùng chung được cấp riêng.
- **Chấm dứt và cấp lại:** Thu hồi phân công vai trò tương ứng cuối cùng của người đó làm chấm dứt quyền quản lý dùng chung liên quan và lưu lịch sử. Phân công lại vai trò tương ứng không khôi phục quyền này; cần cấp riêng lần mới theo D034/D037. Còn phân công tương ứng ở mùa khác thì không chấm dứt theo điều kiện này.
- **Ranh giới:** Mất vai trò là bị thu hồi phân công, không chỉ là mùa đã đến ngày kết thúc. Chính sách đóng/lưu trữ mùa vẫn chưa chốt. Quyết định này không mở quyền truy cập hồ sơ nội bộ của các mùa khác.
- **Phương án/cơ sở:** Tiếp tục phụ thuộc vai trò so với chỉ kiểm tra vai trò lúc cấp rồi giữ quyền tới khi thu hồi riêng. Nhóm trưởng chọn quyền đi cùng trách nhiệm và tránh sót quyền, chấp nhận phối hợp thứ tự điều chuyển và có thể cần cấp lại.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#shared-master-management-permission-depends-on-a-corresponding-role).
- **Phase chịu ảnh hưởng:** Vòng đời vai trò/quyền PHASE 1, hồ sơ gốc CLB/sân PHASE 2, hồ sơ gốc cầu thủ PHASE 3 và kiểm chứng phân quyền PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Xử lý thay đổi phiên được chốt tại D039. Tự giảm/thu hồi quyền được chốt tại D040. Tác động của khóa tài khoản được chốt tại D041. Quy tắc đóng/lưu trữ mùa và cơ chế nhất quán/đồng thời kỹ thuật. Chưa chọn cấu trúc lưu quyền hoặc cơ chế lập lịch tự động.

### D039 - Vô hiệu hóa phiên khi thay đổi quyền quản lý hồ sơ gốc dùng chung

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q39, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08/O12; UC03 và D007/D022/D030/D034/D038.
- **Quyết định:** Cấp thêm, mở rộng, thu hồi hoặc chấm dứt thành công quyền quản lý hồ sơ gốc dùng chung làm vô hiệu hóa toàn bộ phiên hiện có của người nhận bị ảnh hưởng, gồm chấm dứt theo D038. Yêu cầu nội bộ tiếp theo dùng phiên cũ bị từ chối; người dùng phải đăng nhập lại với quyền hiện tại.
- **Thông báo:** Hiển thị thông báo D007: “Phiên đăng nhập không còn hiệu lực do tài khoản hoặc quyền truy cập đã thay đổi. Vui lòng đăng nhập lại.” Không yêu cầu hạ tầng thông báo thời gian thực.
- **Thao tác ghi đang xử lý:** D030 vẫn yêu cầu kiểm tra lại quyền/phiên tại điểm quyết định cuối trong giao dịch nghiệp vụ. Thay đổi quyền/phiên và thao tác ghi đồng thời phải có thứ tự nhất quán; không hoàn tác thao tác đã hoàn tất hợp lệ trước đó.
- **Phương án/cơ sở:** Vô hiệu hóa toàn bộ phiên người nhận so với giữ phiên và kiểm tra quyền hiện tại trên từng yêu cầu, kèm cập nhật giao diện. Nhóm trưởng chọn nhất quán với D007/D022 và ranh giới thay đổi quyền rõ cho người dùng, chấp nhận gián đoạn đăng nhập cả khi cấp thêm.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#session-invalidation-for-shared-master-management-permissions).
- **Phase chịu ảnh hưởng:** Phân quyền/phiên PHASE 1, hồ sơ gốc CLB/sân PHASE 2, hồ sơ gốc cầu thủ PHASE 3 và kiểm chứng truy cập/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Công nghệ/lưu trữ phiên, hợp đồng lỗi, dữ liệu nhập chưa lưu và cơ chế thực thi/đồng thời kỹ thuật. D040 chốt tự giảm/thu hồi quyền. Chưa chọn công nghệ hỗ trợ mới.

### D040 - Cho phép Quản trị viên tự giảm quyền nghiệp vụ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q40, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08/O12; UC03 và D007/D009/D010/D037-D039.
- **Quyết định:** Qua UC03, Quản trị viên hệ thống được tự bỏ vai trò nghiệp vụ theo mùa, thu hẹp phạm vi mùa hoặc thu hồi quyền quản lý hồ sơ gốc dùng chung của chính mình. Thao tác chỉ được giảm quyền, không kèm cấp mới hoặc mở rộng quyền cho bản thân.
- **Hệ quả:** Lưu lịch sử thay đổi. Mất phân công vai trò tương ứng cuối cùng thì chấm dứt quyền dùng chung liên quan theo D038. Áp dụng vô hiệu hóa phiên theo D007/D039 và kiểm tra quyền cuối theo D030. Cấp lại sau đó cần Quản trị viên khác theo D010/D037. Giữ lịch sử và trách nhiệm đối với thao tác trước đó.
- **Ranh giới quản trị:** D009 vẫn cấm tự khóa tài khoản và tự thu hồi vai trò Quản trị viên hệ thống. D040 chỉ cho phép giảm quyền nghiệp vụ.
- **Phương án/cơ sở:** Cho phép tự giảm so với yêu cầu Quản trị viên khác thực hiện mọi thay đổi quyền nghiệp vụ của bản thân. Nhóm trưởng chọn bỏ kịp quyền không cần và phối hợp nhân sự đơn giản hơn, chấp nhận có thể bỏ nhầm quyền đang cần và phụ thuộc Quản trị viên khác để cấp lại.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#administrator-self-reduction-of-business-permissions).
- **Phase chịu ảnh hưởng:** UC03/phân quyền PHASE 1, truy cập nghiệp vụ PHASE 2-PHASE 9 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Hợp đồng giao diện/lỗi chi tiết, bàn giao việc đang chờ và cơ chế nhất quán/đồng thời kỹ thuật. D041 chốt tác động của khóa tài khoản tới quyền dùng chung. Chưa chọn công nghệ mới hoặc luồng bàn giao tự động.

### D041 - Giữ phân công quyền quản lý hồ sơ gốc dùng chung khi tài khoản bị khóa

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q41, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O08/O12; UC03 và D007/D020/D034/D038-D040.
- **Quyết định:** Khóa tài khoản ngăn đăng nhập và mọi việc sử dụng quyền, đồng thời vô hiệu hóa toàn bộ phiên theo D007. Chỉ riêng việc khóa không xóa phân công vai trò hoặc chấm dứt quyền quản lý hồ sơ gốc dùng chung được cấp riêng.
- **Mở khóa:** Yêu cầu đăng nhập mới; phiên cũ không được khôi phục. Người dùng chỉ được sử dụng quyền vẫn hợp lệ tại thời điểm đó. Thu hồi phân công vai trò tương ứng cuối cùng trong lúc khóa vẫn làm chấm dứt quyền dùng chung theo D038; mở khóa không khôi phục quyền đó.
- **Ranh giới ủy quyền:** Ủy quyền nghiệp vụ vẫn theo D020: ủy quyền đã chấm dứt do khóa tài khoản không tự phục hồi khi mở khóa. Giữ phân công quyền dùng chung không thay đổi chính sách này.
- **Phương án/cơ sở:** Giữ phân công nhưng chặn truy cập tài khoản so với chấm dứt quyền dùng chung khi khóa và yêu cầu cấp lại sau mở khóa. Nhóm trưởng chọn phân biệt khóa tài khoản với thu hồi trách nhiệm và vận hành khóa tạm thời đơn giản hơn, chấp nhận rà soát quyền còn giữ khi mở khóa và cách xử lý vòng đời khác với ủy quyền.
- **Bản ghi:** [ADR 0003](../../../docs/adr/0003-season-scoped-business-permissions.md#account-locking-and-shared-master-management-assignments).
- **Phase chịu ảnh hưởng:** Vòng đời tài khoản/truy cập PHASE 1, hồ sơ gốc CLB/sân PHASE 2, hồ sơ gốc cầu thủ PHASE 3 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Hợp đồng giao diện/lỗi, ngừng sử dụng tài khoản vĩnh viễn, đóng/lưu trữ mùa và cơ chế thực thi/đồng thời kỹ thuật. Chưa chọn công nghệ mới hoặc luồng rà soát quyền tự động.

### D042 - Phiên bản quy định mùa giải đã duyệt có nội dung bất biến

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q42, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O12; QĐ6, PDF tr.11; UC06 tr.79-82; D005/D035.
- **Quyết định:** Mỗi lần phê duyệt xác lập một phiên bản quy định riêng, chứa đầy đủ bộ cấu hình quy định cho mùa đó. Nội dung đã duyệt là bất biến; thay đổi cần đề xuất mới và phê duyệt phiên bản mới. Giữ phiên bản cũ để tra cứu và làm căn cứ cho hồ sơ nghiệp vụ liên quan.
- **Ranh giới đề xuất:** Đề xuất được chỉnh sửa trong quá trình soạn thảo. Bản nháp hoặc chờ duyệt không thay quy định đang có hiệu lực. Người duyệt vẫn phải khác người chuẩn bị/chỉnh sửa nội dung trình duyệt theo D005.
- **Phương án/cơ sở:** Các phiên bản đầy đủ đã duyệt bất biến so với một cấu hình hiện tại được cập nhật và tái dựng từ lịch sử. Nhóm trưởng chọn bộ căn cứ đã duyệt rõ ràng và truy vết lịch sử, chấp nhận lặp cấu hình và quản lý phiên bản/phê duyệt/hiệu lực.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, đăng ký PHASE 3, lịch PHASE 4, kết quả PHASE 5, thống kê/báo cáo PHASE 6/PHASE 7 và kiểm chứng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D043 bên dưới chốt quy tắc thời điểm hiệu lực cơ bản. Chi tiết hiệu lực, giới hạn thay đổi trong mùa, xử lý hồ sơ chờ/đã duyệt, tham chiếu phiên bản/mốc ghi nhận cụ thể, vòng đời đề xuất và hợp đồng schema/API/đồng thời. D042 không phê duyệt tự động kiểm tra lại hồi tố hoặc tính lại dữ liệu.

### D043 - Hiệu lực quy định ngay hoặc trong tương lai và không lùi về quá khứ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q43, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O12; QĐ6.6, PDF tr.11; UC06 tr.79-82; D024/D042.
- **Quyết định:** Đề xuất quy định chỉ rõ áp dụng ngay hoặc thời điểm hiệu lực tương lai để người duyệt xem xét. Áp dụng ngay bắt đầu khi hệ thống ghi nhận phê duyệt thành công. Phiên bản được duyệt cho tương lai không thay quy định hiện hành trước mốc đã duyệt. Không cho hiệu lực lùi về quá khứ.
- **Duyệt muộn:** Từ chối phê duyệt nếu thời điểm tương lai trong đề xuất đã trôi qua; không tự chuyển sang áp dụng ngay. Sửa đề xuất cần trình duyệt lại.
- **Quy ước thời gian:** Áp dụng D024: lưu/so sánh thời điểm UTC và nhập/hiển thị theo Asia/Ho_Chi_Minh.
- **Phương án/cơ sở:** Hiệu lực ngay hoặc tương lai so với chỉ hiệu lực ngay khi duyệt. Nhóm trưởng chọn chuẩn bị trước và ranh giới thời gian rõ, chấp nhận quản lý bản đã duyệt nhưng chưa có hiệu lực và trình lại nếu duyệt muộn.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#effective-time-policy).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, nghiệp vụ phụ thuộc PHASE 3-PHASE 7 và kiểm chứng biên thời gian PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Biên bằng nhau/độ chính xác và ranh giới giao dịch, các bản tương lai chồng lấn, thay thế/hủy, giới hạn thay đổi trong mùa, kiểm tra điều kiện khi bắt đầu hiệu lực và xử lý hồ sơ chờ/đã duyệt. D043 không cho phép mọi loại thay đổi giữa mùa hoặc tự tính lại dữ liệu trước đó. Chưa chọn bộ lập lịch kích hoạt, kiểu SQL hoặc thư viện.

### D044 - Khóa cấu trúc thi đấu sau khi phê duyệt lịch ban đầu

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q44, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O10/O12; QĐ6.3, PDF tr.11; QĐ2; UC13/UC14; D042/D043.
- **Quyết định:** Từ lần đầu phê duyệt lịch ban đầu của mùa, khóa số CLB theo cấu hình, thể thức và số lượt cho mùa đó. Phiên bản quy định sau phải giữ nguyên các thông số cấu trúc này, kể cả khi chưa có trận bắt đầu.
- **Phạm vi:** Phạm vi đồ án hiện tại không có quy trình mở khóa hoặc hủy toàn bộ lịch để thay đổi cấu trúc thi đấu. Điều chỉnh ngày/giờ hoặc sân của trận chưa diễn ra vẫn theo UC14 và các điều kiện riêng.
- **Phương án/cơ sở:** Khóa từ lúc duyệt lịch ban đầu so với cho đổi cấu trúc trước trận đầu qua rà soát tác động, thay lịch và phê duyệt lại. Nhóm trưởng chọn nhất quán giữa quy định và lịch đã duyệt, giảm phức tạp triển khai/kiểm thử, chấp nhận giảm linh hoạt trước khi thi đấu.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#competition-structure-freeze).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, lập lịch PHASE 4 và kiểm chứng toàn vẹn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** CLB rút lui/thay thế, nhóm quy định khác, làm mất hiệu lực bản lịch nháp trước duyệt, kiểm tra khi bản tương lai bắt đầu hiệu lực và hợp đồng giao dịch/đồng thời. D044 không chọn các thể thức được hỗ trợ hoặc cho phép thay đổi ngoài điều kiện phê duyệt/toàn vẹn hiện có.

### D045 - Khóa điểm số và thứ tự tiêu chí xếp hạng sau kết quả chính thức đầu tiên

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q45, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O12; QĐ5.2/QĐ5.3 và QĐ6.5, PDF tr.10-11; UC18-UC20; D042-D044.
- **Quyết định:** Từ kết quả được xác nhận chính thức đầu tiên của mùa, khóa điểm thắng/hòa/thua và thứ tự ưu tiên tiêu chí xếp hạng cho mùa đó. Phiên bản quy định sau phải giữ nguyên các thông số này. Trước mốc đó, thay đổi vẫn cần phiên bản quy định và phê duyệt theo D042/D043.
- **Hiệu chỉnh và phạm vi:** Sửa kết quả chính thức theo UC19 và tính lại theo UC20 vẫn được thực hiện theo điều kiện áp dụng, dùng quy tắc điểm/xếp hạng đã khóa. Phạm vi đồ án hiện tại không có quy trình mở khóa các thông số này.
- **Phương án/cơ sở:** Khóa sau kết quả chính thức đầu tiên so với cho đổi giữa mùa qua phê duyệt riêng và tính lại toàn mùa. Nhóm trưởng chọn căn cứ tính thống nhất trong mùa và giảm phức tạp xử lý/kiểm thử, chấp nhận không đổi các luật này giữa mùa dù có căn cứ của Ban tổ chức.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#points-and-ranking-priority-freeze).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, kết quả/thống kê PHASE 5, tra cứu PHASE 6, báo cáo PHASE 7 và kiểm chứng hồi quy PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Tiêu chí xếp hạng hỗ trợ, đồng hạng, playoff/xuống hạng, kiểm tra khi bản tương lai bắt đầu hiệu lực và hợp đồng giao dịch/đồng thời. D045 chốt mốc khóa cấu hình, không chốt các chính sách xếp hạng O05 còn lại.

### D046 - Giữ mã và ý nghĩa loại bàn thắng hoặc thẻ đã được tham chiếu

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q46, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O09/O12; QĐ3.3-QĐ3.5 và QĐ6.4; D042/D043.
- **Quyết định:** Khi loại bàn thắng/thẻ đã được dùng, gồm trong biên bản nháp, giữ mã và ý nghĩa nghiệp vụ; không xóa khi đang được tham chiếu. Không đổi cách hiểu loại đã dùng, gồm cách tính tỷ số/thống kê, hoặc tái sử dụng mã cho nghĩa khác.
- **Thay đổi:** Ý nghĩa khác cần đề xuất loại mới qua phiên bản quy định và phê duyệt. Có thể đề xuất ngừng cho chọn khi nhập mới nhưng giữ loại cũ để đọc và giải thích lịch sử. Thêm loại không tự cho phép công thức tính mới hoặc nghiệp vụ chưa được duyệt.
- **Phương án/cơ sở:** Mã/ý nghĩa được tham chiếu ổn định so với cho cùng mã có định nghĩa khác theo phiên bản quy định, mỗi sự kiện gắn định nghĩa tương ứng. Nhóm trưởng chọn tham chiếu ổn định và bảo vệ lịch sử đơn giản hơn, chấp nhận giữ loại không còn dùng và không sửa trực tiếp định nghĩa đã dùng sai.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#preserve-referenced-goal-and-card-type-meanings).
- **Phase chịu ảnh hưởng:** Danh mục quy định PHASE 2, sự kiện/kết quả trận PHASE 5, tra cứu/báo cáo lịch sử PHASE 6/PHASE 7 và kiểm chứng toàn vẹn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Sửa lỗi tên hiển thị, luồng ngừng cho chọn chi tiết, hiệu chỉnh sự kiện cũ, trường danh mục và ràng buộc kỹ thuật. D047 bên dưới chốt danh mục áp dụng theo thời điểm trận. Chưa chọn loại bàn thắng/thẻ hoặc cách tính mới.

### D047 - Gắn danh mục sự kiện trận với giờ bắt đầu thực tế được ghi nhận

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q47, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O09/O12; QĐ6.4, UC16/UC19; D042/D043/D046.
- **Quyết định:** Dùng danh mục bàn thắng/thẻ có hiệu lực tại giờ bắt đầu thực tế được ghi nhận của trận, thay vì thời điểm nhập hoặc hiệu chỉnh. Ghi nhận thời điểm bắt đầu thực tế và căn cứ phiên bản quy định áp dụng. Nhập muộn hoặc hiệu chỉnh không tự chuyển trận sang danh mục mới.
- **Ranh giới ngừng chọn:** Loại bị ngừng cho chọn trong phiên bản quy định sau vẫn dùng được cho trận có danh mục áp dụng chứa loại đó. Việc ngừng chọn ảnh hưởng trận bắt đầu khi phiên bản mới có hiệu lực, đồng thời giữ cách hiểu sự kiện lịch sử.
- **Hiệu chỉnh chính thức:** Sửa kết quả chính thức vẫn cần quy trình phê duyệt có thẩm quyền đã chốt; không cho phép tự sửa dữ liệu lịch sử.
- **Phương án/cơ sở:** Danh mục theo thời điểm trận so với danh mục hiện hành lúc nhập/sửa nhưng giữ loại đã lưu. Nhóm trưởng chọn quy định đi cùng trận đã diễn ra và nhất quán nhập muộn/lịch sử, chấp nhận ghi giờ bắt đầu thực tế, tham chiếu phiên bản và hiển thị danh mục lịch sử.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#match-event-catalog-applicability-at-actual-kickoff); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, biên bản/kết quả/hiệu chỉnh PHASE 5, lịch sử/báo cáo PHASE 6/PHASE 7 và kiểm chứng thời gian PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D048 bên dưới chốt ghi nhận/xác nhận giờ thực tế qua luồng biên bản/kết quả. Tác động hiệu chỉnh giờ chi tiết, thiếu hoặc không xác định duy nhất phiên bản hiệu lực, bản nháp khi chưa biết giờ bắt đầu, luồng ngừng chọn danh mục và hợp đồng kỹ thuật. D047 chỉ áp dụng cho danh mục bàn thắng/thẻ, không phải điều kiện đăng ký cầu thủ hoặc mọi nhóm quy định. Chưa chọn API ngoài hoặc thiết kế Live Score.

### D048 - Ghi giờ bắt đầu thực tế trong biên bản và xác nhận cùng kết quả chính thức

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q48, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O09/O12; UC16-UC19; D005/D047.
- **Quyết định:** Nhân viên kết quả nhập giờ bắt đầu thực tế theo căn cứ nghiệp vụ của trận trong UC16/UC17. Giao diện phân biệt giờ theo lịch và giờ thực tế; không tự coi giờ theo lịch là giờ thực tế đã xác nhận. Bắt buộc có giờ thực tế trước khi trình xác nhận kết quả chính thức.
- **Xác nhận/hiệu chỉnh:** Người xác nhận có thẩm quyền kiểm tra thời điểm này cùng biên bản theo UC18 và quy tắc tách người của D005. Sau xác nhận chính thức, sửa giờ thực tế phải qua quy trình hiệu chỉnh UC19 đã chốt. Không có luồng phê duyệt giờ bắt đầu thực tế riêng.
- **Phạm vi vận hành:** Có thể nhập sau trận; không yêu cầu nhân sự thao tác ngay lúc bắt đầu. Cần kiểm tra lại danh mục/sự kiện khi sửa giờ thực tế trong nháp; xử lý chi tiết khi đổi qua ranh giới phiên bản vẫn mở.
- **Phương án/cơ sở:** Ghi/kiểm tra trong luồng biên bản/kết quả hiện có so với luồng trình/duyệt giờ thực tế riêng. Nhóm trưởng chọn dùng lại trách nhiệm hiện có và hỗ trợ nhập sau trận, chấp nhận không xác nhận độc lập giờ bắt đầu từ trước và cần kiểm tra lại khi sửa giờ trong nháp.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#recording-and-confirming-actual-kickoff).
- **Phase chịu ảnh hưởng:** Luồng biên bản/kết quả/hiệu chỉnh PHASE 5 và kiểm chứng PHASE 10; tích hợp xác định quy định áp dụng PHASE 2. Không đổi trạng thái Phase.
- **Còn mở:** Định dạng căn cứ, độ chính xác/kiểm tra trường, bản nháp trước giờ bắt đầu, hợp đồng kỹ thuật. D049 bên dưới chốt hiệu chỉnh qua phiên bản danh mục. Chưa chọn tích hợp Live Score hoặc nguồn thời gian ngoài làm căn cứ chính thức.

### D049 - Kiểm tra lại sự kiện khi sửa giờ bắt đầu làm đổi danh mục áp dụng

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q49, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O07/O09/O12; UC16-UC20; D005/D036/D047/D048.
- **Quyết định:** Cho phép sửa giờ bắt đầu thực tế qua ranh giới phiên bản danh mục. Xác định danh mục theo giờ bắt đầu thực tế mới được đề xuất và kiểm tra lại toàn bộ sự kiện trong bản biên bản đề xuất. Chỉ rõ sự kiện không phù hợp; người lập phải sửa theo căn cứ nghiệp vụ. Không tự đổi loại hoặc xóa sự kiện.
- **Điều kiện kiểm tra:** Chặn trình hoặc phê duyệt cho tới khi giải quyết hết các lỗi này.
- **Ranh giới chính thức:** Với kết quả đã chính thức, giữ mọi thay đổi trong đề xuất hiệu chỉnh UC19. Giờ bắt đầu, danh mục và kết quả chính thức hiện có không đổi trong lúc chờ duyệt. Sau khi đề xuất hợp lệ được người khác có thẩm quyền duyệt, áp dụng nhất quán toàn bộ thay đổi liên quan, tính lại thống kê nếu cần và giữ lịch sử.
- **Phương án/cơ sở:** Cho sửa kèm kiểm tra lại toàn bộ bản biên bản đề xuất so với cấm sửa giờ qua phiên bản khi đã có sự kiện và để ngoại lệ ngoài chức năng hiện tại. Nhóm trưởng chọn sửa thông tin sai có kiểm soát, chấp nhận hiển thị lỗi theo sự kiện và có thể phải rà soát nhiều nội dung biên bản.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#kickoff-correction-across-catalog-versions).
- **Phase chịu ảnh hưởng:** Xác định quy định áp dụng PHASE 2, biên bản/kết quả/hiệu chỉnh PHASE 5, đầu ra phụ thuộc PHASE 6/PHASE 7 và kiểm chứng toàn vẹn/hồi quy PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Lưu nháp/biểu diễn lỗi, định dạng căn cứ, thiếu hoặc không xác định duy nhất phiên bản áp dụng và hợp đồng giao dịch/đồng thời. Chưa chọn chuyển đổi sự kiện tự động hoặc thẩm quyền hiệu chỉnh mới.

### D050 - Mỗi mùa tối đa một phiên bản quy định đã duyệt chờ hiệu lực tương lai

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q50, Nhóm trưởng chọn phương án A: “Tôi chọn A”.
- **Nguồn:** O07/O12; D042/D043.
- **Quyết định:** Mỗi mùa có tối đa một phiên bản quy định đã duyệt đang chờ thời điểm hiệu lực tương lai. Khi còn phiên bản đó, chặn phê duyệt phiên bản khác, kể cả phiên bản áp dụng ngay.
- **Chuẩn bị:** Vẫn được soạn đề xuất tiếp theo nhưng phải kiểm tra lại với quy định đang có hiệu lực trước khi duyệt. Thay thế hoặc hủy phiên bản đã duyệt đang chờ cần quy trình riêng chưa chốt; không sửa trực tiếp nội dung đã duyệt.
- **Phương án/cơ sở:** Một bản đã duyệt đang chờ so với nhiều bản tương lai có kiểm tra lịch/phụ thuộc và có thể phải duyệt lại các bản sau. Nhóm trưởng chọn quản lý phiên bản đầy đủ đơn giản và giảm xung đột cấu hình, chấp nhận không duyệt sẵn một chuỗi và phải xử lý bản đang chờ trước khi duyệt khẩn cấp.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#one-approved-future-version-per-season).
- **Phase chịu ảnh hưởng:** Luồng quy định PHASE 2 và kiểm chứng điều kiện/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D051 bên dưới chốt thẩm quyền/luồng hủy và thay thế, ngoại lệ thay thế có kiểm soát và kiểm tra không phù hợp nghiệp vụ khi tới hạn. Kiểm tra căn cứ/xung đột, lỗi kỹ thuật/thử lại và thực thi đồng thời vẫn mở. Chưa chọn giới hạn số đề xuất mới hoặc cơ chế triển khai.

### D051 - Hủy, thay thế và kiểm soát hiệu lực quy định đang chờ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q51 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận toàn bộ gói chính sách được đề xuất.
- **Nguồn:** O07/O08/O12; UC06; D005/D042-D045/D050.
- **Hủy:** Trước thời điểm hiệu lực đã duyệt, Người quản lý mùa giải có thẩm quyền lập đề nghị hủy kèm lý do và một Người quản lý mùa giải khác có thẩm quyền duyệt. Giữ nội dung đã duyệt và lịch sử; ghi nhận quyết định hủy riêng.
- **Thay thế:** Một đề xuất có thể yêu cầu đồng thời hủy bản đang chờ và duyệt bản thay thế. Chỉ ghi nhận cả hai sau khi toàn bộ đề xuất hợp lệ được duyệt; thất bại thì giữ bản đang chờ. Đây là ngoại lệ có kiểm soát đối với việc chặn duyệt thêm bản khi còn bản chờ tại D050, không cho phép hai bản tương lai đã duyệt.
- **Biên thời gian:** Đề nghị hủy/thay thế đang chờ không hoãn hiệu lực. Khi đã tới thời điểm hiệu lực, không còn dùng quy trình hủy bản tương lai; thay đổi tiếp cần phiên bản quy định mới.
- **Điều kiện áp dụng:** Tại thời điểm hiệu lực, kiểm tra lại ràng buộc phát sinh từ lúc duyệt, gồm mốc khóa D044/D045. Nếu bản không còn phù hợp thì không áp dụng: giữ quy định đang có hiệu lực, ghi nguyên nhân và yêu cầu đề xuất mới để xử lý. Không tự sửa nội dung đã duyệt hoặc dời thời điểm hiệu lực.
- **Phương án/cơ sở:** Hủy qua đề xuất/người khác duyệt so với Người quản lý mùa giải có thẩm quyền hủy trực tiếp kèm lý do/lịch sử; cả hai phương án đều gồm thay thế nhất quán và kiểm tra khi tới hạn. Nhóm trưởng chọn kiểm soát trách nhiệm độc lập, chấp nhận cần hai người có thẩm quyền và xử lý đề nghị chưa duyệt khi tới hạn hoặc bản bị chặn áp dụng.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#controlled-cancellation-replacement-and-activation).
- **Phase chịu ảnh hưởng:** Vòng đời quy định PHASE 2, nghiệp vụ phụ thuộc PHASE 3-PHASE 7 và kiểm chứng biên/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Mã vòng đời/lỗi chi tiết, lỗi kỹ thuật/thử lại, thiếu bản hiệu lực ban đầu, kiểm tra căn cứ/xung đột, chính sách tác động nhóm quy định khác và cơ chế đồng thời. D051 không chọn bộ lập lịch, biểu diễn lưu trữ hoặc công nghệ thông báo.

### D052 - Thay đổi quy định đăng ký tương thích và kiểm tra lại hồ sơ đang chờ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q52 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Nguồn:** O01/O02/O07/O12; QĐ6.2, UC06/UC10/UC11; D036/D042/D043/D051.
- **Quyết định:** Cho thay đổi có kiểm soát giữa mùa đối với hạn mức danh sách, điều kiện homegrown và U21 chỉ khi không làm mất tính hợp lệ của đăng ký/danh sách đã duyệt đang có hiệu lực. Kiểm tra tác động khi duyệt và khi bắt đầu hiệu lực; chặn thay đổi không tương thích.
- **Quyết định hiện có:** Không tự hủy đăng ký, loại cầu thủ hoặc sửa quyết định đã duyệt để ép phù hợp luật mới. Giữ căn cứ phiên bản quy định gốc của quyết định lịch sử.
- **Hồ sơ đang chờ:** Kiểm tra lại hồ sơ nháp/chờ theo quy định có hiệu lực tại thời điểm quyết định. Nộp trước không bảo đảm được xét theo điều kiện/hạn mức cũ. Lưu phiên bản quy định làm căn cứ cho từng quyết định.
- **Ranh giới sửa sai:** Sai dữ liệu gốc hoặc quyết định trước đó đi qua quy trình hiệu chỉnh tương ứng; đổi quy định không thay thế hiệu chỉnh.
- **Phương án/cơ sở:** Thay đổi tương thích có kiểm soát so với khóa các điều kiện từ đăng ký được duyệt đầu tiên. Nhóm trưởng chọn hỗ trợ điều chỉnh theo QĐ6.2 mà không cần thu hồi hàng loạt hoặc giữ ngoại lệ đăng ký hiện hành không phù hợp, chấp nhận kiểm tra tác động và có thể bổ sung/sửa hồ sơ đang chờ.
- **Bản ghi:** [ADR 0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#registration-rule-changes-and-affected-records).
- **Phase chịu ảnh hưởng:** Quy định PHASE 2, đăng ký PHASE 3, kiểm tra tham gia PHASE 5 và kiểm chứng hồi quy PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Tiêu chí/giá trị homegrown/U21 cụ thể, đợt đăng ký/ngoại lệ hạn nộp, vòng đời hồ sơ chi tiết và hợp đồng schema/đồng thời. Quyết định này áp dụng điều kiện cầu thủ và hạn mức, không chốt mốc xét hạn nộp; không thêm người phê duyệt vào UC10.

### D053 - Đợt đăng ký, hạn tiếp nhận và ngoại lệ từng hồ sơ

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q53 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Nguồn:** O02/O07/O08/O12; QĐ1.6/QĐ6.2, UC06/UC08/UC10/UC11; D024/D052.
- **Lịch:** Cấu hình lịch tiếp nhận theo mùa riêng cho hồ sơ tham gia CLB và đăng ký/thay đổi danh sách cầu thủ. Mỗi nhóm có thể có nhiều đợt, không chồng lấn trong cùng nhóm, được quản lý qua quy định mùa giải. Dùng thời điểm mở/đóng cụ thể và khoảng nửa kín [mở, đóng), theo D024. Không tự nhập lịch chuyển nhượng EPL ngoài nguồn.
- **Căn cứ hạn nộp:** Dùng thời điểm server ghi nhận thành công việc tiếp nhận phiên bản hồ sơ được đưa ra xét, không phải lúc tạo nháp hoặc thời gian người dùng tự khai. Bản tiếp nhận đúng hạn có thể được xử lý sau khi đóng đợt. Điều kiện cầu thủ/hạn mức vẫn xét tại thời điểm quyết định theo D052.
- **Bổ sung:** Bổ sung hoặc thay đổi nội dung xét tạo phiên bản tiếp nhận mới và phải xét hạn lại.
- **Ngoại lệ cá biệt:** Nhân viên đăng ký đề nghị cho hồ sơ/phiên bản cụ thể kèm lý do và căn cứ; Người quản lý mùa giải có thẩm quyền phê duyệt riêng. Ngoại lệ chỉ miễn hạn tiếp nhận cho bản đó, không miễn điều kiện cầu thủ, hạn mức hoặc xung đột đăng ký. Duyệt ngoại lệ không thay quyết định xử lý đăng ký.
- **Truy vết:** Giữ thời điểm tiếp nhận, lịch làm căn cứ và quyết định ngoại lệ. Không sửa lịch hoặc lùi thời gian để hợp thức hóa tiếp nhận trước đó.
- **Phương án/cơ sở:** Ngoại lệ từng hồ sơ được duyệt so với yêu cầu chờ đợt sau hoặc đợt bổ sung được duyệt chung. Nhóm trưởng chọn linh hoạt cá biệt có giới hạn theo QĐ1.6, chấp nhận thêm bước duyệt ngoại lệ và có thể cần ngoại lệ khi bổ sung sau hạn.
- **Bản ghi:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Lịch quy định PHASE 2, tiếp nhận/đăng ký PHASE 3 và kiểm chứng thời gian/quyền PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Ngày cụ thể từng mùa, vòng đời hồ sơ/ngoại lệ và trường bắt buộc, chi tiết điều kiện, hợp đồng schema/API/lỗi/đồng thời. Chưa chọn cổng nộp công khai, cơ chế tải tệp hoặc thêm bước duyệt chung vào UC10.

### D054 - Tự xét U21 và kiểm tra homegrown bằng căn cứ do nhân sự xác minh

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q54 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Nguồn:** O01/O07/O09/O12; QĐ1.2-QĐ1.4/QĐ6.2, UC10/UC11; D024/D033/D052.
- **Tham số mùa:** Bắt buộc có ngày sinh giới hạn U21 và khoảng tuổi đào tạo đủ điều kiện homegrown trong quy định trình duyệt. Không điền phần thiếu từ luật EPL ngoài nguồn. Giữ ngưỡng nguồn ít nhất ba mùa hoặc 36 tháng làm mặc định; thay đổi theo D052. Giá trị thực tế từng mùa phải nhập và duyệt trong cấu hình, không tự ngầm định.
- **U21:** Tự xác định đủ điều kiện khi ngày sinh bằng hoặc sau ngày giới hạn của mùa. So sánh ngày lịch thay vì tuổi hiện tại; thiếu ngày sinh thì chưa đủ căn cứ kết luận.
- **Homegrown:** Nhân viên đăng ký kiểm tra tài liệu và ghi nhận căn cứ theo số mùa hoặc số tháng đạt điều kiện, kết luận, người kiểm tra, thời điểm và phiên bản quy định. Căn cứ phải chứng minh đáp ứng khoảng tuổi và yêu cầu liên đoàn Anh/Wales; không dùng quốc tịch thay thế.
- **Thiếu căn cứ:** Không đánh dấu đạt homegrown. Người lập có thể chọn xử lý theo nhóm không đạt homegrown nếu đáp ứng hạn mức và mọi điều kiện khác; thiếu căn cứ homegrown không tự từ chối mọi đăng ký.
- **Thuộc tính độc lập và phạm vi:** U21 và homegrown độc lập, không suy từ quốc tịch hoặc suy ra lẫn nhau. Phiên bản đầu không tự cộng toàn bộ lịch sử đào tạo qua nhiều CLB, xử lý trùng thời gian hoặc quy đổi mùa/tháng. Căn cứ vẫn nội bộ theo quyền xem đã chốt.
- **Phương án/cơ sở:** Tự xét U21 và nhân sự xác minh homegrown so với tự tính homegrown từ lịch sử đào tạo chi tiết. Nhóm trưởng chọn kiểm tra có truy vết phù hợp SE104, chấp nhận phụ thuộc chất lượng kiểm tra và không tự chứng minh toàn bộ lịch sử đào tạo.
- **Bản ghi:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#u21-assessment-and-homegrown-verification); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Cấu hình quy định PHASE 2, điều kiện đăng ký PHASE 3, kiểm tra tham gia PHASE 5 và kiểm chứng biên/căn cứ PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Giá trị tham số mùa cụ thể, trường/định dạng căn cứ bắt buộc, kiểm tra trường, vòng đời và hợp đồng kỹ thuật. Chưa chọn công nghệ tải tệp, dịch vụ kiểm tra ngoài hoặc vai trò duyệt bổ sung.

### D055 - Luồng hồ sơ CLB và đăng ký cầu thủ theo phiên bản

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q55 đã gộp, Nhóm trưởng chọn phương án A: “tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Luồng CLB:** Nháp -> Đã tiếp nhận -> Chờ phê duyệt -> Đã duyệt hoặc Từ chối. Nhân viên đăng ký chuẩn bị/rà soát; Người quản lý mùa giải có thẩm quyền duyệt theo UC08/D005.
- **Nguồn:** O02/O08/O09/O12; UC08/UC10/UC11; D005/D052-D054.
- **Luồng cầu thủ:** Nháp -> Đã tiếp nhận -> Hợp lệ. Nhân viên đăng ký xác nhận hợp lệ sau kiểm tra UC11 theo UC10; không thêm bước Người quản lý mùa giải duyệt.
- **Bổ sung/phiên bản:** Hồ sơ đã tiếp nhận hoặc hồ sơ CLB chờ duyệt có thể được trả về Cần bổ sung kèm lý do. Bổ sung tạo phiên bản mới để tiếp nhận/kiểm tra lại theo D053. Nội dung CLB đã trình duyệt là bất biến; muốn sửa phải rút về hoặc được trả bổ sung, rồi trình bản mới.
- **Hủy/nộp lại:** Cho hủy trước khi CLB được duyệt hoặc đăng ký cầu thủ được xác nhận hợp lệ, giữ lý do/lịch sử. Bản từ chối/hủy không được sửa thành đã duyệt; lượt xử lý mới liên kết lịch sử. Giữ một hồ sơ CLB-mùa chứa các phiên bản/lượt, không nhiều hồ sơ tham gia độc lập cho cùng CLB-mùa.
- **Phụ thuộc:** Được chuẩn bị/kiểm tra danh sách cầu thủ trong lúc chờ duyệt CLB, nhưng chỉ xác nhận đăng ký cầu thủ hợp lệ sau khi hồ sơ tham gia CLB được duyệt. Duyệt CLB không tự làm mọi đăng ký cầu thủ hợp lệ; UC10 vẫn phải kiểm tra/xác nhận.
- **Ranh giới thời gian:** Xác nhận hợp lệ khác với hiệu lực thi đấu, kết thúc đăng ký và chuyển CLB, các nội dung này còn cần chốt.
- **Phương án/cơ sở:** Lưu việc đăng ký cầu thủ chưa hoàn chỉnh bằng trạng thái/phiên bản so với chỉ lưu đăng ký đạt kiểm tra, để nội dung chưa đạt trên màn hình. Nhóm trưởng chọn bổ sung/phối hợp có truy vết, chấp nhận thêm quản lý vòng đời/phiên bản. Cả hai phương án giữ luồng CLB và khác biệt thẩm quyền UC08/UC10.
- **Bản ghi:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#club-and-player-registration-workflows); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Luồng hồ sơ/đăng ký PHASE 3, tích hợp CLB hợp lệ khi lập lịch PHASE 4, kiểm tra tham gia PHASE 5 và kiểm chứng luồng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D056 bên dưới chốt quy tắc cơ bản về hiệu lực thi đấu/kết thúc/chuyển CLB. Chi tiết thao tác hủy/rút, trường bắt buộc, hợp đồng enum/API/lỗi và đồng thời. Tên trạng thái nghiệp vụ chưa chọn mã enum kỹ thuật.

### D056 - Khoảng hiệu lực thi đấu và chuyển CLB nhất quán

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q56 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Nguồn:** O02/O08/O09/O12; QĐ1.5, UC10/UC11; D024/D053-D055.
- **Khoảng hiệu lực:** Đăng ký hợp lệ có mốc bắt đầu hiệu lực thi đấu và khoảng nửa kín [bắt đầu, kết thúc). Có thể chưa xác định mốc kết thúc cho tới khi được kết thúc hợp lệ. Thao tác bắt đầu/kết thúc thông thường có hiệu lực khi ghi nhận thành công hoặc ở tương lai, không trước lúc ghi nhận; sai lịch sử cần quy trình hiệu chỉnh riêng.
- **Độc quyền:** Từ chối khoảng đăng ký đã xác nhận chồng lấn cho cùng cầu thủ và giải, gồm đăng ký bắt đầu trong tương lai và khác mùa. Cho phép hai khoảng nối tiếp tại cùng mốc kết thúc/bắt đầu.
- **Chuyển CLB:** Trong UC10, kết thúc đăng ký CLB cũ và bắt đầu đăng ký CLB mới tại cùng mốc bằng một thao tác nhất quán. Chỉ ghi nhận cả hai khi đăng ký mới đạt mọi kiểm tra; thất bại giữ nguyên đăng ký cũ.
- **Thẩm quyền/kiểm tra:** Nhân viên đăng ký phải có quyền đối với đăng ký/mùa bị ảnh hưởng, kèm lý do và lịch sử. Chuyển CLB vẫn đáp ứng hạn/ngoại lệ D053, điều kiện D054, hạn mức và mọi kiểm tra khác; không có quyền bỏ qua.
- **Lịch sử:** Kết thúc hoặc chuyển CLB không tự xóa lần ra sân, bàn thắng hoặc thống kê trước đó.
- **Phương án/cơ sở:** Chuyển đăng ký theo cặp nhất quán so với kết thúc cũ và tạo mới độc lập. Cả hai phương án dùng hiệu lực theo khoảng. Nhóm trưởng chọn tránh mất đăng ký cũ ngoài ý muốn khi bản mới thất bại, chấp nhận phối hợp và kiểm tra khoảng tương lai.
- **Bản ghi:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#playing-effectivity-and-club-transfers); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Đăng ký/chuyển CLB PHASE 3, điều kiện ra sân PHASE 5, lịch sử PHASE 6/PHASE 7 và kiểm chứng chồng lấn/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D057 bên dưới chốt chính sách hiệu chỉnh đăng ký lịch sử. Tác động đóng mùa, độ chính xác trường/thời gian, sửa/hủy kế hoạch tương lai, xét hạn mức qua các khoảng đã lên kế hoạch và hợp đồng kỹ thuật. Chưa chọn phân hệ chuyển nhượng tài chính, dịch vụ ngoài hoặc cơ chế CSDL.

### D057 - Hiệu chỉnh đăng ký đã hợp lệ qua phê duyệt độc lập

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q57 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, phê duyệt rõ phần bổ sung v2 này cho UC10.
- **Nguồn:** O02/O08/O09/O12; UC10/UC11/UC19; D036/D055/D056.
- **Phạm vi:** Sửa sai nội dung/căn cứ đã xác nhận, kết luận phân loại hoặc khoảng hiệu lực ghi nhận sai, gồm hiệu chỉnh lịch sử, cần đề xuất và phê duyệt độc lập. Không thêm bước duyệt cho xác nhận hợp lệ ban đầu theo UC10 hoặc kết thúc/chuyển CLB thông thường.
- **Trách nhiệm:** Nhân viên đăng ký rà soát/lập đề xuất kèm lý do, căn cứ, giá trị trước/sau và ảnh hưởng liên quan. Người quản lý mùa giải có thẩm quyền khác người chuẩn bị/chỉnh sửa đề xuất phê duyệt, trả bổ sung hoặc từ chối.
- **Chờ rà soát:** Giữ quyết định chính thức hiện có và ghi nhận việc cần rà soát. Nghiệp vụ mới vẫn kiểm tra theo dữ liệu gốc đã sửa theo D036, không dùng kết quả lỗi thời.
- **Kiểm tra:** Kiểm tra lại điều kiện, hạn mức và chồng lấn cho khoảng bị ảnh hưởng theo quy định tương ứng. Hiệu chỉnh không miễn kiểm tra hoặc hợp thức hóa vi phạm.
- **Quyết định cũ sai:** Nếu không thể giữ đăng ký hợp lệ, đề xuất phải nêu cách xử lý, chẳng hạn kết thúc hiệu lực hoặc ghi nhận quyết định trước đó là sai. Không xóa dấu vết đăng ký từng tồn tại.
- **Ảnh hưởng trận:** Xác định biên bản/kết quả cần rà soát riêng. Duyệt hiệu chỉnh đăng ký không tự sửa kết quả, xử thua hoặc đổi thống kê; sửa kết quả chính thức vẫn qua UC19.
- **Phương án/cơ sở:** Người quản lý mùa giải duyệt độc lập so với Nhân viên đăng ký tự áp dụng, cùng yêu cầu căn cứ/kiểm tra tác động/lịch sử. Nhóm trưởng chọn kiểm soát độc lập dữ liệu đã dùng làm căn cứ thi đấu, chấp nhận thêm luồng hiệu chỉnh và phối hợp sửa kết quả.
- **Bổ sung so với nguồn:** Giữ nguyên văn bản UC10 v1. Chính sách v2 được xác nhận này thêm phê duyệt riêng cho hiệu chỉnh đăng ký đã hợp lệ, không khẳng định v1 đã yêu cầu.
- **Bản ghi:** [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#correction-of-validated-registrations); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Hiệu chỉnh đăng ký PHASE 3, rà soát tác động trận PHASE 5, đầu ra lịch sử PHASE 6/PHASE 7 và kiểm chứng toàn vẹn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Trường hiệu chỉnh/tác động chi tiết, biểu diễn quyết định cũ sai, hiển thị lịch sử công khai, hợp đồng vòng đời/lỗi và giao dịch/đồng thời. Chưa chọn kỷ luật tự động, xử thua hoặc UC mới.

### D058 - Mã nghiệp vụ ổn định, rà soát hồ sơ trùng và số áo duy nhất theo thời gian

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q58 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói chính sách được đề xuất.
- **Nguồn:** O09/O12; UC05/UC07/UC09/UC10/UC12, BM1; D035/D055-D057.
- **Định danh:** Mùa, CLB, sân và cầu thủ có mã nghiệp vụ duy nhất, ổn định, không tái sử dụng trong từng nhóm đối tượng. Tên, tên viết tắt và ngày sinh không thay mã định danh. Từ chối mã trùng.
- **Cầu thủ nghi trùng:** Trùng họ tên đã chuẩn hóa, ngày sinh và quốc tịch tạo cảnh báo để nhân sự kiểm tra, không tự gộp hoặc dùng làm ràng buộc duy nhất cứng. Dùng hồ sơ cũ nếu cùng người; người khác nhau được có hồ sơ riêng sau xác nhận kèm lý do được ghi nhận.
- **CLB/sân:** Tên trùng tạo cảnh báo; cùng tên không tự xác định cùng đối tượng.
- **Số áo:** Bắt buộc là số nguyên 1-99 khi xác nhận đăng ký hợp lệ. Trong cùng CLB-mùa, các đăng ký đã xác nhận có khoảng hiệu lực thi đấu chồng lấn không được trùng số, gồm U21 và đăng ký tương lai. Cho tái sử dụng sau khi khoảng cũ kết thúc. Khoảng 1-99 là lựa chọn v2 rõ ràng, không phải luật PDF.
- **Lịch sử/phạm vi:** Đổi tên/số hiện tại không tự viết lại lịch sử đã ghi nhận. Không tự gộp hồ sơ nghi trùng hoặc chuyển tham chiếu. Công cụ tự gộp hồ sơ nằm ngoài phạm vi phiên bản đầu.
- **Phương án/cơ sở:** Mã ổn định và cảnh báo trùng được rà soát so với chặn cứng bộ tên/ngày sinh/quốc tịch cầu thủ trùng; cả hai dùng cùng quy tắc mã/số áo. Nhóm trưởng chọn hỗ trợ người khác nhau trùng thuộc tính mà không thu thêm giấy tờ chỉ để xử lý trùng, chấp nhận xác minh của nhân sự và rủi ro tạo trùng còn lại.
- **Bản ghi:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#business-codes-and-suspected-duplicates); [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#shirt-number-constraints).
- **Phase chịu ảnh hưởng:** Định danh/hồ sơ gốc PHASE 2, đăng ký PHASE 3, tích hợp ra sân/lịch sử PHASE 5 và kiểm chứng trùng/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Cách sinh/định dạng mã và kiểu khóa CSDL, chuẩn hóa, trường chi tiết và giao diện rà soát trùng, hợp đồng bản chụp lịch sử và thực thi đồng thời kỹ thuật.

### D059 - Dữ liệu đăng ký bắt buộc và mốc chụp thông tin chính thức

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q59 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn phương án A.”, xác nhận gói trường và bản chụp.
- **Nguồn:** O04/O09/O12; BM1/BM4, UC05/UC07-UC12; D032-D036/D054-D058.
- **Trường bắt buộc:** Mùa: mã, tên, ngày bắt đầu/kết thúc, quy định quản lý riêng. Hồ sơ gốc CLB: mã, tên, tên viết tắt. Hồ sơ sân: mã, tên. Hồ sơ cầu thủ: mã, họ tên, ngày sinh, quốc tịch, vị trí.
- **Trình hồ sơ CLB:** Cần CLB, mùa, huấn luyện viên, sân nhà, tên/điện thoại/địa chỉ liên hệ đại diện và ít nhất một cầu thủ đề nghị được kiểm tra ở mức chuẩn bị. Không yêu cầu đăng ký đang có hiệu lực thi đấu trước khi duyệt CLB.
- **Xác nhận cầu thủ:** Cần cầu thủ, CLB, mùa, số áo, kết quả phân loại U21/homegrown, mốc bắt đầu hiệu lực và căn cứ kiểm tra tương ứng. Nháp có thể thiếu trường nghiệp vụ; chặn chuyển bước tại mốc cần hoàn chỉnh.
- **Căn cứ homegrown:** Kết luận đạt cần nhánh số mùa/tháng, giá trị đạt điều kiện, tóm tắt và tham chiếu căn cứ. Hệ thống giữ người kiểm tra/thời điểm/phiên bản quy định. Không bắt buộc tải tệp. Ghi chú tùy chọn; không thêm giấy tờ định danh cá nhân.
- **Bản chụp CLB:** Khi duyệt hồ sơ CLB giữ tên/tên viết tắt CLB, huấn luyện viên, sân nhà, thông tin đại diện và danh sách đề nghị của phiên bản được duyệt.
- **Bản chụp cầu thủ:** Khi xác nhận hợp lệ giữ tên, ngày sinh, quốc tịch, vị trí, số áo, phân loại và căn cứ quy định/xác minh. Hiệu chỉnh được duyệt tạo bản kế tiếp, giữ bản cũ.
- **Tra cứu mùa:** Dùng thông tin đã ghi nhận cho mùa, gồm hiệu chỉnh được duyệt, không tự lấy mọi giá trị gốc mới nhất. Ranh giới công khai/nội bộ D032/D033 vẫn áp dụng.
- **Phương án/cơ sở:** Hoàn chỉnh theo mốc và chụp thông tin mô tả so với cùng trường bắt buộc nhưng chỉ chụp tham chiếu/kết luận, tra cứu mô tả hiện tại. Nhóm trưởng chọn tái hiện hồ sơ đã duyệt và tra cứu mùa ổn định, chấp nhận lặp chọn lọc và tách thông tin hiện tại khỏi thông tin theo mùa.
- **Bản ghi:** [ADR 0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#registration-snapshot-fields-and-seasonal-lookup); [ADR 0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#required-fields-at-registration-milestones).
- **Phase chịu ảnh hưởng:** Trường hồ sơ gốc/mùa PHASE 2, tiếp nhận/bản chụp PHASE 3, tra cứu mùa PHASE 6 và kiểm chứng dữ liệu/lịch sử PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Kiểu/độ dài/định dạng và chuẩn hóa chi tiết, biểu diễn vị trí/quốc tịch, schema/tham chiếu bản chụp cụ thể, hợp đồng bản chụp lịch/biên bản và đồng thời triển khai. Chưa chọn công nghệ tải tệp hoặc thu giấy tờ định danh.

### D060 - Tự sinh cặp đấu và hoàn thiện lịch nháp bằng nhập liệu

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q60 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O10/O12; QĐ2, UC13, TH-02; D005/D044.
- **Phạm vi hỗ trợ:** Phiên bản đầu vòng tròn hai lượt với số CLB chẵn từ 4 đến 20, mặc định 20. Khoảng 4-20 là lựa chọn phạm vi v2 đã chốt. Báo rõ số lẻ, một lượt và thể thức khác chưa hỗ trợ thay vì sinh lịch sai.
- **Đầu vào/sinh lịch:** Nhân viên lịch thi đấu chọn đúng số CLB theo cấu hình, tất cả có hồ sơ tham gia đã duyệt. Tự sinh đầy đủ vòng/cặp đấu, đảo sân nhà/sân khách giữa hai lượt: 2*(N-1) vòng và N*(N-1) trận; mặc định tạo 38 vòng, 380 trận.
- **Hoàn thiện:** Nhân sự nhập ngày giờ; gợi ý sân nhà đã đăng ký. Thay sân vẫn chịu điều kiện phê duyệt của nguồn. Không yêu cầu tự động tối ưu toàn bộ lịch ngày giờ/phân sân.
- **Nháp/phê duyệt:** Lưu nháp chưa hoàn chỉnh kèm chỉ rõ thiếu trường/xung đột; không công khai nháp. Chỉ trình toàn bộ lịch ban đầu khi đủ dữ liệu, đúng cấu trúc và đạt kiểm tra CLB/sân. Công bố cần phê duyệt theo D005; không duyệt riêng từng phần lịch ban đầu.
- **Phương án/cơ sở:** Tự sinh cặp/vòng/sân nhà-khách và hoàn thiện thủ công so với tự phân cả ngày giờ/sân. Nhóm trưởng chọn tự động hóa hữu ích phù hợp SE104, chấp nhận nhân sự bố trí/xử lý xung đột thay vì dữ liệu khả dụng và bộ tối ưu.
- **Bản ghi:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md).
- **Phase chịu ảnh hưởng:** Cấu hình quy định hỗ trợ PHASE 2, sinh/nháp/duyệt lịch PHASE 4, tra cứu công bố PHASE 6 và kiểm chứng lịch PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D061 bên dưới chốt khoảng thi đấu/chiếm dụng sân dự kiến và đệm. D062 bên dưới chốt chính sách điều chỉnh/phiên bản/công bố và sinh lại. Hợp đồng bản chụp/schema/API/đồng thời. Không ngầm định 90 phút, thời gian đệm, thư viện thuật toán hoặc chỉ tiêu thời gian sinh lịch.

### D061 - Khoảng kế hoạch theo mùa và kiểm tra xung đột lịch toàn hệ thống

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q61 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói khoảng thời gian/xung đột.
- **Nguồn:** O03/O07/O10/O12; QĐ2.4-QĐ2.6, UC13/UC14; D024/D044/D060.
- **Tham số:** Bắt buộc có thời lượng trận dự kiến, đệm chuẩn bị sân trước trận và đệm giải phóng sân sau trận được duyệt theo mùa, đơn vị phút. Thời lượng dương; đệm không âm. Không ngầm định 90 phút hoặc giá trị đệm. Khóa cả ba từ khi duyệt lịch ban đầu trong phạm vi phiên bản đầu.
- **Khoảng:** CLB dùng [giờ theo lịch, giờ theo lịch + thời lượng dự kiến). Sân chiếm dụng [giờ theo lịch - đệm chuẩn bị, giờ kết thúc dự kiến + đệm giải phóng). Từ chối khoảng CLB hoặc sân chồng lấn; cho nối tiếp đúng biên.
- **Phạm vi:** Kiểm tra cùng CLB/sân trên toàn hệ thống, gồm khác mùa. Kiểm tra nháp với chính nó và lịch đã duyệt; nháp hoặc đề nghị chờ không giữ chỗ.
- **Phê duyệt/điều chỉnh:** Kiểm tra lại xung đột trước khi duyệt thành công, gồm yêu cầu đồng thời. Điều chỉnh thay phân bổ cũ của chính trận, không xung đột với bản thân. Đổi ngày giờ/sân vẫn theo UC14.
- **Ranh giới vận hành:** Khoảng phục vụ kế hoạch; giờ bắt đầu thực tế vẫn theo D047/D048 và không tự sửa lịch đã duyệt. Phiên bản đầu không thêm ràng buộc nghỉ tối thiểu giữa trận hoặc thời gian di chuyển CLB.
- **Phương án/cơ sở:** Tính khoảng từ tham số chung theo mùa so với nhập khoảng thi đấu/chiếm dụng riêng từng trận. Nhóm trưởng chọn giảm nhập liệu và kiểm tra nhất quán ở quy mô SE104, chấp nhận giảm linh hoạt theo sân/trận.
- **Bản ghi:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#planning-intervals-and-conflict-checks); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Tham số quy định PHASE 2, lập/điều chỉnh lịch PHASE 4, tra cứu lịch PHASE 6 và kiểm chứng biên/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Giá trị phút cụ thể từng mùa, hợp đồng bản chụp/schema/API và đồng thời kỹ thuật. D062 bên dưới chốt chính sách điều chỉnh/công bố/sinh lại. Không coi khoảng kế hoạch là thời lượng thực tế của trận.

### D062 - Duyệt lịch đồng thời công bố và điều chỉnh theo phiên bản

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q62 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói vòng đời/công bố.
- **Nguồn:** O08/O09/O10/O12; UC13-UC15; D005/D019/D044/D060/D061.
- **Vòng đời ban đầu:** Nhân viên lịch thi đấu soạn và trình lịch đầy đủ; người có thẩm quyền khác người chuẩn bị/chỉnh sửa duyệt. Duyệt thành công công bố ngay, không thêm bước công bố riêng.
- **Bản đang chờ:** Nội dung đã trình là bất biến. Người lập được rút trước quyết định; người duyệt được trả bổ sung hoặc từ chối kèm lý do. Sửa/trình lại tạo phiên bản mới và giữ lịch sử.
- **Sinh lại:** Chỉ sinh lại khi lịch ban đầu chưa duyệt và đang nháp, có xác nhận thay thế và dấu vết bản trước. Sau công bố không sinh lại toàn bộ hoặc đổi cặp đấu, vòng, vai trò sân nhà/sân khách.
- **Điều chỉnh:** Đề xuất đổi ngày giờ hoặc sân kèm lý do và giá trị trước/sau. Một đề xuất có thể chứa nhiều trận cùng mùa; duyệt/áp dụng toàn bộ hoặc không phần nào. Lịch cũ vẫn công khai khi chờ duyệt.
- **Điều kiện trận:** Chỉ điều chỉnh trận chưa bắt đầu. Nếu quá giờ theo lịch, người duyệt phải có căn cứ xác nhận trận chưa diễn ra; chỉ riêng quá giờ theo lịch không chứng minh đã hoặc chưa thi đấu.
- **Kiểm tra cuối/công bố:** Khi duyệt điều chỉnh kiểm tra lại trạng thái trận, quyền, phiên bản lịch và xung đột D061. Dữ liệu nền đã đổi thì yêu cầu rà soát/trình lại. Duyệt thành công cập nhật lịch công khai và giữ lịch sử. Giữ thẩm quyền/tách người theo D005/D019, gồm người duyệt điều chỉnh được ủy quyền.
- **Phương án/cơ sở:** Duyệt công bố ngay so với trạng thái đã duyệt chưa công bố và thao tác công bố riêng của Người quản lý mùa giải, cùng các bảo vệ luồng khác. Nhóm trưởng chọn ít thao tác và không lệch giữa bản đã duyệt/công khai, chấp nhận người duyệt phải sẵn sàng công bố ngay.
- **Bản ghi:** [ADR 0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#schedule-lifecycle-and-publication).
- **Phase chịu ảnh hưởng:** Luồng lịch/điều chỉnh PHASE 4, công bố/lịch sử PHASE 6 và kiểm chứng luồng/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Mã thao tác/trạng thái cụ thể, trường căn cứ, ghi nhận trạng thái trận, chi tiết bản chụp/hiển thị và hợp đồng giao dịch/API/đồng thời. Chưa chọn dịch vụ thông báo hoặc bộ lập lịch công bố tự động.

### D063 - Tách vòng đời trận, phiên bản biên bản và kết quả chính thức

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q63 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói vòng đời.
- **Nguồn:** O08/O09/O12; UC16-UC20; D005/D047-D049/D062.
- **Nhóm trạng thái:** Trận: Chưa bắt đầu -> Đang diễn ra -> Đã kết thúc. Phiên bản biên bản: Nháp -> Chờ xác nhận -> Đã xác nhận, có trả bổ sung hoặc rút trước quyết định. Kết quả: Chưa chính thức -> Chính thức, đề xuất hiệu chỉnh quản lý riêng.
- **Giờ thực tế:** Nhân viên kết quả ghi giờ bắt đầu/kết thúc thực tế trong biên bản. Bắt buộc có cả hai trước khi trình; kết thúc phải sau bắt đầu. Giờ theo lịch hoặc thời lượng dự kiến không tự xác lập việc kết thúc. Có thể nhập cả hai sau trận, không yêu cầu thao tác trực tiếp lúc bắt đầu/kết thúc.
- **Quản lý phiên bản:** Mỗi trận một hồ sơ biên bản với nhiều phiên bản lịch sử, tối đa một bản chờ xác nhận hoặc hiệu chỉnh tại một thời điểm. Nội dung đã trình là bất biến; muốn sửa phải rút/được trả và trình bản mới.
- **Xác nhận ban đầu:** UC18 cần trận đã kết thúc và biên bản đầy đủ đạt kiểm tra, theo thẩm quyền/tách người đã chốt. Lưu biên bản hoặc nhập tỷ số không làm kết quả chính thức.
- **Hiệu chỉnh/nhất quán:** Kết quả chính thức hiện hành vẫn công khai và dùng tính thống kê khi UC19 chờ duyệt. Trả/từ chối/rút đề xuất không làm mất hiệu lực kết quả đó. Xác nhận/hiệu chỉnh thành công cập nhật nhất quán kết quả, thống kê và lịch sử theo UC18-UC20; thất bại không để cập nhật chính thức/thống kê dở.
- **Phương án/cơ sở:** Các trạng thái nghiệp vụ liên kết riêng so với chuỗi trạng thái chung cho trận/kết quả. Nhóm trưởng chọn biểu diễn đúng kết thúc, bản đang chờ và kết quả chính thức vẫn hiệu lực, chấp nhận kiểm tra quan hệ giữa nhiều nhóm trạng thái.
- **Bản ghi:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Luồng biên bản/kết quả PHASE 5, kiểm tra trạng thái trận khi điều chỉnh PHASE 4, đầu ra chính thức PHASE 6/PHASE 7 và kiểm chứng vòng đời/đồng thời PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Kiểm tra ra sân/sự kiện, độ chính xác giờ thực tế, chuyển trạng thái/lỗi và trường căn cứ chi tiết, bản chụp và hợp đồng giao dịch/API. Trạng thái nghiệp vụ nội bộ này không chọn hoặc phê duyệt thiết kế Live Score được hoãn.

### D064 - Xét ra sân tại giờ bắt đầu và xác định thủ môn theo biên bản

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q64 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”, xác nhận gói ra sân/thủ môn.
- **Nguồn:** O02/O06/O09/O12; QĐ3.2/QĐ5.7, BM3, UC16/UC18/UC20; D047/D048/D056.
- **Mốc xét:** Mỗi cầu thủ ra sân cần đăng ký đã xác nhận hợp lệ đúng CLB-mùa, có khoảng hiệu lực thi đấu chứa giờ bắt đầu thực tế. Nhập biên bản muộn không lấy CLB hiện tại thay căn cứ lịch sử.
- **Danh sách:** Mỗi đội có danh sách không rỗng. Cầu thủ xuất hiện tối đa một lần trong trận và thuộc một trong hai đội. Phiên bản đầu không thêm bắt buộc đủ mười một người, sơ đồ chiến thuật hoặc quản lý thay người.
- **Số áo/vị trí:** Lấy số áo từ đăng ký áp dụng tại mốc xét. Ghi vị trí trong trận riêng, được khác vị trí hồ sơ.
- **Kiểm tra thủ môn:** Trước trình/xác nhận, danh sách mỗi đội phải có đúng một thủ môn theo vị trí trong trận. Thiếu/nhiều thủ môn chặn trình/xác nhận tới khi sửa; không tự chọn một người hoặc bỏ qua thống kê.
- **Giữ sạch lưới:** Với kết quả chính thức, đội không thủng lưới thì thủ môn được xác định theo biên bản nhận một trận giữ sạch lưới. Thay thủ môn vẫn ngoài phạm vi nguồn.
- **Lịch sử:** Khi xác nhận giữ căn cứ đăng ký, tên, số áo và vị trí trong trận. Chuyển CLB/sửa hồ sơ sau đó không tự đổi biên bản; hiệu chỉnh chính thức vẫn qua UC19.
- **Phương án/cơ sở:** Chỉ định thủ môn bằng vị trí trong trận so với suy từ vị trí hồ sơ đăng ký, cùng kiểm tra đúng một người. Nhóm trưởng chọn vai trò thực tế và lịch sử nhập muộn nhất quán, chấp nhận nhân sự nhập và giải quyết danh sách thiếu/mâu thuẫn.
- **Bản ghi:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#appearance-eligibility-and-goalkeeper-basis).
- **Phase chịu ảnh hưởng:** Tích hợp lịch sử đăng ký PHASE 3, biên bản/giữ sạch lưới PHASE 5, đầu ra lịch sử PHASE 6/PHASE 7 và kiểm chứng thời gian/thủ môn PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** D065 bên dưới chốt chính sách bàn thắng/thẻ/phút/trọng tài. Đồng giải Găng tay vàng, schema ra sân/bản chụp chi tiết và hợp đồng hiệu chỉnh/đồng thời. Chưa chọn phân hệ kỷ luật hoặc thay người.

### D065 - Phút sự kiện có cấu trúc, kiểm tra tỷ số và tham chiếu chữ ký trọng tài

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q65 đã gộp, Nhóm trưởng chọn phương án A: “tôi chọn A.”, xác nhận gói sự kiện/trọng tài.
- **Nguồn:** O09/O12; BM3, QĐ3.3-QĐ3.5, UC16-UC19; D046-D049/D063/D064.
- **Phút sự kiện:** Lưu phút chính nguyên 1-90 và phút bù giờ nguyên không âm; bù giờ dương chỉ đi với mốc 45 hoặc 90. Hiển thị 45+2 hoặc 90+5, không đổi 45+2 thành phút 47. Bù giờ hiệp một xếp trước phút 46.
- **Phạm vi:** Đây là quy ước biên bản phiên bản đầu, không có sự kiện hiệp phụ/loạt luân lưu. Thời lượng kế hoạch D061 vẫn riêng.
- **Sự kiện hợp lệ:** Cần cầu thủ thuộc danh sách ra sân, CLB đúng với cầu thủ, loại hợp lệ từ danh mục áp dụng cho trận và phút hợp lệ. Giữ loại mặc định nguồn, không tự thêm loại.
- **Tỷ số:** Tính từ bàn thắng hợp lệ; phản lưới nhà cộng cho đội đối phương, không cộng bàn cá nhân. Tỷ số cuối được nhập phải khớp; không khớp chặn trình/xác nhận.
- **Thẻ:** Ghi vàng/đỏ theo biên bản, không tự tạo treo giò, xử thua hoặc phân hệ kỷ luật.
- **Căn cứ trọng tài:** Trước trình cần họ tên trọng tài, mã/tham chiếu biên bản gốc và xác nhận của người nhập đã đối chiếu chữ ký trên bản gốc. Giữ người xác nhận/thời điểm; người duyệt kiểm tra cùng biên bản.
- **Lịch sử/tệp:** Giữ sự kiện/căn cứ trọng tài trong bản xác nhận; hiệu chỉnh qua UC19. Phiên bản đầu không yêu cầu ảnh chữ ký, tệp quét đính kèm hoặc chữ ký số. Đây là cách biểu diễn căn cứ chữ ký BM3 trong v2, không bỏ trường nguồn.
- **Phương án/cơ sở:** Tham chiếu bản gốc và ghi nhận đối chiếu chữ ký so với bắt buộc đính kèm bản quét có chữ ký, cùng quy tắc sự kiện/tỷ số. Nhóm trưởng chọn truy vết không cần hạ tầng tệp/chữ ký, chấp nhận phụ thuộc nhân sự kiểm tra và khả năng truy xuất bản gốc.
- **Bản ghi:** [ADR 0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#event-minutes-scores-and-referee-basis); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Kiểm tra biên bản PHASE 5, đầu ra chính thức/lịch sử PHASE 6/PHASE 7 và kiểm chứng biên/căn cứ PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Schema/độ dài sự kiện/trọng tài cụ thể, định dạng tham chiếu nguồn, phản hồi sự kiện nghi trùng, hợp đồng bản chụp/hiển thị/API và đồng thời chi tiết. Chưa chọn công nghệ tải tệp hoặc chữ ký số.

### D066 - Đồng hạng trên bảng xếp hạng và đồng giải cá nhân

- **Trạng thái:** CONFIRMED bởi Nhóm trưởng ngày 2026-10-25 (Asia/Bangkok).
- **Bằng chứng xác nhận:** Khi trả lời Q66 đã gộp, Nhóm trưởng chọn phương án A: “Tôi chọn A.”.
- **Nguồn:** O05/O06/O12; QĐ5.3-QĐ5.5/QĐ5.7, BM5.1-BM5.3; D045/D064.
- **Hạng trong mùa:** CLB bằng toàn bộ tiêu chí chính đang áp dụng cùng hạng theo kiểu 1, 2, 2, 4. Không dùng tiêu chí đối đầu dành cho phân định cuối mùa trong mùa. Sắp theo mã CLB ổn định trong nhóm hòa chỉ để hiển thị, không tạo lợi thế hoặc hạng thể thao riêng.
- **Vị trí quan trọng cuối mùa:** Đánh dấu nhóm hòa ảnh hưởng chức vô địch, suất dự giải hoặc xuống hạng cần phân định bằng tiêu chí phụ/playoff của nguồn. Không phân định kết quả thể thao bằng tên/mã CLB. Luồng phân định chi tiết vẫn mở.
- **Giải cá nhân:** Giữ đồng Vua phá lưới theo nguồn, không tự thêm kiến tạo/số trận/phút thi đấu. Thủ môn cùng số trận giữ sạch lưới cao nhất đồng Găng tay vàng, không thêm tỷ lệ, số trận ra sân hoặc bàn thua làm tiêu chí phụ.
- **Thành tích dương:** Chỉ xác định người nhận Vua phá lưới khi có ít nhất một bàn cá nhân hợp lệ, Găng tay vàng khi có ít nhất một trận giữ sạch lưới. Nếu chưa có thì hiển thị chưa có người đạt, không trao đồng giải toàn bộ người có số 0.
- **Tính lại/chốt:** Hiệu chỉnh kết quả chính thức hợp lệ cập nhật nhóm đồng hạng và dẫn đầu giải cá nhân. Danh hiệu cuối cùng được xác nhận qua tổng kết mùa.
- **Phương án/cơ sở:** Đồng Găng tay vàng so với thêm tiêu chí ít trận ra sân hơn rồi đồng giải nếu vẫn hòa. Cả hai giữ chính sách CLB/Vua phá lưới đã đề xuất. Nhóm trưởng chọn công bằng thành tích bằng nhau, rõ ràng và không thêm tiêu chí ngoài nguồn, chấp nhận nhiều người nhận Găng tay vàng và hạng trong mùa không riêng từng CLB.
- **Bản ghi:** [ADR 0014](../../../docs/adr/0014-shared-ranks-and-individual-awards.md); [glossary](../GLOSSARY.md#bổ-sung-context-v2).
- **Phase chịu ảnh hưởng:** Xếp hạng/thống kê PHASE 5, tra cứu công khai PHASE 6, báo cáo/tổng kết PHASE 7 và kiểm chứng hòa/giải thưởng PHASE 10. Không đổi trạng thái Phase.
- **Còn mở:** Tính đối đầu/nhóm nhiều CLB cụ thể, tham số suất dự giải/xuống hạng, ghi nhận playoff, duyệt tổng kết và hợp đồng kỹ thuật. D066 không chốt các lựa chọn kết thúc mùa còn lại.

## Cải tiến v2 chờ quyết định

Xem [danh sách quyết định chờ xử lý](pending-decisions.md). V2-EXT-01 ghi nhận cải tiến Live Match Tracking / Live Score do Nhóm trưởng yêu cầu và ranh giới dữ liệu tham khảo đã chỉ định. Hoãn phỏng vấn thiết kế tới khi xong các nhóm quyết định nền tảng hiện tại, và phải chủ động đưa ra trước tổng kết/đề xuất phê duyệt gói v2. Đây không phải D037, không phải Oxx đã giải quyết và chưa phải thiết kế triển khai được duyệt.

## Độ bao phủ quyết định

Cả 16 vấn đề nguồn vẫn **OPEN** cho đến khi các quyết định thành phần được xác nhận. O12 được chốt một phần qua D001, D002, D007, D011, D022, D024, D030, D031, D034-D036 và D042-D066. O03 đã có chính sách xác nhận qua múi giờ D024 và khoảng CLB/sân, đệm, biên, phạm vi xung đột toàn hệ thống D061; giá trị mùa và thực thi kỹ thuật vẫn mở. O04 được chốt một phần qua D032-D034 và căn cứ tra cứu mùa D059, gồm ngoại lệ rõ cho ngày sinh cầu thủ và xem nội bộ theo trách nhiệm; phạm vi trường/tệp/nhật ký chi tiết vẫn còn mở. O08 được chốt một phần qua D003-D023, D025-D031, D033-D034, D037-D041 và D051/D053/D055-D057 và D062-D063. O07 được chốt một phần qua quy tắc tách người duyệt quy định tại D005 và mô hình/trách nhiệm/giới hạn thẩm quyền/ma trận người nhận/chính sách chấm dứt/thu hồi/phiên/thời gian ủy quyền D013-D023 và D025-D030; D042 chốt phiên bản quy định đã duyệt bất biến và D043 cho hiệu lực ngay/tương lai không lùi quá khứ; D044 khóa cấu trúc thi đấu sau duyệt lịch ban đầu và D045 khóa điểm/thứ tự xếp hạng sau kết quả chính thức đầu tiên; D046 giữ mã và ý nghĩa loại bàn thắng/thẻ được tham chiếu và D047 gắn danh mục áp dụng với giờ bắt đầu thực tế được ghi nhận; D050 giới hạn mỗi mùa một bản tương lai đã duyệt và D051 chốt hủy/thay thế có kiểm soát cùng kiểm tra khi tới hạn; D052 cho thay đổi quy định đăng ký tương thích và kiểm tra lại hồ sơ chờ; D053 chốt lịch, hạn tiếp nhận và ngoại lệ cá biệt; chi tiết hiệu lực và chính sách nhóm còn lại vẫn mở. O09 được chốt một phần qua chính sách sửa sai chung D036 và giữ loại sự kiện/danh mục áp dụng theo D046-D049, gồm luồng ghi nhận/hiệu chỉnh giờ bắt đầu thực tế, thêm chính sách căn cứ điều kiện D054 và hiệu chỉnh/rà soát tác động đăng ký hợp lệ D057; D058 chốt định danh bằng mã, cảnh báo trùng và số áo theo thời gian; D059 chốt trường bắt buộc hồ sơ gốc/đăng ký và mốc chụp; D063 chốt trạng thái biên bản/trận và bắt buộc giờ bắt đầu/kết thúc thực tế; D064 chốt điều kiện ra sân và căn cứ thủ môn; D065 chốt phút/kiểm tra tỷ số và căn cứ chữ ký trọng tài; hợp đồng hiệu chỉnh/kỹ thuật và schema/hiển thị chi tiết vẫn mở. Chưa vấn đề nào RESOLVED. O10 được chốt một phần qua khóa cấu trúc D044 và tự sinh cặp đấu, cấu hình hỗ trợ, nháp chưa hoàn chỉnh, trình toàn bộ lịch D060; D062 bổ sung bảo vệ sinh lại, điều chỉnh theo phiên bản và công bố ngay; hợp đồng vòng đời/thao tác và kỹ thuật cụ thể vẫn mở. O01 được chốt một phần qua chính sách thay đổi/tác động D052 và cấu hình/so sánh U21, nhân sự xác minh homegrown theo D054; D059 chốt trường căn cứ bắt buộc; giá trị mùa và hợp đồng kiểm tra/định dạng chi tiết vẫn mở. O02 có thêm chính sách đợt/hạn/ngoại lệ D053 và luồng CLB/cầu thủ theo phiên bản D055; D056 bổ sung khoảng hiệu lực và chuyển CLB nhất quán; D057 bổ sung hiệu chỉnh đăng ký lịch sử độc lập; ngày cụ thể, chuyển trạng thái ngoại lệ/thao tác chi tiết, tác động đóng mùa và hợp đồng thao tác/hiệu chỉnh chi tiết vẫn mở. O06 được chốt một phần qua căn cứ vị trí thủ môn trong biên bản và chặn thiếu/nhiều thủ môn D064; D066 bổ sung đồng Găng tay vàng và ngưỡng thành tích dương. O05 được chốt một phần qua hiển thị đồng hạng và đánh dấu vị trí cần phân định D066; đối đầu/playoff/tổng kết chi tiết vẫn mở. O11 và O13-O16 chưa có nội dung giải quyết được xác nhận trong v2. Yêu cầu Live Score mới được ghi chờ riêng tại V2-EXT-01, không tính là giải quyết vấn đề v1. [Sổ v1](../open-decisions.md) được giữ làm mốc nguồn; phần bổ sung này ghi các xác nhận phát sinh sau đó.

## Thứ tự phỏng vấn

Hướng dẫn phỏng vấn được Nhóm trưởng cập nhật sau Q50: chỉ hỏi quyết định đáng kể cần phê duyệt, gộp lựa chọn chính sách liên quan khi có thể đánh giá cùng nhau và không hỏi lại quyết định đã chốt. Giữ tính đầy đủ, nhất quán và khả năng triển khai. Phân biệt chi tiết kỹ thuật được đề xuất với quyết định đã xác nhận; xin xác nhận đánh đổi mới đáng kể thay vì từng hệ quả thuần túy. Không dùng giảm số câu để che giấu yêu cầu chưa giải quyết.

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

Q1-Q66 đã được xác nhận thành D001-D066; toàn bộ gói vẫn DRAFT. Q66 chốt đồng hạng, đồng giải cá nhân và ngưỡng thành tích dương. Nhóm trưởng yêu cầu nghỉ trước Q67; chưa ghi câu hỏi hoặc câu trả lời Q67. Tiếp tục nhóm đối đầu/playoff và tổng kết mùa, xác định lại phụ thuộc trước khi hỏi. Ước lượng cập nhật còn 30-45 lượt câu hỏi, gồm câu phụ dự kiến, thiết kế kỹ thuật, vận hành, Live Score và rà soát/phê duyệt cuối; không phải trần cố định. Chỉ hỏi quyết định đáng kể, gộp chính sách liên quan và tránh xác nhận lặp. Phỏng vấn V2-EXT-01 sau các nhóm nền tảng và trước tổng kết/phê duyệt. Commit message chỉ được yêu cầu ở mức đề xuất; không cho phép commit/push.
