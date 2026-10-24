# Mùa giải, quy định và đăng ký: UC05–UC11

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Các bản ghi dưới đây chuyển bảng đặc tả từ PDF sang Markdown, giữ nội dung và thứ tự bước; chỉ bỏ header/footer và nối dòng. Không phải feature Specification mới. Trang và hình tham chiếu dùng quy ước [nguồn](../sources.md). Sơ đồ lớp/sequence là mô hình phân tích trong báo cáo, chưa xác lập API, schema hay cấu trúc mã nguồn.

## UC05

**Quản lý mùa giải**

Nguồn: §2.4.1.5, tr.77–78 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền tạo và quản lý thông tin các mùa giải Premier League. Mỗi mùa giải phải được nhận diện riêng để dữ liệu về câu lạc bộ tham dự, quy định, lịch thi đấu và kết quả không bị trộn lẫn giữa các mùa.

**Mô tả:**

Tạo mới, cập nhật và tra cứu thông tin mùa giải.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Người dùng đã đăng nhập và có quyền quản lý mùa giải.

**Hậu điều kiện:**

Thông tin mùa giải được lưu hợp lệ và có thể được sử dụng trong các nghiệp vụ liên quan.

**Luồng chính:**

1. Người dùng mở chức năng quản lý mùa giải.
2. Hệ thống hiển thị danh sách mùa giải.
3. Người dùng chọn tạo mới hoặc cập nhật một mùa giải.
4. Hệ thống yêu cầu nhập hoặc chỉnh sửa thông tin.
5. Người dùng cung cấp thông tin và xác nhận.
6. Hệ thống kiểm tra tính hợp lệ và tính nhất quán.
7. Hệ thống lưu dữ liệu.
8. Hệ thống thông báo kết quả.

**Luồng thay thế:**

Người dùng chỉ tra cứu: hệ thống hiển thị thông tin mùa giải được phép xem.

**Ngoại lệ:**

1. Thiếu thông tin bắt buộc hoặc trùng mã: từ chối lưu.
2. Thay đổi ảnh hưởng dữ liệu lịch sử: hệ thống kiểm tra ràng buộc trước khi chấp nhận.
3. Lỗi lưu trữ: dữ liệu hiện có được bảo toàn.

## UC06

**Quản lý quy định mùa giải**

Nguồn: §2.4.1.6, tr.79–82 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép người có thẩm quyền quản lý các quy định áp dụng cho từng mùa giải. Những quy định này ảnh hưởng đến điều kiện đăng ký cầu thủ, thể thức thi đấu, cách ghi nhận sự kiện trận đấu, tính điểm và xếp hạng. Mọi thay đổi phải có thẩm quyền phù hợp, thời điểm hiệu lực và lịch sử để tránh làm sai lệch dữ liệu của các mùa đã hoàn tất.

**Mô tả:**

Tạo, xem xét, phê duyệt hoặc cập nhật cấu hình quy định theo mùa giải trong phạm vi quyền hạn được cấp.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Người dùng đã đăng nhập.
2. Người dùng có quyền phù hợp với thao tác.
3. Mùa giải cần áp dụng quy định đã tồn tại.

**Hậu điều kiện:**

1. Quy định được lưu cùng mùa giải áp dụng và thời điểm hiệu lực.
2. Lịch sử thay đổi được ghi nhận.
3. Dữ liệu lịch sử của các mùa giải trước được bảo toàn, không bị thay đổi hồi tố.

**Luồng chính:**

1. Người dùng chọn mùa giải.
2. Hệ thống hiển thị bộ quy định hiện hành.
3. Người dùng chọn nội dung cần cập nhật.
4. Hệ thống kiểm tra quyền và yêu cầu nhập thông tin thay đổi.
5. Người dùng nhập nội dung, căn cứ và thời điểm hiệu lực theo quy trình đã được phê duyệt.
6. Hệ thống kiểm tra tính hợp lệ và xung đột với dữ liệu liên quan.
7. Người có thẩm quyền xác nhận hoặc phê duyệt theo chính sách.
8. Hệ thống lưu quy định mới và lịch sử trước–sau.
9. Hệ thống thông báo kết quả.

**Luồng thay thế:**

1. Người dùng chỉ xem quy định: hệ thống hiển thị quy định có hiệu lực theo mùa giải.
2. Thay đổi cần phê duyệt: hệ thống giữ trạng thái chờ đến khi có quyết định hợp lệ.

