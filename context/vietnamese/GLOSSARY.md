# Whistle-EPL - Thuật ngữ nghiệp vụ

Một ngữ cảnh duy nhất cho hệ thống quản lý Premier League. Định nghĩa theo PDF; [quy ước nguồn](sources.md). Chỉ thống nhất nghĩa nghiệp vụ, không xác định mô hình lưu trữ.

## Giải đấu và tổ chức

**Premier League / EPL**: Giải bóng đá Ngoại hạng Anh được hệ thống mô phỏng quản lý theo từng mùa giải (§1.1 tr.4-5).

**Mùa giải**: Đơn vị tổ chức có mã, tên, thời gian, trạng thái và dữ liệu/quy định được phân biệt với mùa khác (§1.3.4.1 tr.37).

**Ban tổ chức / Người quản lý mùa giải**: Tác nhân quản lý mùa giải, giám sát nghiệp vụ và phê duyệt theo thẩm quyền (§2.1 tr.53). “Quản lý giải đấu” ở UC01 là cách gọi trong nguồn, không thêm tác nhân thứ bảy.

**Câu lạc bộ (CLB)**: Đơn vị bóng đá có thông tin định danh chung, được liên kết với hồ sơ tham dự từng mùa (§1.3.4.1 tr.37; UC07 tr.82-84). “Đội bóng”/“đội” là nhãn giữ nguyên trên BM, dùng CLB trong diễn giải.

**Sân vận động**: Địa điểm thi đấu có thông tin quản lý và trạng thái sử dụng; có thể được nhiều CLB sử dụng (tr.37; QĐ2.5).

**Sân nhà**: Sân được CLB đăng ký trong hồ sơ theo mùa, mặc định dùng khi CLB là chủ nhà trừ thay đổi được Ban tổ chức chấp thuận (BM1, QĐ2.3).

## Hồ sơ và đăng ký

**Cầu thủ / Hồ sơ cầu thủ**: Cá nhân và hồ sơ định danh cơ bản, phân biệt với việc đăng ký cho CLB/mùa cụ thể (UC09 tr.88-90).

**Hồ sơ đăng ký câu lạc bộ**: Hồ sơ tham dự một mùa của CLB, gồm người đại diện, HLV, sân nhà và danh sách cầu thủ theo BM1 (tr.37; UC08 tr.85-88). _Tránh_: đồng nhất với thông tin CLB gốc.

**Đăng ký cầu thủ theo mùa giải**: Việc cầu thủ đăng ký cho một CLB trong mùa cụ thể, có số áo, diện đăng ký, trạng thái và thời gian hiệu lực (tr.37; UC10 tr.91-94).

**Danh sách chính thức**: Danh sách cầu thủ chịu giới hạn mặc định tối đa 25 và tối đa 17 không đáp ứng tiêu chí đào tạo nội địa; U21 đủ điều kiện đăng ký ngoài giới hạn 25 (QĐ1.2-1.4).

**Cầu thủ đáp ứng tiêu chí đào tạo nội địa (Home Grown Player)**: Có ít nhất ba mùa hoặc 36 tháng đăng ký tại CLB thuộc Liên đoàn Anh hoặc Wales trong giai đoạn tuổi được quy định, không phân biệt quốc tịch (QĐ1.3). _Tránh_: “cầu thủ quốc tịch Anh” thay cho tiêu chí đào tạo.

**U21**: Diện đăng ký xác định bằng mốc ngày sinh của từng mùa; không tự suy ra bằng tuổi tại ngày hiện tại (QĐ1.4).

**Đăng ký còn hiệu lực**: Đăng ký thi đấu đang có hiệu lực trong khoảng thời gian được xem xét; một cầu thủ chỉ được có một đăng ký như vậy tại một thời điểm trong cùng giải (QĐ1.5).

## Trận đấu và kết quả

**Vòng đấu**: Nhóm các trận theo mùa và số thứ tự vòng (tr.37).

**Trận đấu / Lịch thi đấu**: Trận gắn mùa, vòng, chủ nhà, khách, ngày giờ, sân và trạng thái; lịch tổ chức các trận theo thể thức (QĐ2; tr.37).

**Biên bản trận đấu**: Dữ liệu theo BM3 gồm cầu thủ ra sân, bàn thắng, thẻ phạt và thông tin làm căn cứ kiểm tra kết quả; lập biên bản chưa có nghĩa kết quả chính thức (UC16 tr.109-112).

**Danh sách cầu thủ ra sân**: Các cầu thủ tham gia trận, thuộc đúng hai CLB và có đăng ký hợp lệ; có vị trí và số áo trong trận (QĐ3.2; tr.37).

**Kết quả chính thức / Kết quả đã xác nhận**: Kết quả được người có quyền xác nhận sau khi trận kết thúc, dùng cho công khai và thống kê chính thức (UC18 tr.115-118). _Tránh_: coi lưu biên bản hoặc UC17 là xác nhận.

