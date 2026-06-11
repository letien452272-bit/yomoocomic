var mangaForm = document.getElementById("mangaForm");
var saveExitBtn = document.getElementById("saveExitBtn");

var coverInput = document.getElementById("cover");
var coverPreview = document.getElementById("coverPreview");
var coverText = document.getElementById("coverText");

var selectedCoverFile = null;

var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";

if(coverInput){
    coverInput.onchange = function(){
        var file = coverInput.files[0];

        if(!file){
            selectedCoverFile = null;

            if(coverPreview){
                coverPreview.src = "";
                coverPreview.style.display = "none";
            }

            if(coverText){
                coverText.style.display = "block";
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

    var yearInput = document.getElementById("year");
    var teamInput = document.getElementById("team");

    if(yearInput){
        yearInput.value = "2026";
    }

    if(teamInput){
        teamInput.value = "Lion Team";
    }

    selectedCoverFile = null;

    if(coverPreview){
        coverPreview.src = "";
        coverPreview.style.display = "none";
    }

    if(coverText){
        coverText.style.display = "block";
    }
}

function getSupabase(){
    return window.supabaseClient || window.supabase || null;
}

function getInputValue(id){
    var input = document.getElementById(id);
    return input ? input.value.trim() : "";
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

    var coverUrl = "";

    try{
        if(selectedCoverFile){
            coverUrl = await uploadFileToR2(selectedCoverFile, {
                type: "cover"
            });
        }
    }catch(error){
        alert("Lỗi upload ảnh bìa R2: " + error.message);
        console.log(error);
        setButtonsLoading(false);
        return;
    }

    var genres = [];

    document.querySelectorAll('input[name="genre"]:checked').forEach(function(item){
        genres.push(item.value);
    });

    var statusInput = document.getElementById("status");

    var manga = {
        title: title,
        original_name: getInputValue("originalName"),
        author: getInputValue("author"),
        cover: coverUrl,
        description: getInputValue("description"),
        genres: genres,
        status: statusInput ? statusInput.value : "Đang tiến hành",
        views: 0,
        likes: 0,
        follows: 0
    };

    var result = await db
        .from("mangas")
        .insert([manga])
        .select()
        .single();

    setButtonsLoading(false);

    if(result.error){
        alert("Lỗi lưu truyện Supabase: " + result.error.message);
        console.log(result.error);
        return;
    }

    alert("Đã lưu truyện thành công!");

    if(exitAfterSave){
        window.location.href = "Danhsach.html";
    }else{
        resetForm();
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