# Yêu cầu nghiệp vụ, biểu mẫu và quy định

Nguồn: §1.2.1, Bảng 1.1 và §1.2.1.1 tr.6-11. Các mục dưới đây giữ mã của PDF; không bổ sung quy định EPL bên ngoài. [Nguồn gốc](sources.md) · [Điểm mở](open-decisions.md).

## Sáu yêu cầu nghiệp vụ

| STT gốc | Yêu cầu | Biểu mẫu | Quy định | UC liên quan | Phase sở hữu |
|---|---|---|---|---|---|
| 1 | Tiếp nhận hồ sơ đăng ký | BM1 | QĐ1 | UC08-UC11; dữ liệu UC07, UC09, UC12 | PHASE 3 |
| 2 | Lập lịch thi đấu | BM2 | QĐ2 | UC13-UC15 | PHASE 4; tra cứu tại PHASE 6 |
| 3 | Ghi nhận kết quả trận đấu | BM3 | QĐ3 | UC16-UC20 | PHASE 5 |
| 4 | Tra cứu thông tin giải đấu | BM4.1-BM4.4 | QĐ4 | UC15, UC21, UC23; thông tin mùa UC05 | PHASE 6 |
| 5 | Lập báo cáo giải | BM5.1-BM5.3 | QĐ5 | UC20, UC22 | PHASE 5 tính thống kê; PHASE 7 lập/xuất báo cáo |
| 6 | Thay đổi qui định | Không có BM riêng trong Bảng 1.1 | QĐ6 | UC06 | PHASE 2 |

Tài khoản/nhật ký (PHASE 1), dữ liệu nền (PHASE 2), tin tức (PHASE 8), nhập/xuất dữ liệu (PHASE 9) và nghiệm thu toàn hệ thống (PHASE 10) được truy vết từ các mục khác trong Chương 1-2, không thêm thành yêu cầu thứ bảy của Bảng 1.1.

## Trường của 10 biểu mẫu

Các cột và thông tin dưới đây là nội dung biểu mẫu nghiệp vụ, không xác định UI, schema hay API. Mẫu không đánh dấu đầy đủ trường bắt buộc; không tự coi mọi trường hiển thị đều bắt buộc hoặc công khai. Đối chiếu chất lượng BM-05 và điểm mở O04/O09.

| Mã, tên nguyên mẫu | Trang | Thông tin/cột cần giữ |
|---|---|---|
| BM1 - Hồ Sơ Đội Bóng | 6 | Người đại diện: Họ và tên, Số điện thoại, Địa chỉ liên hệ. Đội bóng: Tên đội, Sân nhà, Huấn luyện viên. Danh sách đăng ký: STT, Cầu thủ, Ngày sinh, Vị trí thi đấu, Số áo, Diện đăng ký, Ghi chú |
| BM2 - Lịch Thi Đấu | 7 | Vòng thi đấu, Mùa giải; STT, Đội 1 (Chủ nhà), Đội 2 (Đội khách), Ngày - Giờ, Sân thi đấu |
| BM3 - Kết Quả Thi Đấu | 7-8 | Mùa giải, Vòng thi đấu, Ngày - Giờ, Đội 1 (Chủ nhà), Đội 2 (Đội khách), Tỷ số chung cuộc, Sân thi đấu. Danh sách ra sân: STT, Cầu thủ, Đội bóng, Vị trí, Số áo. Bàn thắng: STT, Cầu thủ, Đội bóng, Loại bàn thắng, Thời điểm. Thẻ phạt: STT, Cầu thủ, Đội bóng, Loại thẻ phạt, Thời điểm. Chữ ký trọng tài |
| BM4.1 - Tra Cứu Thông Tin Giải Đấu | 8 | Tên giải đấu, Mùa giải, Số lượng CLB tham gia, Số vòng đấu, Tổng số trận đấu, Ngày khởi tranh - Kết thúc |
| BM4.2 - Tra Cứu Thông Tin Đội Bóng | 8 | Mùa giải; STT, Tên đội bóng, HLV trưởng, Sân nhà, Số lượng cầu thủ, Người đại diện |
| BM4.3 - Tra Cứu Thông Tin Cầu Thủ | 9 | Mùa giải; STT, Cầu thủ, Ngày sinh, Diện đăng ký, Số áo, Tên đội bóng, Số bàn thắng |
| BM4.4 - Tra Cứu Lịch Thi Đấu Và Kết Quả | 9 | Mùa giải; Vòng đấu, Đội chủ nhà, Đội khách, Ngày - Giờ, Sân thi đấu, Tỷ số |
| BM5.1 - Bảng Xếp Hạng | 9-10 | Mùa giải, Ngày; Hạng, Đội, Trận, Thắng, Hòa, Thua, BT, BB, HS, Điểm |
| BM5.2 - Danh Sách Các Cầu Thủ Ghi Bàn | 10 | Mùa giải, Ngày; STT, Tên cầu thủ, Tên đội bóng, Diện đăng ký, Tổng số bàn thắng |
| BM5.3 - Tổng Kết Mùa Giải | 10 | Mùa giải, Ngày lập báo cáo; Đội vô địch, Đội á quân, Đội hạng ba; bảng CLB xuống hạng gồm STT, Vị trí trên BXH, Tên CLB (mẫu có ba dòng); Vua phá lưới, Găng tay vàng, Tổng số bàn thắng toàn giải đấu |

