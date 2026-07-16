var mangaId = Number(localStorage.getItem("currentMangaId"));
var editChapterId = localStorage.getItem("editChapterId");

const R2_UPLOAD_URL = atob("aHR0cHM6Ly9kYXJrLXNub3ctOTcxMS5sZXRpZW4tNDUyMjcyLndvcmtlcnMuZGV2");

if(!mangaId){
    alert("Không tìm thấy ID truyện!");
    window.location.href = "Danhsach.html";
}

var manga = null;

var pageTitle = document.getElementById("pageTitle");
var chapterNumber = document.getElementById("chapterNumber");
var chapterTitle = document.getElementById("chapterTitle");
var chapterStatus = document.getElementById("chapterStatus");
var scheduleTime = document.getElementById("scheduleTime");
var chapterImages = document.getElementById("chapterImages");
var imagePreview = document.getElementById("imagePreview");
var uploadBox = document.getElementById("uploadBox");
var uploadError = document.getElementById("uploadError");
var saveChapterBtn = document.getElementById("saveChapterBtn");

var chapterImageList = [];
var isImageUploading = false;

async function initPage(){

    var mangaResult = await supabase
        .from("mangas")
        .select("*")
        .eq("id", mangaId)
        .single();

    if(mangaResult.error || !mangaResult.data){
        console.log(mangaResult.error);
        alert("Không tìm thấy truyện trong Supabase!");
        window.location.href = "Danhsach.html";
        return;
    }

    manga = mangaResult.data;

    if(editChapterId){
        await loadEditChapter();
    }else{
        pageTitle.innerText = "Thêm Chapter Mới - " + manga.title;
    }
}

async function loadEditChapter(){

    var result = await supabase
        .from("chapters")
        .select("*")
        .eq("id", editChapterId)
        .single();

    if(result.error || !result.data){
        console.log(result.error);
        alert("Không tìm thấy chapter cần sửa!");
        localStorage.removeItem("editChapterId");
        pageTitle.innerText = "Thêm Chapter Mới - " + manga.title;
        return;
    }

    var editingChapter = result.data;

    pageTitle.innerText = "Sửa Chapter - " + manga.title;

    chapterNumber.value = editingChapter.number || "";
    chapterTitle.value = editingChapter.title || "";

    chapterImageList = (editingChapter.images || []).map(function(img, index){

        if(typeof img === "string"){
            try{
                img = JSON.parse(img);
            }catch(e){
                img = {
                    name: "Ảnh " + (index + 1),
                    url: img,
                    order: index + 1
                };
            }
        }

        return {
            id: index + 1,
            name: img.name || "Ảnh " + (index + 1),
            url: img.url,
            preview: img.url,
            order: img.order || index + 1,
            old: true
        };
    });

    renderPreview();
}

if(uploadBox && chapterImages){
    uploadBox.onclick = function(e){
        if(e.target && e.target.id === "chapterImages"){
            return;
        }

        chapterImages.click();
    };
}

if(uploadBox){
    uploadBox.ondragover = function(e){
        e.preventDefault();
        uploadBox.classList.add("dragging");
    };

    uploadBox.ondragleave = function(e){
        e.preventDefault();
        uploadBox.classList.remove("dragging");
    };

    uploadBox.ondrop = function(e){
        e.preventDefault();
        uploadBox.classList.remove("dragging");

        var files = Array.from(e.dataTransfer.files || []);
        handleFiles(files);
    };
}

if(chapterImages){
    chapterImages.onchange = function(){
        var files = Array.from(chapterImages.files || []);
        handleFiles(files);
    };
}

function getFileOrder(fileName){
    var name = fileName.toLowerCase();
    var matches = name.match(/\d+/g);

    if(!matches){
        return 999999;
    }

    return Number(matches[matches.length - 1]);
}

function setSaveButtonLoading(isLoading, text){
    if(!saveChapterBtn){
        return;
    }

    if(isLoading){
        saveChapterBtn.disabled = true;
        saveChapterBtn.innerHTML = text || "Đang xử lý...";
    }else{
        saveChapterBtn.disabled = false;
        saveChapterBtn.innerHTML = '<img src="Image/disk.svg" alt=""> Lưu';
    }
}

