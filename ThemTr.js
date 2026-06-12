var mangaForm = document.getElementById("mangaForm");
var saveExitBtn = document.getElementById("saveExitBtn");

var coverInput = document.getElementById("cover");
var coverPreview = document.getElementById("coverPreview");
var coverText = document.getElementById("coverText");

var selectedCoverFile = null;
var oldCoverUrl = "";

var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";

var urlParams = new URLSearchParams(window.location.search);
var editMangaId = Number(urlParams.get("edit")) || Number(localStorage.getItem("editMangaId"));
var isEditMode = !!editMangaId;

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
                coverText.style.display = oldCoverUrl ? "block" : "block";
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

async function uploadFileToR2(file, options){
    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", options.type);

    if(options.mangaId){
        formData.append("mangaId", options.mangaId);
    }

    if(options.chapterNumber){
        formData.append("chapterNumber", options.chapterNumber);
    }

    var response = await fetch(R2_UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    if(!response.ok){
        var errorText = await response.text();
        throw new Error(errorText || "Upload R2 thất bại!");
    }

    var data = await response.json();

    if(!data.url){
        throw new Error("Worker không trả về URL ảnh.");
    }

    return data.url;
}

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

function resetForm(){
    if(mangaForm){
        mangaForm.reset();
    }

    setInputValue("year", "2026");
    setInputValue("team", "Lion Team");
    setInputValue("chapter", "");

    selectedCoverFile = null;
    oldCoverUrl = "";

    if(coverPreview){
        coverPreview.src = "";
        coverPreview.style.display = "none";
    }

    if(coverText){
        coverText.style.display = "block";
        coverText.innerText = "Chưa chọn ảnh";
    }

    updateStatusColor();
}

function getGenres(){
    var genres = [];

    document.querySelectorAll('input[name="genre"]:checked').forEach(function(item){
        genres.push(item.value);
    });

    return genres;
}

function setGenres(genres){
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

    document.querySelectorAll('input[name="genre"]').forEach(function(input){
        input.checked = genres.includes(input.value);
    });
}

async function loadOldMangaData(){
    var db = getSupabase();

    if(!db){
        alert("Lỗi: Chưa load supabase.js trước ThemTr.js");
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
    setGenres(manga.genres);

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
        window.location.href = isEditMode ? "Quanlytruyenchitiet.html" : "Danhsach.html";
    }else{
        if(isEditMode){
            await loadOldMangaData();
        }else{
            resetForm();
        }
    }
}

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

if(isEditMode){
    loadOldMangaData();
}else{
    resetForm();
}