## Quy định chi tiết

37 điều khoản được chuyển từ PDF theo từng nhóm dưới đây. Các giá trị mặc định áp dụng theo nguồn; QĐ6 cho phép thay đổi có kiểm soát theo mùa, không có nghĩa tự áp dụng cấu hình khác.

### QĐ1

Nguồn: §1.2.1.1.1, tr.6-7.

- **QĐ1.1:** Mỗi câu lạc bộ tham gia giải đấu phải có hồ sơ đăng ký theo từng mùa giải, bao gồm thông tin câu lạc bộ, người đại diện và danh sách cầu thủ.
- **QĐ1.2:** Mỗi câu lạc bộ được đăng ký tối đa 25 cầu thủ trong danh sách chính thức, trong đó tối đa 17 cầu thủ không đáp ứng tiêu chí đào tạo nội địa.
- **QĐ1.3:** Cầu thủ được xem là đáp ứng tiêu chí đào tạo nội địa nếu có ít nhất ba mùa giải hoặc 36 tháng đăng ký tại các câu lạc bộ thuộc Liên đoàn Bóng đá Anh hoặc Wales trong giai đoạn tuổi được quy định, không phân biệt quốc tịch.
- **QĐ1.4:** Cầu thủ thuộc diện U21 được đăng ký ngoài giới hạn 25 cầu thủ. Điều kiện U21 được xác định theo mốc ngày sinh của từng mùa giải.
- **QĐ1.5:** Mỗi cầu thủ chỉ được có một đăng ký thi đấu còn hiệu lực tại một thời điểm trong cùng giải đấu.
- **QĐ1.6:** Hồ sơ đăng ký và các thay đổi danh sách cầu thủ phải tuân thủ thời hạn đăng ký của mùa giải và các trường hợp ngoại lệ được phép.

### QĐ2

Nguồn: §1.2.1.1.2, tr.7.

