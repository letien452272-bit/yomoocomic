var mangaForm = document.getElementById("mangaForm");
var saveExitBtn = document.getElementById("saveExitBtn");

var coverInput = document.getElementById("cover");
var coverPreview = document.getElementById("coverPreview");
var coverText = document.getElementById("coverText");

var selectedCoverFile = null;

var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";
var R2_PUBLIC_URL = "https://pub-feac672c19c646b4b97ff6a2ac5ce733.r2.dev";

coverInput.onchange = function(){

    var file = coverInput.files[0];

    if(!file){
        selectedCoverFile = null;
        coverPreview.src = "";
        coverPreview.style.display = "none";
        coverText.style.display = "block";
        return;
    }

    selectedCoverFile = file;

    coverPreview.src = URL.createObjectURL(file);
    coverPreview.style.display = "block";
    coverText.style.display = "none";
};

function makeSafeFileName(fileName){
    var ext = fileName.split(".").pop();
    return Date.now() + "-" + Math.random().toString(36).substring(2) + "." + ext;
}

async function uploadFileToR2(file, options){

    var folder = options.type || "files";
    var fileName = makeSafeFileName(file.name);
    var r2Path = folder + "/" + fileName;

    var uploadUrl = R2_UPLOAD_URL + "/" + r2Path;

    var response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type
        }
    });

    if(!response.ok){
        throw new Error("Upload R2 thất bại!");
    }

    return R2_PUBLIC_URL + "/" + r2Path;
}

function setButtonsLoading(isLoading){
    var submitBtn = document.querySelector('button[type="submit"]');

    submitBtn.disabled = isLoading;
    saveExitBtn.disabled = isLoading;

    submitBtn.innerText = isLoading ? "Đang lưu..." : "Lưu";
    saveExitBtn.innerText = isLoading ? "Đang lưu..." : "Lưu & Thoát";
}

function resetForm(){
    mangaForm.reset();

    document.getElementById("year").value = "2026";
    document.getElementById("team").value = "Lion Team";

    selectedCoverFile = null;

    coverPreview.src = "";
    coverPreview.style.display = "none";
    coverText.style.display = "block";
}

async function saveManga(exitAfterSave){

    var title = document.getElementById("title").value.trim();

    if(title === ""){
        alert("Vui lòng nhập tên truyện!");
        return;
    }

    setButtonsLoading(true);

    var coverUrl = "";

    try{
        if(selectedCoverFile){
            coverUrl = await uploadFileToR2(selectedCoverFile, {
                type: "covers"
            });
        }
    }catch(error){
        alert("Lỗi upload ảnh bìa R2: " + error.message);
        setButtonsLoading(false);
        return;
    }

    var genres = [];

    document.querySelectorAll('input[name="genre"]:checked').forEach(function(item){
        genres.push(item.value);
    });

    var manga = {
        title: title,
        original_name: document.getElementById("originalName").value.trim(),
        author: document.getElementById("author").value.trim(),
        cover: coverUrl,
        description: document.getElementById("description").value.trim(),
        genres: genres,
        status: document.getElementById("status").value,
        views: 0,
        likes: 0,
        follows: 0
    };

    var result = await supabase
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

mangaForm.onsubmit = function(e){
    e.preventDefault();
    saveManga(false);
};

saveExitBtn.onclick = function(){
    saveManga(true);
};