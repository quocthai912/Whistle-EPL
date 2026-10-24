# Progress Checker - Phát triển và nghiệm thu theo Phase

Đây là **phân rã phạm vi dự kiến của Context v1, chờ nhóm trưởng duyệt**, không phải Spec/Plan/Task. Yêu cầu gốc tại [nghiệp vụ](business.md), [chất lượng](quality.md), [UC](README.md); ma trận đầy đủ tại [sources.md](sources.md). Mã PHASE 1–PHASE 10 là mã tổ chức nội bộ, không có trong PDF. Mười Phase đều bắt buộc cho phạm vi hiện tại; tích hợp API ngoài ở TT-05 là điều kiện, không phát sinh Phase tích hợp bắt buộc.

## Trạng thái và bằng chứng

| Trạng thái | Nghĩa |
|---|---|
| `NOT_STARTED` | Bằng chứng kiểm kê cho thấy chưa bắt đầu triển khai phạm vi Phase |
| `IN_PROGRESS` | Đang triển khai, ghi rõ phạm vi đã làm và chưa nghiệm thu |
| `BLOCKED` | Ghi rõ vấn đề/phụ thuộc thực sự đang ngăn công việc, người xử lý và điều kiện gỡ |
| `COMPLETED` | Đã có chức năng thực tế, đạt mọi tiêu chí Phase, bằng chứng kiểm chứng đầy đủ và kết quả nghiệm thu được ghi nhận |
| `UNKNOWN` | Chưa đủ kiểm tra/bằng chứng để xác định tình trạng; không suy ra chưa làm hay hoàn thành |

Kiểm kê ngày 24/10/2026 (Asia/Bangkok), HEAD `a7631efc05061e221a2d7d4ea3da80aafc084615`, working tree sạch trước khi tạo v1: `git status --short`, `git ls-files` và `rg --files` cho thấy chỉ hướng dẫn agent, skills, bộ khung `.specify`, LICENSE và cấu hình; chưa có mã nguồn ứng dụng, manifest/build ứng dụng hay bộ kiểm thử chức năng. `.specify/memory/constitution.md` còn placeholder. Vì vậy PHASE 1–PHASE 10 là `NOT_STARTED` **trong checkout này**. Không kiểm tra nhánh/checkout khác, không suy ra tình trạng toàn bộ hoạt động của nhóm. Các tệp Context thêm ở lần này không thay đổi trạng thái triển khai.

Mỗi Phase bên dưới có **bằng chứng cần có**, chưa có bằng chứng triển khai/kiểm thử thực tế. Khi cập nhật trạng thái, bổ sung đường dẫn Specification, Plan, `tasks.md`, Issue links; revision hoặc snapshot mã, ngày/môi trường/dataset, lệnh hoặc kịch bản và kết quả thực, tiêu chí đạt/chưa đạt, lỗi còn mở, người nghiệm thu. Không tạo trước đường dẫn giả.

Tạo Context/Specification/Plan/Tasks không hoàn thành chức năng. Đóng hết Issues cũng không đủ. Chỉ đặt `COMPLETED` sau khi kiểm tra chức năng và toàn bộ tiêu chí, có bằng chứng phù hợp; không tự điền kết quả kiểm thử, không tự hoàn thành Phase kế tiếp. Khi thay đổi làm mất hiệu lực bằng chứng cũ, đánh giá lại và ghi trạng thái theo quan sát (hoặc `UNKNOWN` nếu chưa đủ căn cứ).

## Checklist và đồng bộ song ngữ

- `[ ]` nghĩa là chưa xác minh hoàn thành hạng mục; thiếu bằng chứng không chứng minh công việc chưa từng được thực hiện.
- Chỉ dùng `[x]` khi có bằng chứng xác định được cho đúng hạng mục. Ghi liên kết/kết quả trong Verification Evidence; checkbox chuẩn bị được đánh dấu không chứng minh đã triển khai.
- Giữ năm nghĩa trạng thái ở trên. Tài liệu chuẩn bị có thể hoàn tất trong khi triển khai vẫn `NOT_STARTED`; không suy trạng thái hoặc phần trăm hoàn thành từ số checkbox. Phase hoàn thành phải đạt mọi checkbox bắt buộc, mọi tiêu chí nghiệm thu và có bằng chứng hợp lệ.
- Hai bản [English](../english/progress-checker.md) và [Vietnamese](progress-checker.md) là hai ngôn ngữ đồng bộ của một sổ tiến độ Phase. Cập nhật ý nghĩa/thứ tự/trạng thái checkbox, bằng chứng và trạng thái Phase trong cùng thay đổi. Khi khác biệt, đối chiếu bằng chứng thật hoặc báo cáo; không quản lý hai tiến độ độc lập.
- Mọi checkbox thêm ở lần chuyển đổi này giữ chưa đánh dấu do chưa có bằng chứng hoàn thành phù hợp. Bảo toàn trạng thái Phase hiện có, không tuyên bố thêm tiến độ phần mềm. Phase dự án khác Phase nội bộ của Spec Kit `tasks.md`; checklist này không sao chép sổ Task.

## Chọn Phase và thứ tự

