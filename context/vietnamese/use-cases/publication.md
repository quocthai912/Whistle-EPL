# Tra cứu, báo cáo và tin tức: UC21-UC25

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Luồng UC hiện hành giữ mã/trang nguồn và tích hợp làm rõ được duyệt rõ. Quy tắc chính thức của miền được liên kết bên dưới; bằng chứng duyệt/nguồn/lý do ở ADR English. Đây là tài liệu Context, không phải feature Specification sinh mới. Hình phân tích không phải API/schema đã duyệt. Xem [nguồn](../sources.md).

## UC21

Quy tắc hiện hành: [D032](publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ), [D033](publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ).

**Tra cứu thông tin trận đấu**

Nguồn: §2.4.1.21, tr.123-126 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Quy tắc hiện hành: [D066](publication.md#d066---đồng-hạng-trên-bảng-xếp-hạng-và-đồng-giải-cá-nhân).

**Lập và xuất báo cáo giải đấu**

Nguồn: §2.4.1.22, tr.127-130 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Quy tắc hiện hành: [D032](publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ), [D033](publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ), [D066](publication.md#d066---đồng-hạng-trên-bảng-xếp-hạng-và-đồng-giải-cá-nhân).

**Tra cứu thông tin và thống kê câu lạc bộ, cầu thủ**

Nguồn: §2.4.1.23, tr.130-133 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Nguồn: §2.4.1.24, tr.134-136 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Nguồn: §2.4.1.25, tr.136-139 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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
## Hiển thị media được quản lý hiện hành

Dùng [chính sách media](../design/media.md) cho Logo hiện tại, ảnh cầu thủ và fallback. Hiển thị không đổi thẩm quyền/tính toán nghiệp vụ UC.

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](../open-decisions.md).

### D032 - Phạm vi công khai gồm ngày sinh cầu thủ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d032-english-evidence).

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

- **Thay đổi mặc định theo nguồn:** BM-05 v1 ghi ngày sinh cần quyền phù hợp. Nhóm trưởng thay đổi rõ mặc định đó cho ngày sinh cầu thủ trong v2. Giữ PDF nguồn và phê duyệt v1 trong Git; Specification/nghiệm thu sau này phải truy vết ngoại lệ đã duyệt, không khẳng định công khai ngày sinh vốn là mặc định v1. Quyết định này không công khai liên hệ hoặc dữ liệu nội bộ khác.

- **Phạm vi cung cấp:** Backend phải áp dụng thống nhất phạm vi công khai cho dữ liệu UI/API công khai và tệp phục vụ công khai nếu có. Quyết định này không tự cho phép tạo chức năng xuất tệp công khai. Phạm vi xem/xuất nội bộ vẫn cần thiết kế.

### D033 - Xem dữ liệu nội bộ theo trách nhiệm nghiệp vụ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d033-english-evidence).

- **Nguồn:** O04/O08; BM-02/BM-05/BM-06, PDF tr.23-24; UC03/UC04, các UC đăng ký/lịch/kết quả; [D003](administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D004](administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải)/[D019](../design/access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu)/[D032](publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ).

- **Quyết định:** Đăng nhập và được phân công trong mùa không tự cho phép xem mọi thông tin nội bộ. Áp dụng phạm vi xem theo trách nhiệm sau.

| Nhóm dữ liệu nội bộ | Vai trò được xem trong mùa phụ trách |
|---|---|
| Hồ sơ tham gia CLB, đại diện và liên hệ | Ban tổ chức / Người quản lý mùa giải; Nhân viên đăng ký |
| Hồ sơ đăng ký cầu thủ và bằng chứng homegrown | Ban tổ chức / Người quản lý mùa giải; Nhân viên đăng ký |
| Lịch nháp và đề nghị điều chỉnh chưa duyệt | Ban tổ chức / Người quản lý mùa giải; Nhân viên lịch thi đấu |
| Biên bản, kết quả chưa chính thức và đề xuất sửa kết quả | Ban tổ chức / Người quản lý mùa giải; Nhân viên kết quả |
| Đề xuất thay đổi quy định | Ban tổ chức / Người quản lý mùa giải; nhân viên có ủy quyền tương ứng theo [D019](../design/access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu) |
| Quản trị tài khoản và tra cứu nhật ký toàn hệ thống | Quản trị viên hệ thống theo UC03/UC04 |

- **Nhiều vai trò và ủy quyền:** Người kiêm vai trò được xem theo các vai trò thực sự được phân công trong mùa. Ủy quyền chỉ bổ sung dữ liệu cần cho thao tác. Chức năng cần kiểm tra đủ điều kiện có thể nhận kết quả và lý do cần thiết, không mặc nhiên nhận toàn bộ hồ sơ nguồn.

- **Quản trị và lịch sử:** Quản trị viên hệ thống không tự có quyền xem mọi màn hình hồ sơ nghiệp vụ; làm nghiệp vụ cần vai trò tương ứng. Lịch sử gắn đối tượng được xem trong phạm vi quyền của đối tượng; tra cứu nhật ký toàn hệ thống vẫn theo UC04. Trường nhật ký và quyền xuất tệp cụ thể còn mở, nên UC04 không ngầm cấp mọi màn hình nghiệp vụ hoặc nội dung nhật ký không giới hạn.

### D066 - Đồng hạng trên bảng xếp hạng và đồng giải cá nhân

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0014-shared-ranks-and-individual-awards.md#d066-english-evidence).

- **Nguồn:** O05/O06/O12; QĐ5.3-QĐ5.5/QĐ5.7, BM5.1-BM5.3; [D045](registration.md#d045---khóa-điểm-số-và-thứ-tự-tiêu-chí-xếp-hạng-sau-kết-quả-chính-thức-đầu-tiên)/[D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản).

- **Hạng trong mùa:** CLB bằng toàn bộ tiêu chí chính đang áp dụng cùng hạng theo kiểu 1, 2, 2, 4. Không dùng tiêu chí đối đầu dành cho phân định cuối mùa trong mùa. Sắp theo mã CLB ổn định trong nhóm hòa chỉ để hiển thị, không tạo lợi thế hoặc hạng thể thao riêng.

- **Vị trí quan trọng cuối mùa:** Đánh dấu nhóm hòa ảnh hưởng chức vô địch, suất dự giải hoặc xuống hạng cần phân định bằng tiêu chí phụ/playoff của nguồn. Không phân định kết quả thể thao bằng tên/mã CLB. Luồng phân định chi tiết vẫn mở.

- **Giải cá nhân:** Giữ đồng Vua phá lưới theo nguồn, không tự thêm kiến tạo/số trận/phút thi đấu. Thủ môn cùng số trận giữ sạch lưới cao nhất đồng Găng tay vàng, không thêm tỷ lệ, số trận ra sân hoặc bàn thua làm tiêu chí phụ.

- **Thành tích dương:** Chỉ xác định người nhận Vua phá lưới khi có ít nhất một bàn cá nhân hợp lệ, Găng tay vàng khi có ít nhất một trận giữ sạch lưới. Nếu chưa có thì hiển thị chưa có người đạt, không trao đồng giải toàn bộ người có số 0.

- **Tính lại/chốt:** Hiệu chỉnh kết quả chính thức hợp lệ cập nhật nhóm đồng hạng và dẫn đầu giải cá nhân. Danh hiệu cuối cùng được xác nhận qua tổng kết mùa.

## DASHBOARD-01 - Dashboard tổng quan mùa giải

**Phạm vi:** CONFIRMED bắt buộc phiên bản đầu theo chỉ đạo Nhóm trưởng ngày 2026-10-26 (Asia/Bangkok). UC15/UC21/UC23 hiện có cùng xem trước UC22/UC24-UC25 phù hợp cung cấp tổng quan chỉ đọc; không thêm tác nhân hoặc UC.

Hợp đồng thành phần/chỉ số/bố cục đã chốt do [D068](#d068---dashboard-tổng-quan-mùa-giải-công-khai) sở hữu.

### D068 - Dashboard tổng quan mùa giải công khai

**Quy tắc đã chốt:** Nhóm trưởng xác nhận rõ Q68 phương án A và toàn bộ gói đề xuất. [Phê duyệt và lý do](../../../docs/adr/0008-public-information-and-player-birth-dates.md#q68---shared-public-season-dashboard).

- **Người xem:** Khách và người đã đăng nhập cùng dùng Dashboard của mùa được chọn, chỉ chứa dữ liệu công khai theo D032. Người nội bộ có liên kết đến chức năng theo quyền; hồ sơ nháp, yêu cầu chờ duyệt và dữ liệu nhạy cảm ở màn hình nghiệp vụ. Quyết định này không yêu cầu Dashboard công việc nội bộ riêng.
- **Bộ đếm:** Hiển thị tên/trạng thái mùa, số CLB đã duyệt tham gia, tổng trận thuộc lịch đã công bố, số trận có Official Result và số trận chưa diễn ra. Chưa diễn ra bằng Chưa bắt đầu cộng Đã hoãn. Hiển thị số trận hoãn riêng và ghi rõ là tập con của chưa diễn ra, không cộng thành tổng nhóm độc lập. Nhận diện riêng Đang diễn ra và Đã kết thúc chưa có Official Result; không tính hai trạng thái này là chưa diễn ra hoặc có kết quả chính thức. Không công khai tỷ số chưa xác nhận hoặc chi tiết duyệt nội bộ.
- **Lịch/kết quả:** Tối đa năm trận Chưa bắt đầu sắp tới có lịch đã duyệt, theo giờ lịch tăng dần. Trận hoãn có khu vực riêng thông báo chưa xác định lịch mới theo D067. Hiển thị năm Official Results gần nhất theo thời điểm thi đấu thực tế giảm dần. Có Logo, trường trạng thái/thời gian/sân/tỷ số phù hợp và điều hướng đầy đủ, tuân thủ ranh giới trường công khai.
- **BXH/thành tích:** Xem trước năm CLB đầu bảng và danh sách dẫn đầu ghi bàn/giữ sạch lưới theo D066. Phần xem trước bị rút gọn phải báo còn mục và liên kết danh sách đầy đủ; không khiến người xem hiểu người đồng dẫn đầu bị ẩn không cùng hạng/giải. Xem trước không phải xác nhận danh hiệu cuối mùa.
- **Hồ sơ/tin:** Liên kết rõ tới danh sách CLB/cầu thủ có tìm kiếm/lọc tại đó; không tải hàng trăm hồ sơ vào Dashboard. Tối đa năm tin/thông báo đã công bố, mới nhất trước. Bản nháp chưa công bố vẫn nội bộ.
- **Bố cục:** Tổng quan mùa ở đầu, sau đó lịch sắp tới/kết quả gần đây, BXH/thành tích, điều hướng hồ sơ/tin tức. Điện thoại xếp một cột. Đây là bố cục nền; chi tiết mỹ thuật hoàn thiện khi thiết kế UI, không chọn thêm framework/thư viện.
- **Độ mới/lỗi:** Tải khi mở trang, đổi mùa hoặc chủ động làm mới; không yêu cầu cập nhật liên tục. Hiển thị thời điểm tải thành công. Từng khối có Loading, Empty, Error và thử lại độc lập; khối lỗi không làm mất khối thành công hoặc biến lỗi thành số 0/dữ liệu giả. Giữ thống kê chỉ từ kết quả chính thức và vận hành độc lập API ngoài.