**Điều chỉnh kết quả đã xác nhận**: Thay đổi kết quả chính thức có căn cứ, quyền, lý do, lịch sử trước/sau và tính lại dữ liệu phụ thuộc (UC19 tr.118-121).

**Sự kiện bàn thắng**: Sự kiện có cầu thủ, CLB, loại và thời điểm gồm phút chính thức/bù giờ; mặc định A thường, B phạt đền, C phản lưới, D đá phạt trực tiếp (QĐ3.3-3.4).

**Bàn phản lưới nhà**: Loại C, tính vào tỷ số đội đối phương và không tính thành tích ghi bàn cá nhân (QĐ3.4; QĐ5.4).

**Sự kiện thẻ phạt**: Thẻ vàng hoặc đỏ gắn trận, cầu thủ, CLB, thời điểm; không bao gồm hệ thống kỷ luật/đình chỉ độc lập (QĐ3.5; tr.38-39).

## Tổng hợp và công bố

**Bảng xếp hạng (BXH)**: Thành tích CLB theo mùa tính từ kết quả chính thức, gồm trận, thắng, hòa, thua, bàn thắng, bàn thua, hiệu số, điểm, hạng (BM5.1; QĐ5).

**BT / BB / HS**: Các nhãn trên BM5.1 lần lượt là bàn thắng, bàn thua, hiệu số; hiệu số bằng bàn ghi được trừ bàn thua (QĐ5.2).

**Vua phá lưới**: Danh hiệu dành cho cầu thủ có tổng bàn thắng hợp lệ cao nhất mùa; đồng số cao nhất cùng nhận, không tính phản lưới (QĐ5.4).

**Trận giữ sạch lưới**: Trận chính thức CLB không thủng lưới, cộng cho thủ môn xác định từ danh sách ra sân; phạm vi hiện tại chưa xét thay thủ môn (QĐ5.7).

**Găng tay vàng**: Danh hiệu xác định theo số trận giữ sạch lưới của thủ môn trong mùa (QĐ5.7); cách xử lý đồng số chưa được nguồn chốt.

**Báo cáo tổng kết mùa giải**: BM5.3, chỉ được xác nhận khi đủ kết quả mọi trận và giải quyết phân hạng cần thiết (QĐ5.5).

**Tin tức và thông báo giải đấu**: Nội dung do Ban tổ chức quản lý; chỉ nội dung đã công bố mới được công khai (UC24-UC25 tr.134-139).

**Quy định mùa giải**: Bộ điều kiện nghiệp vụ áp dụng theo mùa, có thẩm quyền phê duyệt và thời điểm hiệu lực (QĐ6; UC06).

**Lịch sử thay đổi / Nhật ký hoạt động**: Thông tin truy vết người, thời điểm, thao tác/đối tượng, nội dung trước-sau đối với những thay đổi quan trọng; chỉ được truy cập theo quyền (tr.38; BM-06). Hai cách gọi có phạm vi liên quan trong nguồn, chưa bắt buộc là cùng một cơ chế kỹ thuật.

## Bổ sung Context v2

