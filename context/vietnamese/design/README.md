# Điều hướng thiết kế và chỉ mục quyết định

Metadata/phê duyệt gói: [Context hiện hành](../README.md). Mỗi quy tắc có một nơi sở hữu; trang này chỉ điều hướng. D001-D066 giữ xác nhận và bằng chứng duyệt/nguồn/phương án/lý do gốc trong ADR English; tái tổ chức không chốt nghiệp vụ mới.

## Đọc theo chủ đề

| Chủ đề | Nơi sở hữu |
|---|---|
| Kiến trúc, stack, thời gian, quyền cuối | [Kiến trúc](architecture.md) |
| Tài khoản, vai trò, quyền hồ sơ gốc dùng chung | [UC01-UC04](../use-cases/administration.md) |
| Ủy quyền thao tác/mùa/thời hạn | [Ủy quyền nghiệp vụ](access-control.md) |
| Định danh, sửa sai, trường bắt buộc và bản chụp | [Nghiệp vụ](../business.md) |
| Luồng quy định/đăng ký | [UC05-UC11](../use-cases/registration.md) |
| Sinh lịch, khoảng thời gian và công bố | [UC12-UC15](../use-cases/scheduling.md) |
| Biên bản, kết quả, ra sân và sự kiện | [UC16-UC20](../use-cases/results.md) |
| Xem công khai/nội bộ, hạng và giải thưởng | [UC21-UC25](../use-cases/publication.md) |
| Media CLB/cầu thủ | [Media](media.md) |
| Cổng API media và lịch sử phạm vi đã đóng | [Tích hợp](integrations.md) |

## Quyết định đã xác nhận