**Ngoại lệ:**

1. Không đủ quyền: từ chối thao tác.
2. Quy định không hợp lệ hoặc thiếu thời điểm hiệu lực: yêu cầu điều chỉnh.
3. Thay đổi gây mâu thuẫn với dữ liệu đã xác nhận: từ chối hoặc yêu cầu xử lý theo chính sách được phê duyệt.
4. Lỗi lưu trữ: không áp dụng một phần quy định mới.

## UC07

**Quản lý câu lạc bộ**

Nguồn: §2.4.1.7, tr.82–84 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép quản lý thông tin cơ bản của các câu lạc bộ tham gia hệ thống. Hồ sơ câu lạc bộ được quản lý riêng với hồ sơ tham dự một mùa giải cụ thể, bởi trạng thái tham dự và danh sách đăng ký có thể khác nhau theo từng mùa.

**Mô tả:**

Tạo, cập nhật và tra cứu hồ sơ cơ bản của câu lạc bộ.

**Tác nhân:**

Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

Người dùng đã đăng nhập và có quyền tương ứng.

**Hậu điều kiện:**

Hồ sơ câu lạc bộ được lưu hợp lệ và có thể liên kết với các mùa giải.

**Luồng chính:**

1. Người dùng mở chức năng quản lý câu lạc bộ.
2. Hệ thống hiển thị danh sách câu lạc bộ.
3. Người dùng chọn tạo mới, cập nhật hoặc xem hồ sơ.
4. Hệ thống tiếp nhận thông tin.
5. Hệ thống kiểm tra dữ liệu bắt buộc và tính trùng lặp.
6. Người dùng xác nhận.
7. Hệ thống lưu hoặc hiển thị hồ sơ.
8. Hệ thống thông báo kết quả.

**Luồng thay thế:**

Người dùng tìm kiếm câu lạc bộ: hệ thống lọc danh sách theo điều kiện nhập.

**Ngoại lệ:**

1. Hồ sơ thiếu thông tin bắt buộc hoặc trùng định danh: từ chối lưu.
2. Người dùng không đủ quyền chỉnh sửa: chỉ cho phép các thao tác được cấp.
3. Lỗi lưu dữ liệu: giữ nguyên hồ sơ trước đó.

## UC08

**Quản lý hồ sơ đăng ký câu lạc bộ**

Nguồn: §2.4.1.8, tr.85–88 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép nhân viên có thẩm quyền tiếp nhận hồ sơ tham dự của câu lạc bộ cho một mùa giải, kiểm tra tính đầy đủ, ghi nhận kết quả thẩm định và quản lý trạng thái hồ sơ. Chức năng này không đồng nghĩa với việc đại diện câu lạc bộ mặc nhiên có quyền tự phê duyệt hồ sơ của mình.

**Mô tả:**

Tiếp nhận và xử lý hồ sơ đăng ký tham dự của câu lạc bộ theo từng mùa giải.

**Tác nhân:**

Nhân viên phụ trách đăng ký; Ban tổ chức / Người quản lý mùa giải.

**Tiền điều kiện:**

1. Mùa giải đã được tạo.
2. Hồ sơ câu lạc bộ có thể được xác định.
3. Người thực hiện đã đăng nhập và có quyền tương ứng với thao tác tiếp nhận, thẩm định hoặc phê duyệt hồ sơ.

**Hậu điều kiện:**

1. Hồ sơ tham dự được ghi nhận theo đúng mùa giải.
2. Trạng thái hồ sơ, kết quả thẩm định và quyết định xét duyệt được ghi nhận theo thẩm quyền.
3. Lịch sử thay đổi quan trọng được ghi nhận.

**Luồng chính:**

1. Nhân viên mở chức năng quản lý hồ sơ tham dự.
2. Hệ thống hiển thị các hồ sơ theo mùa giải.
3. Nhân viên chọn tiếp nhận hồ sơ mới hoặc xử lý hồ sơ hiện có.
4. Hệ thống kiểm tra thông tin câu lạc bộ, mùa giải và các trường bắt buộc.
5. Nhân viên kiểm tra hồ sơ và thông tin liên quan.
6. Nhân viên ghi nhận kết quả thẩm định và chuyển hồ sơ đủ điều kiện đến Ban tổ chức để xét duyệt.
7. Hệ thống kiểm tra tính hợp lệ của trạng thái chuyển đổi.
8. Ban tổ chức có thẩm quyền phê duyệt hoặc từ chối; hệ thống lưu quyết định, trạng thái hồ sơ và nhật ký liên quan.
9. Hệ thống thông báo kết quả.

