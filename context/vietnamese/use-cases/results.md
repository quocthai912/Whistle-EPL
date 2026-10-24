# Biên bản, kết quả và thống kê: UC16-UC20

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Các bản ghi dưới đây chuyển bảng đặc tả từ PDF sang Markdown, giữ nội dung và thứ tự bước; chỉ bỏ header/footer và nối dòng. Không phải feature Specification mới. Trang và hình tham chiếu dùng quy ước [nguồn](../sources.md). Sơ đồ lớp/sequence là mô hình phân tích trong báo cáo, chưa xác lập API, schema hay cấu trúc mã nguồn.

## UC16

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
5. Hệ thống kiểm tra cầu thủ thuộc câu lạc bộ tương ứng và có đăng ký hợp lệ.
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
4. Lỗi khi cập nhật kết quả, bảng xếp hạng hoặc thống kê: không để lại trạng thái chính thức nhưng các dữ liệu phụ thuộc vẫn cũ.

## UC19

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
8. Người dùng xác nhận thao tác.
9. Hệ thống lưu kết quả mới và lịch sử điều chỉnh.
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

