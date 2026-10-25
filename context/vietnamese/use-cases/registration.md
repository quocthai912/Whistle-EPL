# Mùa giải, quy định và đăng ký: UC05-UC11

[Điểm truy cập](../README.md) · [Nghiệp vụ/BM/QĐ](../business.md) · [Chất lượng](../quality.md) · [Điểm mở](../open-decisions.md)

Luồng UC hiện hành giữ mã/trang nguồn và tích hợp làm rõ được duyệt rõ. Quy tắc chính thức của miền được liên kết bên dưới; bằng chứng duyệt/nguồn/lý do ở ADR English. Đây là tài liệu Context, không phải feature Specification sinh mới. Hình phân tích không phải API/schema đã duyệt. Xem [nguồn](../sources.md).

## UC05

**Quản lý mùa giải**

Nguồn: §2.4.1.5, tr.77-78 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Quy tắc hiện hành: [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến), [D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ), [D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu), [D045](registration.md#d045---khóa-điểm-số-và-thứ-tự-tiêu-chí-xếp-hạng-sau-kết-quả-chính-thức-đầu-tiên), [D046](registration.md#d046---giữ-mã-và-ý-nghĩa-loại-bàn-thắng-hoặc-thẻ-đã-được-tham-chiếu), [D050](registration.md#d050---mỗi-mùa-tối-đa-một-phiên-bản-quy-định-đã-duyệt-chờ-hiệu-lực-tương-lai), [D051](registration.md#d051---hủy-thay-thế-và-kiểm-soát-hiệu-lực-quy-định-đang-chờ), [D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ), [D053](registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ), [D054](registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh).

**Quản lý quy định mùa giải**

Nguồn: §2.4.1.6, tr.79-82 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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
7. Người có thẩm quyền khác duyệt phiên bản đã trình theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến); lưu nháp không làm quy định có hiệu lực.
8. Hệ thống lưu quy định mới và lịch sử trước-sau.
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

Nguồn: §2.4.1.7, tr.82-84 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

### Quản lý Logo trong UC07

