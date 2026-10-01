const express = require("express");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");
const cloudinary = require("cloudinary").v2;

const app = express();
app.use(express.json({ limit: "150mb" })); // ảnh/video gửi lên dạng base64 nên cần giới hạn lớn

// Nơi lưu dữ liệu dùng chung: thay vì ghi vào file trên server (sẽ mất khi
// Render khởi động lại / deploy lại, vì gói free không có ổ đĩa lâu dài),
// dữ liệu được lưu trong một database MongoDB Atlas miễn phí ở ngoài —
// luôn còn nguyên dù server có ngủ/khởi động lại bao nhiêu lần.
const MONGODB_URI = process.env.MONGODB_URI;

// Tùy chọn: đặt biến môi trường EDIT_PASSWORD để yêu cầu mật khẩu khi
// thêm/sửa/xóa. Để trống (mặc định) thì ai mở trang cũng sửa được luôn.
const EDIT_PASSWORD = process.env.EDIT_PASSWORD || "";

const PORT = process.env.PORT || 3000;

if (!MONGODB_URI) {
  console.error(
    "THIẾU biến môi trường MONGODB_URI — vào Render > service > Environment để thêm connection string MongoDB Atlas."
  );
}

// Ảnh/video người dùng tải lên được gửi sang Cloudinary (free ~25GB) thay
// vì nhúng thẳng base64 vào MongoDB — tránh làm phình dữ liệu và chạm giới
// hạn 16MB/bản ghi của MongoDB. Chỉ hoạt động khi đã khai báo đủ 3 biến
// môi trường CLOUDINARY_* bên dưới; nếu thiếu, endpoint /api/upload sẽ báo
// lỗi rõ ràng thay vì âm thầm hỏng.
const CLOUDINARY_READY = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (CLOUDINARY_READY) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn(
    "Chưa cấu hình đủ CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET — " +
    "giao diện sẽ tự động quay về lưu ảnh/video trực tiếp trong MongoDB (không lỗi, nhưng dễ phình dữ liệu hơn)."
  );
}

let col; // collection "storage", gán sau khi kết nối xong

function loadSeed() {
  const seedPath = path.join(__dirname, "seed", "default-data.json");
  try {
    return JSON.parse(fs.readFileSync(seedPath, "utf-8"));
  } catch {
    return { maps: [], tactics: [], mapImages: {} };
  }
}

// Lần đầu tiên chạy (database còn trống), nạp sẵn dữ liệu mẫu từ seed/.
async function ensureSeeded() {
  const count = await col.countDocuments();
  if (count > 0) return;
  const seed = loadSeed();
  await col.insertMany([
    { _id: "cs2-tactics-maps", value: JSON.stringify(seed.maps || []) },
    { _id: "cs2-tactics-data", value: JSON.stringify(seed.tactics || []) },
    { _id: "cs2-tactics-map-images", value: JSON.stringify(seed.mapImages || {}) },
  ]);
  console.log("Đã nạp dữ liệu mẫu ban đầu vào MongoDB.");
}

function requireEditAuth(req, res, next) {
  if (!EDIT_PASSWORD) return next();
  const token = req.header("x-edit-token");
  if (token && token === EDIT_PASSWORD) return next();
  return res.status(401).json({ error: "unauthorized" });
}

app.post("/api/login", (req, res) => {
  if (!EDIT_PASSWORD) return res.json({ ok: true, token: "" });
  if (req.body && req.body.password === EDIT_PASSWORD) {
    return res.json({ ok: true, token: EDIT_PASSWORD });
  }
  return res.status(401).json({ ok: false });
});

// Nhận một ảnh/video dạng "data:..." (base64) từ trình duyệt, đẩy lên
// Cloudinary, trả về đường link đã lưu trữ. Cùng yêu cầu mật khẩu chỉnh
// sửa (nếu có đặt) như các thao tác ghi dữ liệu khác.
app.post("/api/upload", requireEditAuth, async (req, res) => {
  if (!CLOUDINARY_READY) {
    return res.status(501).json({ error: "Cloudinary chưa được cấu hình trên server." });
  }
  const dataUrl = req.body?.dataUrl;
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return res.status(400).json({ error: "dataUrl không hợp lệ" });
  }
  try {
    const result = await cloudinary.uploader.upload(dataUrl, {
      resource_type: "auto", // tự nhận diện ảnh hay video
      folder: "cs2-tactics-board",
    });
    res.json({ url: result.secure_url });
  } catch (e) {
    console.error("Upload Cloudinary lỗi:", e.message);
    res.status(500).json({ error: "upload thất bại" });
  }
});

app.get("/api/storage/:key", async (req, res) => {
  try {
    const doc = await col.findOne({ _id: req.params.key });
    if (!doc) return res.status(404).json({ error: "not found" });
    res.json({ key: doc._id, value: doc.value, shared: true });
  } catch (e) {
    console.error("GET storage error:", e.message);
    res.status(500).json({ error: "db error" });
  }
});

app.put("/api/storage/:key", requireEditAuth, async (req, res) => {
  try {
    const key = req.params.key;
    await col.updateOne({ _id: key }, { $set: { value: req.body.value } }, { upsert: true });
    res.json({ key, value: req.body.value, shared: true });
  } catch (e) {
    console.error("PUT storage error:", e.message);
    res.status(500).json({ error: "db error" });
  }
});

app.delete("/api/storage/:key", requireEditAuth, async (req, res) => {
  try {
    const key = req.params.key;
    const result = await col.deleteOne({ _id: key });
    res.json({ key, deleted: result.deletedCount > 0, shared: true });
  } catch (e) {
    console.error("DELETE storage error:", e.message);
    res.status(500).json({ error: "db error" });
  }
});

app.get("/api/storage", async (req, res) => {
  try {
    const prefix = req.query.prefix || "";
    const docs = await col.find({}, { projection: { _id: 1 } }).toArray();
    const keys = docs.map((d) => d._id).filter((k) => !prefix || k.startsWith(prefix));
    res.json({ keys, prefix, shared: true });
  } catch (e) {
    console.error("LIST storage error:", e.message);
    res.status(500).json({ error: "db error" });
  }
});

// Phục vụ bản build của giao diện (thư mục dist do "npm run build" tạo ra)
app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

async function start() {
  if (!MONGODB_URI) {
    // Vẫn khởi động để Render không báo "crash loop", nhưng mọi API sẽ lỗi
    // cho tới khi biến môi trường được thêm đúng.
    app.listen(PORT, () => console.log(`Server chạy ở cổng ${PORT} nhưng CHƯA kết nối được database.`));
    return;
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("cs2-tactics-board");
  col = db.collection("storage");
  await ensureSeeded();
  app.listen(PORT, () => {
    console.log(`CS2 Tactics Board (web) đang chạy ở cổng ${PORT}`);
    console.log("Đã kết nối MongoDB Atlas thành công.");
    console.log(EDIT_PASSWORD ? "Chỉnh sửa yêu cầu mật khẩu." : "Chỉnh sửa mở cho tất cả mọi người.");
  });
}

start().catch((err) => {
  console.error("Không khởi động được server:", err.message);
  process.exit(1);
});
