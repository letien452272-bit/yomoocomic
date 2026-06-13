function isAdminEmail(email){
    return String(email || "").toLowerCase() === "letien.452272@gmail.com";
}

function getCommentDisplayName(user){
    if(!user){
        return "Khách";
    }

    if(isAdminEmail(user.email)){
        return "Admin";
    }

    if(typeof getDisplayName === "function"){
        return getDisplayName(user);
    }

    return user.username || user.name || user.email || "Người dùng";
}

async function requireLoginToRead(){
    var currentUser = null;

    if(typeof getCurrentUser === "function"){
        currentUser = await getCurrentUser();
    }

    if(!currentUser){
        try{
            currentUser = JSON.parse(localStorage.getItem("currentUser")) ||
                          JSON.parse(localStorage.getItem("loginUser")) ||
                          JSON.parse(localStorage.getItem("loggedInUser"));
        }catch(e){
            currentUser = null;
        }
    }

    if(!currentUser){
        alert("Bạn cần đăng nhập để đọc truyện.");
        localStorage.setItem("redirectAfterLogin", "DTR.html");
        window.location.href = "Loging.html";
        return false;
    }

    return true;
}

async function startReader(){
    var canRead = await requireLoginToRead();

    if(!canRead){
        throw new Error("Chưa đăng nhập, không cho đọc truyện.");
    }

    if(typeof updateUserMenu === "function"){
        updateUserMenu();
    }

    loadReaderData();
}

var mangaId = Number(localStorage.getItem("currentMangaId"));
var chapterId = Number(localStorage.getItem("currentChapterId"));

var manga = null;
var chapters = [];
var chapter = null;
var chapterIndex = -1;

if(!mangaId || !chapterId){
    alert("Không tìm thấy truyện hoặc chương!");
    window.location.href = "CW.html";
}

async function loadReaderData(){

    var mangaResult = await supabase
        .from("mangas")
        .select("*")
        .eq("id", mangaId)
        .single();

    if(mangaResult.error || !mangaResult.data){
        console.log(mangaResult.error);
        alert("Không tìm thấy truyện trong Supabase!");
        window.location.href = "CW.html";
        return;
    }

    manga = mangaResult.data;

    var chapterResult = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("number", { ascending:true });

    if(chapterResult.error || !chapterResult.data){
        console.log(chapterResult.error);
        alert("Lỗi tải chapter từ Supabase!");
        window.location.href = "TD.html?id=" + mangaId;
        return;
    }

    chapters = chapterResult.data || [];

    chapterIndex = chapters.findIndex(function(item){
        return Number(item.id) === Number(chapterId);
    });

    if(chapterIndex === -1){
        alert("Không tìm thấy chương!");
        window.location.href = "TD.html?id=" + mangaId;
        return;
    }

    chapter = chapters[chapterIndex];

    saveReadingProgress();
    renderChapter();
    setupChapterButtons();
    setupViewCount();
    setupReportBox();
    setupScrollButtons();
    renderComments();
}

function saveReadingProgress(){
    var readingProgress = JSON.parse(localStorage.getItem("readingProgress")) || {};
    readingProgress[mangaId] = chapterId;
    localStorage.setItem("readingProgress", JSON.stringify(readingProgress));
}

function getImageUrl(img){
    if(!img){
        return "";
    }

    if(typeof img === "string"){
        var text = img.trim();

        try{
            var parsed = JSON.parse(text);

            if(parsed && typeof parsed === "object"){
                return parsed.url || parsed.data || parsed.src || "";
            }
        }catch(e){
            return text;
        }
    }

    if(typeof img === "object"){
        return img.url || img.data || img.src || "";
    }

    return "";
}