- **QĐ2.1:** Mặc định nguồn là 20 CLB; [D060](use-cases/scheduling.md#d060---tự-sinh-cặp-đấu-và-hoàn-thiện-lịch-nháp-bằng-nhập-liệu) sở hữu cấu hình phiên bản đầu được hỗ trợ và chọn CLB đã duyệt.
- **QĐ2.2:** Với mặc định nguồn 20 CLB vòng tròn hai lượt, mỗi CLB gặp 19 CLB còn lại sân nhà/sân khách: 38 trận mỗi CLB, 38 vòng và 380 trận. D060 sở hữu sinh/kiểm tra số CLB thay đổi được hỗ trợ.
- **QĐ2.3:** Mỗi trận đấu phải xác định rõ vòng thi đấu, đội chủ nhà, đội khách, ngày giờ và sân thi đấu. Đội chủ nhà sử dụng sân nhà đã đăng ký, trừ trường hợp thay đổi sân được Ban tổ chức chấp thuận.
- **QĐ2.4:** Một câu lạc bộ không được tham gia hai trận đấu có thời gian diễn ra trùng nhau.
- **QĐ2.5:** Một sân vận động không được tổ chức hai trận đấu có thời gian diễn ra chồng lấn nhau. Các câu lạc bộ dùng chung sân phải được bố trí lịch thi đấu phù hợp.
- **QĐ2.6:** Ban tổ chức được phép điều chỉnh ngày giờ hoặc sân thi đấu của trận đấu chưa diễn ra. Mọi thay đổi phải bảo đảm tính hợp lệ của lịch thi đấu và được lưu lại để phục vụ tra cứu, đối chiếu.

### QĐ3

Nguồn: §1.2.1.1.3, tr.8.

- **QĐ3.1:** Chỉ những trận đấu đã được lập lịch hợp lệ theo BM2 mới được ghi nhận kết quả. Thông tin trận đấu phải tương ứng với mùa giải, vòng đấu, hai câu lạc bộ và lịch thi đấu đã đăng ký.
- **QĐ3.2:** Danh sách cầu thủ ra sân phải thuộc hai câu lạc bộ tham gia trận đấu và có đăng ký thi đấu hợp lệ. Kết quả trận đấu chỉ được xác nhận chính thức sau khi trận đấu kết thúc.
- **QĐ3.3:** Có 4 loại bàn thắng được quản lý: A (bàn thắng thông thường), B (bàn thắng từ chấm phạt đền), C (bàn thắng phản lưới nhà) và D (bàn thắng từ quả đá phạt trực tiếp).
- **QĐ3.4:** Thời điểm ghi bàn được tính theo phút thi đấu chính thức và phút bù giờ. Tỷ số trận đấu phải khớp với tổng số bàn thắng hợp lệ của mỗi đội, bàn phản lưới nhà được tính cho đội đối phương.
- **QĐ3.5:** Hệ thống ghi nhận hai loại thẻ phạt là thẻ vàng và thẻ đỏ, bao gồm cầu thủ nhận thẻ, đội bóng và thời điểm nhận thẻ. Các sự kiện thẻ phạt phải thuộc trận đấu được ghi nhận.
- **QĐ3.6:** Kết quả trận đấu sau khi được xác nhận phải được sử dụng để cập nhật bảng xếp hạng và thống kê cầu thủ. Mọi điều chỉnh kết quả đã xác nhận phải do người có thẩm quyền thực hiện và được lưu lại lịch sử thay đổi.

### QĐ4

Nguồn: §1.2.1.1.4, tr.9.

- **QĐ4.1:** Thông tin tra cứu phải được xác định theo từng mùa giải, bao gồm thông tin câu lạc bộ, cầu thủ, lịch thi đấu và kết quả trận đấu. Dữ liệu của các mùa giải khác nhau phải được quản lý và hiển thị độc lập.
- **QĐ4.2:** Hệ thống cho phép tra cứu thông tin các câu lạc bộ tham gia mùa giải, bao gồm tên đội bóng, huấn luyện viên, sân nhà, số lượng cầu thủ đăng ký và người đại diện. Thông tin phải tương ứng với hồ sơ đăng ký hợp lệ.
- **QĐ4.3:** Hệ thống cho phép tra cứu cầu thủ theo tên hoặc câu lạc bộ, hiển thị các thông tin đăng ký và số bàn thắng được ghi nhận. Thông tin cầu thủ phải phù hợp với hồ sơ đăng ký của mùa giải được chọn.
- **QĐ4.4:** Hệ thống cho phép tra cứu lịch thi đấu và kết quả theo vòng đấu hoặc câu lạc bộ. Lịch thi đấu phải tương ứng với BM2, tỷ số chỉ được hiển thị là kết quả chính thức sau khi được xác nhận theo BM3.
- **QĐ4.5:** Các thông tin thống kê và kết quả tra cứu phải được tổng hợp từ dữ liệu nghiệp vụ hợp lệ. Khi có điều chỉnh được xác nhận, thông tin tra cứu phải được cập nhật nhất quán mà không làm sai lệch dữ liệu lịch sử.
- **QĐ4.6:** Người dùng được phép tra cứu các thông tin công khai của giải đấu. Những dữ liệu nội bộ hoặc thông tin cá nhân không thuộc phạm vi công khai chỉ được hiển thị cho người dùng có quyền truy cập phù hợp.

### QĐ5

Nguồn: §1.2.1.1.5, tr.10-11.

- **QĐ5.1:** Các báo cáo giải đấu phải được lập theo từng mùa giải, sử dụng dữ liệu trận đấu và kết quả đã được xác nhận. Bảng xếp hạng và danh sách ghi bàn được cập nhật theo kết quả hợp lệ tại thời điểm lập báo cáo.
- **QĐ5.2:** Điểm số được tính như sau: Thắng 3 điểm, hòa 1 điểm, thua 0 điểm. Hiệu số bàn thắng bằng tổng số bàn ghi được trừ tổng số bàn thua.
- **QĐ5.3:** Các câu lạc bộ được xếp hạng theo thứ tự ưu tiên: điểm số, hiệu số bàn thắng, tổng số bàn thắng. Khi kết thúc mùa giải, nếu cần phân định chức vô địch, suất dự giải đấu khác hoặc vị trí xuống hạng mà các tiêu chí trên bằng nhau, xét tiếp điểm đối đầu, bàn thắng sân khách trong các trận đối đầu và trận đấu phân hạng nếu cần.
- **QĐ5.4:** Danh sách cầu thủ ghi bàn được sắp xếp theo tổng số bàn thắng hợp lệ trong mùa giải. Bàn phản lưới nhà không được tính vào thành tích ghi bàn cá nhân. Các cầu thủ có cùng số bàn thắng cao nhất cùng được công nhận danh hiệu Vua phá lưới.
- **QĐ5.5:** Báo cáo tổng kết mùa giải chỉ được xác nhận sau khi hoàn tất việc ghi nhận kết quả toàn bộ các trận đấu và giải quyết các trường hợp phân hạng cần thiết. Báo cáo bao gồm các đội đứng đầu, các đội xuống hạng, Vua phá lưới, Găng tay vàng và tổng số bàn thắng của giải.
- **QĐ5.6:** Khi kết quả trận đấu đã xác nhận được điều chỉnh hợp lệ, hệ thống phải cập nhật lại bảng xếp hạng, thống kê cầu thủ và các báo cáo liên quan, đồng thời bảo đảm khả năng truy xuất lịch sử thay đổi.
- **QĐ5.7:** Hệ thống tự động thống kê số trận giữ sạch lưới của thủ môn dựa trên kết quả trận đấu đã được xác nhận chính thức. Một trận giữ sạch lưới được ghi nhận khi câu lạc bộ không để thủng lưới; thủ môn được xác định từ danh sách cầu thủ ra sân trong biên bản trận đấu và được cộng một trận giữ sạch lưới. Trong phạm vi hiện tại, hệ thống chưa xét đến trường hợp thay thủ môn trong trận đấu. Khi kết quả chính thức được điều chỉnh hợp lệ, thống kê phải được cập nhật lại. Danh hiệu Găng tay vàng được xác định dựa trên số trận giữ sạch lưới của các thủ môn trong mùa giải.

### QĐ6

Nguồn: §1.2.1.1.6, tr.11.

- **QĐ6.1:** Chỉ Ban tổ chức / Người quản lý mùa giải hoặc người được ủy quyền hợp lệ mới có quyền thay đổi quy định giải đấu. Mọi thay đổi phải được phê duyệt và xác định rõ mùa giải áp dụng.
- **QĐ6.2:** Hệ thống cho phép điều chỉnh các quy định đăng ký cầu thủ, bao gồm giới hạn số lượng cầu thủ, tiêu chí đào tạo nội địa, điều kiện U21 và thời hạn đăng ký theo điều lệ của từng mùa giải.
- **QĐ6.3:** Hệ thống cho phép điều chỉnh số lượng câu lạc bộ, thể thức thi đấu và số lượt đấu khi có thay đổi về điều lệ mùa giải mới. Việc điều chỉnh không được làm sai lệch lịch thi đấu và kết quả của các mùa giải trước.
- **QĐ6.4:** Hệ thống cho phép cập nhật danh mục các loại bàn thắng và thẻ phạt theo quy định áp dụng cho từng mùa giải. Việc thay đổi không được làm sai lệch các sự kiện trận đấu đã được xác nhận.
- **QĐ6.5:** Hệ thống cho phép điều chỉnh điểm số khi thắng, hòa, thua và thứ tự ưu tiên các tiêu chí xếp hạng theo điều lệ được phê duyệt. Điểm thắng phải lớn hơn điểm hòa và điểm hòa phải lớn hơn điểm thua.
- **QĐ6.6:** Mọi thay đổi quy định phải được kiểm tra tính hợp lệ, ghi nhận người thực hiện, thời điểm áp dụng, giá trị trước và sau thay đổi. Quy định mới chỉ có hiệu lực từ thời điểm được phê duyệt áp dụng và phải bảo toàn dữ liệu lịch sử của các mùa giải trước.
## Quy tắc media được quản lý hiện hành

Dùng [chính sách media](design/media.md) chính thức cho ảnh được quản lý và [cổng tích hợp](design/integrations.md) cho phụ thuộc ngoài. Kiểm chứng thuộc [Progress Checker](progress-checker.md); giữ ngưỡng chất lượng nguồn. Trang này không sao chép chính sách đó.

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](open-decisions.md).