**Luồng thay thế:**

1. Hồ sơ chưa đầy đủ: ghi nhận trạng thái cần bổ sung theo quy trình nghiệp vụ đã thống nhất.
2. Hồ sơ cần thẩm định thêm: giữ ở trạng thái chưa được chấp thuận.

**Ngoại lệ:**

1. Hồ sơ không thuộc mùa giải được chọn: từ chối xử lý.
2. Người dùng không đủ quyền thẩm định: từ chối thao tác.
3. Hồ sơ trùng hoặc có xung đột dữ liệu: yêu cầu kiểm tra trước khi lưu.
4. Lỗi lưu dữ liệu: không tạo trạng thái chấp thuận dở dang.

## UC09

**Quản lý hồ sơ cầu thủ**

Nguồn: §2.4.1.9, tr.88–90 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép quản lý hồ sơ định danh và thông tin cơ bản của cầu thủ. Hồ sơ này cần được phân biệt với đăng ký cầu thủ ở một câu lạc bộ và mùa giải cụ thể, nhằm bảo toàn lịch sử và tránh nhầm lẫn khi cầu thủ thay đổi tình trạng đăng ký.

**Mô tả:**

Tạo, cập nhật và tra cứu thông tin cơ bản của cầu thủ.

**Tác nhân:**

Nhân viên phụ trách đăng ký.

**Tiền điều kiện:**

Người dùng đã đăng nhập và có quyền quản lý hồ sơ cầu thủ.

**Hậu điều kiện:**

Hồ sơ cầu thủ được lưu hợp lệ và có thể được tham chiếu bởi các đăng ký tương ứng.

**Luồng chính:**

1. Người dùng mở chức năng quản lý hồ sơ cầu thủ.
2. Hệ thống hiển thị danh sách cầu thủ.
3. Người dùng chọn tạo mới, cập nhật hoặc tra cứu hồ sơ.
4. Hệ thống yêu cầu thông tin cần thiết.
5. Người dùng nhập hoặc chỉnh sửa dữ liệu.
6. Hệ thống kiểm tra tính đầy đủ và trùng lặp.
7. Người dùng xác nhận.
8. Hệ thống lưu hoặc hiển thị hồ sơ.
9. Hệ thống thông báo kết quả.

**Luồng thay thế:**

Người dùng tra cứu theo tên hoặc thông tin định danh: hệ thống hiển thị kết quả phù hợp trong phạm vi quyền hạn.

**Ngoại lệ:**

1. Dữ liệu không hợp lệ hoặc trùng hồ sơ: từ chối lưu.
2. Không đủ quyền chỉnh sửa: từ chối thao tác.
3. Lỗi lưu trữ: giữ nguyên dữ liệu trước đó.

## UC10

**Quản lý đăng ký cầu thủ**

Nguồn: §2.4.1.10, tr.91–94 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép tiếp nhận và quản lý việc đăng ký cầu thủ cho câu lạc bộ trong một mùa giải. Đây là nghiệp vụ trọng tâm vì trạng thái đăng ký quyết định cầu thủ có đủ điều kiện được đưa vào danh sách thi đấu hay không. Hệ thống phải kiểm tra giới hạn danh sách, tiêu chí đào tạo nội địa, điều kiện U21, thời hạn đăng ký và việc trùng đăng ký còn hiệu lực.

**Mô tả:**

Tiếp nhận, kiểm tra, lưu và quản lý trạng thái đăng ký cầu thủ theo câu lạc bộ và mùa giải.

**Tác nhân:**

Nhân viên phụ trách đăng ký.

**Tiền điều kiện:**

1. Mùa giải đã tồn tại và có quy định đăng ký áp dụng.
2. Câu lạc bộ đã có hồ sơ tham dự phù hợp.
3. Hồ sơ cầu thủ đã tồn tại hoặc có thể được xác định.
4. Người thực hiện có quyền quản lý đăng ký.

**Hậu điều kiện:**