function isAutoYomooImage(img){
    var url = getImageUrl(img).toLowerCase();
    var name = "";
    var type = "";

    if(typeof img === "string"){
        try{
            var parsed = JSON.parse(img);
            name = (parsed.name || "").toLowerCase();
            type = (parsed.type || "").toLowerCase();
        }catch(e){
            name = img.toLowerCase();
        }
    }

    if(typeof img === "object" && img){
        name = (img.name || "").toLowerCase();
        type = (img.type || "").toLowerCase();
    }

    return (
        url.includes("image/7.png") ||
        url.includes("image/8.png") ||
        name.includes("7.png") ||
        name.includes("8.png") ||
        name.includes("yomoo-start") ||
        name.includes("yomoo-end") ||
        name.includes("yomoo đầu") ||
        name.includes("yomoo cuối") ||
        type.includes("auto-start") ||
        type.includes("auto-end")
    );
}

function createChapterImageWrap(src, alt, extraClass){
    var wrap = document.createElement("div");

    if(extraClass){
        wrap.className = "chapter-image-wrap " + extraClass;
    }else{
        wrap.className = "chapter-image-wrap";
    }

    var image = document.createElement("img");
    image.src = src;
    image.alt = alt || "";
    image.loading = "lazy";

    wrap.appendChild(image);

    return wrap;
}

function renderChapter(){
    var chapterTitle = document.getElementById("chapterTitle");
    var chapterImages = document.getElementById("chapterImages");

    if(chapterTitle){
        chapterTitle.textContent = (manga.title || "Không tên") + " - Chapter " + (chapter.number || "");
    }

    if(!chapterImages){
        return;
    }

    chapterImages.innerHTML = "";

    var images = Array.isArray(chapter.images) ? chapter.images : [];

    images = images.filter(function(img){
        var url = getImageUrl(img);

        if(!url){
            return false;
        }

        return !isAutoYomooImage(img);
    });

    if(images.length === 0){
        chapterImages.innerHTML = "<p>Chương này chưa có ảnh.</p>";
        return;
    }

    var topBanner = createChapterImageWrap(
        "Image/7.png",
        "YOMOO đầu truyện",
        "chapter-auto-banner"
    );

    chapterImages.appendChild(topBanner);

    images.forEach(function(img){
        var imageUrl = getImageUrl(img);

        if(!imageUrl){
            return;
        }

        var wrap = createChapterImageWrap(
            imageUrl,
            manga.title || "",
            ""
        );

        chapterImages.appendChild(wrap);
    });

    var bottomBanner = createChapterImageWrap(
        "Image/8.png",
        "YOMOO cuối truyện",
        "chapter-auto-banner"
    );

    chapterImages.appendChild(bottomBanner);

    if(chapterImages.innerHTML.trim() === ""){
        chapterImages.innerHTML = "<p>Chương này chưa có ảnh.</p>";
    }
}