### D035 - Định danh gốc ổn định và bản chụp chọn lọc thông tin nghiệp vụ chính thức

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d035-english-evidence).

- **Nguồn:** O12; AT-04, PDF tr.32; TH-05/TH-06, tr.13-14; phân biệt đối tượng gốc/theo mùa tại §1.3.4.1 tr.37-38; [D034](use-cases/administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung).

- **Quyết định:** Giữ định danh ổn định cho CLB, sân và cầu thủ xuyên mùa. Tại mốc ghi nhận nghiệp vụ chính thức, lưu bản chụp chọn lọc những thông tin cần để tái hiện hồ sơ/báo cáo lịch sử tương ứng. Cập nhật hồ sơ gốc không tự ghi đè thông tin lịch sử đã ghi nhận chính thức.

- **Hiệu chỉnh chính thức:** Thay đổi dữ liệu nghiệp vụ chính thức thực hiện qua quy trình có thẩm quyền tương ứng, kèm lý do và lịch sử. Không chụp mọi trường một cách đại trà; trường và mốc chụp cụ thể vẫn cần thiết kế.

- **Ví dụ ranh giới:** CLB đổi tên ở mùa sau không được âm thầm thay tên đã dùng chính thức trong báo cáo mùa trước, đồng thời vẫn nhận diện cùng một CLB. [D036](business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng) bên dưới chốt chính sách sửa sai chung cho thông tin gốc từng bị nhập sai, gồm sai ngày sinh.

