var mangaForm = document.getElementById("mangaForm");
var saveExitBtn = document.getElementById("saveExitBtn");

var coverInput = document.getElementById("cover");
var coverPreview = document.getElementById("coverPreview");
var coverText = document.getElementById("coverText");

var selectedCoverFile = null;
var oldCoverUrl = "";

/* ================== XỬ LÝ THÊM / SỬA TRUYỆN ================== */

var urlParams = new URLSearchParams(window.location.search);
var editParam = urlParams.get("edit");

var editMangaId = editParam ? Number(editParam) : 0;
var isEditMode = !!editMangaId;

if(!isEditMode){
    localStorage.removeItem("editMangaId");
    localStorage.removeItem("editingMangaId");
}

if(isEditMode){
    localStorage.setItem("editMangaId", editMangaId);
}

/* ================== HÀM PHỤ ================== */

function getSupabase(){
    return window.supabaseClient || window.supabase || null;
}

function getInputValue(id){
    var input = document.getElementById(id);
    return input ? input.value.trim() : "";
}

function setInputValue(id, value){
    var input = document.getElementById(id);

    if(input){
        input.value = value || "";
    }
}

function updateStatusColor(){
    var statusInput = document.getElementById("status");

    if(!statusInput){
        return;
    }

    statusInput.classList.remove(
        "status-ongoing",
        "status-completed",
        "status-paused",
        "status-coming"
    );

    if(statusInput.value === "Đang tiến hành"){
        statusInput.classList.add("status-ongoing");
    }else if(statusInput.value === "Đã hoàn thành"){
        statusInput.classList.add("status-completed");
    }else if(statusInput.value === "Tạm ngưng"){
        statusInput.classList.add("status-paused");
    }else if(statusInput.value === "Sắp ra mắt"){
        statusInput.classList.add("status-coming");
    }
}

var statusInput = document.getElementById("status");

if(statusInput){
    statusInput.onchange = updateStatusColor;
}

/* ================== PREVIEW ẢNH BÌA ================== */

if(coverInput){
    coverInput.onchange = function(){
        var file = coverInput.files[0];

        if(!file){
            selectedCoverFile = null;

            if(coverPreview){
                coverPreview.src = oldCoverUrl || "";
                coverPreview.style.display = oldCoverUrl ? "block" : "none";
            }

            if(coverText){
                coverText.style.display = "block";
                coverText.innerText = oldCoverUrl ? "Ảnh bìa hiện tại" : "Chưa chọn ảnh";
            }

            return;
        }

        selectedCoverFile = file;

        if(coverPreview){
            coverPreview.src = URL.createObjectURL(file);
            coverPreview.style.display = "block";
        }

        if(coverText){
            coverText.style.display = "none";
        }
    };
}

/* ================== UPLOAD R2 ================== */

async function uploadFileToR2(file, options = {}) {

    if(!file){
        throw new Error("Không có file để upload.");
    }

    var db = getSupabase();

    if(!db){
        throw new Error("Supabase chưa được kết nối.");
    }

    /* =========================
       LẤY SESSION ĐĂNG NHẬP
    ========================= */

    var sessionResult = await db.auth.getSession();

    if(sessionResult.error){
        console.error("Lỗi lấy session:", sessionResult.error);
        throw new Error("Không lấy được phiên đăng nhập.");
    }

    var session =
        sessionResult.data &&
        sessionResult.data.session;

    if(!session || !session.access_token){
        throw new Error("Bạn chưa đăng nhập.");
    }

    var token = session.access_token;

    console.log("Đã lấy được Supabase access token.");

    /* =========================
       TẠO FORM DATA
    ========================= */

    var formData = new FormData();

    formData.append("file", file);

    formData.append(
        "type",
        options.type || "cover"
    );

    if(options.mangaId){
        formData.append(
            "mangaId",
            String(options.mangaId)
        );
    }

    if(options.chapterNumber){
        formData.append(
            "chapterNumber",
            String(options.chapterNumber)
        );
    }

    console.log(
        "Đang upload R2:",
        file.name,
        options.type
    );

    /* =========================
       GỌI CLOUDFLARE WORKER
    ========================= */

    var response = await fetch(
        R2_UPLOAD_URL,
        {
            method: "POST",

            headers: {
                "Authorization": "Bearer " + token
            },

            body: formData
        }
    );

    var text = await response.text();

    var data = null;

    try{
        data = JSON.parse(text);
    }catch(e){
        console.error(
            "Worker trả về không phải JSON:",
            text
        );

        throw new Error(
            "Worker trả về dữ liệu không hợp lệ."
        );
    }

    /* =========================
       KIỂM TRA LỖI WORKER
    ========================= */

    if(!response.ok){

        console.error(
            "Upload R2 thất bại:",
            response.status,
            data
        );

        throw new Error(
            data.error ||
            data.message ||
            "Upload R2 thất bại."
        );
    }

    if(!data.url){
        console.error(
            "Worker không trả URL:",
            data
        );

        throw new Error(
            "Worker không trả về URL ảnh."
        );
    }

    console.log(
        "Upload R2 thành công:",
        data.url
    );

    return data.url;
}
/* ================== BUTTON LOADING ================== */

