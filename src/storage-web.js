// Cung cấp đúng hình dạng API `window.storage.get/set/delete/list` mà
// App.jsx đã dùng sẵn (giống hệt bản Electron), nhưng thay vì lưu trong
// một file trên máy, nó gọi sang server Node (server.js) để đọc/ghi vào
// một file dữ liệu dùng chung trên server — nhờ vậy mọi người mở cùng một
// trang web sẽ luôn thấy cùng một dữ liệu.
//
// Nếu server có đặt mật khẩu chỉnh sửa (biến môi trường EDIT_PASSWORD),
// mọi người vẫn XEM được bình thường không cần mật khẩu; chỉ khi bấm
// thêm/sửa/xóa mới bị chặn (401) — lúc đó sẽ tự hỏi mật khẩu bằng một
// hộp thoại nhỏ, và nhớ lại cho các lần sau trên cùng trình duyệt.

const API = "/api/storage";

function getEditToken() {
  try {
    return localStorage.getItem("cs2-edit-token") || "";
  } catch {
    return "";
  }
}

function setEditToken(token) {
  try {
    localStorage.setItem("cs2-edit-token", token);
  } catch {}
}

function authHeaders() {
  const token = getEditToken();
  return token ? { "x-edit-token": token } : {};
}

async function promptForPassword() {
  const pass = window.prompt("Nhập mật khẩu chỉnh sửa:");
  if (!pass) return false;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pass }),
  });
  if (!res.ok) {
    window.alert("Sai mật khẩu.");
    return false;
  }
  const data = await res.json();
  setEditToken(data.token || "");
  return true;
}

async function writeWithAuth(doFetch) {
  let res = await doFetch();
  if (res.status === 401) {
    const ok = await promptForPassword();
    if (!ok) throw new Error("Cần mật khẩu chỉnh sửa để lưu thay đổi.");
    res = await doFetch();
  }
  if (!res.ok) throw new Error("Lưu thất bại, thử lại nhé.");
  return res.json();
}

async function get(key) {
  const res = await fetch(`${API}/${encodeURIComponent(key)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("storage get failed");
  return res.json();
}

async function set(key, value) {
  return writeWithAuth(() =>
    fetch(`${API}/${encodeURIComponent(key)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ value }),
    })
  );
}

async function del(key) {
  return writeWithAuth(() =>
    fetch(`${API}/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: { ...authHeaders() },
    })
  );
}

async function list(prefix) {
  const qs = prefix ? `?prefix=${encodeURIComponent(prefix)}` : "";
  const res = await fetch(`${API}${qs}`);
  if (!res.ok) throw new Error("storage list failed");
  return res.json();
}

// Tải ảnh/video (dạng data: URL) lên Cloudinary qua server, trả về đường
// link đã lưu trữ thay vì giữ nguyên base64 — App.jsx tự phát hiện hàm
// này tồn tại (chỉ có ở bản web) để chuyển sang cách lưu nhẹ hơn.
async function uploadImage(dataUrl) {
  const data = await writeWithAuth(() =>
    fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ dataUrl }),
    })
  );
  return data?.url || null;
}

window.storage = { get, set, delete: del, list, uploadImage };
