# CS2 Tactics Board — bản Web (chạy trên domain riêng)

Đây là bản **web** của app, khác với bản Windows (.exe) bạn đang có. Bản này:
- Chạy bằng trình duyệt, ai có link `https://consoicongnghe.com` cũng mở được, không cần cài đặt gì.
- Dữ liệu chữ (map, tên chiến thuật, mô tả...) được lưu trong một **database MongoDB Atlas miễn phí**.
- **Ảnh/video** được tải lên một nơi lưu trữ riêng là **Cloudinary (free ~25GB)** thay vì nhúng thẳng base64 vào database — tránh làm phình dữ liệu và chạm giới hạn dung lượng mỗi bản ghi.
- Nhiều người mở cùng lúc sẽ thấy cùng một dữ liệu, ai sửa thì người khác load lại trang sẽ thấy thay đổi đó, và dữ liệu **không bao giờ mất** dù server có khởi động lại.
- Mặc định **ai cũng sửa được**, không cần đăng nhập. Nếu muốn giới hạn chỉ người biết mật khẩu mới sửa được, xem mục "Giới hạn chỉnh sửa (tuỳ chọn)" bên dưới.

Cách làm dưới đây dùng **Render.com** (chạy app) + **MongoDB Atlas** (lưu dữ liệu chữ) + **Cloudinary** (lưu ảnh/video) — cả ba đều **miễn phí hoàn toàn và không yêu cầu thẻ tín dụng**, chỉ cần đăng ký bằng email hoặc GitHub.

> Đánh đổi duy nhất: vì là gói free, app sẽ "ngủ" sau 15 phút không ai truy cập. Lần mở đầu tiên sau khi ngủ sẽ chậm khoảng 30-60 giây để "thức dậy", sau đó dùng bình thường.

---

## Tổng quan các bước

1. Tạo database miễn phí trên **MongoDB Atlas**, lấy "connection string".
2. Tạo tài khoản **Cloudinary** miễn phí, lấy 3 thông tin API.
3. Đưa code lên GitHub (repo `vechaikt01/cs2-tactics-web` đã có sẵn).
4. Tạo Web Service trên **Render.com** từ repo đó, dán các thông tin trên vào.
5. Trỏ domain `consoicongnghe.com` về Render.
6. Xong — domain chạy được app, HTTPS tự động có sẵn, dữ liệu an toàn lâu dài.

---

## Bước 1 — Tạo database MongoDB Atlas (miễn phí)

1. Vào **https://www.mongodb.com/cloud/atlas/register** → đăng ký bằng email hoặc Google (không hỏi thẻ).
2. Sau khi vào Dashboard, chọn **Build a Database** → chọn gói **M0 (Free)** → chọn nhà cung cấp **AWS** và khu vực gần Việt Nam (ví dụ Singapore) → **Create**.
3. Màn hình **Security Quickstart** hiện ra:
   - Mục **Username and Password**: đặt một username/password bất kỳ (ví dụ `cs2admin` / tự đặt mật khẩu) → bấm **Create User**. **Ghi lại mật khẩu này.**
   - Mục **Where would you like to connect from**: chọn **My Local Environment** → bấm **Add My Current IP Address**, sau đó **thêm thêm** một mục nữa gõ `0.0.0.0/0` (cho phép truy cập từ bất kỳ đâu — cần thiết vì Render không có IP cố định) → **Finish and Close**.
4. Vào **Database** (menu bên trái) → bấm **Connect** trên cluster vừa tạo → chọn **Drivers** → chọn **Node.js** → copy chuỗi **connection string**, dạng:
   ```
   mongodb+srv://cs2admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Thay `<password>` bằng đúng mật khẩu bạn đặt ở bước 3 (không có dấu `<` `>`). **Giữ lại chuỗi này** — sẽ dùng ở Bước 4.

---

## Bước 2 — Tạo tài khoản Cloudinary (miễn phí, lưu ảnh/video)

1. Vào **https://cloudinary.com/users/register_free** → đăng ký bằng email hoặc Google (không hỏi thẻ).
2. Sau khi vào **Dashboard** (trang đầu tiên hiện ra sau khi đăng ký), bạn sẽ thấy ngay mục **"API Environment variable"** hoặc **"Account Details"** hiển thị 3 thông tin:
   - **Cloud Name**
   - **API Key**
   - **API Secret** (bấm vào biểu tượng con mắt 👁 để hiện ra)
3. **Ghi lại cả 3 giá trị này** — sẽ dùng ở Bước 4.

---

## Bước 3 — Đưa code lên GitHub

Repo đích: **https://github.com/vechaikt01/cs2-tactics-web**

1. Nếu chưa tạo repo: vào github.com → **New repository** → tên `cs2-tactics-web` → **Create repository** (không tích "Add README").
2. Giải nén file zip tôi gửi, mở terminal tại đúng thư mục đó, chạy:
   ```
   git init
   git add .
   git commit -m "init: cs2 tactics board web (MongoDB + Cloudinary)"
   git branch -M main
   git remote add origin https://github.com/vechaikt01/cs2-tactics-web.git
   git push -u origin main
   ```
   (Nếu báo lỗi "remote origin already exists", dùng `git remote set-url origin https://github.com/vechaikt01/cs2-tactics-web.git` thay vì `add`. Nếu báo "Author identity unknown", chạy lại `git config --global user.email ...` và `git config --global user.name ...`.)