1. Bản ghi đăng ký được lưu với câu lạc bộ, cầu thủ, mùa giải và trạng thái tương ứng.
2. Kết quả kiểm tra điều kiện đăng ký được ghi nhận.
3. Lịch sử thao tác được lưu theo yêu cầu.

**Luồng chính:**

1. Nhân viên chọn mùa giải và câu lạc bộ.
2. Hệ thống hiển thị danh sách đăng ký hiện có.
3. Nhân viên chọn cầu thủ cần đăng ký.
4. Hệ thống kiểm tra thông tin cầu thủ, hồ sơ tham dự và thời hạn đăng ký.
5. Hệ thống thực hiện UC11 – Kiểm tra điều kiện đăng ký cầu thủ.
6. Hệ thống trả về kết quả kiểm tra và các điều kiện chưa đáp ứng, nếu có.
7. Nếu hợp lệ, nhân viên xác nhận đăng ký.
8. Hệ thống lưu bản ghi đăng ký và trạng thái.
9. Hệ thống ghi nhật ký và thông báo kết quả.

**Luồng thay thế:**

1. Nhân viên cập nhật trạng thái hoặc thông tin của một đăng ký hiện có: hệ thống kiểm tra lại các ràng buộc liên quan trước khi lưu.
2. Đăng ký chưa đủ điều kiện: hệ thống hiển thị các lý do và không chuyển sang trạng thái hợp lệ.

**Ngoại lệ:**

1. Cầu thủ đã có đăng ký còn hiệu lực bị xung đột theo quy định: từ chối đăng ký mới.
2. Vượt giới hạn danh sách hoặc vi phạm điều kiện đăng ký: từ chối xác nhận.
3. Ngoài thời hạn đăng ký và không thuộc trường hợp ngoại lệ đã được quy định: từ chối.
4. Lỗi lưu dữ liệu: không để lại bản ghi đăng ký ở trạng thái dở dang.

## UC11

**Kiểm tra điều kiện đăng ký cầu thủ**

Nguồn: §2.4.1.11, tr.94–97 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Đây là nghiệp vụ kiểm tra được sử dụng trong quá trình quản lý đăng ký cầu thủ. Nó xác định hồ sơ đăng ký có đáp ứng các quy định áp dụng cho mùa giải hay không. Kết quả kiểm tra cần có thể giải thích được, thay vì chỉ trả về trạng thái đạt hoặc không đạt.

**Mô tả:**

Đánh giá một đăng ký theo quy định của mùa giải và trả về kết quả kiểm tra.

**Tác nhân:**

Nhân viên phụ trách đăng ký (thông qua UC10 - Quản lý đăng ký cầu thủ).

**Tiền điều kiện:**

1. Có thông tin cầu thủ, câu lạc bộ và mùa giải cần kiểm tra.
2. Bộ quy định đăng ký tương ứng đã được xác định.

**Hậu điều kiện:**

Hệ thống trả về kết quả kiểm tra và các lý do liên quan để UC10 quyết định bước tiếp theo.

**Luồng chính:**

1. UC10 chuyển thông tin đăng ký sang bước kiểm tra.
2. Hệ thống lấy quy định của mùa giải.
3. Hệ thống kiểm tra giới hạn danh sách chính thức.
4. Hệ thống kiểm tra giới hạn cầu thủ không đáp ứng tiêu chí đào tạo nội địa.
5. Hệ thống kiểm tra điều kiện U21 theo mốc thời gian áp dụng.
6. Hệ thống kiểm tra thời hạn đăng ký và trường hợp ngoại lệ.
7. Hệ thống kiểm tra xung đột với đăng ký còn hiệu lực.
8. Hệ thống tổng hợp kết quả và trả về UC10.

**Luồng thay thế:**

Một tiêu chí không áp dụng cho trường hợp cụ thể theo quy định: hệ thống ghi nhận tiêu chí đó là không áp dụng, không tự coi là lỗi.

**Ngoại lệ:**

1. Thiếu dữ liệu bắt buộc: trả về trạng thái chưa đủ căn cứ kết luận.
2. Không tìm thấy quy định có hiệu lực: không tự sử dụng quy định của mùa giải khác.
3. Phát hiện vi phạm: trả về lý do cụ thể và không cho phép UC10 xác nhận đăng ký hợp lệ.