function setupChapterButtons(){

    var prevChapter = document.getElementById("prevChapter");
    var nextChapter = document.getElementById("nextChapter");
    var chapterListBtn = document.getElementById("chapterListBtn");

    var bottomPrevChapter = document.getElementById("bottomPrevChapter");
    var bottomNextChapter = document.getElementById("bottomNextChapter");
    var bottomChapterListBtn = document.getElementById("bottomChapterListBtn");

    function goPrev(){
        if(chapterIndex > 0){
            var prev = chapters[chapterIndex - 1];
            localStorage.setItem("currentChapterId", prev.id);
            window.location.href = "DTR.html";
        }
    }

    function goNext(){
        if(chapterIndex < chapters.length - 1){
            var next = chapters[chapterIndex + 1];
            localStorage.setItem("currentChapterId", next.id);
            window.location.href = "DTR.html";
        }
    }

    function goList(btn){

        var oldMenu = document.getElementById("quickChapterMenu");

        if(oldMenu){
            oldMenu.remove();
            return;
        }

        var menu = document.createElement("div");
        menu.id = "quickChapterMenu";
        menu.className = "quick-chapter-menu";

        var sortedChapters = chapters.slice().sort(function(a, b){
            return Number(b.number) - Number(a.number);
        });

        menu.innerHTML = sortedChapters.map(function(chap){
            var active = Number(chap.id) === Number(chapterId) ? "active" : "";

            return `
                <button class="${active}" data-id="${chap.id}">
                    Chapter ${chap.number} ${chap.title ? "- " + chap.title : ""}
                </button>
            `;
        }).join("");

        document.body.appendChild(menu);

        var rect = btn.getBoundingClientRect();

        menu.style.position = "absolute";
        menu.style.top = (window.scrollY + rect.bottom + 6) + "px";
        menu.style.left = (window.scrollX + rect.left) + "px";

        menu.querySelectorAll("button").forEach(function(btn){
            btn.onclick = function(){
                localStorage.setItem("currentChapterId", this.dataset.id);
                window.location.href = "DTR.html";
            };
        });
    }

    function disableBtn(btn){
        if(!btn){
            return;
        }

        btn.style.opacity = "0.5";
        btn.style.cursor = "not-allowed";

        btn.onclick = function(e){
            e.preventDefault();
        };
    }

    if(chapterListBtn){
        chapterListBtn.onclick = function(e){
            e.preventDefault();
            goList(chapterListBtn);
        };
    }

    if(bottomChapterListBtn){
        bottomChapterListBtn.onclick = function(e){
            e.preventDefault();
            goList(bottomChapterListBtn);
        };
    }

    if(prevChapter){
        prevChapter.onclick = function(e){
            e.preventDefault();
            goPrev();
        };

        if(chapterIndex === 0){
            disableBtn(prevChapter);
        }
    }

    if(bottomPrevChapter){
        bottomPrevChapter.onclick = function(e){
            e.preventDefault();
            goPrev();
        };

        if(chapterIndex === 0){
            disableBtn(bottomPrevChapter);
        }
    }

    if(nextChapter){
        nextChapter.onclick = function(e){
            e.preventDefault();
            goNext();
        };

        if(chapterIndex === chapters.length - 1){
            disableBtn(nextChapter);
        }
    }

    if(bottomNextChapter){
        bottomNextChapter.onclick = function(e){
            e.preventDefault();
            goNext();
        };

        if(chapterIndex === chapters.length - 1){
            disableBtn(bottomNextChapter);
        }
    }
}

function setupViewCount(){
    var viewKey = "viewed_" + mangaId + "_" + chapterId;

    setTimeout(async function(){
        if(localStorage.getItem(viewKey)){
            return;
        }

        localStorage.setItem(viewKey, "true");

        var currentViews = Number(manga.views || 0) + 1;

        var result = await supabase
            .from("mangas")
            .update({
                views: currentViews
            })
            .eq("id", mangaId);

        if(result.error){
            console.log("Lỗi tăng view:", result.error);
            return;
        }

        manga.views = currentViews;
    }, 10000);
}

function setupReportBox(){
    var reportBtn = document.getElementById("reportBtn");
    var reportBox = document.getElementById("reportBox");
    var reportType = document.getElementById("reportType");
    var reportNote = document.getElementById("reportNote");
    var sendReport = document.getElementById("sendReport");
    var closeReport = document.getElementById("closeReport");

    function getReportList(){
        return JSON.parse(localStorage.getItem("reportList")) || [];
    }

    function saveReportList(list){
        localStorage.setItem("reportList", JSON.stringify(list));
    }

    if(reportBtn && reportBox){
        reportBtn.onclick = function(){
            reportBox.classList.add("show");
        };
    }

    if(closeReport && reportBox){
        closeReport.onclick = function(){
            reportBox.classList.remove("show");
        };
    }

    if(sendReport){
        sendReport.onclick = function(){
            var reports = getReportList();

            reports.push({
                id: Date.now(),
                mangaId: manga.id,
                chapterId: chapter.id,
                mangaTitle: manga.title || "Không tên",
                chapterName: "Chapter " + (chapter.number || ""),
                type: reportType.value,
                note: reportNote.value.trim(),
                status: "Chưa xử lý",
                createdAt: new Date().toLocaleString("vi-VN")
            });

            saveReportList(reports);

            reportNote.value = "";
            reportBox.classList.remove("show");

            alert("Đã gửi báo lỗi. Cảm ơn bạn!");
        };
    }
}