function setButtonsLoading(isLoading){
    var submitBtn = document.querySelector('button[type="submit"]');

    if(submitBtn){
        submitBtn.disabled = isLoading;
        submitBtn.innerText = isLoading ? "Đang lưu..." : "Lưu";
    }

    if(saveExitBtn){
        saveExitBtn.disabled = isLoading;
        saveExitBtn.innerText = isLoading ? "Đang lưu..." : "Lưu & Thoát";
    }
}

/* ================== THỂ LOẠI ================== */

function normalizeMangaGenres(genres){
    if(typeof genres === "string"){
        try{
            genres = JSON.parse(genres);
        }catch(e){
            genres = genres.split(",").map(function(item){
                return item.trim();
            });
        }
    }

    if(!Array.isArray(genres)){
        genres = [];
    }

    return genres.filter(function(item){
        return item && String(item).trim() !== "";
    });
}

function getGenres(){
    var genreBox = document.getElementById("genreCheckboxBox");

    if(genreBox && typeof getSelectedGenres === "function"){
        return getSelectedGenres("genreCheckboxBox");
    }

    var genres = [];

    document.querySelectorAll('input[name="genre"]:checked').forEach(function(item){
        genres.push(item.value);
    });

    return genres;
}

async function setGenres(genres){
    genres = normalizeMangaGenres(genres);

    var genreBox = document.getElementById("genreCheckboxBox");

    if(genreBox && typeof renderGenreCheckboxes === "function"){
        await renderGenreCheckboxes("genreCheckboxBox", genres);
        return;
    }

    document.querySelectorAll('input[name="genre"]').forEach(function(input){
        input.checked = genres.includes(input.value);
    });
}

/* ================== RESET FORM THÊM TRUYỆN ================== */

async function resetForm(){
    if(mangaForm){
        mangaForm.reset();
    }

    setInputValue("title", "");
    setInputValue("originalName", "");
    setInputValue("author", "");
    setInputValue("year", "2026");
    setInputValue("team", "Lion Team");
    setInputValue("chapter", "");
    setInputValue("description", "");

    selectedCoverFile = null;
    oldCoverUrl = "";

    if(coverInput){
        coverInput.value = "";
    }

    if(coverPreview){
        coverPreview.src = "";
        coverPreview.style.display = "none";
    }

    if(coverText){
        coverText.style.display = "block";
        coverText.innerText = "Chưa chọn ảnh";
    }

    var statusInput = document.getElementById("status");

    if(statusInput){
        statusInput.value = "Đang tiến hành";
    }

    await setGenres([]);

    updateStatusColor();
}

/* ================== LOAD DỮ LIỆU KHI SỬA ================== */