**G0 - Tiên quyết ngoài Phase triển khai:** nhóm trưởng phê duyệt Context v1, hoàn thiện/duyệt các quyết định v2 cần cho Phase (đặc biệt O12 về nền tảng), và giải quyết các điểm mở làm thay đổi đặc tả của Phase. G0 là điều kiện, không phải Phase phần mềm đã hoàn thành vì đã viết tài liệu. Chưa có Phase nào được khẳng định sẵn sàng triển khai khi G0 chưa đáp ứng.

Sau G0, chọn Phase đủ phụ thuộc → Specification theo Context duyệt → Plan bằng Spec Kit → Tasks và phụ thuộc → duyệt Tasks → mỗi Task một GitHub Issue theo [quy ước](../../docs/agents/issue-tracker.md) → Implementation → Testing & Acceptance → `COMPLETED`. Chỉ bắt đầu bước phụ thuộc khi có đầu vào phù hợp; lập tài liệu cho Phase chưa giải quyết blocker không giải phóng triển khai.

| Phase | Phạm vi sở hữu | Phụ thuộc nghiệm thu | Implementation Status |
|---|---|---|---|
| PHASE 1 - Nền tảng vận hành và quản trị truy cập | Nền tảng web, tài khoản/phiên/quyền, ghi/tra cứu nhật ký | G0 | `NOT_STARTED` |
| PHASE 2 - Mùa giải, danh mục và quy định | Mùa, CLB gốc, sân, quy định theo mùa | PHASE 1 | `NOT_STARTED` |
| PHASE 3 - Hồ sơ và đăng ký cầu thủ | Hồ sơ cầu thủ, hồ sơ CLB theo mùa, đăng ký và kiểm tra | PHASE 1, PHASE 2 | `NOT_STARTED` |
| PHASE 4 - Lập và điều chỉnh lịch | Lịch hai lượt, kiểm tra xung đột, phê duyệt, điều chỉnh | PHASE 2, PHASE 3 | `NOT_STARTED` |
| PHASE 5 - Kết quả chính thức và thống kê | Biên bản, kết quả, xác nhận/điều chỉnh, BXH/thống kê tự động | PHASE 1, PHASE 2, PHASE 3, PHASE 4 | `NOT_STARTED` |
| PHASE 6 - Tra cứu thông tin giải đấu | BM4.1–4.4, lịch, trận, CLB/cầu thủ, BXH/thống kê công khai | PHASE 2, PHASE 3, PHASE 4, PHASE 5 | `NOT_STARTED` |
| PHASE 7 - Báo cáo và tổng kết mùa giải | Xem trước/lập/xuất BM5.1–5.3 | PHASE 1, PHASE 2, PHASE 5 | `NOT_STARTED` |
| PHASE 8 - Tin tức và thông báo | Quản lý/công bố/xem tin | PHASE 1, PHASE 2; việc gắn mùa theo O15 | `NOT_STARTED` |
| PHASE 9 - Nhập và xuất dữ liệu trao đổi | Nhập/xuất dữ liệu định dạng được duyệt, không thay UC22 | PHASE 1, PHASE 2 và các Phase sở hữu loại dữ liệu chọn ở O11 | `NOT_STARTED` |
| PHASE 10 - Tích hợp, hồi quy và nghiệm thu hệ thống | Tích hợp, sao lưu/khôi phục, chất lượng, vận hành và bàn giao | PHASE 1–PHASE 9 `COMPLETED` | `NOT_STARTED` |

Song song dự kiến: sau PHASE 2, PHASE 3 và PHASE 8 có thể phát triển độc lập; PHASE 9 có thể làm phần dữ liệu đã có hợp đồng được duyệt, nhưng chỉ nghiệm thu khi đủ các nguồn đã chọn. Sau PHASE 5, PHASE 6 và PHASE 7 có thể triển khai song song, dùng chung thống kê chính thức do PHASE 5 sở hữu. Các chức năng chỉ đọc của PHASE 6 có thể chuẩn bị theo từng nguồn sẵn có, nhưng toàn Phase chưa hoàn tất trước PHASE 5. Đây là quan hệ dữ liệu/phạm vi, không phải quyết định chia service, API, repository hay phân công thành viên. Mọi công việc song song vẫn phải tuân theo quy trình Spec→Tasks đã duyệt.

## PHASE 1 - Nền tảng vận hành và quản trị truy cập

**Implementation Status:** `NOT_STARTED`.

**Scope:** Nền tảng ứng dụng theo CN-01–04; UC01–UC04; tài khoản/vai trò, phiên, kiểm tra quyền máy chủ và dữ liệu đầu vào; cơ chế nhật ký dùng chung. Nhật ký nghiệp vụ cụ thể được bổ sung/nghiệm thu tại Phase sinh sự kiện; sao lưu/khôi phục đủ dữ liệu hệ thống thuộc PHASE 10.

**References:** §2.4.1.1–4 tr.67–76, §1.3.3 tr.35; BM-01–BM-06 tr.23–24; CN-01–CN-04 tr.26; TD-02/03, AT-02/04. [UC](use-cases/administration.md).

**Dependencies:** G0; quyết định O08, O12–O14, phần phân loại dữ liệu O04.

