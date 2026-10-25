# Sân vận động và lịch thi đấu: UC12-UC15

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Luồng UC hiện hành giữ mã/trang nguồn và tích hợp làm rõ được duyệt rõ. Quy tắc chính thức của miền được liên kết bên dưới; bằng chứng duyệt/nguồn/lý do ở ADR English. Đây là tài liệu Context, không phải feature Specification sinh mới. Hình phân tích không phải API/schema đã duyệt. Xem [nguồn](../sources.md).

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

Quy tắc hiện hành: [D060](scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu), [D061](scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống), [D062](scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản).

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
2. Lịch chưa đủ dữ liệu: lưu nháp chưa hoàn chỉnh theo [D060](scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu); không phải lịch chính thức.
3. Người có thẩm quyền độc lập duyệt lịch: công bố ngay theo [D062](scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản); trả/từ chối giữ lịch chưa công bố để sửa.

**Ngoại lệ:**

1. Sai số vòng hoặc số trận: từ chối xác nhận lịch.
2. Trùng thời gian thi đấu của cùng câu lạc bộ hoặc xung đột sân: thông báo các trận liên quan.
3. Cặp câu lạc bộ không đủ hai lượt sân nhà/sân khách theo thể thức: yêu cầu sửa.
4. Lỗi lưu dữ liệu: không để lại lịch chính thức chỉ được lưu một phần.

## UC14

Quy tắc hiện hành: [D061](scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống), [D062](scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản).

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
7. Trình điều chỉnh theo phiên bản; người có thẩm quyền khác, gồm người nhận ủy quyền đủ điều kiện, duyệt theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D019](../design/access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu)/[D062](scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản).
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
## Hiển thị media được quản lý hiện hành

Dùng [chính sách media](../design/media.md) cho Logo hiện tại, ảnh cầu thủ và fallback. Hiển thị không đổi thẩm quyền/tính toán nghiệp vụ UC.

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](../open-decisions.md).

### D060 - Tự sinh cặp đấu và hoàn thiện lịch nháp bằng nhập liệu

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d060-english-evidence).

- **Nguồn:** O10/O12; QĐ2, UC13, TH-02; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu).

- **Phạm vi hỗ trợ:** Phiên bản đầu vòng tròn hai lượt với số CLB chẵn từ 4 đến 20, mặc định 20. Khoảng 4-20 là lựa chọn phạm vi v2 đã chốt. Báo rõ số lẻ, một lượt và thể thức khác chưa hỗ trợ thay vì sinh lịch sai.

- **Đầu vào/sinh lịch:** Nhân viên lịch thi đấu chọn đúng số CLB theo cấu hình, tất cả có hồ sơ tham gia đã duyệt. Tự sinh đầy đủ vòng/cặp đấu, đảo sân nhà/sân khách giữa hai lượt: 2*(N-1) vòng và N*(N-1) trận; mặc định tạo 38 vòng, 380 trận.

- **Hoàn thiện:** Nhân sự nhập ngày giờ; gợi ý sân nhà đã đăng ký. Thay sân vẫn chịu điều kiện phê duyệt của nguồn. Không yêu cầu tự động tối ưu toàn bộ lịch ngày giờ/phân sân.

- **Nháp/phê duyệt:** Lưu nháp chưa hoàn chỉnh kèm chỉ rõ thiếu trường/xung đột; không công khai nháp. Chỉ trình toàn bộ lịch ban đầu khi đủ dữ liệu, đúng cấu trúc và đạt kiểm tra CLB/sân. Công bố cần phê duyệt theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt); không duyệt riêng từng phần lịch ban đầu.

### D061 - Khoảng kế hoạch theo mùa và kiểm tra xung đột lịch toàn hệ thống

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d061-english-evidence).

- **Nguồn:** O03/O07/O10/O12; QĐ2.4-QĐ2.6, UC13/UC14; [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam)/[D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu)/[D060](scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu).

- **Tham số:** Bắt buộc có thời lượng trận dự kiến, đệm chuẩn bị sân trước trận và đệm giải phóng sân sau trận được duyệt theo mùa, đơn vị phút. Thời lượng dương; đệm không âm. Không ngầm định 90 phút hoặc giá trị đệm. Khóa cả ba từ khi duyệt lịch ban đầu trong phạm vi phiên bản đầu.