async function loadOldMangaData(){
    var db = getSupabase();

    if(!db){
        alert("Lỗi: Chưa load supabase.js trước ThemTr.js");
        return;
    }

    if(!editMangaId){
        alert("Không tìm thấy ID truyện cần sửa!");
        window.location.href = "Danhsach.html";
        return;
    }

    var result = await db
        .from("mangas")
        .select("*")
        .eq("id", editMangaId)
        .single();

    if(result.error || !result.data){
        alert("Không tải được thông tin truyện cũ!");
        console.log(result.error);
        return;
    }

    var manga = result.data;

    setInputValue("title", manga.title);
    setInputValue("originalName", manga.original_name);
    setInputValue("author", manga.author);
    setInputValue("year", manga.year || "");
    setInputValue("team", manga.team || "Lion Team");
    setInputValue("chapter", manga.latest_chapter || "");
    setInputValue("description", manga.description);

    var statusInput = document.getElementById("status");

    if(statusInput){
        statusInput.value = manga.status || "Đang tiến hành";
    }

    updateStatusColor();

    await setGenres(manga.genres);

    oldCoverUrl = manga.cover || "";

    if(oldCoverUrl && coverPreview){
        coverPreview.src = oldCoverUrl;
        coverPreview.style.display = "block";
    }

    if(coverText){
        coverText.style.display = "block";
        coverText.innerText = oldCoverUrl ? "Ảnh bìa hiện tại" : "Chưa chọn ảnh";
    }
}

/* ================== LƯU TRUYỆN ================== */

async function saveManga(exitAfterSave){
    var db = getSupabase();

    if(!db){
        alert("Lỗi: Chưa load supabase.js trước ThemTr.js");
        return;
    }

    var title = getInputValue("title");

    if(title === ""){
        alert("Vui lòng nhập tên truyện!");
        return;
    }

    setButtonsLoading(true);

    var coverUrl = oldCoverUrl;

    try{
        if(selectedCoverFile){
            coverUrl = await uploadFileToR2(selectedCoverFile, {
                type: "cover",
                mangaId: editMangaId || ""
            });
        }
    }catch(error){
        alert("Lỗi upload ảnh bìa R2: " + error.message);
        console.log(error);
        setButtonsLoading(false);
        return;
    }

    var statusInput = document.getElementById("status");

    var manga = {
        title: title,
        original_name: getInputValue("originalName"),
        author: getInputValue("author"),
        year: Number(getInputValue("year")) || null,
        team: getInputValue("team"),
        latest_chapter: getInputValue("chapter"),
        cover: coverUrl,
        description: getInputValue("description"),
        genres: getGenres(),
        status: statusInput ? statusInput.value : "Đang tiến hành"
    };

    var result;

    if(isEditMode){
        result = await db
            .from("mangas")
            .update(manga)
            .eq("id", editMangaId)
            .select()
            .single();
    }else{
        manga.views = 0;
        manga.likes = 0;
        manga.follows = 0;

        result = await db
            .from("mangas")
            .insert([manga])
            .select()
            .single();
    }

    setButtonsLoading(false);

    if(result.error){
        alert("Lỗi lưu truyện Supabase: " + result.error.message);
        console.log(result.error);
        return;
    }

    alert(isEditMode ? "Đã cập nhật truyện thành công!" : "Đã lưu truyện thành công!");

    if(exitAfterSave){
        localStorage.setItem("currentMangaId", result.data.id);

        if(isEditMode){
            window.location.href = "Quanlytruyenchitiet.html";
        }else{
            localStorage.removeItem("editMangaId");
            localStorage.removeItem("editingMangaId");
            window.location.href = "Danhsach.html";
        }

        return;
    }

    if(isEditMode){
        await loadOldMangaData();
    }else{
        await resetForm();
    }
}

/* ================== EVENT ================== */

if(mangaForm){
    mangaForm.onsubmit = function(e){
        e.preventDefault();
        saveManga(false);
    };
}

if(saveExitBtn){
    saveExitBtn.onclick = function(){
        saveManga(true);
    };
}

/* ================== KHỞI ĐỘNG TRANG ================== */

async function initThemTrPage(){
    if(typeof setupGenreBox === "function"){
        await setupGenreBox();
    }

    if(isEditMode){
        await loadOldMangaData();
    }else{
        await resetForm();
    }
}

initThemTrPage();
