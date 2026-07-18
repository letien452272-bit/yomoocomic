const R2_WORKER_URL = "https://dark-snow-9711.letien-452272.workers.dev";

async function uploadFileToR2(file, options) {

    // Lấy session đăng nhập Supabase
    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error) {
        throw new Error("Không lấy được phiên đăng nhập: " + error.message);
    }

    if (!session || !session.access_token) {
        throw new Error("Bạn chưa đăng nhập.");
    }

    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", options.type);

    if (options.mangaId) {
        formData.append("mangaId", options.mangaId);
    }

    if (options.chapterNumber) {
        formData.append("chapterNumber", options.chapterNumber);
    }

    const response = await fetch(R2_WORKER_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session.access_token}`
        },
        body: formData
    });

    let data;

    try {
        data = await response.json();
    } catch (e) {
        throw new Error("Worker trả về dữ liệu không hợp lệ.");
    }

    if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
    }

    if (!data.success) {
        throw new Error(data.error || "Upload R2 thất bại");
    }

    return data.url;
}
