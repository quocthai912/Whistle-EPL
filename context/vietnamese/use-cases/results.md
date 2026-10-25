# Biên bản, kết quả và thống kê: UC16-UC20

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Luồng UC hiện hành giữ mã/trang nguồn và tích hợp làm rõ được duyệt rõ. Quy tắc chính thức của miền được liên kết bên dưới; bằng chứng duyệt/nguồn/lý do ở ADR English. Đây là tài liệu Context, không phải feature Specification sinh mới. Hình phân tích không phải API/schema đã duyệt. Xem [nguồn](../sources.md).

## UC16

Quy tắc hiện hành: [D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận), [D048](results.md#d048---ghi-giờ-bắt-đầu-thực-tế-trong-biên-bản-và-xác-nhận-cùng-kết-quả-chính-thức), [D063](results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức), [D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản), [D065](results.md#d065---phút-sự-kiện-có-cấu-trúc-kiểm-tra-tỷ-số-và-tham-chiếu-chữ-ký-trọng-tài).

**Lập biên bản trận đấu**

Nguồn: §2.4.1.16, tr.109-112 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền lập biên bản cho trận đấu đã được lên lịch hợp lệ. Biên bản ghi nhận danh sách cầu thủ ra sân và các sự kiện trận đấu, bao gồm bàn thắng, thời điểm ghi bàn, loại bàn thắng và thẻ phạt. Dữ liệu phải đủ căn cứ để kiểm tra tỷ số và xác nhận kết quả.

**Mô tả:**

Tạo biên bản và ghi nhận các thông tin, sự kiện của trận đấu.

**Tác nhân:**

Nhân viên phụ trách kết quả.

**Tiền điều kiện:**

1. Trận đấu đã được lập lịch hợp lệ.
2. Người thực hiện có quyền lập biên bản.
3. Dữ liệu cầu thủ và đăng ký liên quan có thể được kiểm tra.

**Hậu điều kiện:**

Biên bản được lưu ở trạng thái phù hợp với quy trình; chưa được xem là kết quả chính thức chỉ vì đã lập biên bản.

**Luồng chính:**

1. Người dùng chọn trận đấu.
2. Hệ thống kiểm tra trận đấu có trong lịch hợp lệ.
3. Hệ thống hiển thị thông tin trận và các cầu thủ đăng ký liên quan.
4. Người dùng nhập danh sách cầu thủ ra sân của hai đội.
5. Kiểm tra đăng ký CLB-mùa tại giờ bắt đầu thực tế và thủ môn theo vị trí biên bản theo [D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản).
6. Người dùng ghi nhận các sự kiện bàn thắng, loại bàn thắng, phút thi đấu và bù giờ, thẻ vàng, thẻ đỏ cùng cầu thủ và câu lạc bộ liên quan.
7. Hệ thống kiểm tra tính đầy đủ và nhất quán của các sự kiện.
8. Người dùng lưu biên bản.
9. Hệ thống ghi nhận trạng thái biên bản và thông báo kết quả.

**Luồng thay thế:**

Biên bản chưa hoàn tất: người dùng tiếp tục cập nhật trước khi chuyển sang bước xác nhận theo quy trình.

**Ngoại lệ:**

1. Cầu thủ không thuộc câu lạc bộ hoặc không có đăng ký hợp lệ: từ chối ghi nhận cầu thủ đó trong danh sách ra sân.
2. Sự kiện thiếu loại hoặc thời điểm bắt buộc: yêu cầu bổ sung.
3. Tỷ số không khớp tổng số bàn thắng được ghi nhận: không cho xác nhận biên bản ở trạng thái hợp lệ.
4. Lỗi lưu dữ liệu: không để lại biên bản ở trạng thái không nhất quán.

## UC17

**Cập nhật kết quả trận đấu**

Nguồn: §2.4.1.17, tr.112-114 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền cập nhật dữ liệu kết quả từ biên bản trận đấu. Kết quả được cập nhật ở bước này chưa mặc nhiên là kết quả chính thức; việc công nhận chính thức được thực hiện thông qua UC18 - Xác nhận kết quả trận đấu.

**Mô tả:**

Cập nhật tỷ số và dữ liệu kết quả dựa trên biên bản trận đấu.

**Tác nhân:**

Nhân viên phụ trách kết quả.

**Tiền điều kiện:**

1. Trận đấu tồn tại và được lập lịch hợp lệ.
2. Có biên bản hoặc dữ liệu kết quả cần cập nhật.
3. Người thực hiện có quyền cập nhật.

**Hậu điều kiện:**

Dữ liệu kết quả được lưu ở trạng thái chờ xác nhận hoặc trạng thái tương ứng đã được thống nhất; chưa được sử dụng như kết quả chính thức nếu chưa qua UC18.

**Luồng chính:**

1. Người dùng chọn trận đấu.
2. Hệ thống tải biên bản và kết quả hiện có.
3. Người dùng cập nhật tỷ số hoặc thông tin kết quả theo dữ liệu trận.
4. Hệ thống kiểm tra tính nhất quán giữa tỷ số và các sự kiện bàn thắng.
5. Hệ thống kiểm tra trạng thái trận và quyền cập nhật.
6. Người dùng xác nhận lưu dữ liệu cập nhật.
7. Hệ thống lưu kết quả ở trạng thái phù hợp.
8. Hệ thống ghi nhật ký và thông báo kết quả.

**Luồng thay thế:**

Người dùng không thay đổi dữ liệu: hệ thống giữ nguyên kết quả hiện có.

**Ngoại lệ:**

1. Tỷ số không khớp sự kiện bàn thắng: từ chối lưu kết quả hợp lệ.
2. Trận đã được xác nhận chính thức: không xử lý như cập nhật thông thường; sử dụng UC19 - Điều chỉnh kết quả trận đấu đã xác nhận theo phạm vi và quyền hạn được phê duyệt.
3. Không đủ quyền hoặc dữ liệu bị thay đổi đồng thời: từ chối hoặc yêu cầu tải lại.
4. Lỗi lưu dữ liệu: giữ nguyên trạng thái trước đó.

## UC18

Quy tắc hiện hành: [D063](results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức), [D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản), [D065](results.md#d065---phút-sự-kiện-có-cấu-trúc-kiểm-tra-tỷ-số-và-tham-chiếu-chữ-ký-trọng-tài).

**Xác nhận kết quả trận đấu**

Nguồn: §2.4.1.18, tr.115-118 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền kiểm tra và xác nhận kết quả chính thức sau khi trận đấu kết thúc. Hệ thống phải bảo đảm kết quả khớp với biên bản, không xác nhận lặp và không cập nhật một phần các dữ liệu phụ thuộc. Sau khi xác nhận thành công, bảng xếp hạng, thống kê và báo cáo liên quan phải phản ánh kết quả đã được công nhận.

**Mô tả:**

Kiểm tra và chuyển kết quả trận đấu sang trạng thái chính thức.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Trận đấu đã kết thúc.
2. Biên bản và kết quả đã được cập nhật.
3. Người thực hiện có quyền xác nhận.
4. Trận đấu chưa được xác nhận chính thức.

**Hậu điều kiện:**

1. Kết quả được đánh dấu chính thức.
2. Bảng xếp hạng và thống kê liên quan được tính toán hoặc đồng bộ lại.
3. Nhật ký xác nhận được ghi nhận.
4. Các báo cáo dựa trên kết quả chính thức có thể sử dụng dữ liệu mới.

**Luồng chính:**

1. Người xác nhận chọn trận đấu cần xác nhận.
2. Hệ thống tải trạng thái trận, biên bản và kết quả.
3. Hệ thống kiểm tra quyền xác nhận.
4. Hệ thống kiểm tra trận đấu đã kết thúc và chưa được xác nhận.
5. Hệ thống kiểm tra danh sách ra sân, đăng ký cầu thủ và sự kiện trận đấu.
6. Hệ thống kiểm tra loại bàn thắng, thời điểm, phản lưới, thẻ phạt và tính nhất quán của tỷ số.
7. Hệ thống hiển thị dữ liệu cần xác nhận.
8. Người dùng xác nhận.
9. Hệ thống lưu trạng thái kết quả chính thức.
10. Hệ thống cập nhật bảng xếp hạng, thống kê liên quan và ghi nhật ký trong một quy trình nhất quán.
11. Hệ thống thông báo kết quả.

**Luồng thay thế:**

1. Người xác nhận phát hiện dữ liệu cần sửa: hủy thao tác xác nhận và chuyển lại bước cập nhật dữ liệu theo quyền hạn.
2. Kết quả đã được xác nhận trước đó: hệ thống thông báo trạng thái hiện tại và không xác nhận lặp.

**Ngoại lệ:**

1. Trận chưa kết thúc hoặc biên bản không hợp lệ: từ chối xác nhận.
2. Người dùng không đủ quyền: từ chối thao tác.
3. Dữ liệu kết quả thay đổi đồng thời: yêu cầu tải lại và kiểm tra.
4. Lỗi khi cập nhật kết quả, bảng xếp hạng hoặc thống kê: không để lại trạng thái chính thức khi các dữ liệu phụ thuộc vẫn cũ.

## UC19

Quy tắc hiện hành: [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt), [D049](results.md#d049---kiểm-tra-lại-sự-kiện-khi-sửa-giờ-bắt-đầu-làm-đổi-danh-mục-áp-dụng), [D063](results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức).

**Điều chỉnh kết quả trận đấu đã xác nhận**

Nguồn: §2.4.1.19, tr.118-121 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền điều chỉnh một kết quả đã được xác nhận chính thức khi có căn cứ hợp lệ. Do kết quả đã xác nhận ảnh hưởng đến bảng xếp hạng, thống kê và báo cáo, hệ thống phải lưu lịch sử trước-sau, kiểm tra quyền và xử lý thay đổi như một quy trình nhất quán. Không được cập nhật trực tiếp khiến dữ liệu phụ thuộc bị sai lệch.

**Mô tả:**

Điều chỉnh kết quả chính thức theo quyền hạn và căn cứ hợp lệ, đồng thời cập nhật dữ liệu phụ thuộc.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải; Nhân viên phụ trách kết quả (nếu được phân quyền).

**Tiền điều kiện:**

1. Trận đấu đã có kết quả chính thức.
2. Người thực hiện có quyền điều chỉnh.
3. Có căn cứ và lý do điều chỉnh theo quy trình được phê duyệt.

**Hậu điều kiện:**

1. Kết quả mới được lưu hợp lệ.
2. Lịch sử trước-sau và lý do điều chỉnh được ghi nhận.
3. Bảng xếp hạng, thống kê và báo cáo liên quan được cập nhật nhất quán.
4. Nhật ký thao tác được lưu.

**Luồng chính:**

1. Người dùng chọn trận đấu có kết quả đã xác nhận.
2. Hệ thống tải kết quả hiện hành và lịch sử điều chỉnh.
3. Người dùng nhập dữ liệu cần sửa và lý do.
4. Hệ thống kiểm tra quyền, trạng thái trận và dữ liệu hiện hành.
5. Hệ thống kiểm tra biên bản, sự kiện bàn thắng, thẻ phạt và tính nhất quán của tỷ số.
6. Hệ thống phát hiện dữ liệu có bị thay đổi kể từ khi người dùng mở hay không.
7. Hệ thống hiển thị dữ liệu trước và sau điều chỉnh.
8. Trình phiên bản hiệu chỉnh để người có thẩm quyền khác duyệt theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D049](results.md#d049---kiểm-tra-lại-sự-kiện-khi-sửa-giờ-bắt-đầu-làm-đổi-danh-mục-áp-dụng)/[D063](results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức).
9. Sau duyệt hợp lệ, lưu kết quả mới/lịch sử; giữ kết quả chính thức cũ trong lúc chờ.
10. Hệ thống tính lại bảng xếp hạng, thống kê và các dữ liệu báo cáo bị ảnh hưởng.
11. Hệ thống ghi nhật ký và thông báo kết quả.

**Luồng thay thế:**

1. Người dùng hủy trước khi xác nhận: hệ thống không thay đổi dữ liệu.
2. Kết quả cần sửa nhưng dữ liệu căn cứ chưa đầy đủ: hệ thống yêu cầu bổ sung trước khi xử lý.

**Ngoại lệ:**

1. Người dùng không đủ quyền: từ chối thao tác.
2. Kết quả hiện hành đã bị thay đổi đồng thời: yêu cầu tải lại và xác nhận trên dữ liệu mới nhất.
3. Dữ liệu điều chỉnh không hợp lệ: từ chối cập nhật.
4. Lỗi trong quá trình lưu kết quả hoặc cập nhật dữ liệu phụ thuộc: không để lại trạng thái cập nhật một phần.
5. Không xác định được quy định có hiệu lực: không tự suy diễn quy tắc để điều chỉnh.

## UC20

Quy tắc hiện hành: [D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản), [D066](publication.md#d066---đồng-hạng-trên-bảng-xếp-hạng-và-đồng-giải-cá-nhân).

**Cập nhật bảng xếp hạng và thống kê**

Nguồn: §2.4.1.20, tr.121-123 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Trạng thái: Xử lý nội bộ, không phải chức năng độc lập để người dùng tùy ý cập nhật điểm.

**Mô tả:**

Tính toán và đồng bộ bảng xếp hạng, thống kê cầu thủ từ các kết quả trận đấu đã được xác nhận theo mùa giải.

**Tác nhân:**

Không có tác nhân khởi tạo riêng; hệ thống tự động thực hiện sau UC18 - Xác nhận kết quả trận đấu hoặc UC19 - Điều chỉnh kết quả trận đấu đã xác nhận.

**Tiền điều kiện:**

1. Có kết quả chính thức được xác nhận hoặc điều chỉnh hợp lệ.
2. Quy định tính điểm và xếp hạng của mùa giải đã được xác định.

**Hậu điều kiện:**

Bảng xếp hạng và thống kê cầu thủ phản ánh chính xác các kết quả chính thức liên quan.

**Luồng chính:**

1. UC18 hoặc UC19 kích hoạt cập nhật bảng xếp hạng và thống kê liên quan.
2. Hệ thống lấy các kết quả chính thức liên quan.
3. Hệ thống tính số trận, thắng, hòa, thua, bàn thắng, bàn thua, hiệu số và điểm.
4. Hệ thống áp dụng tiêu chí xếp hạng và tiêu chí phụ được cấu hình cho mùa giải.
5. Hệ thống cập nhật thống kê ghi bàn của cầu thủ từ các sự kiện bàn thắng hợp lệ, không tính bàn phản lưới nhà vào thành tích cá nhân.
6. Hệ thống thống kê số trận giữ sạch lưới của thủ môn từ các kết quả chính thức và danh sách cầu thủ ra sân theo QĐ5.7.
7. Hệ thống lưu hoặc đồng bộ bảng xếp hạng và thống kê cầu thủ.
8. Hệ thống thông báo kết quả xử lý cho nghiệp vụ gọi.

**Luồng thay thế:**

Không có thay đổi ảnh hưởng bảng xếp hạng: hệ thống không cần tính lại các dữ liệu không bị ảnh hưởng.

**Ngoại lệ:**

1. Không xác định được quy định xếp hạng có hiệu lực: không tự áp dụng quy định của mùa khác.
2. Lỗi tính toán hoặc lưu dữ liệu: không để bảng xếp hạng và thống kê cầu thủ ở trạng thái cập nhật dở dang.
## Hiển thị media được quản lý hiện hành

Dùng [chính sách media](../design/media.md) cho Logo hiện tại, ảnh cầu thủ và fallback. Hiển thị không đổi thẩm quyền/tính toán nghiệp vụ UC.

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](../open-decisions.md).

### D047 - Gắn danh mục sự kiện trận với giờ bắt đầu thực tế được ghi nhận

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d047-english-evidence).

- **Nguồn:** O07/O09/O12; QĐ6.4, UC16/UC19; [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ)/[D046](registration.md#d046---giữ-mã-và-ý-nghĩa-loại-bàn-thắng-hoặc-thẻ-đã-được-tham-chiếu).

- **Quyết định:** Dùng danh mục bàn thắng/thẻ có hiệu lực tại giờ bắt đầu thực tế được ghi nhận của trận, thay vì thời điểm nhập hoặc hiệu chỉnh. Ghi nhận thời điểm bắt đầu thực tế và căn cứ phiên bản quy định áp dụng. Nhập muộn hoặc hiệu chỉnh không tự chuyển trận sang danh mục mới.

- **Ranh giới ngừng chọn:** Loại bị ngừng cho chọn trong phiên bản quy định sau vẫn dùng được cho trận có danh mục áp dụng chứa loại đó. Việc ngừng chọn ảnh hưởng trận bắt đầu khi phiên bản mới có hiệu lực, đồng thời giữ cách hiểu sự kiện lịch sử.

- **Hiệu chỉnh chính thức:** Sửa kết quả chính thức vẫn cần quy trình phê duyệt có thẩm quyền đã chốt; không cho phép tự sửa dữ liệu lịch sử.

### D048 - Ghi giờ bắt đầu thực tế trong biên bản và xác nhận cùng kết quả chính thức

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d048-english-evidence).

- **Nguồn:** O07/O09/O12; UC16-UC19; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận).

- **Quyết định:** Nhân viên kết quả nhập giờ bắt đầu thực tế theo căn cứ nghiệp vụ của trận trong UC16/UC17. Giao diện phân biệt giờ theo lịch và giờ thực tế; không tự coi giờ theo lịch là giờ thực tế đã xác nhận. Bắt buộc có giờ thực tế trước khi trình xác nhận kết quả chính thức.

- **Xác nhận/hiệu chỉnh:** Người xác nhận có thẩm quyền kiểm tra thời điểm này cùng biên bản theo UC18 và quy tắc tách người của [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt). Sau xác nhận chính thức, sửa giờ thực tế phải qua quy trình hiệu chỉnh UC19 đã chốt. Không có luồng phê duyệt giờ bắt đầu thực tế riêng.

- **Phạm vi vận hành:** Có thể nhập sau trận; không yêu cầu nhân sự thao tác ngay lúc bắt đầu. Cần kiểm tra lại danh mục/sự kiện khi sửa giờ thực tế trong nháp; xử lý chi tiết khi đổi qua ranh giới phiên bản vẫn mở.

### D049 - Kiểm tra lại sự kiện khi sửa giờ bắt đầu làm đổi danh mục áp dụng

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d049-english-evidence).