**Đồng hạng trên bảng xếp hạng**: Hạng thể thao chung cho các CLB bằng toàn bộ tiêu chí chính áp dụng, hạng sau bỏ qua theo số CLB trong nhóm; thứ tự hiển thị trong nhóm không phân định hòa ([D066](design/README.md#d066---đồng-hạng-trên-bảng-xếp-hạng-và-đồng-giải-cá-nhân), xác nhận 2026-10-25).

**Phút sự kiện trận**: Phút chính cùng phần bù giờ ghi riêng để xác định lúc bàn thắng/thẻ xảy ra; bù giờ hiệp một vẫn thuộc hiệp một, không chuyển thành phút hiệp hai ([D065](design/README.md#d065---phút-sự-kiện-có-cấu-trúc-kiểm-tra-tỷ-số-và-tham-chiếu-chữ-ký-trọng-tài), xác nhận 2026-10-25).

**Phiên bản biên bản trận**: Một bản nội dung trong hồ sơ biên bản duy nhất của trận; bản đã trình được giữ nguyên khi chờ xác nhận, độc lập với việc kết quả trước đó vẫn chính thức ([D063](design/README.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức), xác nhận 2026-10-25).

**Khoảng thi đấu dự kiến**: Khoảng nửa kín từ giờ bắt đầu theo lịch đến giờ kết thúc dự kiến, dùng kiểm tra xung đột lịch CLB theo thời lượng kế hoạch của mùa ([D061](design/README.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống), xác nhận 2026-10-25).

**Khoảng chiếm dụng sân**: Khoảng thi đấu dự kiến nửa kín được mở rộng bằng đệm chuẩn bị và giải phóng sân của mùa, dùng kiểm tra xung đột phân bổ sân ([D061](design/README.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống)).

**Hiệu chỉnh đăng ký đã hợp lệ**: Việc sửa sai nội dung, phân loại hoặc khoảng hiệu lực đăng ký đã xác nhận qua phê duyệt độc lập, phân biệt với xác nhận ban đầu và kết thúc/chuyển CLB thông thường ([D057](design/README.md#d057---hiệu-chỉnh-đăng-ký-đã-hợp-lệ-qua-phê-duyệt-độc-lập), xác nhận 2026-10-25).

**Khoảng hiệu lực thi đấu**: Khoảng từ mốc bắt đầu được tính đến mốc kết thúc không được tính của đăng ký hợp lệ, có thể chưa xác định kết thúc cho tới khi chấm dứt; các khoảng đã xác nhận của cùng cầu thủ và giải không được chồng lấn ([D056](design/README.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán), xác nhận 2026-10-25).

**Đăng ký cầu thủ hợp lệ**: Đăng ký được Nhân viên đăng ký xác nhận đạt các kiểm tra áp dụng theo UC10; riêng việc xác nhận này không chứng minh khoảng hiệu lực thi đấu bao gồm một thời điểm cụ thể ([D055](design/README.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản), xác nhận 2026-10-25).

**Căn cứ xác minh homegrown**: Tài liệu và đánh giá được nhân sự ghi nhận để chứng minh số mùa hoặc tháng đạt điều kiện homegrown của mùa, phân biệt với quốc tịch hoặc trạng thái U21 ([D054](design/README.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh), xác nhận 2026-10-25).

**Đợt tiếp nhận đăng ký**: Khoảng mở/đóng theo mùa để tiếp nhận hồ sơ tham gia CLB hoặc đăng ký/thay đổi danh sách cầu thủ, được quản lý riêng cho hai nhóm ([D053](design/README.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ), xác nhận 2026-10-25).

**Ngoại lệ hạn tiếp nhận**: Việc miễn điều kiện thời hạn tiếp nhận đã được phê duyệt cho một phiên bản hồ sơ xác định, không miễn điều kiện cầu thủ, hạn mức hoặc quy tắc xung đột đăng ký ([D053](design/README.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ)).

**Giờ bắt đầu thực tế của trận**: Thời điểm được ghi nhận khi trận thực sự bắt đầu, phân biệt với giờ trong lịch và lúc nhập biên bản; dùng xác định danh mục bàn thắng/thẻ áp dụng theo [D047](design/README.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận), xác nhận 2026-10-25.

**Phiên bản quy định mùa giải**: Một bộ quy định đầy đủ riêng cho một mùa, có nội dung đã duyệt được giữ nguyên làm căn cứ nghiệp vụ; thay đổi nội dung đã duyệt cần phiên bản mới được phê duyệt ([D042](design/README.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến), xác nhận 2026-10-25).

Các định nghĩa v1 theo nguồn phía trên được giữ nguyên. Các định nghĩa nghiệp vụ sau đến từ những quyết định v2 đã được Nhóm trưởng xác nhận, không phải điều khoản PDF bổ sung.

**Ủy quyền nghiệp vụ**: Việc cho phép thực hiện một thao tác quản lý giải đấu cụ thể trong một mùa xác định và thời hạn hiệu lực xác định, phân biệt với cấp toàn bộ vai trò nghiệp vụ ([D013](design/README.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn), xác nhận 2026-10-25; O07/O08). Ban tổ chức đề nghị và Quản trị viên hệ thống ghi nhận cấp/thu hồi ([D014](design/README.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)); người nhận phải có tài khoản hoạt động và vai trò nghiệp vụ trong mùa đích ([D018](design/README.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền)), trong ma trận vai trò/thao tác đã duyệt ([D019](design/README.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu)).

**Quyền nghiệp vụ trực tiếp**: Quyền một người có trực tiếp từ vai trò nghiệp vụ của mình trong mùa tương ứng, thay vì nhận qua ủy quyền; chỉ quyền này được dùng làm căn cứ đề nghị ủy quyền ([D015](design/README.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò), xác nhận 2026-10-25). Ủy quyền nghiệp vụ chỉ có một cấp: người nhận không được dùng quyền được ủy quyền để ủy quyền tiếp.

**Tài khoản nội bộ cá nhân**: Tài khoản duy nhất được cấp cho một nhân sự nội bộ trên toàn hệ thống, mang các vai trò và phân công mùa tương ứng của người đó, không dùng chung với người khác ([D031](design/README.md#d031---mỗi-người-một-tài-khoản-nội-bộ-cá-nhân), xác nhận 2026-10-25).

**Thông tin giải đấu công khai**: Thông tin giải đấu đã được cho phép xem không cần đăng nhập trong phạm vi mùa/xuất bản, gồm ngày sinh cầu thủ theo quyết định v2 của Nhóm trưởng ([D032](design/README.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ), xác nhận 2026-10-25).

**Thông tin giải đấu nội bộ**: Thông tin quản trị, hồ sơ và cá nhân nằm ngoài phạm vi công khai đã duyệt, chỉ được truy cập với thẩm quyền tương ứng ([D032](design/README.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ)). Quyền xem theo vai trò phụ trách và mùa, không chỉ dựa vào đăng nhập ([D033](design/README.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ)).