**Deliverables:** Ứng dụng khởi chạy được, quản trị tài khoản/vai trò, phiên/quyền; ghi/tra cứu nhật ký; hướng dẫn thiết lập môi trường nền tảng.

### Progress Checklist

- [ ] Specification cho xác thực, quyền và nhật ký được xây dựng, phê duyệt.
- [ ] Implementation Plan cho nền tảng được hoàn thiện theo các quyết định đã duyệt.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết mỗi Task với một Issue theo quy ước.
- [ ] Nền tảng cài/khởi chạy được theo hướng dẫn trên môi trường mới.
- [ ] UC01–UC03, quản lý phiên và kiểm tra quyền máy chủ hoạt động đúng phạm vi.
- [ ] UC04 và nhật ký phân quyền/đăng nhập/đăng xuất có bản ghi thật, truy cập đúng quyền.
- [ ] Kiểm thử mật khẩu, đầu vào nguy hiểm, vượt quyền, lỗi lưu và tải BM-01 đạt tiêu chí.
- [ ] Kiểm thử chức năng và hồi quy quản trị/phiên đạt yêu cầu; bằng chứng nghiệm thu Phase đầy đủ.

**Acceptance Criteria:** UC01–UC04 đạt cả luồng chính/thay thế/ngoại lệ; khóa/mở khóa và gán quyền đúng phạm vi. BM-01 đạt 100 lượt/20 đồng thời/95% trong 3 giây, timeout không hoạt động ≤30 phút và phiên cũ không tái dùng. Kiểm tra vượt quyền trực tiếp, đầu vào nguy hiểm, mật khẩu không lộ/không lưu gốc; nhật ký phân quyền và đăng nhập/đăng xuất có thật, tra cứu không sửa dữ liệu. Kiểm tra ràng buộc và lỗi cập nhật không dở dang trong phạm vi quản trị. Cài mới nền tảng theo tài liệu chạy được; khả năng vận hành các nghiệp vụ và cấu trúc module được kiểm chứng thêm ở các Phase sau/PHASE 10.

**Verification Evidence:** Revision nguồn + kết quả UC/quyền/phiên/input và tải xác thực; kiểm tra dữ liệu mật khẩu đã bảo vệ; bản ghi audit mẫu; thao tác dựng môi trường nền tảng mới và kết quả. Chưa có bằng chứng nào ở v1.


## PHASE 2 - Mùa giải, danh mục và quy định

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC05, UC06, UC07, UC12: mùa giải, CLB gốc, sân, quản lý trạng thái/danh mục và bộ quy định/phê duyệt/hiệu lực theo mùa. PHASE 3 sở hữu hồ sơ tham dự và cầu thủ, không lặp ở đây.

**References:** §1.3.4 tr.37–39; QĐ6.1–6.6 tr.11; TH-01–TH-06; AT-03/04; BM-02/04/06; CN-02/04; TD-02/03/04. [UC05–07](use-cases/registration.md), [UC12](use-cases/scheduling.md).

**Dependencies:** PHASE 1; O01/O02 (cấu hình đăng ký), O05/O07/O08/O09/O10 và O12 cho phần liên quan.

**Deliverables:** Quản lý mùa/CLB/sân; bộ quy định được kiểm tra, duyệt và áp dụng đúng hiệu lực, danh mục có bảo toàn lịch sử.

### Progress Checklist

- [ ] Specification mùa giải, danh mục và quy định được phê duyệt.
- [ ] Implementation Plan được hoàn thiện theo quyết định hiệu lực/phê duyệt đã chốt.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC05/UC07/UC12 quản lý mùa, CLB gốc và sân với ràng buộc hợp lệ.
- [ ] UC06 kiểm tra, phê duyệt, áp dụng quy định đúng hiệu lực và ghi lịch sử.
- [ ] Kiểm thử cấu hình, thứ tự điểm, ngừng dùng danh mục và bảo toàn hai mùa đạt yêu cầu.
- [ ] Kiểm thử chức năng, lỗi lưu/vượt quyền và hồi quy dữ liệu tham chiếu đạt yêu cầu.
- [ ] Toàn bộ tiêu chí và bằng chứng thuộc phạm vi Phase được xác minh.

**Acceptance Criteria:** Đủ luồng/ngoại lệ của bốn UC; chặn thiếu trường/trùng định danh/vượt quyền, giữ dữ liệu cũ khi lưu lỗi. Quy định chờ phê duyệt chưa tự có hiệu lực; lưu người/thời điểm/trước–sau/căn cứ theo UC06; điểm thắng > hòa > thua. Cấu hình đăng ký, điểm/xếp hạng và danh mục sửa được theo QĐ6/TH mà không sửa mã nghiệp vụ thuộc phạm vi yêu cầu. Đổi danh mục/sân/CLB không phá liên kết đã dùng; mùa mới không thay lịch sử mùa trước. Cấu hình thể thức chưa hỗ trợ không tạo lịch sai. Tác động sử dụng cấu hình được nghiệm thu thêm ở PHASE 3/PHASE 4/PHASE 5/PHASE 10.

**Verification Evidence:** Kịch bản CRUD/duyệt/hiệu lực/dữ liệu sai, mẫu lịch sử trước–sau, đối chiếu hai mùa và dữ liệu tham chiếu; kiểm tra cấu hình và hồi quy khi sử dụng ở các Phase sau.