- **Khoảng:** CLB dùng [giờ theo lịch, giờ theo lịch + thời lượng dự kiến). Sân chiếm dụng [giờ theo lịch - đệm chuẩn bị, giờ kết thúc dự kiến + đệm giải phóng). Từ chối khoảng CLB hoặc sân chồng lấn; cho nối tiếp đúng biên.

- **Phạm vi:** Hoãn đã duyệt giải phóng phân bổ theo [D067](#d067---phê-duyệt-hoãn-và-trở-lại-lịch-qua-uc14). Kiểm tra cùng CLB/sân trên toàn hệ thống, gồm khác mùa. Kiểm tra nháp với chính nó và lịch đã duyệt; nháp hoặc đề nghị chờ không giữ chỗ.

- **Phê duyệt/điều chỉnh:** Kiểm tra lại xung đột trước khi duyệt thành công, gồm yêu cầu đồng thời. Điều chỉnh thay phân bổ cũ của chính trận, không xung đột với bản thân. Đổi ngày giờ/sân vẫn theo UC14.

- **Ranh giới vận hành:** Khoảng phục vụ kế hoạch; giờ bắt đầu thực tế vẫn theo [D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận)/[D048](results.md#d048---ghi-giờ-bắt-đầu-thực-tế-trong-biên-bản-và-xác-nhận-cùng-kết-quả-chính-thức) và không tự sửa lịch đã duyệt. Phiên bản đầu không thêm ràng buộc nghỉ tối thiểu giữa trận hoặc thời gian di chuyển CLB.

### D062 - Duyệt lịch đồng thời công bố và điều chỉnh theo phiên bản

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d062-english-evidence).

- **Nguồn:** O08/O09/O10/O12; UC13-UC15; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D019](../design/access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu)/[D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu)/[D060](scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu)/[D061](scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống).

- **Vòng đời ban đầu:** Nhân viên lịch thi đấu soạn và trình lịch đầy đủ; người có thẩm quyền khác người chuẩn bị/chỉnh sửa duyệt. Duyệt thành công công bố ngay, không thêm bước công bố riêng.

- **Bản đang chờ:** Nội dung đã trình là bất biến. Người lập được rút trước quyết định; người duyệt được trả bổ sung hoặc từ chối kèm lý do. Sửa/trình lại tạo phiên bản mới và giữ lịch sử.

- **Sinh lại:** Chỉ sinh lại khi lịch ban đầu chưa duyệt và đang nháp, có xác nhận thay thế và dấu vết bản trước. Sau công bố không sinh lại toàn bộ hoặc đổi cặp đấu, vòng, vai trò sân nhà/sân khách.

- **Điều chỉnh:** Đề xuất đổi ngày giờ hoặc sân kèm lý do và giá trị trước/sau. Một đề xuất có thể chứa nhiều trận cùng mùa; duyệt/áp dụng toàn bộ hoặc không phần nào. Lịch cũ vẫn công khai khi chờ duyệt.

- **Điều kiện trận:** Chỉ điều chỉnh trận chưa bắt đầu. Nếu quá giờ theo lịch, người duyệt phải có căn cứ xác nhận trận chưa diễn ra; chỉ riêng quá giờ theo lịch không chứng minh đã hoặc chưa thi đấu.

- **Kiểm tra cuối/công bố:** Khi duyệt điều chỉnh kiểm tra lại trạng thái trận, quyền, phiên bản lịch và xung đột [D061](scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống). Dữ liệu nền đã đổi thì yêu cầu rà soát/trình lại. Duyệt thành công cập nhật lịch công khai và giữ lịch sử. Giữ thẩm quyền/tách người theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D019](../design/access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu), gồm người duyệt điều chỉnh được ủy quyền.

## POSTPONE-01 - Quản lý hoãn trận phiên bản đầu

**Phạm vi:** CONFIRMED theo chỉ đạo Nhóm trưởng ngày 2026-10-26 (Asia/Bangkok), sau đặc tả ban đầu. **Thẩm quyền/vòng đời chi tiết:** CONFIRMED tại D067, Q67 phương án A và toàn bộ gói quy tắc chung. Đây là cải tiến rõ của package hiện hành, không phải yêu cầu Chương 1-2 nguồn.