function handleFiles(files){

    if(files.length === 0){
        return;
    }

    files.sort(function(a, b){
        var orderA = getFileOrder(a.name);
        var orderB = getFileOrder(b.name);

        if(orderA !== orderB){
            return orderA - orderB;
        }

        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });

    var validFiles = files.filter(function(file){
        var name = file.name.toLowerCase();

        return file.type === "image/webp" ||
               file.type === "image/avif" ||
               file.type === "image/jpeg" ||
               file.type === "image/png" ||
               name.endsWith(".webp") ||
               name.endsWith(".avif") ||
               name.endsWith(".jpg") ||
               name.endsWith(".jpeg") ||
               name.endsWith(".png");
    });

    if(validFiles.length !== files.length){
        alert("Chỉ được upload file ảnh WEBP, AVIF, JPG hoặc PNG!");

        if(chapterImages){
            chapterImages.value = "";
        }

        return;
    }

    chapterImageList = validFiles.map(function(file, index){
        return {
            id: Date.now() + index,
            name: file.name,
            file: file,
            preview: URL.createObjectURL(file),
            order: index + 1,
            fileOrder: getFileOrder(file.name),
            old: false
        };
    });

    renderPreview();
}

function renderPreview(){
    if(uploadError){
        uploadError.style.display = "none";
    }

    if(chapterImageList.length === 0){
        imagePreview.innerHTML = "";
        return;
    }

    imagePreview.innerHTML = chapterImageList.map(function(img, index){
        return `
            <div class="preview-item">
                <span>${index + 1}</span>
                <img src="${img.preview || img.url}" alt="Lỗi Ảnh" onerror="this.replaceWith(document.createTextNode('Lỗi Ảnh'))">
                <p>${img.name}</p>
            </div>
        `;
    }).join("");
}

function loadImageFromFile(file){
    return new Promise(function(resolve, reject){
        var img = new Image();

        img.onload = function(){
            resolve(img);
        };

        img.onerror = function(){
            reject(new Error("Không đọc được ảnh: " + file.name));
        };

        img.src = URL.createObjectURL(file);
    });
}

function canvasToBlob(canvas, type, quality){
    return new Promise(function(resolve){
        canvas.toBlob(function(blob){
            resolve(blob);
        }, type, quality);
    });
}

/* ================== WATERMARK ẢNH CHAPTER ==================
   ĐÃ XÓA LOGO GIỮA ẢNH
   CHỈ GIỮ LOGO Ở GÓC TRÊN BÊN PHẢI
=========================================================== */

async function addWatermarkToImage(file){

    var img = await loadImageFromFile(file);

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    var logo = new Image();

    await new Promise(function(resolve, reject){

        logo.onload = resolve;

        logo.onerror = function(){
            reject(new Error("Không tìm thấy Image/LOGO WEB.png"));
        };

        logo.src = "Image/LOGO WEB.png";
    });

    /*
        Logo góc trên bên phải.
        Không còn logo mờ ở giữa ảnh nữa.
    */

    var cornerLogoWidth = Math.min(170, canvas.width * 0.2);
    var cornerLogoHeight = logo.height * (cornerLogoWidth / logo.width);

    var padding = Math.max(12, canvas.width * 0.018);

    ctx.save();

    ctx.globalAlpha = 0.55;

    ctx.drawImage(
        logo,
        canvas.width - cornerLogoWidth - padding,
        padding,
        cornerLogoWidth,
        cornerLogoHeight
    );

    ctx.restore();

    var blob = await canvasToBlob(
        canvas,
        "image/webp",
        0.92
    );

    var newName =
        file.name.replace(/\.[^/.]+$/, "") +
        "-watermark.webp";

    return new File(
        [blob],
        newName,
        {
            type: "image/webp"
        }
    );
}