- **Nguồn:** O07/O09/O12; UC16-UC20; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D036](../business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng)/[D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận)/[D048](results.md#d048---ghi-giờ-bắt-đầu-thực-tế-trong-biên-bản-và-xác-nhận-cùng-kết-quả-chính-thức).

- **Quyết định:** Cho phép sửa giờ bắt đầu thực tế qua ranh giới phiên bản danh mục. Xác định danh mục theo giờ bắt đầu thực tế mới được đề xuất và kiểm tra lại toàn bộ sự kiện trong bản biên bản đề xuất. Chỉ rõ sự kiện không phù hợp; người lập phải sửa theo căn cứ nghiệp vụ. Không tự đổi loại hoặc xóa sự kiện.

- **Điều kiện kiểm tra:** Chặn trình hoặc phê duyệt cho tới khi giải quyết hết các lỗi này.

- **Ranh giới chính thức:** Với kết quả đã chính thức, giữ mọi thay đổi trong đề xuất hiệu chỉnh UC19. Giờ bắt đầu, danh mục và kết quả chính thức hiện có không đổi trong lúc chờ duyệt. Sau khi đề xuất hợp lệ được người khác có thẩm quyền duyệt, áp dụng nhất quán toàn bộ thay đổi liên quan, tính lại thống kê nếu cần và giữ lịch sử.

### D063 - Tách vòng đời trận, phiên bản biên bản và kết quả chính thức

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d063-english-evidence).

