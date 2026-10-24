# Nguồn, truy vết và kiểm tra Context v1

## PDF

Nguồn nghiệp vụ: `[SE104] - Báo Cáo Đồ Án - Nhóm 11.pdf`, Nhóm 11, SE104.R13, bản báo cáo tháng 10/2026. Đã đọc toàn Chương 1 (tr.4–52) và Chương 2 (tr.53–139); các trang 1–3 là bìa/nhận xét/mục lục. PDF có 139 trang; nhãn trang và số trang vật lý trùng nhau, tính từ 1. `tr.N` trong Context luôn là số đó; `§` là mục trong báo cáo, không phải mục của Markdown.

- Kích thước bản đã đọc: 6.342.359 byte.
- SHA-256: `fc5252b97031fda2a710f8ab0e560b87e73c9098cb55de4b8d7a1a9dc5dccb79`.
- Vị trí bản được cung cấp khi xây v1: `D:\UIT\[UIT] - NĂM 3 (HK1)\[SE104] - NHẬP MÔN CÔNG NGHỆ PHẦN MỀM\Đồ Án Môn Học\Báo Cáo Đồ Án\[SE104] - Báo Cáo Đồ Án - Nhóm 11.pdf`.
- Theo yêu cầu nhóm trưởng, **không đưa PDF vào repository**. Thành viên dùng bản PDF sẵn có, đối chiếu tên/hash/nhãn trang trước khi áp dụng trích dẫn. Đường dẫn trên chỉ nhận diện bản đã đọc, không phải cấu hình bắt buộc trên máy khác.

Đã trích xuất văn bản bằng pypdf, đối chiếu lại bằng pdfplumber để xử lý khoảng trắng do dàn trang; đã render/xem các trang chứa biểu mẫu và toàn bộ Hình 1.1–1.6, Hình 2.1–2.55. Những thông điệp rất nhỏ trong sequence diagram không được coi là API/hợp đồng triển khai; khi xây Chương 3 cần mở hình gốc ở độ phóng đại phù hợp và xử lý các điểm khác biệt được ghi trong sổ quyết định. Bảng đặc tả UC và các điều khoản được giữ đủ nội dung; bỏ header/footer và nối dòng là thay đổi trình bày.

## Cấu trúc tham khảo