## PHASE 3 - Hồ sơ và đăng ký cầu thủ

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC08–UC11, gồm hồ sơ gốc cầu thủ UC09, hồ sơ CLB theo mùa, xét duyệt, danh sách đăng ký và kiểm tra giải thích được qua UC11.

**References:** BM1, QĐ1.1–1.6 tr.6–7; §1.4.3.1 tr.42–43; §2.4.1.8–11 tr.85–97; TH-01/04/05/06; BM-02/04/05/06; TD-01–04; AT-01–04. [UC](use-cases/registration.md).

**Dependencies:** PHASE 1/PHASE 2; O01/O02/O04/O08/O09.

**Deliverables:** Hồ sơ cầu thủ, hồ sơ CLB tham dự BM1, luồng bổ sung/thẩm định/phê duyệt/từ chối và đăng ký theo mùa; kiểm tra điều kiện có lý do.

### Progress Checklist

- [ ] Specification hồ sơ, đăng ký và điều kiện xét duyệt được phê duyệt.
- [ ] Implementation Plan xử lý đăng ký theo mùa được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC08/UC09 quản lý hồ sơ và luồng bổ sung/thẩm định/phê duyệt/từ chối đúng quyền.
- [ ] UC10/UC11 kiểm tra giới hạn 25/17, đào tạo nội địa, U21, thời hạn và đăng ký hiệu lực.
- [ ] Các ca biên, thiếu căn cứ, không áp dụng và đăng ký xung đột trả kết quả đúng.
- [ ] Đối chiếu BM1, quyền/dữ liệu cá nhân, lịch sử và hai mùa đạt yêu cầu.
- [ ] Kiểm thử chức năng, tích hợp quy định và hồi quy/lỗi lưu đạt; đủ bằng chứng nghiệm thu.

**Acceptance Criteria:** Đủ luồng và ngoại lệ UC08–11. Kiểm tra mặc định 25 chính thức, tối đa 17 không đào tạo nội địa, 3 mùa hoặc 36 tháng theo giai đoạn tuổi được duyệt, U21 theo mốc mùa và ngoài giới hạn 25; không suy từ quốc tịch. Chặn hai đăng ký hiệu lực xung đột, quá hạn không ngoại lệ, hồ sơ sai mùa/trùng; thiếu dữ liệu hoặc quy định trả thiếu căn cứ và không lấy quy định mùa khác. Chưa đạt không chuyển hợp lệ; trường không áp dụng không bị tính lỗi. Thẩm định và quyết định duyệt đúng quyền/trạng thái, có lịch sử; lưu lỗi không chấp thuận dở dang. Đổi quy định mùa mới dùng quy tắc mới, giữ mùa cũ; phân trang và bảo vệ dữ liệu đúng yêu cầu.

**Verification Evidence:** Ma trận ca biên giới hạn/đào tạo/U21/thời hạn/đăng ký đồng thời, quyết định xét duyệt và lịch sử; ca thiếu căn cứ và phạm vi quyền; đối chiếu BM1 và hai mùa.


## PHASE 4 - Lập và điều chỉnh lịch

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC13–UC14: xây dựng/kiểm tra/trình duyệt/công bố lịch, điều chỉnh ngày giờ hoặc sân trận chưa diễn ra. UC15 thuộc PHASE 6.

**References:** BM2, QĐ2.1–2.6 tr.7; §1.4.3.2 tr.44–45; §2.4.1.13–14 tr.100–106; TH-02/04/06; BM-02/04/06; TD-02/03; AT-01–04. [UC](use-cases/scheduling.md).

**Dependencies:** PHASE 2/PHASE 3 (và PHASE 1 bắc cầu); O03/O07/O08/O10.

**Deliverables:** Lịch hợp lệ theo mùa, phê duyệt/công bố; kiểm tra xung đột, điều chỉnh có lịch sử/ủy quyền.

### Progress Checklist

- [ ] Specification lịch, xung đột và phê duyệt/ủy quyền được phê duyệt.
- [ ] Implementation Plan lập/điều chỉnh lịch được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC13 tạo lịch BM2 đúng 20 CLB, 38 vòng/380 trận và hai lượt chủ/khách.
- [ ] Kiểm tra thời gian/sân chung, lịch thiếu/sai và cấu hình chưa hỗ trợ đạt yêu cầu.
- [ ] Phê duyệt/công bố và UC14 điều chỉnh đúng điều kiện, có lý do và lịch sử trước–sau.
- [ ] Kiểm thử hủy, chờ duyệt, trận đã diễn ra, sửa đồng thời và lỗi lưu bảo toàn lịch.
- [ ] Kiểm thử chức năng/tích hợp đăng ký–lịch và hồi quy đạt; đủ bằng chứng nghiệm thu.