---

## Bước 4 — Deploy lên Render

1. Vào **https://render.com** → **Get Started** → đăng ký bằng GitHub (không cần thẻ).
2. Bấm **New** → **Web Service** → chọn repo `vechaikt01/cs2-tactics-web` (nếu chưa thấy, bấm **Configure account** để cấp quyền Render truy cập repo).
3. Điền cấu hình:
   - **Name**: tuỳ ý, ví dụ `cs2-tactics-board`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
4. Kéo xuống mục **Environment Variables** → **Add Environment Variable**, thêm đủ các dòng sau:
   - `MONGODB_URI` = chuỗi connection string đã lấy ở Bước 1
   - `CLOUDINARY_CLOUD_NAME` = Cloud Name lấy ở Bước 2
   - `CLOUDINARY_API_KEY` = API Key lấy ở Bước 2
   - `CLOUDINARY_API_SECRET` = API Secret lấy ở Bước 2
   - (tuỳ chọn) `EDIT_PASSWORD` = mật khẩu nếu muốn giới hạn ai sửa được — xem mục bên dưới
5. Bấm **Create Web Service**. Đợi vài phút để build xong. Render cho một link dạng `cs2-tactics-board.onrender.com` — mở thử để chắc app chạy và thấy dữ liệu mẫu hiện ra.
6. Kiểm tra nhanh Cloudinary đã hoạt động: vào app → thử thêm 1 ảnh ở bất kỳ chiến thuật nào → quay lại trang **Dashboard** của Cloudinary → mục **Media Library** → nếu thấy ảnh vừa upload nằm trong thư mục `cs2-tactics-board` là đã chạy đúng.

---

## Bước 5 — Trỏ domain `consoicongnghe.com` về Render

1. Trong Render, vào service vừa tạo → tab **Settings** → mục **Custom Domains** → **Add Custom Domain** → nhập `consoicongnghe.com` (và thêm lần nữa cho `www.consoicongnghe.com` nếu muốn).
2. Render cho bản ghi DNS cần thêm, thường là:
   - Loại **A**, Host `@`, Value = một địa chỉ IP Render đưa ra.
   - Loại **CNAME**, Host `www`, Value = dạng `cs2-tactics-board.onrender.com`.
3. Đăng nhập nơi bạn **mua domain** → phần quản lý **DNS** → thêm đúng các bản ghi Render yêu cầu.
4. Đợi DNS cập nhật (vài phút đến vài giờ). Render tự cấp HTTPS miễn phí cho domain, không cần làm gì thêm.
5. Mở `https://consoicongnghe.com` — app hiện ra là xong.

---

## Cập nhật app sau này

Mỗi khi tôi gửi file mới:
```
git add .
git commit -m "mô tả thay đổi"
git push
```
Render tự động build và deploy lại (thường 2-3 phút), không cần đụng gì tới domain hay database.

---

## Dữ liệu cũ (file backup JSON)

Sau khi app đã chạy trên domain:
1. Mở app trên domain.
2. Dùng nút **Nhập dữ liệu (Import)**, chọn file `cs2-tactics-backup-...json` bạn đã xuất từ bản Windows.
3. Chọn **"Gộp / Thêm mới"** để gộp dữ liệu cũ vào mà không mất gì.

---

## Giới hạn chỉnh sửa (tuỳ chọn)

Nếu chỉ muốn mình bạn (hoặc một nhóm nhỏ biết mật khẩu) được thêm/sửa/xóa, còn người khác chỉ xem được:
1. Trong Render → tab **Environment** → đặt `EDIT_PASSWORD` = mật khẩu bạn chọn → **Save Changes** (Render tự deploy lại).
2. Khi ai đó bấm thêm/sửa/xóa lần đầu trên một trình duyệt, app sẽ tự hiện hộp thoại hỏi mật khẩu. Nhập đúng thì trình duyệt đó nhớ luôn.
3. Xem (không sửa) thì không cần mật khẩu, ai cũng xem được bình thường.

---

## Giới hạn cần biết

- **App "ngủ" sau 15 phút không ai dùng** (đặc điểm gói free của Render) — lần mở lại đầu tiên sẽ chậm ~30-60 giây, sau đó bình thường.
- **Ảnh/video mới** (thêm trực tiếp trong app từ lúc này) sẽ tự động tải lên Cloudinary (free ~25GB), MongoDB chỉ giữ đường link — rất nhẹ, khó chạm giới hạn.
- **Dữ liệu cũ nhập từ file backup JSON** (nút Import) vẫn giữ nguyên ảnh dạng base64 như trong file gốc — vì đây là ảnh có sẵn, không phải upload mới nên không tự động chuyển sang Cloudinary. Nếu muốn "dọn" luôn các ảnh cũ này sang Cloudinary để nhẹ dữ liệu hơn, nói tôi làm thêm bước đó.
- Gói **M0 free** của MongoDB Atlas giới hạn 512MB — với kiến trúc mới (chỉ lưu chữ + đường link ảnh) sẽ dùng được rất lâu, gần như không còn là vấn đề.
- Không có tài khoản riêng cho từng người, chỉ có một mật khẩu chỉnh sửa dùng chung (nếu bạn bật). Không dùng để lưu thông tin nhạy cảm.