| Mã | Quy tắc hiện hành | Phê duyệt/lý do |
|---|---|---|
| D001 | [Backend nguyên khối chia module nghiệp vụ, có phân lớp](architecture.md#d001---backend-nguyên-khối-chia-module-nghiệp-vụ-có-phân-lớp) | [0001](../../../docs/adr/0001-modular-layered-backend.md#d001-english-evidence) |
| D002 | [Technology Stack và kiểu API đã phê duyệt](architecture.md#d002---technology-stack-và-kiểu-api-đã-phê-duyệt) | [0002](../../../docs/adr/0002-approved-technology-stack.md#d002-english-evidence) |
| D003 | [Quyền nghiệp vụ theo phạm vi mùa giải](../use-cases/administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d003-english-evidence) |
| D004 | [Nhiều vai trò nghiệp vụ trong cùng mùa giải](../use-cases/administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d004-english-evidence) |
| D005 | [Tách biệt trách nhiệm lập và phê duyệt](../use-cases/administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d005-english-evidence) |
| D006 | [Quản trị viên hệ thống quản lý phân công vai trò theo mùa](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d006-english-evidence) |
| D007 | [Vô hiệu hóa phiên khi đổi quyền hoặc khóa tài khoản](../use-cases/administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d007-english-evidence) |
| D008 | [Khởi tạo Quản trị viên hệ thống đầu tiên bằng CLI trên server](../use-cases/administration.md#d008---khởi-tạo-quản-trị-viên-hệ-thống-đầu-tiên-bằng-cli-trên-server) | [0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d008-english-evidence) |
| D009 | [Bảo vệ quyền quản trị và cấm tự khóa tài khoản](../use-cases/administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d009-english-evidence) |
| D010 | [Cấm quản trị viên tự cấp quyền nghiệp vụ theo mùa](../use-cases/administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d010-english-evidence) |
| D011 | [CLI khôi phục khẩn cấp cho quản trị viên đã tồn tại](../use-cases/administration.md#d011---cli-khôi-phục-khẩn-cấp-cho-quản-trị-viên-đã-tồn-tại) | [0004](../../../docs/adr/0004-first-administrator-cli-bootstrap.md#d011-english-evidence) |
| D012 | [Nhân viên kết quả xử lý toàn mùa, không phân công từng trận](../use-cases/administration.md#d012---nhân-viên-kết-quả-xử-lý-toàn-mùa-không-phân-công-từng-trận) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d012-english-evidence) |
| D013 | [Ủy quyền nghiệp vụ riêng theo thao tác, mùa và thời hạn](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d013-english-evidence) |
| D014 | [Ban tổ chức đề nghị ủy quyền, Quản trị viên ghi nhận cấp/thu hồi](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d014-english-evidence) |
| D015 | [Ủy quyền một cấp dựa trên quyền trực tiếp từ vai trò](access-control.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d015-english-evidence) |
| D016 | [Người nhận không tự đề nghị hoặc ghi nhận cấp ủy quyền cho mình](access-control.md#d016---người-nhận-không-tự-đề-nghị-hoặc-ghi-nhận-cấp-ủy-quyền-cho-mình) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d016-english-evidence) |
| D017 | [Ba người khác nhau khi cấp ủy quyền](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d017-english-evidence) |
| D018 | [Người nhận phải có vai trò nghiệp vụ trong mùa đích trước khi nhận ủy quyền](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d018-english-evidence) |
| D019 | [Ma trận thao tác và vai trò được nhận ủy quyền trong phiên bản đầu](access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d019-english-evidence) |
| D020 | [Chấm dứt ủy quyền khi mất điều kiện, không tự khôi phục](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d020-english-evidence) |
| D021 | [Quản trị viên trực tiếp thu hồi ủy quyền nghiệp vụ](access-control.md#d021---quản-trị-viên-trực-tiếp-thu-hồi-ủy-quyền-nghiệp-vụ) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d021-english-evidence) |
| D022 | [Vô hiệu hóa phiên người nhận khi ủy quyền bắt đầu hoặc kết thúc hiệu lực](access-control.md#d022---vô-hiệu-hóa-phiên-người-nhận-khi-ủy-quyền-bắt-đầu-hoặc-kết-thúc-hiệu-lực) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d022-english-evidence) |
| D023 | [Thời điểm bắt đầu/kết thúc cụ thể, không bao gồm mốc kết thúc](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d023-english-evidence) |
| D024 | [Thời điểm theo UTC, nhập/hiển thị thống nhất múi giờ Việt Nam](architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam) | [0006](../../../docs/adr/0006-utc-instants-and-vietnam-time-zone.md#d024-english-evidence) |
| D025 | [Thời hạn ủy quyền hữu hạn, không có trần số ngày cố định](access-control.md#d025---thời-hạn-ủy-quyền-hữu-hạn-không-có-trần-số-ngày-cố-định) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d025-english-evidence) |
| D026 | [Thời hạn ủy quyền có thể nằm ngoài ngày bắt đầu/kết thúc mùa](access-control.md#d026---thời-hạn-ủy-quyền-có-thể-nằm-ngoài-ngày-bắt-đầukết-thúc-mùa) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d026-english-evidence) |
| D027 | [Cấm ủy quyền cùng người nhận, thao tác và mùa chồng lấn thời gian](access-control.md#d027---cấm-ủy-quyền-cùng-người-nhận-thao-tác-và-mùa-chồng-lấn-thời-gian) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d027-english-evidence) |
| D028 | [Khóa phiên bản đề nghị đã gửi, cấp đúng nội dung đã trình](access-control.md#d028---khóa-phiên-bản-đề-nghị-đã-gửi-cấp-đúng-nội-dung-đã-trình) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d028-english-evidence) |
| D029 | [Tách vòng đời đề nghị và ủy quyền đã cấp](access-control.md#d029---tách-vòng-đời-đề-nghị-và-ủy-quyền-đã-cấp) | [0005](../../../docs/adr/0005-action-scoped-business-delegation.md#d029-english-evidence) |
| D030 | [Kiểm tra lại phiên và quyền hiện hành tại điểm quyết định cuối của thao tác ghi](architecture.md#d030---kiểm-tra-lại-phiên-và-quyền-hiện-hành-tại-điểm-quyết-định-cuối-của-thao-tác-ghi) | [0007](../../../docs/adr/0007-final-authorization-check-for-writes.md#d030-english-evidence) |
| D031 | [Mỗi người một tài khoản nội bộ cá nhân](../use-cases/administration.md#d031---mỗi-người-một-tài-khoản-nội-bộ-cá-nhân) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d031-english-evidence) |
| D032 | [Phạm vi công khai gồm ngày sinh cầu thủ](../use-cases/publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d032-english-evidence) |
| D033 | [Xem dữ liệu nội bộ theo trách nhiệm nghiệp vụ](../use-cases/publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#d033-english-evidence) |
| D034 | [Cấp riêng quyền quản lý hồ sơ gốc dùng chung](../use-cases/administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d034-english-evidence) |
| D035 | [Định danh gốc ổn định và bản chụp chọn lọc thông tin nghiệp vụ chính thức](../business.md#d035---định-danh-gốc-ổn-định-và-bản-chụp-chọn-lọc-thông-tin-nghiệp-vụ-chính-thức) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d035-english-evidence) |
| D036 | [Sửa dữ liệu gốc bị sai và rà soát riêng nghiệp vụ bị ảnh hưởng](../business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d036-english-evidence) |
| D037 | [Cấm Quản trị viên tự cấp quyền quản lý hồ sơ gốc dùng chung](../use-cases/administration.md#d037---cấm-quản-trị-viên-tự-cấp-quyền-quản-lý-hồ-sơ-gốc-dùng-chung) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d037-english-evidence) |
| D038 | [Chấm dứt quyền quản lý hồ sơ gốc dùng chung khi mất phân công vai trò tương ứng cuối cùng](../use-cases/administration.md#d038---chấm-dứt-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-mất-phân-công-vai-trò-tương-ứng-cuối-cùng) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d038-english-evidence) |
| D039 | [Vô hiệu hóa phiên khi thay đổi quyền quản lý hồ sơ gốc dùng chung](../use-cases/administration.md#d039---vô-hiệu-hóa-phiên-khi-thay-đổi-quyền-quản-lý-hồ-sơ-gốc-dùng-chung) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d039-english-evidence) |
| D040 | [Cho phép Quản trị viên tự giảm quyền nghiệp vụ](../use-cases/administration.md#d040---cho-phép-quản-trị-viên-tự-giảm-quyền-nghiệp-vụ) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d040-english-evidence) |
| D041 | [Giữ phân công quyền quản lý hồ sơ gốc dùng chung khi tài khoản bị khóa](../use-cases/administration.md#d041---giữ-phân-công-quyền-quản-lý-hồ-sơ-gốc-dùng-chung-khi-tài-khoản-bị-khóa) | [0003](../../../docs/adr/0003-season-scoped-business-permissions.md#d041-english-evidence) |
| D042 | [Phiên bản quy định mùa giải đã duyệt có nội dung bất biến](../use-cases/registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d042-english-evidence) |
| D043 | [Hiệu lực quy định ngay hoặc trong tương lai và không lùi về quá khứ](../use-cases/registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d043-english-evidence) |
| D044 | [Khóa cấu trúc thi đấu sau khi phê duyệt lịch ban đầu](../use-cases/registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d044-english-evidence) |
| D045 | [Khóa điểm số và thứ tự tiêu chí xếp hạng sau kết quả chính thức đầu tiên](../use-cases/registration.md#d045---khóa-điểm-số-và-thứ-tự-tiêu-chí-xếp-hạng-sau-kết-quả-chính-thức-đầu-tiên) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d045-english-evidence) |
| D046 | [Giữ mã và ý nghĩa loại bàn thắng hoặc thẻ đã được tham chiếu](../use-cases/registration.md#d046---giữ-mã-và-ý-nghĩa-loại-bàn-thắng-hoặc-thẻ-đã-được-tham-chiếu) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d046-english-evidence) |
| D047 | [Gắn danh mục sự kiện trận với giờ bắt đầu thực tế được ghi nhận](../use-cases/results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d047-english-evidence) |
| D048 | [Ghi giờ bắt đầu thực tế trong biên bản và xác nhận cùng kết quả chính thức](../use-cases/results.md#d048---ghi-giờ-bắt-đầu-thực-tế-trong-biên-bản-và-xác-nhận-cùng-kết-quả-chính-thức) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d048-english-evidence) |
| D049 | [Kiểm tra lại sự kiện khi sửa giờ bắt đầu làm đổi danh mục áp dụng](../use-cases/results.md#d049---kiểm-tra-lại-sự-kiện-khi-sửa-giờ-bắt-đầu-làm-đổi-danh-mục-áp-dụng) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d049-english-evidence) |
| D050 | [Mỗi mùa tối đa một phiên bản quy định đã duyệt chờ hiệu lực tương lai](../use-cases/registration.md#d050---mỗi-mùa-tối-đa-một-phiên-bản-quy-định-đã-duyệt-chờ-hiệu-lực-tương-lai) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d050-english-evidence) |
| D051 | [Hủy, thay thế và kiểm soát hiệu lực quy định đang chờ](../use-cases/registration.md#d051---hủy-thay-thế-và-kiểm-soát-hiệu-lực-quy-định-đang-chờ) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d051-english-evidence) |
| D052 | [Thay đổi quy định đăng ký tương thích và kiểm tra lại hồ sơ đang chờ](../use-cases/registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ) | [0010](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d052-english-evidence) |
| D053 | [Đợt đăng ký, hạn tiếp nhận và ngoại lệ từng hồ sơ](../use-cases/registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d053-english-evidence) |
| D054 | [Tự xét U21 và kiểm tra homegrown bằng căn cứ do nhân sự xác minh](../use-cases/registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d054-english-evidence) |
| D055 | [Luồng hồ sơ CLB và đăng ký cầu thủ theo phiên bản](../use-cases/registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d055-english-evidence) |
| D056 | [Khoảng hiệu lực thi đấu và chuyển CLB nhất quán](../use-cases/registration.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d056-english-evidence) |
| D057 | [Hiệu chỉnh đăng ký đã hợp lệ qua phê duyệt độc lập](../use-cases/registration.md#d057---hiệu-chỉnh-đăng-ký-đã-hợp-lệ-qua-phê-duyệt-độc-lập) | [0011](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d057-english-evidence) |
| D058 | [Mã nghiệp vụ ổn định, rà soát hồ sơ trùng và số áo duy nhất theo thời gian](../business.md#d058---mã-nghiệp-vụ-ổn-định-rà-soát-hồ-sơ-trùng-và-số-áo-duy-nhất-theo-thời-gian) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d058-english-evidence) |
| D059 | [Dữ liệu đăng ký bắt buộc và mốc chụp thông tin chính thức](../business.md#d059---dữ-liệu-đăng-ký-bắt-buộc-và-mốc-chụp-thông-tin-chính-thức) | [0009](../../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d059-english-evidence) |
| D060 | [Tự sinh cặp đấu và hoàn thiện lịch nháp bằng nhập liệu](../use-cases/scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d060-english-evidence) |
| D061 | [Khoảng kế hoạch theo mùa và kiểm tra xung đột lịch toàn hệ thống](../use-cases/scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d061-english-evidence) |
| D062 | [Duyệt lịch đồng thời công bố và điều chỉnh theo phiên bản](../use-cases/scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#d062-english-evidence) |
| D063 | [Tách vòng đời trận, phiên bản biên bản và kết quả chính thức](../use-cases/results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d063-english-evidence) |
| D064 | [Xét ra sân tại giờ bắt đầu và xác định thủ môn theo biên bản](../use-cases/results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d064-english-evidence) |
| D065 | [Phút sự kiện có cấu trúc, kiểm tra tỷ số và tham chiếu chữ ký trọng tài](../use-cases/results.md#d065---phút-sự-kiện-có-cấu-trúc-kiểm-tra-tỷ-số-và-tham-chiếu-chữ-ký-trọng-tài) | [0013](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d065-english-evidence) |
| D066 | [Đồng hạng trên bảng xếp hạng và đồng giải cá nhân](../use-cases/publication.md#d066---đồng-hạng-trên-bảng-xếp-hạng-và-đồng-giải-cá-nhân) | [0014](../../../docs/adr/0014-shared-ranks-and-individual-awards.md#d066-english-evidence) |
| D067 | [Phê duyệt hoãn và trở lại lịch](../use-cases/scheduling.md#d067---phê-duyệt-hoãn-và-trở-lại-lịch-qua-uc14) | [0012](../../../docs/adr/0012-schedule-generation-scope-and-drafts.md#q67---postponement-approval-and-allocation) |
| D068 | [Dashboard tổng quan mùa giải công khai](../use-cases/publication.md#d068---dashboard-tổng-quan-mùa-giải-công-khai) | [0008](../../../docs/adr/0008-public-information-and-player-birth-dates.md#q68---shared-public-season-dashboard) |

## Chỉ đạo khác đã xác nhận

| Mã | Nơi sở hữu | Bằng chứng |
|---|---|---|
| LOGO-01 | [Chính sách Logo đã duyệt](media.md#logo-01---thiết-kế-logo-đã-phê-duyệt) | [ADR 0015](../../../docs/adr/0015-managed-club-logos-in-first-version.md) |
| INT-01 | [Nghiệm thu trước nghiên cứu API](integrations.md#int-01---nghiệm-thu-trước-nghiên-cứu-và-tích-hợp-api) | [ADR 0016](../../../docs/adr/0016-core-acceptance-before-external-integration.md) |
| POSTPONE-01 | [Hoãn trận](../use-cases/scheduling.md#postpone-01---quản-lý-hoãn-trận-phiên-bản-đầu) | Phạm vi đã chốt; chi tiết Q67 theo D067. |
| DASHBOARD-01 | [Dashboard mùa](../use-cases/publication.md#dashboard-01---dashboard-tổng-quan-mùa-giải) | Phạm vi và gói Q68 đã chốt; D068 sở hữu chi tiết. |
| LS-01 | [Loại khỏi phiên bản đầu](integrations.md#v2-ext-01---live-match-tracking--live-score) | [ADR 0017](../../../docs/adr/0017-live-score-excluded-from-first-version.md); hủy phỏng vấn. |
| DOCS-01 | [Duy trì package](../README.md#duy-trì-package-hiện-hành) | Nhóm trưởng duyệt tái tổ chức sau LOGO-01, giữ chỉ mục tại đây và chỉ để việc chưa chốt trong open-decisions. |

## Mốc tiếp tục

Q67 và Q68 đã chốt: D067 sở hữu hoãn trận; D068 sở hữu Dashboard công khai dùng chung. Dừng ở mốc nghỉ sau Q68 theo yêu cầu Nhóm trưởng. Chưa hỏi hoặc trả lời Q69. Khi tiếp tục, ưu tiên quyết định phiên bản đầu còn mở theo phụ thuộc, gồm chính sách ảnh cầu thủ và xếp hạng/playoff/tổng kết mùa. LS-01 hủy phỏng vấn/thiết kế/nghiệm thu Live Score. Nghiên cứu/chọn API media vẫn sau nghiệm thu cốt lõi độc lập. Phê duyệt toàn v2 còn chờ; không cho code, Specs, Tasks, Issues, tích hợp API, commit hoặc push.