Đã đọc qua GitHub connector ngày 24/10/2026, nhánh `development` của [slop-loop](https://github.com/pminhtaiii/slop-loop/tree/development):

| Tài liệu đã đọc | Git blob SHA quan sát | Nguyên tắc áp dụng |
|---|---|---|
| [AGENTS.md](https://github.com/pminhtaiii/slop-loop/blob/development/AGENTS.md) | `c1661be1cbdcf2df12f16d0b42ef8326ba9ddc44` | Pointer vào Context trước khi làm việc |
| [context/README.md](https://github.com/pminhtaiii/slop-loop/blob/development/context/README.md) | `6993913ad4359014db016a3849b7ffd8dcdbb80c` | Bảng nạp tài liệu theo nhiệm vụ, nội dung có nơi sở hữu |
| [GLOSSARY.md](https://github.com/pminhtaiii/slop-loop/blob/development/GLOSSARY.md) | `ce4b7c535654599dd731895f328a28fc0b648c5e` | Định nghĩa tập trung, phân biệt thuật ngữ gần nhau |
| [docs/agents/domain.md](https://github.com/pminhtaiii/slop-loop/blob/development/docs/agents/domain.md), [thư mục ADR](https://github.com/pminhtaiii/slop-loop/tree/development/docs/adr) và [ADR 0001](https://github.com/pminhtaiii/slop-loop/blob/development/docs/adr/0001-uc03-scope-and-completion.md) | domain: `4032de016c1e91119d33d477633e2b8f265f4195`; ADR 0001: `efd2019cae07e7d3be38d79bc9072a4877bd5045` | Một glossary ở root; ADR trong docs/adr chỉ khi có quyết định được chấp thuận, không ghi ý tưởng mở thành quyết định |
| [context/progress_checker.md](https://github.com/pminhtaiii/slop-loop/blob/development/context/progress_checker.md) | `882983646f4f099dc5f8cc776355f7817be9a003` | Tách mục tiêu và quan sát; ngày/revision/phạm vi và bằng chứng thật mới hỗ trợ trạng thái |

Đây là snapshot ở cấp tệp đã đọc, không tuyên bố là một commit snapshot toàn repo; nhánh có thể tiếp tục thay đổi. Không nhập runtime/stack/nghiệp vụ, bộ trạng thái riêng, paired-ticket workflow, phân công multi-agent hay scripts tự động của slop-loop. Whistle-EPL dùng đúng năm trạng thái và vòng đời Phase nhóm trưởng yêu cầu.

## Ma trận truy vết Chương 1

| Phạm vi nguồn | Nơi sở hữu trong Context | Phase / cách bao phủ |
|---|---|---|
| §1.1 tr.4–5: lý do, mục tiêu, phạm vi | [overview](project-overview.md) | Ranh giới cho tất cả Phase; nội dung kiến thức/thực trạng không tự trở thành chức năng mới |
| §1.2.1/Bảng 1.1 tr.6: 6 yêu cầu nghiệp vụ | [business](business.md) | Bảng ánh xạ 6 yêu cầu → UC/BM/QĐ/Phase |
| BM1 tr.6; QĐ1.1–1.6 tr.6–7 | [business](business.md#qđ1), UC08–11 | PHASE 3; cấu hình PHASE 2 |
| BM2/QĐ2.1–2.6 tr.7 | [business](business.md#qđ2), UC13–15 | PHASE 4; tra cứu PHASE 6 |
| BM3 tr.7–8; QĐ3.1–3.6 tr.8 | [business](business.md#qđ3), UC16–20 | PHASE 5 |
| BM4.1–4.2 tr.8, BM4.3–4.4/QĐ4.1–4.6 tr.9 | [business](business.md#qđ4), UC15/21/23 | PHASE 6; nguồn mùa/CLB/đăng ký PHASE 2/PHASE 3 |
| BM5.1 tr.9–10, BM5.2–5.3 tr.10; QĐ5.1–5.7 tr.10–11 | [business](business.md#qđ5), UC20/22 | PHASE 5 thống kê, PHASE 7 báo cáo |
| QĐ6.1–6.6 tr.11 | [business](business.md#qđ6), UC06 | PHASE 2; sử dụng cấu hình và hồi quy PHASE 3–PHASE 7/PHASE 10 |
| §1.2.2–8 tr.11–32: 34 mã chất lượng | [quality](quality.md) | Ma trận từng mã ở dưới; PHASE 10 kiểm chứng tổng hợp |
| §1.3.1–3 tr.33–35; §2.1 tr.53: mô hình và 6 vai trò | [overview](project-overview.md), [glossary](GLOSSARY.md) | PHASE 1 quyền và kiểm tra ở mỗi Phase |
| §1.3.4 tr.36–39: 17 đối tượng chính và quan hệ | [overview](project-overview.md), glossary, BM/UC chi tiết | PHASE 2–PHASE 7; tài khoản/audit PHASE 1; bảo toàn quan hệ PHASE 10 |
| §1.4 tr.39–49: quy trình, Hình 1.1–1.6 | [overview](project-overview.md), UC, Progress Checker | PHASE 3 đăng ký, PHASE 4 lịch, PHASE 5 kết quả, PHASE 10 luồng đầu–cuối |
| §1.5 tr.50–52: Modified Waterfall/10 tuần/theo dõi thay đổi | [overview](project-overview.md), [README](README.md), [Progress Checker](progress-checker.md) | Giữ kế hoạch nguồn; không coi 5 giai đoạn kế hoạch là 5 Phase chức năng hoặc bằng chứng tiến độ |

## Ma trận 25 Use Case và hình phân tích

Mỗi UC liên kết đến bản ghi có đầy đủ tác nhân, tiền/hậu điều kiện và các luồng. “Phase” là nơi sở hữu hành vi, không phải ánh xạ mỗi UC thành một Phase. Quan hệ «include» và các hành vi có điều kiện được nêu trong project-overview/điểm mở.

| UC | Đặc tả/nhóm đọc | Nguồn §2.4.1 | Trang (gồm mô tả và hình) | Hình | Phase |
|---|---|---|---|---|---|
| UC01 | [Đăng nhập](use-cases/administration.md#uc01) | 1 | 67–69 | 2.7–2.8 | PHASE 1 |
| UC02 | [Đăng xuất](use-cases/administration.md#uc02) | 2 | 69–71 | 2.9–2.10 | PHASE 1 |
| UC03 | [Quản lý tài khoản và vai trò](use-cases/administration.md#uc03) | 3 | 72–74 | 2.11–2.12 | PHASE 1 |
| UC04 | [Tra cứu nhật ký hoạt động](use-cases/administration.md#uc04) | 4 | 75–76 | 2.13–2.14 | PHASE 1 |
| UC05 | [Quản lý mùa giải](use-cases/registration.md#uc05) | 5 | 77–78 | 2.15–2.16 | PHASE 2 |
| UC06 | [Quản lý quy định mùa giải](use-cases/registration.md#uc06) | 6 | 79–82 | 2.17–2.18 | PHASE 2 |
| UC07 | [Quản lý câu lạc bộ](use-cases/registration.md#uc07) | 7 | 82–84 | 2.19–2.20 | PHASE 2 |
| UC08 | [Quản lý hồ sơ đăng ký câu lạc bộ](use-cases/registration.md#uc08) | 8 | 85–88 | 2.21–2.22 | PHASE 3 |
| UC09 | [Quản lý hồ sơ cầu thủ](use-cases/registration.md#uc09) | 9 | 88–90 | 2.23–2.24 | PHASE 3 |
| UC10 | [Quản lý đăng ký cầu thủ](use-cases/registration.md#uc10) | 10 | 91–94 | 2.25–2.26 | PHASE 3 |
| UC11 | [Kiểm tra điều kiện đăng ký cầu thủ](use-cases/registration.md#uc11) | 11 | 94–97 | 2.27–2.28 | PHASE 3 |
| UC12 | [Quản lý sân vận động](use-cases/scheduling.md#uc12) | 12 | 97–99 | 2.29–2.30 | PHASE 2 |
| UC13 | [Lập lịch thi đấu](use-cases/scheduling.md#uc13) | 13 | 100–103 | 2.31–2.32 | PHASE 4 |
| UC14 | [Điều chỉnh lịch thi đấu](use-cases/scheduling.md#uc14) | 14 | 103–106 | 2.33–2.34 | PHASE 4 |
| UC15 | [Tra cứu lịch thi đấu](use-cases/scheduling.md#uc15) | 15 | 106–108 | 2.35–2.36 | PHASE 6 |
| UC16 | [Lập biên bản trận đấu](use-cases/results.md#uc16) | 16 | 109–112 | 2.37–2.38 | PHASE 5 |
| UC17 | [Cập nhật kết quả trận đấu](use-cases/results.md#uc17) | 17 | 112–114 | 2.39–2.40 | PHASE 5 |
| UC18 | [Xác nhận kết quả trận đấu](use-cases/results.md#uc18) | 18 | 115–118 | 2.41–2.42 | PHASE 5 |
| UC19 | [Điều chỉnh kết quả trận đấu đã xác nhận](use-cases/results.md#uc19) | 19 | 118–121 | 2.43–2.44 | PHASE 5 |
| UC20 | [Cập nhật bảng xếp hạng và thống kê](use-cases/results.md#uc20) | 20 | 121–123 | 2.45 (không có sequence riêng) | PHASE 5 |
| UC21 | [Tra cứu thông tin trận đấu](use-cases/publication.md#uc21) | 21 | 123–126 | 2.46–2.47 | PHASE 6 |
| UC22 | [Lập và xuất báo cáo giải đấu](use-cases/publication.md#uc22) | 22 | 127–130 | 2.48–2.49 | PHASE 7 |
| UC23 | [Tra cứu thông tin và thống kê câu lạc bộ, cầu thủ](use-cases/publication.md#uc23) | 23 | 130–133 | 2.50–2.51 | PHASE 6 |
| UC24 | [Quản lý tin tức và thông báo giải đấu](use-cases/publication.md#uc24) | 24 | 134–136 | 2.52–2.53 | PHASE 8 |
| UC25 | [Xem tin tức và thông báo giải đấu](use-cases/publication.md#uc25) | 25 | 136–139 | 2.54–2.55 | PHASE 8 |


§2.2 tr.54–58 là danh mục UC01–UC25 và tác nhân/độ phức tạp; §2.3 tr.59–66 gồm Hình 2.1 tổng quan, 2.2 lịch/kết quả, 2.3 đăng ký, 2.4 mùa/quy định, 2.5 báo cáo/tra cứu, 2.6 tài khoản/quyền. Các hình phân rã có tên chức năng con chưa có mã riêng; Context giữ 25 mã gốc. Mức độ phức tạp theo Bảng 2.2–2.6: UC02/12/15/21/25 thấp; UC06/10/11/13/14/16/18/19/20/22 cao; các UC còn lại trung bình. Độ phức tạp không phải mức ưu tiên hoặc bằng chứng triển khai.

## Ma trận chất lượng → Phase

Các Phase ghi đầu tiên chịu trách nhiệm xây hành vi tương ứng; PHASE 10 kiểm chứng cuối cùng tất cả yêu cầu, không làm mất trách nhiệm ở các Phase chức năng. Mỗi mã sau liên kết đến nội dung và ngưỡng đầy đủ trong [quality.md](quality.md).

| Mã gốc | Trang bảng chi tiết | Phase chịu trách nhiệm / kiểm chứng |
|---|---|---|
| TH-01 | 13 | PHASE 2/PHASE 3; PHASE 10 đối chiếu cuối |
| TH-02 | 13 | PHASE 2/PHASE 4; PHASE 10 đối chiếu cuối |
| TH-03 | 13 | PHASE 2/PHASE 5/PHASE 7; PHASE 10 đối chiếu cuối |
| TH-04 | 13 | PHASE 2/PHASE 3/PHASE 4; PHASE 10 đối chiếu cuối |
| TH-05 | 13 | PHASE 2–PHASE 7/PHASE 10; PHASE 10 đối chiếu cuối |
| TH-06 | 14 | PHASE 1–PHASE 5/PHASE 10; PHASE 10 đối chiếu cuối |
| HQ-01 | 16 | PHASE 6; PHASE 10 đối chiếu cuối |
| HQ-02 | 16 | PHASE 5; PHASE 10 đối chiếu cuối |
| HQ-03 | 16 | PHASE 6/PHASE 10; PHASE 10 đối chiếu cuối |
| HQ-04 | 16 | PHASE 7; PHASE 10 đối chiếu cuối |
| TT-01 | 19 | PHASE 1–PHASE 9/PHASE 10; PHASE 10 đối chiếu cuối |
| TT-02 | 19 | PHASE 6; PHASE 10 đối chiếu cuối |
| TT-03 | 19 | PHASE 9; PHASE 10 đối chiếu cuối |
| TT-04 | 19 | PHASE 1–PHASE 9/PHASE 10; PHASE 10 đối chiếu cuối |
| TT-05 | 20 | PHASE 6/PHASE 10; tích hợp ngoài chỉ khi được duyệt; PHASE 10 đối chiếu cuối |
| BM-01 | 23 | PHASE 1; PHASE 10 đối chiếu cuối |
| BM-02 | 23 | PHASE 1 và từng Phase nội bộ; PHASE 10 đối chiếu cuối |
| BM-03 | 23 | PHASE 1; PHASE 10 đối chiếu cuối |
| BM-04 | 23 | PHASE 1 và mọi Phase nhận đầu vào; PHASE 10 đối chiếu cuối |
| BM-05 | 23 | PHASE 1/PHASE 3/PHASE 6/PHASE 7/PHASE 8/PHASE 9; PHASE 10 đối chiếu cuối |
| BM-06 | 24 | PHASE 1 ghi/tra cứu; PHASE 2–PHASE 5/PHASE 8 phát sinh sự kiện; PHASE 10 đối chiếu cuối |
| BM-07 | 24 | PHASE 10 xây cơ chế và kiểm chứng đủ mùa; PHASE 10 đối chiếu cuối |
| CN-01 | 26 | PHASE 1/PHASE 10; PHASE 10 đối chiếu cuối |
| CN-02 | 26 | PHASE 1–PHASE 5/PHASE 9/PHASE 10; PHASE 10 đối chiếu cuối |
| CN-03 | 26 | PHASE 1/PHASE 10; PHASE 10 đối chiếu cuối |
| CN-04 | 26 | PHASE 1 và mọi Phase mở rộng nghiệp vụ/PHASE 10; PHASE 10 đối chiếu cuối |
| TD-01 | 29 | Các Phase có UI, PHASE 10 thử 5 người/20 lượt; PHASE 10 đối chiếu cuối |
| TD-02 | 29 | Mọi biểu mẫu PHASE 1–PHASE 5/PHASE 8/PHASE 9; PHASE 10 đối chiếu cuối |
| TD-03 | 29 | PHASE 1–PHASE 5 và thay đổi quan trọng/PHASE 10; PHASE 10 đối chiếu cuối |
| TD-04 | 29 | PHASE 1–PHASE 4/PHASE 6/PHASE 8, PHASE 9 nếu hiển thị danh sách; PHASE 10 đối chiếu cuối |
| AT-01 | 32 | PHASE 3/PHASE 4/PHASE 5/PHASE 9; PHASE 10 đối chiếu cuối |
| AT-02 | 32 | PHASE 1–PHASE 5/PHASE 9; PHASE 10 đối chiếu cuối |
| AT-03 | 32 | PHASE 2/PHASE 4/PHASE 5; PHASE 10 đối chiếu cuối |
| AT-04 | 32 | PHASE 2–PHASE 5/PHASE 9/PHASE 10; PHASE 10 đối chiếu cuối |


Tổng bao phủ: **6/6** dòng yêu cầu nghiệp vụ Bảng 1.1; **10/10** biểu mẫu; **37/37** điều khoản QĐ (6+6+6+6+7+6); **25/25** UC; **34/34** mã chất lượng (TH 6, HQ 4, TT 5, BM 7, CN 4, TD 4, AT 4); **6/6** tác nhân. TT-05 được bao phủ bằng điều kiện vận hành độc lập và nhánh tích hợp nếu có, không tuyên bố đã phê duyệt kết nối ngoài. Đây là độ bao phủ tài liệu, không phải tỷ lệ chức năng hoàn thành.

## Kết quả kiểm tra và giới hạn

Bản v1 được kiểm tra bằng đọc đối chiếu Chương 1–2, bảng đặc tả với bản chuyển Markdown và kiểm tra cơ học liên kết/ID/bao phủ. Báo cáo kiểm tra này chỉ mô tả tài liệu, không phải Verification Evidence để hoàn thành Phase. Các điểm mâu thuẫn/thiếu chi tiết được tập trung trong [open-decisions.md](open-decisions.md); không điền giả hoặc chọn phương án kỹ thuật.

Kết quả kiểm tra cơ học của bản v1 trước chuyển đổi ngày 24/10/2026: 14 tệp Markdown thuộc gói/hướng dẫn được kiểm tra; 134 liên kết nội bộ và fragment đều có đích khi bàn giao. Có đúng một bản ghi cho mỗi UC01–UC25, mỗi bản đủ bảy trường mô tả/tác nhân/tiền điều kiện/hậu điều kiện/luồng chính/thay thế/ngoại lệ; kiểm tra trước đây so khớp 175 trường với văn bản trích xuất, nhưng chưa phát hiện nhãn bảng bị lệch do thứ tự đọc. Khi chuyển song ngữ, đã đối chiếu ô bảng PDF để đặt lại đúng tiêu đề, tác nhân, điều kiện và luồng, giữ nguyên nội dung. Kết quả cũ không chứng minh việc phân nhóm ô là đúng. Có đủ 37 mã điều khoản riêng biệt, 34 mã chất lượng riêng biệt và 10 Phase đủ tám thành phần bắt buộc. `git diff --check` đạt; không có PDF, script, Spec/Plan/Tasks hoặc mã chức năng mới trong Context. Hướng dẫn GitHub Issues/SDD và domain hiện có được giữ lại.

Chưa kiểm chứng hoạt động sản phẩm, bộ kiểm thử ứng dụng, hiệu năng, bảo mật, tương thích hay khôi phục vì checkout chưa có triển khai. Không kiểm tra các nhánh/checkout khác, không kiểm tra Issues từ xa và không thay đổi tracker. Không khẳng định số liệu thực tế EPL ngoài PDF còn đúng ở thời điểm hiện tại. Context chờ nhóm trưởng rà soát/phê duyệt, bao gồm cách chia Phase và quyết định cần xử lý tại v2.

## Kiểm tra chuyển đổi song ngữ

Chuyển đổi ngày 24/10/2026: mỗi ngôn ngữ có 13 tệp tương ứng, gồm GLOSSARY trong thư mục ngôn ngữ; tên nội bộ chuẩn là `project-overview.md` và `progress-checker.md`. Mã Phase dự án đã chuyển sang `PHASE 1`–`PHASE 10`, giữ nguyên thứ tự/phạm vi/phụ thuộc. Đường dẫn `context/progress_checker.md` trong bảng nguồn slop-loop ở trên là tên tệp lịch sử của repository tham khảo, được giữ nguyên để không làm sai nguồn ngoài.

Đã đối chiếu bản dịch theo từng mục/ô bảng/luồng, dùng glossary thống nhất thuật ngữ, kiểm tra bảo toàn mã nghiệp vụ/nguồn trang/ngưỡng số/điều kiện và vấn đề mở. 25 UC giữ đủ 175 trường đặc tả, cùng số lượng/thứ tự bước và các nhánh; việc đặt lại đúng nhóm ô bảng chỉ sửa trình bày đã nêu ở trên. Cả hai bộ giữ 37 điều khoản QĐ, 10 BM, 34 mã chất lượng và 16 điểm mở. Chưa có ADR trong repository để dịch; không tạo quyết định mới.

Hai Progress Checker có cùng 10 Phase và 79 checkbox theo cùng thứ tự/ý nghĩa, đều `[ ]`; trạng thái từng Phase vẫn `NOT_STARTED`, theo bằng chứng kiểm kê đã ghi, không do thiếu dấu checkbox. Mỗi Phase tách chuẩn bị Specification/Plan/Tasks khỏi các nhóm chức năng, kiểm thử và nghiệm thu cụ thể. Hai bản là một sổ tiến độ với hai ngôn ngữ; thay đổi sau này phải đồng bộ cùng bằng chứng. Checklist không thay thế `tasks.md` hoặc GitHub Issues.

Kiểm tra cấu trúc, mã tham chiếu, bảng/danh sách, trạng thái và liên kết nội bộ trên 26 tệp Context cùng AGENTS/domain/issue-tracker; không có liên kết nội bộ hỏng. Các ghi nhận kiểm tra v1 trước chuyển đổi ở trên được giữ như lịch sử, không dùng số liên kết cũ để mô tả gói song ngữ. Dịch thuật đã được đối chiếu nội dung; kiểm tra cơ học không tự chứng minh tương đương ngữ nghĩa. Nhóm trưởng vẫn là người rà soát/phê duyệt cuối; 16 điểm nghiệp vụ/thiết kế mở chưa được giải quyết trong lần chuyển đổi này. Không xác minh chức năng sản phẩm hay kết nối nguồn ngoài trong công việc dịch/tái cấu trúc.