- **Nguồn:** O08/O09/O12; UC16-UC20; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận)-[D049](results.md#d049---kiểm-tra-lại-sự-kiện-khi-sửa-giờ-bắt-đầu-làm-đổi-danh-mục-áp-dụng)/[D062](scheduling.md#d062---duyệt-lịch-đồng-thời-công-bố-và-điều-chỉnh-theo-phiên-bản).

- **Bổ sung hoãn trận:** [POSTPONE-01](scheduling.md#postpone-01---quản-lý-hoãn-trận-phiên-bản-đầu) yêu cầu nhánh Đã hoãn riêng; thẩm quyền/chuyển trở lại theo [D067](scheduling.md#d067---phê-duyệt-hoãn-và-trở-lại-lịch-qua-uc14). Không biến hoãn thành Official Result.

- **Nhóm trạng thái:** Diễn tiến trận thông thường: Chưa bắt đầu -> Đang diễn ra -> Đã kết thúc. Phiên bản biên bản: Nháp -> Chờ xác nhận -> Đã xác nhận, có trả bổ sung hoặc rút trước quyết định. Kết quả: Chưa chính thức -> Chính thức, đề xuất hiệu chỉnh quản lý riêng.

- **Giờ thực tế:** Nhân viên kết quả ghi giờ bắt đầu/kết thúc thực tế trong biên bản. Bắt buộc có cả hai trước khi trình; kết thúc phải sau bắt đầu. Giờ theo lịch hoặc thời lượng dự kiến không tự xác lập việc kết thúc. Có thể nhập cả hai sau trận, không yêu cầu thao tác trực tiếp lúc bắt đầu/kết thúc.

- **Quản lý phiên bản:** Mỗi trận một hồ sơ biên bản với nhiều phiên bản lịch sử, tối đa một bản chờ xác nhận hoặc hiệu chỉnh tại một thời điểm. Nội dung đã trình là bất biến; muốn sửa phải rút/được trả và trình bản mới.

- **Xác nhận ban đầu:** UC18 cần trận đã kết thúc và biên bản đầy đủ đạt kiểm tra, theo thẩm quyền/tách người đã chốt. Lưu biên bản hoặc nhập tỷ số không làm kết quả chính thức.

- **Hiệu chỉnh/nhất quán:** Kết quả chính thức hiện hành vẫn công khai và dùng tính thống kê khi UC19 chờ duyệt. Trả/từ chối/rút đề xuất không làm mất hiệu lực kết quả đó. Xác nhận/hiệu chỉnh thành công cập nhật nhất quán kết quả, thống kê và lịch sử theo UC18-UC20; thất bại không để cập nhật chính thức/thống kê dở.

### D064 - Xét ra sân tại giờ bắt đầu và xác định thủ môn theo biên bản

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d064-english-evidence).

- **Nguồn:** O02/O06/O09/O12; QĐ3.2/QĐ5.7, BM3, UC16/UC18/UC20; [D047](results.md#d047---gắn-danh-mục-sự-kiện-trận-với-giờ-bắt-đầu-thực-tế-được-ghi-nhận)/[D048](results.md#d048---ghi-giờ-bắt-đầu-thực-tế-trong-biên-bản-và-xác-nhận-cùng-kết-quả-chính-thức)/[D056](registration.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán).

- **Mốc xét:** Mỗi cầu thủ ra sân cần đăng ký đã xác nhận hợp lệ đúng CLB-mùa, có khoảng hiệu lực thi đấu chứa giờ bắt đầu thực tế. Nhập biên bản muộn không lấy CLB hiện tại thay căn cứ lịch sử.

- **Danh sách:** Mỗi đội có danh sách không rỗng. Cầu thủ xuất hiện tối đa một lần trong trận và thuộc một trong hai đội. Phiên bản đầu không thêm bắt buộc đủ mười một người, sơ đồ chiến thuật hoặc quản lý thay người.

- **Số áo/vị trí:** Lấy số áo từ đăng ký áp dụng tại mốc xét. Ghi vị trí trong trận riêng, được khác vị trí hồ sơ.

- **Kiểm tra thủ môn:** Trước trình/xác nhận, danh sách mỗi đội phải có đúng một thủ môn theo vị trí trong trận. Thiếu/nhiều thủ môn chặn trình/xác nhận tới khi sửa; không tự chọn một người hoặc bỏ qua thống kê.

- **Giữ sạch lưới:** Với kết quả chính thức, đội không thủng lưới thì thủ môn được xác định theo biên bản nhận một trận giữ sạch lưới. Thay thủ môn vẫn ngoài phạm vi nguồn.

- **Lịch sử:** Khi xác nhận giữ căn cứ đăng ký, tên, số áo và vị trí trong trận. Chuyển CLB/sửa hồ sơ sau đó không tự đổi biên bản; hiệu chỉnh chính thức vẫn qua UC19.

### D065 - Phút sự kiện có cấu trúc, kiểm tra tỷ số và tham chiếu chữ ký trọng tài

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0013-match-report-and-official-result-lifecycles.md#d065-english-evidence).

- **Nguồn:** O09/O12; BM3, QĐ3.3-QĐ3.5, UC16-UC19; [D046](registration.md#d046---giữ-mã-và-ý-nghĩa-loại-bàn-thắng-hoặc-thẻ-đã-được-tham-chiếu)-[D049](results.md#d049---kiểm-tra-lại-sự-kiện-khi-sửa-giờ-bắt-đầu-làm-đổi-danh-mục-áp-dụng)/[D063](results.md#d063---tách-vòng-đời-trận-phiên-bản-biên-bản-và-kết-quả-chính-thức)/[D064](results.md#d064---xét-ra-sân-tại-giờ-bắt-đầu-và-xác-định-thủ-môn-theo-biên-bản).

- **Phút sự kiện:** Lưu phút chính nguyên 1-90 và phút bù giờ nguyên không âm; bù giờ dương chỉ đi với mốc 45 hoặc 90. Hiển thị 45+2 hoặc 90+5, không đổi 45+2 thành phút 47. Bù giờ hiệp một xếp trước phút 46.

- **Phạm vi:** Đây là quy ước biên bản phiên bản đầu, không có sự kiện hiệp phụ/loạt luân lưu. Thời lượng kế hoạch [D061](scheduling.md#d061---khoảng-kế-hoạch-theo-mùa-và-kiểm-tra-xung-đột-lịch-toàn-hệ-thống) vẫn riêng.

- **Sự kiện hợp lệ:** Cần cầu thủ thuộc danh sách ra sân, CLB đúng với cầu thủ, loại hợp lệ từ danh mục áp dụng cho trận và phút hợp lệ. Giữ loại mặc định nguồn, không tự thêm loại.

- **Tỷ số:** Tính từ bàn thắng hợp lệ; phản lưới nhà cộng cho đội đối phương, không cộng bàn cá nhân. Tỷ số cuối được nhập phải khớp; không khớp chặn trình/xác nhận.

- **Thẻ:** Ghi vàng/đỏ theo biên bản, không tự tạo treo giò, xử thua hoặc phân hệ kỷ luật.

- **Căn cứ trọng tài:** Trước trình cần họ tên trọng tài, mã/tham chiếu biên bản gốc và xác nhận của người nhập đã đối chiếu chữ ký trên bản gốc. Giữ người xác nhận/thời điểm; người duyệt kiểm tra cùng biên bản.

- **Lịch sử/tệp:** Giữ sự kiện/căn cứ trọng tài trong bản xác nhận; hiệu chỉnh qua UC19. Phiên bản đầu không yêu cầu ảnh chữ ký, tệp quét đính kèm hoặc chữ ký số. Đây là cách biểu diễn căn cứ chữ ký BM3 trong v2, không bỏ trường nguồn.