**Acceptance Criteria:** Mặc định đúng 20 CLB hồ sơ hợp lệ, 38 vòng/380 trận, mỗi CLB 38 trận, mỗi cặp hai lượt hoán đổi chủ/khách. Đủ trường BM2; sân nhà đăng ký trừ thay đổi chấp thuận; không trùng CLB/chồng lấn sân kể cả dùng chung sân theo khoảng thời gian được duyệt. Sai số trận/vòng/lượt/cấu hình chưa hỗ trợ bị từ chối rõ. Lịch chờ duyệt/nháp có điều kiện chưa công khai; bị từ chối trả điều chỉnh. UC14 chặn trận đã diễn ra, vượt quyền, xung đột/cập nhật đồng thời; chờ duyệt giữ lịch cũ; hủy/lưu lỗi giữ dữ liệu; thay đổi hợp lệ lưu người, thời điểm, lý do, trước–sau và cập nhật lịch công bố.

**Verification Evidence:** Bộ dữ liệu 20 CLB và kiểm tra toàn lịch, trường hợp sân chung/chồng lấn, lịch thiếu/sai, phê duyệt/từ chối, sửa đồng thời, lịch sử; bằng chứng công bố chỉ lịch được phép.


## PHASE 5 - Kết quả chính thức và thống kê

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC16–UC20 trong cùng một ranh giới nghiệm thu: biên bản, kết quả chưa chính thức, xác nhận, sửa kết quả chính thức và tự tính BXH/thống kê. Không tách UC20 thành màn hình nhập điểm; PHASE 7 chỉ tổng hợp/xuất báo cáo từ đầu ra này.

**References:** BM3; QĐ3.1–3.6, QĐ5.1–5.7 tr.8–11; §1.4.3.3 tr.46–47; §2.4.1.16–20 tr.109–123; HQ-02, TH-03/05/06; BM-02/04/06; CN-02/04; TD-02/03; AT-01–04. [UC](use-cases/results.md).

**Dependencies:** PHASE 1–PHASE 4; O02/O05/O06/O07/O08/O09.

**Deliverables:** BM3 và kiểm tra, xác nhận/điều chỉnh có lịch sử, BXH và thống kê ghi bàn/giữ sạch lưới, đồng bộ dữ liệu phụ thuộc.

### Progress Checklist

- [ ] Specification BM3, xác nhận/điều chỉnh và thống kê được phê duyệt.
- [ ] Implementation Plan cập nhật kết quả và dữ liệu phụ thuộc được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC16/UC17 ghi biên bản/kết quả chưa chính thức, kiểm tra cầu thủ, bàn thắng/bù giờ/thẻ và tỷ số.
- [ ] UC18/UC19 xác nhận/điều chỉnh đúng quyền, trạng thái, lý do và lịch sử.
- [ ] UC20 tự tính BXH, ghi bàn và giữ sạch lưới theo quy định; đối chiếu tính tay đúng.
- [ ] Kiểm thử phản lưới, xác nhận lặp, sửa đồng thời, lỗi giữa quy trình và hai mùa đạt yêu cầu.
- [ ] Đo HQ-02, kiểm thử tích hợp/hồi quy dữ liệu phụ thuộc và mọi tiêu chí nghiệm thu đạt, có bằng chứng.

**Acceptance Criteria:** Đủ luồng/ngoại lệ năm UC. Chỉ trận lập lịch hợp lệ; cầu thủ đúng hai CLB/đăng ký hợp lệ; bàn A/B/C/D, phút chính thức+bù giờ, thẻ vàng/đỏ đúng trận. Tỷ số khớp bàn, phản lưới tính đội đối phương và không cộng cá nhân. Chỉ xác nhận sau kết thúc; trước UC18 không coi chính thức; UC17 không sửa kết quả chính thức. UC18/19 tự kích hoạt UC20, tính trận/thắng/hòa/thua/BT/BB/HS/điểm/hạng và ghi bàn/giữ sạch lưới theo quy định hiệu lực; mặc định 3–1–0, HS=BT−BB, tiêu chí QĐ5.3. Đồng Vua phá lưới giữ QĐ5.4, thủ môn giữ QĐ5.7, không tự xét thay thủ môn. Gửi xác nhận lặp không cộng trùng; thiếu quy định không mượn mùa khác. Điều chỉnh đúng quyền/lý do, lưu trước–sau và tính lại mọi thống kê/báo cáo ảnh hưởng; hủy/xung đột/lưu lỗi không dở dang. HQ-02: ≥95% cập nhật hợp lệ trong 2 giây.

**Verification Evidence:** Dữ liệu có kết quả nháp/chính thức/điều chỉnh, cả loại bàn/phản lưới/bù giờ/thẻ, ca phân hạng và thủ môn sau khi O05/O06 được chốt; kết quả tính tay đối chiếu; thử xác nhận lặp, lỗi giữa quy trình, hai người sửa; lịch sử và phép đo HQ-02.


## PHASE 6 - Tra cứu thông tin giải đấu

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC15, UC21, UC23 và thông tin chung BM4.1; tra cứu lịch, trận, CLB/cầu thủ và thống kê/BXH được công bố. Không tạo UC mới cho BM4.1, không sở hữu thuật toán thống kê.

**References:** BM4.1–4.4, QĐ4.1–4.6 tr.8–9; §2.4.1.15 tr.106–108, §2.4.1.21 tr.123–126, §2.4.1.23 tr.130–133; HQ-01/03, TT-01/02/04/05, BM-05, TH-05, TD-01/04. [UC15](use-cases/scheduling.md), [UC21/23](use-cases/publication.md).