function setupScrollButtons(){
    var scrollTopBtn = document.getElementById("scrollTopBtn");
    var scrollBottomBtn = document.getElementById("scrollBottomBtn");

    if(scrollTopBtn){
        scrollTopBtn.onclick = function(){
            window.scrollTo({
                top:0,
                behavior:"smooth"
            });
        };
    }

    if(scrollBottomBtn){
        scrollBottomBtn.onclick = function(){
            window.scrollTo({
                top:document.documentElement.scrollHeight,
                behavior:"smooth"
            });
        };
    }
}

async function getCurrentCommentUser(){
    var user = null;

    if(typeof getCurrentUser === "function"){
        user = await getCurrentUser();
    }

    if(!user){
        try{
            user = JSON.parse(localStorage.getItem("currentUser")) ||
                   JSON.parse(localStorage.getItem("loginUser")) ||
                   JSON.parse(localStorage.getItem("loggedInUser"));
        }catch(e){
            user = null;
        }
    }

    if(!user){
        return {
            username:"Khách",
            name:"Khách",
            email:"",
            avatar:"Image/user.svg",
            role:"user"
        };
    }

    var displayName = getCommentDisplayName(user);

    return {
        username: displayName,
        name: displayName,
        email: user.email || "",
        avatar: user.avatar || "Image/user.svg",
        role: isAdminEmail(user.email) ? "admin" : (user.role || "user")
    };
}

async function sendCommentNow(){
    var commentInput = document.getElementById("commentInput");

    if(!commentInput){
        return;
    }

    var text = commentInput.value.trim();

    if(text === ""){
        alert("Vui lòng nhập bình luận!");
        return;
    }

    var user = await getCurrentCommentUser();

    var comments = JSON.parse(localStorage.getItem("mangaComments")) || {};
    var key = "manga_" + mangaId;

    if(!comments[key]){
        comments[key] = [];
    }

    comments[key].push({
        id: Date.now(),
        mangaId: mangaId,
        chapterId: chapterId,
        chapterNumber: chapter ? chapter.number : "",
        text: text,
        userName: user.username || user.name || "Khách",
        userEmail: user.email || "",
        role: user.role || "user",
        avatar: user.avatar || "Image/user.svg",
        createdAt: new Date().toLocaleString("vi-VN"),
        from: "DTR"
    });

    localStorage.setItem("mangaComments", JSON.stringify(comments));

    commentInput.value = "";
    renderComments();
}

function renderComments(){
    var commentList = document.getElementById("commentList");

    if(!commentList){
        return;
    }

    var comments = JSON.parse(localStorage.getItem("mangaComments")) || {};
    var key = "manga_" + mangaId;
    var list = comments[key] || [];

    if(list.length === 0){
        commentList.innerHTML = "<p>Chưa có bình luận nào.</p>";
        return;
    }

    commentList.innerHTML = list.slice().reverse().map(function(item){

        var name = item.userName || "Khách";
        var email = String(item.userEmail || "").toLowerCase();
        var role = item.role || "user";

        if(isAdminEmail(email) || role === "admin"){
            name = "Admin";
        }

        var adminBadge = "";

        if(isAdminEmail(email) || role === "admin"){
            adminBadge = `<span class="admin-badge">ADMIN</span>`;
        }

        return `
            <div class="comment-item">
                <img class="comment-avatar" src="${item.avatar || "Image/user.svg"}" alt="">
                <div>
                    <b>${name}</b>
                    ${adminBadge}
                    ${item.chapterNumber ? `<span>Chapter ${item.chapterNumber}</span>` : ""}
                    <p>${item.text}</p>
                    <small>${item.createdAt}</small>
                </div>
            </div>
        `;
    }).join("");
}

startReader();
