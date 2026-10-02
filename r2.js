const R2_WORKER_URL = "https://dark-snow-9711.letien-452272.workers.dev";

async function uploadFileToR2(file, options = {}) {

    if (!file) {
        throw new Error("Không có file để upload.");
    }

    // ==============================
    // LẤY SESSION SUPABASE
    // ==============================

    const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError) {
        console.error("Lỗi lấy session:", sessionError);
        throw new Error("Không lấy được phiên đăng nhập.");
    }

    const session = sessionData?.session;

    if (!session || !session.access_token) {
        throw new Error("Bạn chưa đăng nhập.");
    }

    const token = session.access_token;

    console.log("Đã lấy được Supabase token.");

    // ==============================
    // TÊN FILE
    // ==============================

    const fileName =
        options.fileName ||
        file.name ||
        ("file-" + Date.now());

    // ==============================
    // ĐƯỜNG DẪN R2
    // ==============================

    const path =
        options.path ||
        fileName;

    // ==============================
    // FORMDATA
    // ==============================

    const formData = new FormData();

    formData.append("file", file);
    formData.append("path", path);

    if (options.folder) {
        formData.append("folder", options.folder);
    }

    console.log("Đang upload R2:", path);

    // ==============================
    // GỌI WORKER
    // ==============================

    const response = await fetch(
        R2_WORKER_URL + "/upload",
        {
            method: "POST",

            headers: {
                "Authorization": "Bearer " + token
            },

            body: formData
        }
    );

    const text = await response.text();

    console.log("R2 Worker response:", text);

    let result;

    try {
        result = JSON.parse(text);
    } catch (e) {
        console.error("Worker trả về không phải JSON:", text);
        throw new Error("Worker trả về dữ liệu không hợp lệ.");
    }

    // ==============================
    // KIỂM TRA LỖI
    // ==============================

    if (!response.ok) {

        console.error(
            "Upload R2 thất bại:",
            response.status,
            result
        );

        throw new Error(
            result.error ||
            result.message ||
            "Upload R2 thất bại."
        );
    }

    // ==============================
    // THÀNH CÔNG
    // ==============================

    console.log("Upload R2 thành công:", result);

    return result;
}