### D036 - Sửa dữ liệu gốc bị sai và rà soát riêng nghiệp vụ bị ảnh hưởng

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d036-english-evidence).

- **Nguồn:** O09/O12; UC07 tr.82-84, UC09 tr.88-90 và UC12 tr.97-99; QĐ4.5, PDF tr.9; TH-06 và AT-03/AT-04, tr.14/32; [D034](use-cases/administration.md#d034---cấp-riêng-quyền-quản-lý-hồ-sơ-gốc-dùng-chung)/[D035](business.md#d035---định-danh-gốc-ổn-định-và-bản-chụp-chọn-lọc-thông-tin-nghiệp-vụ-chính-thức).

- **Quyết định:** Người có quyền quản lý hồ sơ gốc được sửa thông tin bị nhập sai, kèm lý do và căn cứ. Giữ giá trị trước/sau, người sửa, thời điểm và xác định hồ sơ/nghiệp vụ liên quan cần rà soát. Không yêu cầu phê duyệt toàn bộ phương án hiệu chỉnh phía sau trước khi sửa hồ sơ gốc.

- **Ranh giới lịch sử:** Giữ bản chụp và quyết định chính thức trước đó cho tới khi được hiệu chỉnh qua quy trình nghiệp vụ có thẩm quyền tương ứng. Sửa hồ sơ gốc không tự hủy đăng ký, sửa kết quả chính thức hoặc thay đổi thống kê.

- **Nghiệp vụ mới:** Kiểm tra lại điều kiện bị ảnh hưởng bằng thông tin đã sửa khi xử lý nghiệp vụ mới; không dựa vào kết quả kiểm tra đã lỗi thời. Ví dụ, sửa ngày sinh có thể đòi hỏi rà soát đăng ký U21 trước đó, không tự viết lại quyết định lịch sử chính thức.

### D058 - Mã nghiệp vụ ổn định, rà soát hồ sơ trùng và số áo duy nhất theo thời gian

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d058-english-evidence).

