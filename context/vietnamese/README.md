# Whistle-EPL Context Package

**Phiên bản hiện hành:** v2 | **Trạng thái:** DRAFT - PARTIALLY CONFIRMED | **Duyệt toàn gói:** PENDING

**Mốc v1 đã duyệt:** Nhóm trưởng, 2026-10-24; commit rà soát `adad61f2a0625d62538aa10ce0ec8b6a91defa53`, nhánh `docs/build-agent-context`. Truy xuất bằng `git show adad61f2a0625d62538aa10ce0ec8b6a91defa53:context/vietnamese/README.md`.

Một package phát triển liên tục có hai bản ngôn ngữ tương đương. Quyết định riêng được duyệt theo bằng chứng; thiết kế chưa chốt và duyệt toàn v2 vẫn chờ. Tài liệu không chứng minh triển khai/nghiệm thu phần mềm.

## Nạp theo nhiệm vụ

| Nhiệm vụ | Đọc |
|---|---|
| Mục tiêu, tác nhân, quan hệ đối tượng | [Tổng quan](project-overview.md) |
| Thuật ngữ | [Glossary](GLOSSARY.md) |
| Quy tắc, biểu mẫu nguồn, định danh/trường dùng chung | [Nghiệp vụ](business.md) |
| Tài khoản, vai trò và quyền dùng chung | [UC01-UC04](use-cases/administration.md) |
| Quy định, hồ sơ CLB/cầu thủ và đăng ký | [UC05-UC11](use-cases/registration.md) |
| Sân, sinh và điều chỉnh lịch | [UC12-UC15](use-cases/scheduling.md) |
| Biên bản, ra sân, sự kiện và kết quả chính thức | [UC16-UC20](use-cases/results.md) |
| Tra cứu công khai/nội bộ, hạng, báo cáo, tin tức | [UC21-UC25](use-cases/publication.md) |
| Thiết kế/kỹ thuật hoặc [D001](design/architecture.md#d001---backend-nguyên-khối-chia-module-nghiệp-vụ-có-phân-lớp)-[D068](use-cases/publication.md#d068---dashboard-tổng-quan-mùa-giải-công-khai) | [Điều hướng/chỉ mục thiết kế](design/README.md) |
| Media hoặc API ngoài tương lai | [Media](design/media.md), [tích hợp](design/integrations.md) |
| Chất lượng, nghiệm thu, chọn Phase | [Chất lượng](quality.md), [Progress Checker](progress-checker.md) |
| Việc chưa chốt | [Quyết định mở](open-decisions.md) |
| Trích nguồn và bằng chứng duyệt | [Nguồn](sources.md) |

## Thẩm quyền và quy trình

Chỉ đạo trực tiếp của Nhóm trưởng điều hành công việc. PDF không đổi là nguồn yêu cầu; tài liệu sở hữu hiện hành đánh dấu làm rõ đã duyệt bằng mã quyết định ổn định. Dùng trang nguồn và [truy vết](sources.md); báo mâu thuẫn chưa duyệt thay vì tự thêm luật. Giữ mã tác nhân/UC/BM/QĐ/chất lượng.

Sau khi quyết định cần thiết được duyệt: Phase -> Specification -> Plan -> Tasks -> Issues của Task đã duyệt -> Implementation -> Testing và Acceptance. Đọc [quy ước Issue](../../docs/agents/issue-tracker.md) trước công việc tracker. PHASE 1-PHASE 10 là Phase dự án, khác phase task của Spec Kit. Đổi trạng thái/checkbox cần bằng chứng thực.

## Duy trì package hiện hành

DOCS-01 được Nhóm trưởng duyệt ngày 2026-10-26 (Asia/Bangkok): version là mốc của cùng package lưu trong Git, không phải bộ tài liệu song song. Mỗi quy tắc có một nơi sở hữu. README điều hướng và giữ chỉ mục quyết định hiện có; GLOSSARY định nghĩa thuật ngữ; ADR English ghi quyết định, lý do và bằng chứng duyệt/nguồn; open-decisions chỉ giữ việc chưa giải quyết. Cập nhật nơi sở hữu cùng liên kết/UC/Phase liên quan; không duy trì chính sách hiện hành trùng lặp.

Giữ cấu trúc/ngữ nghĩa English/Vietnamese tương đương. Điểm vào mặc định của agent là English; đọc Vietnamese khi được yêu cầu hoặc xử lý mơ hồ dịch/nghiệp vụ. Giữ PDF và Git history, gồm phê duyệt v1; quyết định riêng không chứng minh duyệt toàn v2 hoặc hoàn thành phần mềm. Quyền tái tổ chức mới nhất thay hướng dẫn cũ đóng băng tệp v1 hiện hành.