UC07 gồm tải, thay và gỡ về fallback theo quyền quản lý CLB dùng chung được cấp riêng, có kiểm tra, giữ ảnh cũ khi lỗi và nhật ký theo [LOGO-01](../design/media.md#logo-01---thiết-kế-logo-đã-phê-duyệt). Giao diện CLB dùng Logo hiện tại được quản lý. Cần tham chiếu backend/cơ sở dữ liệu và tệp thực; hardcode Frontend chưa đủ.

## UC08

Quy tắc hiện hành: [D055](registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản).

**Quản lý hồ sơ đăng ký câu lạc bộ**

Nguồn: §2.4.1.8, tr.85-88 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

Quy tắc hiện hành: [D058](../business.md#d058---mã-nghiệp-vụ-ổn-định-rà-soát-hồ-sơ-trùng-và-số-áo-duy-nhất-theo-thời-gian), [D059](../business.md#d059---dữ-liệu-đăng-ký-bắt-buộc-và-mốc-chụp-thông-tin-chính-thức).

**Quản lý hồ sơ cầu thủ**

Nguồn: §2.4.1.9, tr.88-90 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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
6. Kiểm tra đầy đủ và mã duy nhất; người nghi trùng cần rà soát theo [D058](../business.md#d058---mã-nghiệp-vụ-ổn-định-rà-soát-hồ-sơ-trùng-và-số-áo-duy-nhất-theo-thời-gian).
7. Người dùng xác nhận.
8. Hệ thống lưu hoặc hiển thị hồ sơ.
9. Hệ thống thông báo kết quả.

**Luồng thay thế:**

Người dùng tra cứu theo tên hoặc thông tin định danh: hệ thống hiển thị kết quả phù hợp trong phạm vi quyền hạn.

**Ngoại lệ:**

1. Dữ liệu không hợp lệ hoặc trùng mã: từ chối lưu; trùng thuộc tính cá nhân theo quy trình rà soát [D058](../business.md#d058---mã-nghiệp-vụ-ổn-định-rà-soát-hồ-sơ-trùng-và-số-áo-duy-nhất-theo-thời-gian).
2. Không đủ quyền chỉnh sửa: từ chối thao tác.
3. Lỗi lưu trữ: giữ nguyên dữ liệu trước đó.

### Ảnh cầu thủ được quản lý trong UC09

UC09 phải quản lý ảnh hồ sơ cầu thủ theo quyền quản lý hồ sơ gốc cầu thủ hiện có và lưu tham chiếu. Hỗ trợ hàng trăm hồ sơ, hiển thị/fallback nhất quán. CLB/số áo lấy từ đăng ký mùa tương ứng, không thành định danh gốc cố định. Không cần API ngoài. Định dạng/giới hạn/lịch sử ảnh cầu thủ vẫn mở; LOGO-01 không tự chốt. Xem [phạm vi media](../design/media.md#phạm-vi-ảnh-cầu-thủ-và-quyết-định-còn-mở).

## UC10

Quy tắc hiện hành: [D053](registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ), [D054](registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh), [D055](registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản), [D056](registration.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán), [D057](registration.md#d057---hiệu-chỉnh-đăng-ký-đã-hợp-lệ-qua-phê-duyệt-độc-lập).

**Quản lý đăng ký cầu thủ**

Nguồn: §2.4.1.10, tr.91-94 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

**Bối cảnh nghiệp vụ:** Cho phép tiếp nhận và quản lý việc đăng ký cầu thủ cho câu lạc bộ trong một mùa giải. Đây là nghiệp vụ trọng tâm vì trạng thái đăng ký quyết định cầu thủ có đủ điều kiện được đưa vào danh sách thi đấu hay không. Hệ thống phải kiểm tra giới hạn danh sách, tiêu chí đào tạo nội địa, điều kiện U21, thời hạn đăng ký và việc trùng đăng ký còn hiệu lực.

**Mô tả:**

Tiếp nhận, kiểm tra, lưu và quản lý trạng thái đăng ký cầu thủ theo câu lạc bộ và mùa giải.

**Tác nhân:**

Nhân viên phụ trách đăng ký.

**Tiền điều kiện:**

1. Mùa giải đã tồn tại và có quy định đăng ký áp dụng.
2. Xác nhận hợp lệ cần hồ sơ CLB đã duyệt; danh sách cầu thủ chuẩn bị được kiểm tra trước theo [D055](registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản).
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
5. Hệ thống thực hiện UC11 - Kiểm tra điều kiện đăng ký cầu thủ.
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

Quy tắc hiện hành: [D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ), [D054](registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh).

**Kiểm tra điều kiện đăng ký cầu thủ**

Nguồn: §2.4.1.11, tr.94-97 (mô tả, bảng đặc tả và hình phân tích). Xem [cách đối chiếu PDF](../sources.md#pdf).

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

## Quy tắc hiện hành đã xác nhận

Các quy tắc dưới đây là chính sách hiện hành chính thức của miền. Đọc luồng UC/điều khoản nguồn phía trên cùng các làm rõ được đánh dấu này, không phải phiên bản riêng. Bằng chứng duyệt và ghi chú tại thời điểm phỏng vấn nằm trong ADR English được liên kết; công việc chưa chốt tại [quyết định mở](../open-decisions.md).

### D042 - Phiên bản quy định mùa giải đã duyệt có nội dung bất biến

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d042-english-evidence).

- **Nguồn:** O07/O12; QĐ6, PDF tr.11; UC06 tr.79-82; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D035](../business.md#d035---định-danh-gốc-ổn-định-và-bản-chụp-chọn-lọc-thông-tin-nghiệp-vụ-chính-thức).

- **Quyết định:** Mỗi lần phê duyệt xác lập một phiên bản quy định riêng, chứa đầy đủ bộ cấu hình quy định cho mùa đó. Nội dung đã duyệt là bất biến; thay đổi cần đề xuất mới và phê duyệt phiên bản mới. Giữ phiên bản cũ để tra cứu và làm căn cứ cho hồ sơ nghiệp vụ liên quan.

- **Ranh giới đề xuất:** Đề xuất được chỉnh sửa trong quá trình soạn thảo. Bản nháp hoặc chờ duyệt không thay quy định đang có hiệu lực. Người duyệt vẫn phải khác người chuẩn bị/chỉnh sửa nội dung trình duyệt theo [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt).

### D043 - Hiệu lực quy định ngay hoặc trong tương lai và không lùi về quá khứ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d043-english-evidence).

- **Nguồn:** O07/O12; QĐ6.6, PDF tr.11; UC06 tr.79-82; [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam)/[D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến).

- **Quyết định:** Đề xuất quy định chỉ rõ áp dụng ngay hoặc thời điểm hiệu lực tương lai để người duyệt xem xét. Áp dụng ngay bắt đầu khi hệ thống ghi nhận phê duyệt thành công. Phiên bản được duyệt cho tương lai không thay quy định hiện hành trước mốc đã duyệt. Không cho hiệu lực lùi về quá khứ.

- **Duyệt muộn:** Từ chối phê duyệt nếu thời điểm tương lai trong đề xuất đã trôi qua; không tự chuyển sang áp dụng ngay. Sửa đề xuất cần trình duyệt lại.

- **Quy ước thời gian:** Áp dụng [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam): lưu/so sánh thời điểm UTC và nhập/hiển thị theo Asia/Ho_Chi_Minh.

### D044 - Khóa cấu trúc thi đấu sau khi phê duyệt lịch ban đầu

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d044-english-evidence).

- **Nguồn:** O07/O10/O12; QĐ6.3, PDF tr.11; QĐ2; UC13/UC14; [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ).

- **Quyết định:** Từ lần đầu phê duyệt lịch ban đầu của mùa, khóa số CLB theo cấu hình, thể thức và số lượt cho mùa đó. Phiên bản quy định sau phải giữ nguyên các thông số cấu trúc này, kể cả khi chưa có trận bắt đầu.

- **Phạm vi:** Phạm vi đồ án hiện tại không có quy trình mở khóa hoặc hủy toàn bộ lịch để thay đổi cấu trúc thi đấu. Điều chỉnh ngày/giờ hoặc sân của trận chưa diễn ra vẫn theo UC14 và các điều kiện riêng.

### D045 - Khóa điểm số và thứ tự tiêu chí xếp hạng sau kết quả chính thức đầu tiên

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d045-english-evidence).

- **Nguồn:** O07/O12; QĐ5.2/QĐ5.3 và QĐ6.5, PDF tr.10-11; UC18-UC20; [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)-[D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu).

- **Quyết định:** Từ kết quả được xác nhận chính thức đầu tiên của mùa, khóa điểm thắng/hòa/thua và thứ tự ưu tiên tiêu chí xếp hạng cho mùa đó. Phiên bản quy định sau phải giữ nguyên các thông số này. Trước mốc đó, thay đổi vẫn cần phiên bản quy định và phê duyệt theo [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ).

- **Hiệu chỉnh và phạm vi:** Sửa kết quả chính thức theo UC19 và tính lại theo UC20 vẫn được thực hiện theo điều kiện áp dụng, dùng quy tắc điểm/xếp hạng đã khóa. Phạm vi đồ án hiện tại không có quy trình mở khóa các thông số này.

### D046 - Giữ mã và ý nghĩa loại bàn thắng hoặc thẻ đã được tham chiếu

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d046-english-evidence).

- **Nguồn:** O07/O09/O12; QĐ3.3-QĐ3.5 và QĐ6.4; [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ).

- **Quyết định:** Khi loại bàn thắng/thẻ đã được dùng, gồm trong biên bản nháp, giữ mã và ý nghĩa nghiệp vụ; không xóa khi đang được tham chiếu. Không đổi cách hiểu loại đã dùng, gồm cách tính tỷ số/thống kê, hoặc tái sử dụng mã cho nghĩa khác.

- **Thay đổi:** Ý nghĩa khác cần đề xuất loại mới qua phiên bản quy định và phê duyệt. Có thể đề xuất ngừng cho chọn khi nhập mới nhưng giữ loại cũ để đọc và giải thích lịch sử. Thêm loại không tự cho phép công thức tính mới hoặc nghiệp vụ chưa được duyệt.

### D050 - Mỗi mùa tối đa một phiên bản quy định đã duyệt chờ hiệu lực tương lai

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d050-english-evidence).

- **Nguồn:** O07/O12; [D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ).

- **Quyết định:** Mỗi mùa có tối đa một phiên bản quy định đã duyệt đang chờ thời điểm hiệu lực tương lai. Khi còn phiên bản đó, chặn phê duyệt phiên bản khác, kể cả phiên bản áp dụng ngay.

- **Chuẩn bị:** Vẫn được soạn đề xuất tiếp theo nhưng phải kiểm tra lại với quy định đang có hiệu lực trước khi duyệt. Thay thế hoặc hủy phiên bản đã duyệt đang chờ theo [D051](#d051---hủy-thay-thế-và-kiểm-soát-hiệu-lực-quy-định-đang-chờ); không sửa trực tiếp nội dung đã duyệt.

### D051 - Hủy, thay thế và kiểm soát hiệu lực quy định đang chờ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d051-english-evidence).

- **Nguồn:** O07/O08/O12; UC06; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)-[D045](registration.md#d045---khóa-điểm-số-và-thứ-tự-tiêu-chí-xếp-hạng-sau-kết-quả-chính-thức-đầu-tiên)/[D050](registration.md#d050---mỗi-mùa-tối-đa-một-phiên-bản-quy-định-đã-duyệt-chờ-hiệu-lực-tương-lai).

- **Hủy:** Trước thời điểm hiệu lực đã duyệt, Người quản lý mùa giải có thẩm quyền lập đề nghị hủy kèm lý do và một Người quản lý mùa giải khác có thẩm quyền duyệt. Giữ nội dung đã duyệt và lịch sử; ghi nhận quyết định hủy riêng.

- **Thay thế:** Một đề xuất có thể yêu cầu đồng thời hủy bản đang chờ và duyệt bản thay thế. Chỉ ghi nhận cả hai sau khi toàn bộ đề xuất hợp lệ được duyệt; thất bại thì giữ bản đang chờ. Đây là ngoại lệ có kiểm soát đối với việc chặn duyệt thêm bản khi còn bản chờ tại [D050](registration.md#d050---mỗi-mùa-tối-đa-một-phiên-bản-quy-định-đã-duyệt-chờ-hiệu-lực-tương-lai), không cho phép hai bản tương lai đã duyệt.

- **Biên thời gian:** Đề nghị hủy/thay thế đang chờ không hoãn hiệu lực. Khi đã tới thời điểm hiệu lực, không còn dùng quy trình hủy bản tương lai; thay đổi tiếp cần phiên bản quy định mới.

- **Điều kiện áp dụng:** Tại thời điểm hiệu lực, kiểm tra lại ràng buộc phát sinh từ lúc duyệt, gồm mốc khóa [D044](registration.md#d044---khóa-cấu-trúc-thi-đấu-sau-khi-phê-duyệt-lịch-ban-đầu)/[D045](registration.md#d045---khóa-điểm-số-và-thứ-tự-tiêu-chí-xếp-hạng-sau-kết-quả-chính-thức-đầu-tiên). Nếu bản không còn phù hợp thì không áp dụng: giữ quy định đang có hiệu lực, ghi nguyên nhân và kết thúc bản đã duyệt đó ở trạng thái nghiệp vụ cuối Bị chặn áp dụng. Bản này không còn chiếm vị trí bản tương lai đã duyệt đang chờ theo D050; xử lý điểm không phù hợp cần đề xuất mới và phê duyệt theo quy định/ràng buộc hiện hành. Không kích hoạt lại bản bị chặn, tự sửa nội dung đã duyệt hoặc dời thời điểm hiệu lực. Kết quả không phù hợp nghiệp vụ này không quy định cơ chế thử lại khi lỗi kỹ thuật.

### D052 - Thay đổi quy định đăng ký tương thích và kiểm tra lại hồ sơ đang chờ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0010-immutable-approved-season-regulation-versions.md#d052-english-evidence).

- **Nguồn:** O01/O02/O07/O12; QĐ6.2, UC06/UC10/UC11; [D036](../business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng)/[D042](registration.md#d042---phiên-bản-quy-định-mùa-giải-đã-duyệt-có-nội-dung-bất-biến)/[D043](registration.md#d043---hiệu-lực-quy-định-ngay-hoặc-trong-tương-lai-và-không-lùi-về-quá-khứ)/[D051](registration.md#d051---hủy-thay-thế-và-kiểm-soát-hiệu-lực-quy-định-đang-chờ).

- **Quyết định:** Cho thay đổi có kiểm soát giữa mùa đối với hạn mức danh sách, điều kiện homegrown và U21 chỉ khi không làm mất tính hợp lệ của đăng ký/danh sách đã duyệt đang có hiệu lực. Kiểm tra tác động khi duyệt và khi bắt đầu hiệu lực; chặn thay đổi không tương thích.

- **Quyết định hiện có:** Không tự hủy đăng ký, loại cầu thủ hoặc sửa quyết định đã duyệt để ép phù hợp luật mới. Giữ căn cứ phiên bản quy định gốc của quyết định lịch sử.

- **Hồ sơ đang chờ:** Kiểm tra lại hồ sơ nháp/chờ theo quy định có hiệu lực tại thời điểm quyết định. Nộp trước không bảo đảm được xét theo điều kiện/hạn mức cũ. Lưu phiên bản quy định làm căn cứ cho từng quyết định.

- **Ranh giới sửa sai:** Sai dữ liệu gốc hoặc quyết định trước đó đi qua quy trình hiệu chỉnh tương ứng; đổi quy định không thay thế hiệu chỉnh.

### D053 - Đợt đăng ký, hạn tiếp nhận và ngoại lệ từng hồ sơ

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d053-english-evidence).

- **Nguồn:** O02/O07/O08/O12; QĐ1.6/QĐ6.2, UC06/UC08/UC10/UC11; [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam)/[D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ).

- **Lịch:** Cấu hình lịch tiếp nhận theo mùa riêng cho hồ sơ tham gia CLB và đăng ký/thay đổi danh sách cầu thủ. Mỗi nhóm có thể có nhiều đợt, không chồng lấn trong cùng nhóm, được quản lý qua quy định mùa giải. Dùng thời điểm mở/đóng cụ thể và khoảng nửa kín [mở, đóng), theo [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam). Không tự nhập lịch chuyển nhượng EPL ngoài nguồn.

- **Căn cứ hạn nộp:** Dùng thời điểm server ghi nhận thành công việc tiếp nhận phiên bản hồ sơ được đưa ra xét, không phải lúc tạo nháp hoặc thời gian người dùng tự khai. Bản tiếp nhận đúng hạn có thể được xử lý sau khi đóng đợt. Điều kiện cầu thủ/hạn mức vẫn xét tại thời điểm quyết định theo [D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ).

- **Bổ sung:** Bổ sung hoặc thay đổi nội dung xét tạo phiên bản tiếp nhận mới và phải xét hạn lại.

- **Ngoại lệ cá biệt:** Nhân viên đăng ký đề nghị cho hồ sơ/phiên bản cụ thể kèm lý do và căn cứ; Người quản lý mùa giải có thẩm quyền phê duyệt riêng. Ngoại lệ chỉ miễn hạn tiếp nhận cho bản đó, không miễn điều kiện cầu thủ, hạn mức hoặc xung đột đăng ký. Duyệt ngoại lệ không thay quyết định xử lý đăng ký.

- **Truy vết:** Giữ thời điểm tiếp nhận, lịch làm căn cứ và quyết định ngoại lệ. Không sửa lịch hoặc lùi thời gian để hợp thức hóa tiếp nhận trước đó.

### D054 - Tự xét U21 và kiểm tra homegrown bằng căn cứ do nhân sự xác minh

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d054-english-evidence).

- **Nguồn:** O01/O07/O09/O12; QĐ1.2-QĐ1.4/QĐ6.2, UC10/UC11; [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam)/[D033](publication.md#d033---xem-dữ-liệu-nội-bộ-theo-trách-nhiệm-nghiệp-vụ)/[D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ).

- **Tham số mùa:** Bắt buộc có ngày sinh giới hạn U21 và khoảng tuổi đào tạo đủ điều kiện homegrown trong quy định trình duyệt. Không điền phần thiếu từ luật EPL ngoài nguồn. Giữ ngưỡng nguồn ít nhất ba mùa hoặc 36 tháng làm mặc định; thay đổi theo [D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ). Giá trị thực tế từng mùa phải nhập và duyệt trong cấu hình, không tự ngầm định.

- **U21:** Tự xác định đủ điều kiện khi ngày sinh bằng hoặc sau ngày giới hạn của mùa. So sánh ngày lịch thay vì tuổi hiện tại; thiếu ngày sinh thì chưa đủ căn cứ kết luận.

- **Homegrown:** Nhân viên đăng ký kiểm tra tài liệu và ghi nhận căn cứ theo số mùa hoặc số tháng đạt điều kiện, kết luận, người kiểm tra, thời điểm và phiên bản quy định. Căn cứ phải chứng minh đáp ứng khoảng tuổi và yêu cầu liên đoàn Anh/Wales; không dùng quốc tịch thay thế.

- **Thiếu căn cứ:** Không đánh dấu đạt homegrown. Người lập có thể chọn xử lý theo nhóm không đạt homegrown nếu đáp ứng hạn mức và mọi điều kiện khác; thiếu căn cứ homegrown không tự từ chối mọi đăng ký.

- **Thuộc tính độc lập và phạm vi:** U21 và homegrown độc lập, không suy từ quốc tịch hoặc suy ra lẫn nhau. Phiên bản đầu không tự cộng toàn bộ lịch sử đào tạo qua nhiều CLB, xử lý trùng thời gian hoặc quy đổi mùa/tháng. Căn cứ vẫn nội bộ theo quyền xem đã chốt.

### D055 - Luồng hồ sơ CLB và đăng ký cầu thủ theo phiên bản

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d055-english-evidence).

- **Nguồn:** O02/O08/O09/O12; UC08/UC10/UC11; [D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt)/[D052](registration.md#d052---thay-đổi-quy-định-đăng-ký-tương-thích-và-kiểm-tra-lại-hồ-sơ-đang-chờ)-[D054](registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh).

- **Luồng CLB:** Nháp -> Đã tiếp nhận -> Chờ phê duyệt -> Đã duyệt hoặc Từ chối. Nhân viên đăng ký chuẩn bị/rà soát; Người quản lý mùa giải có thẩm quyền duyệt theo UC08/[D005](administration.md#d005---tách-biệt-trách-nhiệm-lập-và-phê-duyệt).

- **Luồng cầu thủ:** Nháp -> Đã tiếp nhận -> Hợp lệ. Nhân viên đăng ký xác nhận hợp lệ sau kiểm tra UC11 theo UC10; không thêm bước Người quản lý mùa giải duyệt.

- **Bổ sung/phiên bản:** Cần bổ sung là trạng thái thay thế rõ ràng: Đã tiếp nhận -> Cần bổ sung cho hồ sơ CLB/cầu thủ, và Chờ phê duyệt -> Cần bổ sung cho hồ sơ CLB, kèm lý do. Nộp lại theo Cần bổ sung -> Đã tiếp nhận dưới dạng phiên bản mới, rồi đi tiếp luồng rà soát/phê duyệt tương ứng phía trên. Bổ sung tạo phiên bản mới để tiếp nhận/kiểm tra lại theo [D053](registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ). Nội dung CLB đã trình duyệt là bất biến; muốn sửa phải rút về hoặc được trả bổ sung, rồi trình bản mới.

- **Hủy/nộp lại:** Cho hủy trước khi CLB được duyệt hoặc đăng ký cầu thủ được xác nhận hợp lệ, giữ lý do/lịch sử. Bản từ chối/hủy không được sửa thành đã duyệt; lượt xử lý mới liên kết lịch sử. Giữ một hồ sơ CLB-mùa chứa các phiên bản/lượt, không nhiều hồ sơ tham gia độc lập cho cùng CLB-mùa.

- **Phụ thuộc:** Được chuẩn bị/kiểm tra danh sách cầu thủ trong lúc chờ duyệt CLB, nhưng chỉ xác nhận đăng ký cầu thủ hợp lệ sau khi hồ sơ tham gia CLB được duyệt. Duyệt CLB không tự làm mọi đăng ký cầu thủ hợp lệ; UC10 vẫn phải kiểm tra/xác nhận.

- **Ranh giới thời gian:** Xác nhận hợp lệ vẫn khác với hiệu lực thi đấu, kết thúc đăng ký và chuyển CLB; các nội dung này tuân theo [D056](#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán).

### D056 - Khoảng hiệu lực thi đấu và chuyển CLB nhất quán

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d056-english-evidence).

- **Nguồn:** O02/O08/O09/O12; QĐ1.5, UC10/UC11; [D024](../design/architecture.md#d024---thời-điểm-theo-utc-nhậphiển-thị-thống-nhất-múi-giờ-việt-nam)/[D053](registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ)-[D055](registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản).

- **Khoảng hiệu lực:** Đăng ký hợp lệ có mốc bắt đầu hiệu lực thi đấu và khoảng nửa kín [bắt đầu, kết thúc). Có thể chưa xác định mốc kết thúc cho tới khi được kết thúc hợp lệ. Thao tác bắt đầu/kết thúc thông thường có hiệu lực khi ghi nhận thành công hoặc ở tương lai, không trước lúc ghi nhận; sai lịch sử cần quy trình hiệu chỉnh riêng.

- **Độc quyền:** Từ chối khoảng đăng ký đã xác nhận chồng lấn cho cùng cầu thủ và giải, gồm đăng ký bắt đầu trong tương lai và khác mùa. Cho phép hai khoảng nối tiếp tại cùng mốc kết thúc/bắt đầu.

- **Chuyển CLB:** Trong UC10, kết thúc đăng ký CLB cũ và bắt đầu đăng ký CLB mới tại cùng mốc bằng một thao tác nhất quán. Chỉ ghi nhận cả hai khi đăng ký mới đạt mọi kiểm tra; thất bại giữ nguyên đăng ký cũ.

- **Thẩm quyền/kiểm tra:** Nhân viên đăng ký phải có quyền đối với đăng ký/mùa bị ảnh hưởng, kèm lý do và lịch sử. Chuyển CLB vẫn đáp ứng hạn/ngoại lệ [D053](registration.md#d053---đợt-đăng-ký-hạn-tiếp-nhận-và-ngoại-lệ-từng-hồ-sơ), điều kiện [D054](registration.md#d054---tự-xét-u21-và-kiểm-tra-homegrown-bằng-căn-cứ-do-nhân-sự-xác-minh), hạn mức và mọi kiểm tra khác; không có quyền bỏ qua.

- **Lịch sử:** Kết thúc hoặc chuyển CLB không tự xóa lần ra sân, bàn thắng hoặc thống kê trước đó.

### D057 - Hiệu chỉnh đăng ký đã hợp lệ qua phê duyệt độc lập

**Chính sách đã xác nhận.** [Phê duyệt, nguồn và lý do](../../../docs/adr/0011-registration-windows-and-receipt-exceptions.md#d057-english-evidence).

- **Nguồn:** O02/O08/O09/O12; UC10/UC11/UC19; [D036](../business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng)/[D055](registration.md#d055---luồng-hồ-sơ-clb-và-đăng-ký-cầu-thủ-theo-phiên-bản)/[D056](registration.md#d056---khoảng-hiệu-lực-thi-đấu-và-chuyển-clb-nhất-quán).

- **Phạm vi:** Sửa sai nội dung/căn cứ đã xác nhận, kết luận phân loại hoặc khoảng hiệu lực ghi nhận sai, gồm hiệu chỉnh lịch sử, cần đề xuất và phê duyệt độc lập. Không thêm bước duyệt cho xác nhận hợp lệ ban đầu theo UC10 hoặc kết thúc/chuyển CLB thông thường.

- **Trách nhiệm:** Nhân viên đăng ký rà soát/lập đề xuất kèm lý do, căn cứ, giá trị trước/sau và ảnh hưởng liên quan. Người quản lý mùa giải có thẩm quyền khác người chuẩn bị/chỉnh sửa đề xuất phê duyệt, trả bổ sung hoặc từ chối.

- **Chờ rà soát:** Giữ quyết định chính thức hiện có và ghi nhận việc cần rà soát. Nghiệp vụ mới vẫn kiểm tra theo dữ liệu gốc đã sửa theo [D036](../business.md#d036---sửa-dữ-liệu-gốc-bị-sai-và-rà-soát-riêng-nghiệp-vụ-bị-ảnh-hưởng), không dùng kết quả lỗi thời.

- **Kiểm tra:** Kiểm tra lại điều kiện, hạn mức và chồng lấn cho khoảng bị ảnh hưởng theo quy định tương ứng. Hiệu chỉnh không miễn kiểm tra hoặc hợp thức hóa vi phạm.

- **Quyết định cũ sai:** Nếu không thể giữ đăng ký hợp lệ, đề xuất phải nêu cách xử lý, chẳng hạn kết thúc hiệu lực hoặc ghi nhận quyết định trước đó là sai. Không xóa dấu vết đăng ký từng tồn tại.

- **Ảnh hưởng trận:** Xác định biên bản/kết quả cần rà soát riêng. Duyệt hiệu chỉnh đăng ký không tự sửa kết quả, xử thua hoặc đổi thống kê; sửa kết quả chính thức vẫn qua UC19.

- **Bổ sung so với nguồn:** Văn bản UC10 gốc truy xuất tại mốc Git v1. Chính sách đã xác nhận này thêm phê duyệt riêng cho hiệu chỉnh đăng ký đã hợp lệ, không khẳng định v1 đã yêu cầu.