**Dependencies:** PHASE 2–PHASE 5; O04/O08/O09/O13.

**Deliverables:** Tra cứu và lọc theo mùa/vòng/CLB/thời gian/tên phù hợp từng UC, thông tin chung mùa giải, hiển thị đúng phạm vi công khai.

### Progress Checklist

- [ ] Specification tra cứu, bộ lọc và trường công khai được phê duyệt.
- [ ] Implementation Plan tra cứu được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] BM4.1–4.4 và UC15/UC21/UC23 trả đúng dữ liệu/bộ lọc, phân trang và phạm vi mùa.
- [ ] Kết quả nháp và dữ liệu cá nhân không công khai trái quyền; thay đổi lịch/kết quả được phản ánh.
- [ ] Chrome/Edge, ba viewport TT-02, tiếng Việt và các luồng trống/lỗi đạt yêu cầu.
- [ ] HQ-01/HQ-03 được đo với đúng tải và dữ liệu một mùa/≥10 mùa, kèm bằng chứng.
- [ ] Tích hợp nguồn của các Phase phụ thuộc, hồi quy và toàn bộ tiêu chí Phase được xác minh.

**Acceptance Criteria:** Đủ trường BM4 trong phạm vi được phép; dữ liệu mùa độc lập và đúng hồ sơ hợp lệ. Kết quả chưa xác nhận không công khai tỷ số; thông tin trận đã công bố vẫn xem được. Thống kê/công bố cập nhật nhất quán sau điều chỉnh, lịch sử không sai lệch; không sửa nghiệp vụ khi tra cứu. Luồng mặc định, không có kết quả, thiếu căn cứ thống kê và lỗi truy vấn có phản hồi theo UC. Chặn lộ trường cá nhân theo ma trận duyệt kể cả truy cập trực tiếp. Danh sách >20 bản ghi phân trang không thiếu/trùng; tìm/lọc đúng. Chrome/Edge và ba viewport TT-02 đạt yêu cầu; HQ-01/03 đạt ≥95% trong 2 giây với tải/dataset quy định; cốt lõi chạy khi không API ngoài.

**Verification Evidence:** Đối chiếu bộ lọc và kết quả mong đợi; ca công khai/nội bộ/nháp/chính thức, cập nhật từ PHASE 4/PHASE 5; kiểm tra trường trả về; ảnh/biên bản trình duyệt và viewport, log tải một mùa và ≥10 mùa/3.800 trận; kết quả thử điều hướng góp vào TD-01 cuối hệ thống.


## PHASE 7 - Báo cáo và tổng kết mùa giải

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC22: lập, xem trước và xuất BM5.1–BM5.3; kiểm tra đủ điều kiện tổng kết. Tính toán nguồn do PHASE 5 sở hữu; trao đổi dữ liệu chung do PHASE 9 sở hữu.

**References:** QĐ5.1–5.7, BM5.1–5.3 tr.9–11; §2.4.1.22 tr.127–130; HQ-04, TH-03/05/06, TT-04, BM-02/05/06, AT-03/04. [UC22](use-cases/publication.md).

**Dependencies:** PHASE 1/PHASE 2/PHASE 5; O05/O06/O07/O11/O13.

**Deliverables:** Ba loại báo cáo, bản xem trước/tệp tải xuống đúng mẫu và điều kiện xác nhận tổng kết.

### Progress Checklist

- [ ] Specification ba báo cáo và điều kiện tổng kết được phê duyệt.
- [ ] Implementation Plan xem trước/xuất báo cáo được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC22 xem trước và xuất đủ trường BM5.1–BM5.3 từ nguồn chính thức đúng mùa.
- [ ] Phân hạng, danh hiệu và điều kiện đủ kết quả trước tổng kết được kiểm chứng theo quyết định đã duyệt.
- [ ] Các ca thiếu dữ liệu/vượt quyền/không nhất quán/xuất lỗi không trả báo cáo chính thức sai.
- [ ] Sau UC19 báo cáo cập nhật đúng; đối chiếu nguồn/tính tay và đo HQ-04 đạt yêu cầu.
- [ ] Kiểm thử chức năng, tích hợp thống kê và hồi quy đạt; đủ bằng chứng nghiệm thu.

**Acceptance Criteria:** Đúng toàn bộ trường BM5, đúng mùa, dùng kết quả chính thức; BXH/ghi bàn theo thời điểm lập và quy định. Vua phá lưới có đồng nhận; Găng tay vàng từ giữ sạch lưới; tổng bàn giải đúng, không loại bàn phản lưới khỏi tỷ số/tổng giải. Tổng kết chỉ xác nhận khi đủ mọi kết quả và xử lý phân hạng cần thiết. Thiếu dữ liệu/không nhất quán/vượt quyền báo rõ, không xuất như chính thức; lỗi xuất không trả tệp dở dang như thành công. Đổi loại báo cáo tổng hợp lại. Sau UC19 báo cáo liên quan phản ánh dữ liệu mới và truy vết thay đổi. Tạo và xuất từng báo cáo ≤5 giây với đủ một mùa/380 trận, tiếng Việt/giá trị không sai lệch.

