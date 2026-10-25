# Ủy quyền nghiệp vụ

Sở hữu ủy quyền theo thao tác trong trách nhiệm UC03/UC06 hiện có. Quản trị tài khoản/vai trò thuộc [UC01-UC04](../use-cases/administration.md); phạm vi trường công khai/nội bộ thuộc [tra cứu](../use-cases/publication.md). Không thêm tác nhân hoặc Use Case.

### D013 - Ủy quyền nghiệp vụ riêng theo thao tác, mùa và thời hạn

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d013-english-evidence).

- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC14 tr.103-106 và UC19 tr.118-121; [D003](../use-cases/administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)-[D006](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)/[D010](../use-cases/administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa).

- **Quyết định:** Biểu diễn ủy quyền nghiệp vụ riêng, xác định thao tác được phép, mùa áp dụng và thời hạn hiệu lực. Không dùng phương án A đã đề xuất là cấp vai trò hiện có rộng hơn làm cơ chế ủy quyền duy nhất.

- **Ranh giới:** Ủy quyền không bỏ qua tách người lập/người duyệt [D005](../use-cases/administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt). Thẩm quyền quản lý phân công vai trò/phạm vi mùa [D006](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa) và cấm tự cấp quyền [D010](../use-cases/administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa) vẫn giữ nguyên; riêng [D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn) chưa quyết định ai cấp ủy quyền hoặc cách áp dụng các giới hạn này khi quản lý ủy quyền. Không thêm tác nhân hoặc UC mới.

### D014 - Ban tổ chức đề nghị ủy quyền, Quản trị viên ghi nhận cấp/thu hồi

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d014-english-evidence).

- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC03 tr.72-74, UC14 tr.103-106 và UC19 tr.118-121; [D006](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn).

- **Quyết định:** Ban tổ chức / Người quản lý mùa giải đề nghị ủy quyền nghiệp vụ, xác định người nhận, thao tác, mùa, thời hạn và căn cứ. Quản trị viên hệ thống kiểm tra các điều kiện áp dụng và ghi nhận việc cấp hoặc thu hồi trên hệ thống. Người quản lý mùa giải không trực tiếp thực hiện cấp/thu hồi ủy quyền.

- **Ranh giới:** Ghi nhận ủy quyền không phải phê duyệt nội dung nghiệp vụ; [D005](../use-cases/administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt) vẫn áp dụng. Phân công vai trò/phạm vi mùa tiếp tục theo [D006](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa); ủy quyền vẫn cụ thể theo thao tác/mùa/thời hạn [D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn). Quyết định này chưa chọn trạng thái yêu cầu, người được nhận, quy tắc tự ủy quyền hoặc ủy quyền lại.

### D015 - Ủy quyền một cấp dựa trên quyền trực tiếp từ vai trò

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d015-english-evidence).

- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC14 tr.103-106 và UC19 tr.118-121; [D003](../use-cases/administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)/[D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi).

- **Quyết định:** Ủy quyền nghiệp vụ chỉ có một cấp. Người đề nghị phải dựa trên quyền có trực tiếp từ vai trò của chính mình trong mùa tương ứng, giới hạn ở thao tác được phép ủy quyền. Quyền nhận qua ủy quyền không được dùng làm căn cứ ủy quyền tiếp.

- **Thay người và quyền độc lập:** Nếu cần thay người nhận, lập đề nghị ủy quyền mới theo [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi). Nếu người nhận đồng thời có quyền trực tiếp từ vai trò, đề nghị dựa trên quyền trực tiếp đó không phải ủy quyền lại; vẫn phải đáp ứng cùng các kiểm tra điều kiện.

### D016 - Người nhận không tự đề nghị hoặc ghi nhận cấp ủy quyền cho mình

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d016-english-evidence).

- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D010](../use-cases/administration.md#d010---cấm-quản-trị-viên-tự-cấp-quyền-nghiệp-vụ-theo-mùa)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)-[D015](access-control.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò).

- **Quyết định:** Người nhận ủy quyền phải khác người đề nghị và khác Quản trị viên hệ thống ghi nhận cấp quyền. Kiêm nhiều vai trò không được bỏ qua hai giới hạn này. Quản trị viên chỉ được nhận ủy quyền hợp lệ khi người khác đề nghị và quản trị viên khác ghi nhận cấp.

### D017 - Ba người khác nhau khi cấp ủy quyền

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d017-english-evidence).

- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D004](../use-cases/administration.md#d004---nhiều-vai-trò-nghiệp-vụ-trong-cùng-mùa-giải)/[D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)/[D016](access-control.md#d016---người-nhận-không-tự-đề-nghị-hoặc-ghi-nhận-cấp-ủy-quyền-cho-mình).

- **Quyết định:** Người đề nghị ủy quyền phải khác Quản trị viên hệ thống kiểm tra và ghi nhận cấp. Kết hợp [D016](access-control.md#d016---người-nhận-không-tự-đề-nghị-hoặc-ghi-nhận-cấp-ủy-quyền-cho-mình), mỗi lần cấp ủy quyền cần ba người khác nhau: người đề nghị, người ghi nhận và người nhận. Kiêm nhiều vai trò không được bỏ qua các giới hạn này.

- **Hệ quả:** Backend phải kiểm tra các điều kiện tách người khi ghi nhận cấp. Ghi nhận ủy quyền vẫn khác với duyệt nội dung nghiệp vụ; [D005](../use-cases/administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt) áp dụng riêng khi phê duyệt nghiệp vụ sau đó. Đây là quy tắc bổ sung cho việc cấp ủy quyền, không khẳng định [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi) đã yêu cầu tách người.

### D018 - Người nhận phải có vai trò nghiệp vụ trong mùa đích trước khi nhận ủy quyền

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d018-english-evidence).

- **Nguồn:** O07/O08; BM-02, PDF tr.23; UC03 tr.72-74; [D003](../use-cases/administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D006](../use-cases/administration.md#d006---quản-trị-viên-hệ-thống-quản-lý-phân-công-vai-trò-theo-mùa)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)-[D017](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền).

- **Quyết định:** Người nhận phải có tài khoản hoạt động và ít nhất một vai trò nghiệp vụ được phân công trong mùa đích trước khi nhận ủy quyền. Ủy quyền bổ sung thao tác cụ thể, không thay thế phân công nhân sự theo mùa. Tài khoản chỉ giữ vai trò Quản trị viên hệ thống chưa đủ điều kiện, cần được phân công riêng vai trò nghiệp vụ trong mùa đó qua UC03.

- **Ranh giới:** [D018](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền) là điều kiện tiên quyết, không cho phép mọi vai trò trong mùa nhận mọi thao tác ủy quyền. [D019](access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu) bên dưới chốt ma trận vai trò/thao tác của phiên bản đầu. Các điều kiện thẩm quyền và tách người [D015](access-control.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò)-[D017](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền) tiếp tục áp dụng.

### D019 - Ma trận thao tác và vai trò được nhận ủy quyền trong phiên bản đầu

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d019-english-evidence).

- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; UC06 tr.79-82, UC14 tr.103-106, UC19 tr.118-121; ranh giới phê duyệt tại UC08/UC13/UC18/UC22/UC24; [D005](../use-cases/administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)-[D018](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền).

- **Quyết định:** Phiên bản đầu chỉ cho ủy quyền các thao tác và vai trò người nhận trong bảng dưới. Người nhận phải giữ vai trò được liệt kê trong mùa đích và đáp ứng [D015](access-control.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò)-[D018](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền). Đây là nội dung thiết kế v2 đã xác nhận, không khẳng định v1 đã có ma trận chi tiết này.

| Thao tác được ủy quyền | Vai trò nghiệp vụ người nhận trong mùa | Giới hạn |
|---|---|---|
| Soạn/sửa đề xuất thay đổi quy định mùa giải - UC06 | Nhân viên đăng ký, Nhân viên lịch thi đấu hoặc Nhân viên kết quả | Không bao gồm phê duyệt quy định |
| Phê duyệt đề nghị điều chỉnh lịch - UC14 | Nhân viên lịch thi đấu | Không được duyệt phiên bản trình duyệt mình đã lập/sửa |
| Lập/sửa đề xuất sửa kết quả chính thức - UC19 | Nhân viên kết quả | Không được áp dụng trực tiếp; người khác có thẩm quyền phải duyệt |

- **Thẩm quyền phê duyệt/công bố giữ lại:** Duyệt quy định, duyệt hồ sơ tham gia CLB, duyệt lịch ban đầu, xác nhận kết quả chính thức, duyệt sửa kết quả chính thức, xác nhận tổng kết mùa và công bố/thu hồi tin tức giữ ở Ban tổ chức / Người quản lý mùa giải, không cấp qua cơ chế ủy quyền này trong phiên bản đầu. Quản trị tài khoản nằm ngoài ủy quyền nghiệp vụ. Quyết định này không cho phép thao tác ủy quyền nào khác.

Làm rõ phạm vi UC14: duyệt hoãn dùng thao tác ủy quyền duyệt điều chỉnh lịch hiện có theo [D067](../use-cases/scheduling.md#d067---phê-duyệt-hoãn-và-trở-lại-lịch-qua-uc14).

### D020 - Chấm dứt ủy quyền khi mất điều kiện, không tự khôi phục

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d020-english-evidence).

- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; [D003](../use-cases/administration.md#d003---quyền-nghiệp-vụ-theo-phạm-vi-mùa-giải)/[D015](access-control.md#d015---ủy-quyền-một-cấp-dựa-trên-quyền-trực-tiếp-từ-vai-trò)/[D018](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền)/[D019](access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu).

- **Quyết định:** Ủy quyền đã cấp chấm dứt khi người đề nghị mất quyền nghiệp vụ trực tiếp tương ứng trong mùa hoặc tài khoản bị khóa/vô hiệu hóa, hoặc khi người nhận không còn vai trò phù hợp với thao tác trong mùa hoặc tài khoản bị khóa/vô hiệu hóa. Kiểm tra quyền/vai trò liên quan; mất một vai trò phụ không liên quan không tự đồng nghĩa mất điều kiện bắt buộc.

- **Không tự khôi phục:** Mở khóa hoặc cấp lại vai trò không khôi phục ủy quyền đã chấm dứt. Muốn tiếp tục dùng quyền được ủy quyền phải lập đề nghị và cấp mới theo [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)-[D018](access-control.md#d018---người-nhận-phải-có-vai-trò-nghiệp-vụ-trong-mùa-đích-trước-khi-nhận-ủy-quyền) cùng ma trận thao tác/vai trò [D019](access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu). Giữ lịch sử và lý do chấm dứt; không tự hủy thao tác đã hoàn tất hợp lệ trước đó.

### D021 - Quản trị viên trực tiếp thu hồi ủy quyền nghiệp vụ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d021-english-evidence).

- **Nguồn:** O07/O08; UC03, PDF tr.72-74; BM-02/BM-06, tr.23-24; [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)/[D016](access-control.md#d016---người-nhận-không-tự-đề-nghị-hoặc-ghi-nhận-cấp-ủy-quyền-cho-mình)/[D017](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục).

- **Quyết định:** Quản trị viên hệ thống được trực tiếp thu hồi ủy quyền nghiệp vụ mà không chờ đề nghị hoặc quy trình ba người khi cấp, kể cả ủy quyền mà chính mình đang nhận. Ban tổ chức hoặc người nhận có thể đề nghị chấm dứt, nhưng Quản trị viên hệ thống thực hiện thu hồi. Quản trị viên cũng được chủ động thu hồi.

- **Lịch sử và hiệu lực:** Bắt buộc ghi người thực hiện, thời điểm, ủy quyền bị thu hồi và lý do. Sau khi lưu thu hồi thành công, không thao tác nào được tiếp tục dựa trên ủy quyền đó. Thu hồi không tự đảo ngược; muốn cấp lại phải theo quy trình cấp mới. Các quyền độc lập khác không bị gỡ chỉ vì thu hồi một ủy quyền.

- **Ranh giới:** Đây là nội dung cụ thể hóa rõ quy trình thu hồi [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi). [D016](access-control.md#d016---người-nhận-không-tự-đề-nghị-hoặc-ghi-nhận-cấp-ủy-quyền-cho-mình)/[D017](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền) vẫn bắt buộc khi cấp; các giới hạn đó không chặn thu hồi trực tiếp này. [D009](../use-cases/administration.md#d009---bảo-vệ-quyền-quản-trị-và-cấm-tự-khóa-tài-khoản) vẫn cấm tự gỡ vai trò Quản trị viên hệ thống: tự thu hồi ủy quyền nghiệp vụ là thao tác khác.

### D022 - Vô hiệu hóa phiên người nhận khi ủy quyền bắt đầu hoặc kết thúc hiệu lực

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d022-english-evidence).

- **Nguồn:** O07/O08/O12; BM-01/BM-02, PDF tr.23; [D007](../use-cases/administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản)/[D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)/[D021](access-control.md#d021---quản-trị-viên-trực-tiếp-thu-hồi-ủy-quyền-nghiệp-vụ).

- **Quyết định:** Vô hiệu hóa toàn bộ phiên hiện có của người nhận khi ủy quyền bắt đầu hiệu lực, hết hạn, bị thu hồi hoặc chấm dứt do mất điều kiện theo [D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục). Yêu cầu nội bộ tiếp theo từ phiên cũ bị từ chối và hiển thị thông báo đăng nhập lại đã chốt tại [D007](../use-cases/administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản).

- **Bắt đầu trong tương lai:** Ghi nhận trước một ủy quyền có thời điểm bắt đầu trong tương lai không vô hiệu hóa phiên ngay lúc ghi nhận. Vô hiệu hóa các phiên hiện có của người nhận khi ủy quyền thực sự bắt đầu hiệu lực.

- **Ranh giới:** Quyết định này áp dụng cho phiên người nhận; không vô hiệu hóa phiên người đề nghị/người ghi nhận chỉ vì quản lý ủy quyền của người khác. Các điều kiện thay đổi tài khoản/vai trò [D007](../use-cases/administration.md#d007---vô-hiệu-hóa-phiên-khi-đổi-quyền-hoặc-khóa-tài-khoản) vẫn áp dụng độc lập. Không yêu cầu thông báo tức thời: ứng dụng hiển thị khi nhận phản hồi server.

### D023 - Thời điểm bắt đầu/kết thúc cụ thể, không bao gồm mốc kết thúc

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d023-english-evidence).

- **Nguồn:** O07/O08; QĐ6.1, PDF tr.11; [D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)/[D022](access-control.md#d022---vô-hiệu-hóa-phiên-người-nhận-khi-ủy-quyền-bắt-đầu-hoặc-kết-thúc-hiệu-lực). Chi tiết biên thời gian này là lựa chọn thiết kế v2 đã xác nhận, không phải giá trị mặc định từ nguồn.

- **Quyết định:** Mỗi ủy quyền có ngày/giờ bắt đầu và kết thúc xác định; kết thúc phải sau bắt đầu. Khoảng hiệu lực là [bắt đầu, kết thúc): dùng được đúng mốc bắt đầu và không dùng được từ đúng mốc kết thúc trở đi, đồng thời phải đáp ứng các điều kiện quyền/điều kiện nhận khác.

- **Bắt đầu và gia hạn:** Hỗ trợ bắt đầu ngay khi ghi nhận cấp thành công hoặc hẹn bắt đầu trong tương lai. Không cấp ủy quyền hồi tố. Khi chọn bắt đầu ngay, server xác định mốc bắt đầu lúc ghi nhận cấp thành công. Hết hạn không tự gia hạn; muốn tiếp tục phải cấp mới.

### D025 - Thời hạn ủy quyền hữu hạn, không có trần số ngày cố định

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d025-english-evidence).

- **Nguồn:** O07/O08; [D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)/[D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)-[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc). PDF không quy định trần ủy quyền 7 hoặc 30 ngày; đây là lựa chọn chính sách v2 đã xác nhận.

- **Quyết định:** Không đặt số ngày tối đa cố định cho mỗi ủy quyền trong phiên bản đầu. Mọi ủy quyền vẫn phải có thời điểm kết thúc xác định; không cho ủy quyền vô thời hạn. Người đề nghị nêu căn cứ và thời hạn, quản trị viên kiểm tra tính phù hợp trước khi cấp.

- **Ranh giới:** Tiếp tục bắt buộc chấm dứt [D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục), thu hồi [D021](access-control.md#d021---quản-trị-viên-trực-tiếp-thu-hồi-ủy-quyền-nghiệp-vụ), xử lý phiên [D022](access-control.md#d022---vô-hiệu-hóa-phiên-người-nhận-khi-ủy-quyền-bắt-đầu-hoặc-kết-thúc-hiệu-lực) và hết hạn/cấp mới [D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc). [D026](access-control.md#d026---thời-hạn-ủy-quyền-có-thể-nằm-ngoài-ngày-bắt-đầukết-thúc-mùa) chốt quan hệ với ngày mùa; điều kiện vòng đời mùa chi tiết vẫn còn mở.

### D026 - Thời hạn ủy quyền có thể nằm ngoài ngày bắt đầu/kết thúc mùa

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d026-english-evidence).

- **Nguồn:** O07/O08; quản lý mùa UC05, PDF tr.77-78; đề xuất quy định UC06 tr.79-82 và sửa kết quả chính thức UC19 tr.118-121; [D019](access-control.md#d019---ma-trận-thao-tác-và-vai-trò-được-nhận-ủy-quyền-trong-phiên-bản-đầu)/[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc)/[D025](access-control.md#d025---thời-hạn-ủy-quyền-hữu-hạn-không-có-trần-số-ngày-cố-định).

- **Quyết định:** Khoảng ủy quyền có thể bắt đầu trước ngày bắt đầu mùa hoặc kéo dài sau ngày kết thúc mùa, phục vụ chuẩn bị và xử lý sau mùa hợp lệ. Vẫn chỉ áp dụng cho mùa đích và khoảng hiệu lực xác định. Ngày kết thúc mùa không tự cắt ngắn ủy quyền, và ủy quyền không tự gia hạn.

- **Ranh giới nghiệp vụ:** Chỉ được thực hiện thao tác khi vòng đời mùa và điều kiện nghiệp vụ của thao tác cho phép. Ủy quyền không vượt qua các điều kiện đó. Quy tắc chi tiết cho mùa đã tổng kết/lưu trữ vẫn cần xác nhận; [D026](access-control.md#d026---thời-hạn-ủy-quyền-có-thể-nằm-ngoài-ngày-bắt-đầukết-thúc-mùa) không tự chọn trạng thái mùa hoặc chính sách mở lại.

### D027 - Cấm ủy quyền cùng người nhận, thao tác và mùa chồng lấn thời gian

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d027-english-evidence).

- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; [D013](access-control.md#d013---ủy-quyền-nghiệp-vụ-riêng-theo-thao-tác-mùa-và-thời-hạn)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)/[D021](access-control.md#d021---quản-trị-viên-trực-tiếp-thu-hồi-ủy-quyền-nghiệp-vụ)/[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc).

- **Quyết định:** Không cấp các khoảng ủy quyền chồng lấn cho cùng người nhận, thao tác và mùa, kể cả khi người đề nghị khác nhau. Kiểm tra với các ủy quyền đã cấp còn có thể có hiệu lực, gồm bản hẹn bắt đầu trong tương lai. Khác thao tác hoặc khác mùa không tự tạo xung đột chỉ vì thời gian trùng nhau.

- **Quy tắc biên:** Cho phép các khoảng nối tiếp theo [D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc), như 09:00-12:00 rồi 12:00-14:00. Ủy quyền đã thu hồi/chấm dứt không cản cấp mới cho thời gian sau khi chấm dứt, đồng thời giữ lịch sử. Phải ngăn cấp xung đột khi có yêu cầu đồng thời; cơ chế kỹ thuật vẫn còn mở.

### D028 - Khóa phiên bản đề nghị đã gửi, cấp đúng nội dung đã trình

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d028-english-evidence).

- **Nguồn:** O07/O08; BM-02/BM-06, PDF tr.23-24; [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)/[D017](access-control.md#d017---ba-người-khác-nhau-khi-cấp-ủy-quyền)/[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc)/[D027](access-control.md#d027---cấm-ủy-quyền-cùng-người-nhận-thao-tác-và-mùa-chồng-lấn-thời-gian).

- **Quyết định:** Người đề nghị được sửa bản nháp. Khi gửi, nội dung phiên bản đó được khóa. Quản trị viên kiểm tra rồi cấp đúng nội dung hoặc trả lại/từ chối kèm lý do. Quản trị viên không được đổi tham số trước khi cấp, kể cả thu hẹp thời hạn.

- **Chỉnh sửa và kiểm tra:** Sửa và trình lại tạo phiên bản trình mới, giữ lịch sử phiên bản trước. Trước khi cấp, kiểm tra lại quyền hiện hành, thời hạn, tách người và xung đột khoảng thời gian. Nếu bản trình chọn bắt đầu ngay khi cấp, server điền thời điểm ghi nhận cấp thành công theo [D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc); đây không phải quản trị viên thay đổi thời hạn.

- **Ủy quyền đã cấp:** Không sửa trực tiếp ủy quyền đã cấp. Muốn thay đổi phải thu hồi và thực hiện quy trình cấp mới, tuân thủ toàn bộ điều kiện đã chốt.

### D029 - Tách vòng đời đề nghị và ủy quyền đã cấp

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0005-action-scoped-business-delegation.md#d029-english-evidence).

- **Nguồn:** O07/O08; [D014](access-control.md#d014---ban-tổ-chức-đề-nghị-ủy-quyền-quản-trị-viên-ghi-nhận-cấpthu-hồi)/[D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục)-[D023](access-control.md#d023---thời-điểm-bắt-đầukết-thúc-cụ-thể-không-bao-gồm-mốc-kết-thúc)/[D028](access-control.md#d028---khóa-phiên-bản-đề-nghị-đã-gửi-cấp-đúng-nội-dung-đã-trình). Đây là trạng thái nghiệp vụ v2 đã xác nhận; chưa chọn cách triển khai CSDL/schema.

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
| Chấm dứt do mất điều kiện | Kết thúc theo [D020](access-control.md#d020---chấm-dứt-ủy-quyền-khi-mất-điều-kiện-không-tự-khôi-phục) |

- **Chuyển trạng thái đề nghị:** Nháp -> Chờ xử lý khi gửi. Chờ xử lý -> Trả lại / Từ chối / Đã cấp do quản trị viên xử lý. Trả lại -> Chờ xử lý khi người đề nghị sửa và gửi phiên bản mới. Người đề nghị được hủy từ Nháp, Chờ xử lý hoặc Trả lại. Từ chối, Đã hủy và Đã cấp kết thúc đề nghị đó; muốn đề nghị khác phải tạo mới.

- **Chuyển trạng thái ủy quyền:** Cấp thành công bắt đầu ở Chờ hiệu lực hoặc Có hiệu lực theo mốc bắt đầu. Chờ hiệu lực chuyển Có hiệu lực khi tới mốc và đủ điều kiện. Hết hạn, Đã thu hồi và Chấm dứt do mất điều kiện là kết thúc, không quay lại Có hiệu lực. Quy tắc thời gian/chấm dứt/thu hồi đã chốt xác định các chuyển trạng thái áp dụng.

- **Kiểm tra cấp không đạt:** Không tạo ủy quyền hoặc đánh dấu đề nghị Đã cấp. Giữ Chờ xử lý và báo lỗi; quản trị viên có thể tiếp tục trả lại hoặc từ chối.
