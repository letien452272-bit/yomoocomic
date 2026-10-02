const R2_WORKER_URL = "https://dark-snow-9711.letien-452272.workers.dev";

async function uploadFileToR2(file, options = {}) {

    if (!file) {
        throw new Error("Không có file để upload.");
    }

    // Lấy session hiện tại từ Supabase
    const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

    if (sessionError) {
        console.error("Lỗi lấy session:", sessionError);
        throw new Error("Không lấy được phiên đăng nhập.");
    }

    const session = sessionData?.session;

    if (!session || !session.access_token) {
        throw new Error("Bạn chưa đăng nhập");
    }

    const token = session.access_token;

    // Tên file
    const fileName =
        options.fileName ||
        file.name ||
        ("file-" + Date.now());

    // Đường dẫn R2
    const path =
        options.path ||
        fileName;

    // Tạo FormData
    const formData = new FormData();

    formData.append("file", file);
    formData.append("path", path);

    // Nếu có thêm các thông tin khác
    if (options.folder) {
        formData.append("folder", options.folder);
    }

    console.log("Đang upload R2:", path);

    // Gọi Worker
    const response = await fetch(
        "https://dark-snow-9711.yomoo.workers.dev/upload",
        {
            method: "POST",

            headers: {
                "Authorization": "Bearer " + token
            },

            body: formData
        }
    );

    const text = await response.text();

    let result;

    try {
        result = JSON.parse(text);
    } catch (e) {
        console.error("Worker trả về:", text);
        throw new Error("Worker trả về dữ liệu không hợp lệ.");
    }

    if (!response.ok) {
        console.error("Lỗi upload R2:", result);
        throw new Error(
            result.error ||
            result.message ||
            "Upload R2 thất bại."
        );
    }

    console.log("Upload R2 thành công:", result);

    return result;
}