**Verification Evidence:** Ba báo cáo đối chiếu nguồn chính thức/tính tay, ca thiếu kết quả/phân hạng/đồng danh hiệu sau quyết định, ca trước–sau điều chỉnh và xuất lỗi, tệp xuất thực và log thời gian HQ-04.


## PHASE 8 - Tin tức và thông báo

**Implementation Status:** `NOT_STARTED`.

**Scope:** UC24–UC25: soạn/cập nhật/quản lý trạng thái/công bố và xem danh sách/chi tiết được phép công khai.

**References:** §2.2.5 tr.58; §2.4.1.24–25 tr.134–139, Hình 2.52–2.55; BM-02/04/05/06; TT-01/04; TD-02/04. [UC](use-cases/publication.md).

**Dependencies:** PHASE 1/PHASE 2; O08/O09/O15.

**Deliverables:** Chức năng Ban tổ chức quản lý/công bố và người tra cứu xem tin.

### Progress Checklist

- [ ] Specification tin tức, trạng thái và quyền công bố được phê duyệt.
- [ ] Implementation Plan quản lý/xem tin được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] UC24 lưu/cập nhật/công bố đúng quyền, trạng thái và ghi nhận thao tác.
- [ ] UC25 chỉ hiển thị tin được phép công khai, kiểm tra lại trạng thái khi mở chi tiết.
- [ ] Kiểm thử nháp/công bố/thu hồi theo O15, danh sách trống, truy cập trực tiếp và lỗi truy vấn đạt.
- [ ] Kiểm thử chức năng, tích hợp quyền/nhật ký, tiếng Việt và hồi quy đạt; đủ bằng chứng nghiệm thu.

**Acceptance Criteria:** Đủ luồng/ngoại lệ UC24–25; tách quyền lưu và công bố, kiểm tra trường bắt buộc. Nội dung mới/nháp chưa công khai; công bố đúng quyền và ghi nhận thao tác. Người không có quyền công bố bị từ chối, giữ trạng thái. Xem chi tiết kiểm tra lại trạng thái, không lộ nội dung đã không còn được phép công bố; danh sách trống và lỗi truy vấn được thông báo. Trạng thái/thu hồi/gắn mùa thực hiện theo quyết định O15, không tự thêm kênh thông báo ngoài hệ thống.

**Verification Evidence:** Ma trận quyền quản lý/công bố/xem; dữ liệu nháp/đã công bố/không còn công khai, truy cập trực tiếp, nhật ký; kết quả các luồng UC và tiếng Việt.


## PHASE 9 - Nhập và xuất dữ liệu trao đổi

**Implementation Status:** `NOT_STARTED`.

**Scope:** Yêu cầu TT-03, TT-04: trao đổi tệp cho loại dữ liệu được nhóm trưởng chọn; kiểm tra/chuẩn hóa và bảo toàn nghiệp vụ, độc lập với xuất ba báo cáo ở UC22. Không thêm mã UC giả cho yêu cầu chưa có UC riêng.

**References:** §1.2.4.2 tr.17; TT-03/04 tr.19; BM-02/04/05; AT-01/02/04; BM/QĐ của dữ liệu được duyệt ở O11.

**Dependencies:** PHASE 1/PHASE 2 và Phase sở hữu dữ liệu được chọn (PHASE 3, PHASE 4 hoặc PHASE 5 khi liên quan); O04/O09/O11/O12. Sau O11 cập nhật danh sách phụ thuộc cụ thể trước Specification.

**Deliverables:** Định dạng/template được duyệt, nhập/xuất, phản hồi lỗi và đối chiếu dữ liệu.

### Progress Checklist

- [ ] Specification loại dữ liệu, định dạng và chính sách nhập/xuất theo O11 được phê duyệt.
- [ ] Implementation Plan kiểm tra, chuẩn hóa và bảo toàn dữ liệu được hoàn thiện.
- [ ] Tasks, phụ thuộc cụ thể được phê duyệt và liên kết Issues theo quy ước.
- [ ] Nhập/xuất theo từng định dạng được chọn xử lý đủ ≥100 bản ghi và giữ 100% trường đối chiếu.
- [ ] Tệp sai/trùng/lỗi từng phần được xử lý đúng chính sách, quyền và ràng buộc nghiệp vụ.
- [ ] Tiếng Việt, ngày giờ, tỷ số, định danh, liên kết và dữ liệu lịch sử được bảo toàn.
- [ ] Kiểm thử chức năng, tích hợp nguồn dữ liệu và hồi quy đạt; tệp vào/ra và bằng chứng đầy đủ.

**Acceptance Criteria:** Với từng định dạng được chọn (CSV hoặc XLSX), ít nhất 100 bản ghi hợp lệ xử lý đủ và giữ 100% trường được đối chiếu, bao gồm tiếng Việt/ngày giờ/tỷ số/định danh. Phát hiện sai cấu trúc, thiếu trường, sai kiểu/giá trị và vi phạm nghiệp vụ; không tạo dữ liệu sai/lộ thông tin hoặc vượt bước phê duyệt/xác nhận. Xử lý trùng/lỗi từng phần theo quyết định duyệt, bảo toàn dữ liệu hợp lệ và liên kết/mùa lịch sử. Không tự thêm tích hợp API ngoài.