- UC14 phải ghi nhận/hiển thị Postponed (Đã hoãn) cho trận chưa thể diễn ra theo lịch công bố, phân biệt Chưa bắt đầu, Đang diễn ra và Đã kết thúc.
- Ghi nhận nghiệp vụ xác lập hoãn, không tự suy từ giờ theo lịch. Cần đúng thẩm quyền, lý do, người thực hiện, thời điểm và lịch sử trước/sau.
- Hiển thị ở lịch công bố, chi tiết trận và tra cứu liên quan. Công khai trạng thái không tự công khai lý do/người thực hiện nội bộ.
- Ngày giờ/sân mới theo UC14, phê duyệt/tách người D062 và kiểm tra xung đột D061. Không hiển thị đề xuất chưa duyệt như lịch chính thức. Giờ cũ nếu hiển thị cho trận hoãn chỉ là bối cảnh lịch sử, không phải lịch mới đã xác nhận.
- Hoãn không tạo Official Result hoặc đổi bảng xếp hạng/thống kê. Giữ phân biệt biên bản/kết quả và điều kiện trận kết thúc khi xác nhận theo D063.
- Không mở rộng sang xử thua, hủy vĩnh viễn hoặc trận đã bắt đầu bị gián đoạn.
Thẩm quyền, chuyển trạng thái và phân bổ theo [D067](#d067---phê-duyệt-hoãn-và-trở-lại-lịch-qua-uc14).

### D067 - Phê duyệt hoãn và trở lại lịch qua UC14

**Quy tắc đã chốt:** Nhóm trưởng xác nhận rõ Q67 phương án A và toàn bộ gói quy tắc chung. [Phê duyệt và lý do](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#q67---postponement-approval-and-allocation).

- **Thẩm quyền:** Nhân viên phụ trách lịch thi đấu lập/trình đề xuất hoãn UC14. Người quản lý mùa giải hoặc người được ủy quyền hợp lệ theo D019 phê duyệt; người duyệt phải khác mọi người chuẩn bị/chỉnh sửa. Thao tác ủy quyền duyệt điều chỉnh lịch UC14 hiện có bao gồm hoãn trận; giữ mọi điều kiện ủy quyền khác. Không tạo ngoại lệ Người quản lý thao tác trực tiếp trái D005.
- **Điều kiện và bản chờ:** Chỉ hoãn trận chưa bắt đầu, kiểm tra lại khi phê duyệt. Từ chối hoãn trận đã bắt đầu/kết thúc hoặc có Official Result. Đề xuất đang chờ không xác lập trạng thái Đã hoãn chính thức; giữ quy tắc phiên bản, tách người và kiểm tra cuối D062, gồm căn cứ chưa thi đấu khi đã quá giờ lịch.
- **Hoãn có hiệu lực:** Duyệt thành công chuyển Chưa bắt đầu sang Đã hoãn, lưu lý do, người lập/thao tác, người duyệt, thời điểm và lịch sử trước/sau. Tra cứu công khai hiển thị "Đã hoãn - chưa xác định lịch mới"; ngày giờ cũ nếu hiển thị phải nhận diện rõ là lịch trước khi hoãn, không phải lịch thay thế đã xác nhận.
- **Phân bổ:** Khi hoãn có hiệu lực, giải phóng khoảng sử dụng của CLB và khoảng chiếm dụng sân cũ khỏi kiểm tra xung đột D061, giữ lịch sử. Trước khi duyệt, phân bổ cũ vẫn có hiệu lực. Đề xuất lịch thay thế chưa duyệt không giữ chỗ.
- **Trở lại lịch đã duyệt:** Chỉ điều chỉnh ngày giờ/sân UC14 được phê duyệt mới chuyển Đã hoãn về Chưa bắt đầu, sau kiểm tra quyền, trạng thái, phiên bản và xung đột D061/D062. Giữ mã trận, vòng, cặp đấu và chủ/khách. Không chuyển trực tiếp Đã hoãn sang Đang diễn ra khi chưa qua bước trở lại đã duyệt.
- **Hoãn nhầm:** Khôi phục cũng theo phê duyệt UC14 và kiểm tra xung đột; không có hoàn tác bỏ qua phê duyệt. Hoãn/xếp lịch lại không tạo Official Result hoặc đổi BXH/thống kê. Xử thua, hủy vĩnh viễn và gián đoạn trận đã bắt đầu vẫn ngoài bổ sung này.