- **Nguồn:** O09/O12; UC05/UC07/UC09/UC10/UC12, BM1; [D035](business.md#d035---định-danh-gốc-ổn-định-và-bản-chụp-chọn-lọc-thông-tin-nghiệp-vụ-chính-thức)/[D055](use-cases/registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản)-[D057](use-cases/registration.md#d057---hiệu-chỉnh-đăng-ký-đã-hợp-lệ-qua-phê-duyệt-độc-lập).

- **Định danh:** Mùa, CLB, sân và cầu thủ có mã nghiệp vụ duy nhất, ổn định, không tái sử dụng trong từng nhóm đối tượng. Tên, tên viết tắt và ngày sinh không thay mã định danh. Từ chối mã trùng.

- **Cầu thủ nghi trùng:** Trùng họ tên đã chuẩn hóa, ngày sinh và quốc tịch tạo cảnh báo để nhân sự kiểm tra, không tự gộp hoặc dùng làm ràng buộc duy nhất cứng. Dùng hồ sơ cũ nếu cùng người; người khác nhau được có hồ sơ riêng sau xác nhận kèm lý do được ghi nhận.

- **CLB/sân:** Tên trùng tạo cảnh báo; cùng tên không tự xác định cùng đối tượng.

- **Số áo:** Bắt buộc là số nguyên 1-99 khi xác nhận đăng ký hợp lệ. Trong cùng CLB-mùa, các đăng ký đã xác nhận có khoảng hiệu lực thi đấu chồng lấn không được trùng số, gồm U21 và đăng ký tương lai. Cho tái sử dụng sau khi khoảng cũ kết thúc. Khoảng 1-99 là lựa chọn v2 rõ ràng, không phải luật PDF.

- **Lịch sử/phạm vi:** Đổi tên/số hiện tại không tự viết lại lịch sử đã ghi nhận. Không tự gộp hồ sơ nghi trùng hoặc chuyển tham chiếu. Công cụ tự gộp hồ sơ nằm ngoài phạm vi phiên bản đầu.

### D059 - Dữ liệu đăng ký bắt buộc và mốc chụp thông tin chính thức

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../docs/adr/0009-stable-identities-and-selective-business-snapshots.md#d059-english-evidence).

- **Nguồn:** O04/O09/O12; BM1/BM4, UC05/UC07-UC12; [D032](use-cases/publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ)-[D036](business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng)/[D054](use-cases/registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh)-[D058](business.md#d058---mã-nghiệp-vụ-ổn-định-rà-soát-hồ-sơ-trùng-và-số-áo-duy-nhất-theo-thời-gian).

- **Trường bắt buộc:** Mùa: mã, tên, ngày bắt đầu/kết thúc, quy định quản lý riêng. Hồ sơ gốc CLB: mã, tên, tên viết tắt. Hồ sơ sân: mã, tên. Hồ sơ cầu thủ: mã, họ tên, ngày sinh, quốc tịch, vị trí.

- **Trình hồ sơ CLB:** Cần CLB, mùa, huấn luyện viên, sân nhà, tên/điện thoại/địa chỉ liên hệ đại diện và ít nhất một cầu thủ đề nghị được kiểm tra ở mức chuẩn bị. Không yêu cầu đăng ký đang có hiệu lực thi đấu trước khi duyệt CLB.

- **Xác nhận cầu thủ:** Cần cầu thủ, CLB, mùa, số áo, kết quả phân loại U21/homegrown, mốc bắt đầu hiệu lực và căn cứ kiểm tra tương ứng. Nháp có thể thiếu trường nghiệp vụ; chặn chuyển bước tại mốc cần hoàn chỉnh.

- **Căn cứ homegrown:** Kết luận đạt cần nhánh số mùa/tháng, giá trị đạt điều kiện, tóm tắt và tham chiếu căn cứ. Hệ thống giữ người kiểm tra/thời điểm/phiên bản quy định. Không bắt buộc tải tệp. Ghi chú tùy chọn; không thêm giấy tờ định danh cá nhân.

- **Bản chụp CLB:** Khi duyệt hồ sơ CLB giữ tên/tên viết tắt CLB, huấn luyện viên, sân nhà, thông tin đại diện và danh sách đề nghị của phiên bản được duyệt.

- **Bản chụp cầu thủ:** Khi xác nhận hợp lệ giữ tên, ngày sinh, quốc tịch, vị trí, số áo, phân loại và căn cứ quy định/xác minh. Hiệu chỉnh được duyệt tạo bản kế tiếp, giữ bản cũ.

- **Tra cứu mùa:** Dùng thông tin đã ghi nhận cho mùa, gồm hiệu chỉnh được duyệt, không tự lấy mọi giá trị gốc mới nhất. Ranh giới công khai/nội bộ [D032](use-cases/publication.md#d032---phạm-vi-công-khai-gồm-ngày-sinh-cầu-thủ)/[D033](use-cases/publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ) vẫn áp dụng.

- **Ngoại lệ media:** [LOGO-01](design/media.md#logo-01---thiết-kế-logo-đã-phê-duyệt) sở hữu ngoại lệ chỉ cho Logo đối với tra cứu mô tả theo mùa. Lịch sử ảnh cầu thủ vẫn mở.