**Verification Evidence:** Tệp vào/ra thật theo mỗi định dạng chọn, tập ≥100 bản ghi và phép đối chiếu từng trường; tệp sai và kiểm tra dữ liệu trước–sau, quyền, ràng buộc/quy trình tương ứng.


## PHASE 10 - Tích hợp, hồi quy và nghiệm thu hệ thống

**Implementation Status:** `NOT_STARTED`.

**Scope:** Tích hợp, triển khai cơ chế sao lưu/khôi phục BM-07 và nghiệm thu toàn bộ phạm vi Chương 1–2, 25 UC, 37 điều khoản QĐ, 10 BM và 34 yêu cầu chất lượng; không thay các tiêu chí Phase trước bằng một smoke test. CN-03 và kế hoạch kiểm thử/bàn giao tại §1.5 được đối chiếu ở đây.

**References:** Tất cả dòng của [ma trận bao phủ](sources.md); §1.4.4 tr.49; §1.5 tr.50–52; TH-01–06, HQ-01–04, TT-01–05, BM-01–07, CN-01–04, TD-01–04, AT-01–04.

**Dependencies:** PHASE 1–PHASE 9 đã `COMPLETED`, quyết định liên quan đã được duyệt, môi trường/tập dữ liệu/phương pháp kiểm thử O13 và vận hành O14 xác định. API ngoài không bắt buộc; nhánh điều kiện TT-05 phải ghi rõ có/không triển khai.

**Deliverables:** Bản tích hợp chạy được, cơ chế tự sao lưu/lưu giữ/khôi phục BM-07, dữ liệu mẫu và dữ liệu kiểm thử quy mô, ma trận kiểm thử/nghiệm thu theo yêu cầu, kết quả hồi quy, hướng dẫn cài/vận hành/sao lưu/khôi phục và biên bản nghiệm thu.

### Progress Checklist

- [ ] Specification tích hợp, vận hành và nghiệm thu cuối được phê duyệt.
- [ ] Implementation Plan tích hợp/sao lưu/khôi phục/kiểm thử được hoàn thiện.
- [ ] Tasks, phụ thuộc được phê duyệt và liên kết Issues theo quy ước.
- [ ] PHASE 1–PHASE 9 có bằng chứng COMPLETED còn hiệu lực trên bản tích hợp.
- [ ] Chuỗi nghiệp vụ đầu–cuối, điều chỉnh xuyên chức năng và hồi quy đạt yêu cầu.
- [ ] Cơ chế BM-07 chứng minh tự sao lưu/24 giờ, ≥7 bản riêng và phục hồi đủ mùa ≤30 phút.
- [ ] Đủ 34 yêu cầu chất lượng và các ngưỡng tải/dataset/trình duyệt/viewport/tiện dụng được kiểm chứng.
- [ ] Cốt lõi vận hành không API ngoài; nhánh TT-05 nếu có được xác minh.
- [ ] Tài liệu cài mới/vận hành, dữ liệu, báo cáo kiểm thử và biên bản nhóm trưởng nghiệm thu đầy đủ.

**Acceptance Criteria:** Chuỗi mùa/quy định → đăng ký duyệt → lịch duyệt → biên bản → xác nhận → BXH/thống kê → tra cứu/báo cáo/tổng kết hoạt động nhất quán. Điều chỉnh hợp lệ cập nhật xuyên chức năng và truy vết; đầu vào sai/vượt quyền/xác nhận lặp/lỗi giữa quy trình/sửa đồng thời không làm hỏng dữ liệu. Đối chiếu đủ 34 yêu cầu: giữ nguyên ngưỡng HQ/BM/TD/TT/TH trong quality.md, đặc biệt ≥10 mùa/3.800 trận, hai trình duyệt/ba viewport, ≥100 bản ghi nhập/xuất, ≥10 ca trái quyền, thử điều hướng 5 người ×4 lượt (≥80% trong 30 giây/≤3 thao tác), sao lưu/khôi phục đủ một mùa và dựng môi trường mới. Lịch sử/đa mùa và thay cấu hình có kiểm soát không hồi tố sai. Kiểm tra cốt lõi vận hành không API ngoài; nếu có tích hợp phải đạt nhánh kiểm tra/xác nhận TT-05. Mọi tiêu chí bắt buộc đều đạt, các vấn đề ảnh hưởng nghiệm thu được giải quyết và nhóm trưởng xác nhận kết quả.

**Verification Evidence:** Revision/snapshot bản tích hợp, môi trường/dataset, báo cáo từng tiêu chí và log thực, kết quả luồng đầu–cuối/hồi quy/quyền/xung đột/lỗi/tải/khôi phục/tương thích/tiện dụng, tệp bàn giao và biên bản nhóm trưởng nghiệm thu. Test mock/ảnh giao diện riêng lẻ không thay bằng chứng cập nhật dữ liệu và phục hồi thực.


Chỉ xác nhận **toàn bộ hệ thống hoàn chỉnh** khi cả PHASE 1–PHASE 10 đều `COMPLETED` và kết quả tích hợp cuối cùng vẫn còn hiệu lực trên phiên bản bàn giao. Chưa có kết quả kiểm thử sản phẩm nào trong Context v1.
