const R2_WORKER_URL =
    "https://dark-snow-9711.letien-452272.workers.dev";

async function uploadFileToR2(file, options = {}) {

    if (!file) {
        throw new Error("Không có file để upload.");
    }

    // ==============================
    // LẤY SESSION
    // ==============================

    const { data, error } =
        await supabase.auth.getSession();

    if (error) {
        console.error("Lỗi session:", error);
        throw new Error("Không lấy được phiên đăng nhập.");
    }

    const session = data?.session;

    if (!session || !session.access_token) {
        throw new Error("Bạn chưa đăng nhập.");
    }

    const token = session.access_token;

    console.log("Đã lấy token Supabase.");

    // ==============================
    // FORM DATA
    // ==============================

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "type",
        options.type || "cover"
    );

    formData.append(
        "mangaId",
        String(options.mangaId || "unknown")
    );

    formData.append(
        "chapterNumber",
        String(options.chapterNumber || "0")
    );

    // Gửi JWT trực tiếp trong FormData
    formData.append("token", token);

    // ==============================
    // UPLOAD
    // ==============================

    console.log("Đang upload lên R2...");

    const response = await fetch(
        R2_WORKER_URL + "/upload",
        {
            method: "POST",
            body: formData,
            cache: "no-store"
        }
    );

    const text = await response.text();

    console.log(
        "Worker status:",
        response.status
    );

    console.log(
        "Worker response:",
        text
    );

    let result;

    try {
        result = JSON.parse(text);
    } catch (e) {
        throw new Error(
            "Worker trả về dữ liệu không hợp lệ."
        );
    }

    if (!response.ok) {
        throw new Error(
            result.error ||
            result.message ||
            "Upload R2 thất bại."
        );
    }

    console.log(
        "Upload R2 thành công:",
        result
    );

    return result;
}