async function uploadFileToR2(file, options){

    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", "chapter");
    formData.append("mangaId", options.mangaId);
    formData.append("chapterNumber", options.chapterNumber);

    var response = await fetch(R2_UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    if(!response.ok){
        var errorText = await response.text();
        throw new Error("Upload R2 thất bại: " + errorText);
    }

    var data = await response.json();

    if(!data.url){
        throw new Error("Worker không trả về URL ảnh!");
    }

    return data.url;
}

async function uploadChapterImages(number){

    var uploadedImages = [];

    chapterImageList.sort(function(a, b){
        return a.order - b.order;
    });

    for(var i = 0; i < chapterImageList.length; i++){

        var item = chapterImageList[i];

        if(item.old && item.url){
            uploadedImages.push(JSON.stringify({
                name: item.name,
                url: item.url,
                order: i + 1
            }));

            continue;
        }

        setSaveButtonLoading(true, "Đang đóng dấu ảnh " + (i + 1) + "/" + chapterImageList.length + "...");

        try{
            var watermarkedFile = await addWatermarkToImage(item.file);

            setSaveButtonLoading(true, "Đang upload ảnh " + (i + 1) + "/" + chapterImageList.length + " lên R2...");

            var imageUrl = await uploadFileToR2(watermarkedFile, {
                mangaId: mangaId,
                chapterNumber: number
            });

            uploadedImages.push(JSON.stringify({
                name: watermarkedFile.name,
                url: imageUrl,
                order: i + 1
            }));

        }catch(error){
            alert("Lỗi xử lý/upload ảnh: " + error.message);
            console.log(error);
            return null;
        }
    }

    return uploadedImages;
}

saveChapterBtn.onclick = async function(){

    if(isImageUploading){
        alert("Ảnh đang tải, vui lòng chờ hoàn tất.");
        return;
    }

    var number = chapterNumber.value.trim();

    if(number === ""){
        alert("Vui lòng nhập số chương!");
        return;
    }

    if(chapterImageList.length === 0){
        if(uploadError){
            uploadError.style.display = "block";
        }

        alert("Vui lòng upload ít nhất 1 ảnh!");
        return;
    }

    setSaveButtonLoading(true, "Đang lưu chapter...");

    var uploadedImages = await uploadChapterImages(number);

    if(!uploadedImages){
        setSaveButtonLoading(false);
        return;
    }

    var chapterData = {
        manga_id: mangaId,
        number: Number(number),
        title: chapterTitle.value.trim(),
        images: uploadedImages
    };

    console.log("CHAPTER DATA:", chapterData);

    var result;

    if(editChapterId){
        result = await supabase
            .from("chapters")
            .update(chapterData)
            .eq("id", editChapterId);
    }else{
        result = await supabase
            .from("chapters")
            .insert([chapterData])
            .select();
    }

    console.log("INSERT RESULT:", result);

    if(result.error){
        console.log(result.error);
        alert("Lỗi lưu chapter: " + result.error.message);
        setSaveButtonLoading(false);
        return;
    }

    localStorage.removeItem("editChapterId");
    localStorage.removeItem("currentChapterId");

    alert("Đã lưu chapter thành công!");

    window.location.href = "Quanlytruyenchitiet.html";
};

initPage();

/* GIỚI HẠN PREVIEW ẢNH 3 HÀNG RỒI CUỘN */
var fixPreviewScrollStyle = document.createElement("style");

fixPreviewScrollStyle.innerHTML = `
    #imagePreview{
        display:grid !important;
        grid-template-columns:repeat(6, 1fr) !important;
        gap:14px !important;

        max-height:765px !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;

        padding-right:10px !important;
        box-sizing:border-box !important;
    }

    #imagePreview .preview-item{
        height:245px !important;
        overflow:hidden !important;
        box-sizing:border-box !important;
    }

    #imagePreview .preview-item img{
        width:100% !important;
        height:155px !important;
        object-fit:cover !important;
        display:block !important;
    }

    #imagePreview::-webkit-scrollbar{
        width:8px !important;
    }

    #imagePreview::-webkit-scrollbar-thumb{
        background:#4b5f7c !important;
        border-radius:10px !important;
    }

    #imagePreview::-webkit-scrollbar-track{
        background:#172033 !important;
        border-radius:10px !important;
    }

    @media screen and (max-width:768px){
        #imagePreview{
            grid-template-columns:repeat(2, 1fr) !important;
            max-height:765px !important;
        }
    }
`;

document.head.appendChild(fixPreviewScrollStyle);
