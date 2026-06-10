var descText = document.getElementById("desc-text");
var descBtn = document.getElementById("desc-btn");

if(descText && descBtn){
    descBtn.onclick = function(){
        descText.classList.toggle("open");
        descBtn.innerText = descText.classList.contains("open") ? "Thu gọn" : "Xem thêm";
    };
}

var params = new URLSearchParams(window.location.search);
var mangaId = Number(params.get("id")) || Number(localStorage.getItem("currentMangaId"));

if(!mangaId){
    alert("Không tìm thấy truyện!");
    window.location.href = "CW.html";
}

localStorage.setItem("currentMangaId", mangaId);

var manga = null;
var mangas = [];

var commentPage = 1;
var commentsPerPage = 8;

async function loadMangaDetail(){

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
        .order("number", { ascending:false });

    if(chapterResult.error){
        console.log(chapterResult.error);
        alert("Lỗi tải chapter: " + chapterResult.error.message);
        manga.chapters = [];
    }else{
        manga.chapters = chapterResult.data || [];
    }

    var suggestResult = await supabase
        .from("mangas")
        .select("*")
        .neq("id", mangaId)
        .order("id", { ascending:false })
        .limit(5);

    if(suggestResult.error){
        console.log(suggestResult.error);
        mangas = [];
    }else{
        mangas = suggestResult.data || [];
    }

    renderMangaDetail();
    renderChapterList();
    renderSuggestMangas();
    setupContinueButton();
    setupFollowButton();
    setupRating();
    setupCommentButton();
    renderComments();
}

function formatDate(dateString){
    if(!dateString){
        return "Đang cập nhật";
    }

    var date = new Date(dateString);

    if(isNaN(date.getTime())){
        return dateString;
    }

    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();

    return day + "/" + month + "/" + year;
}

function getChapterNumber(targetManga){
    var m = targetManga || manga;

    if(m.chapters && m.chapters.length > 0){
        var max = 0;

        m.chapters.forEach(function(chapter){
            var num = Number(chapter.number) || 0;

            if(num > max){
                max = num;
            }
        });

        return max;
    }

    return Number(m.latestChapter || m.chapter || 0);
}

function renderMangaDetail(){

    document.getElementById("anhBia").src = manga.cover || "Image/LOGO WEB.png";
    document.getElementById("tenTruyen").textContent = manga.title || "Không tên";
    document.getElementById("tenGoc").textContent = manga.original_name || manga.originalName || "Đang cập nhật";
    document.getElementById("tacGia").textContent = manga.author || "Đang cập nhật";

    document.getElementById("capNhat").textContent =
        formatDate(manga.updated_at || manga.created_at);

    document.getElementById("luotThich").textContent = manga.likes || 0;
    document.getElementById("luotTheoDoi").textContent = manga.follows || 0;
    document.getElementById("luotXem").textContent = manga.views || manga.view || 0;

    var theLoaiTruyen = document.getElementById("theLoaiTruyen");

    if(theLoaiTruyen){
        if(manga.genres && manga.genres.length > 0){
            theLoaiTruyen.innerHTML = manga.genres.map(function(genre){
                return `<a href="TheLoai.html?genre=${encodeURIComponent(genre)}" class="genre-tag">${genre}</a>`;
            }).join("");
        }else{
            theLoaiTruyen.innerText = "Đang cập nhật";
        }
    }

    document.getElementById("trangThai").textContent = manga.status || "Đang tiến hành";
    document.getElementById("desc-text").textContent = manga.description || "Chưa có mô tả.";
}

function renderChapterList(){
    var chapterList = document.getElementById("chapterList");
    var chapters = manga.chapters || [];

    if(!chapterList) return;

    if(chapters.length === 0){
        chapterList.innerHTML = "<p>Chưa có chương nào.</p>";
        return;
    }

    var readingProgress = JSON.parse(localStorage.getItem("readingProgress")) || {};
    var currentReadingChapterId = Number(readingProgress[manga.id]);

    chapterList.innerHTML = "";

    chapters.forEach(function(chapter){
        var item = document.createElement("div");
        item.className = "chapter-item";

        var isReading = currentReadingChapterId === Number(chapter.id);

        item.innerHTML = `
            <span>
                Chapter ${chapter.number || ""}
                ${isReading ? '<span class="reading-mark">✨</span>' : ''}
            </span>
            <span>${chapter.title || ""}</span>
        `;

        item.onclick = function(){
            localStorage.setItem("currentChapterId", chapter.id);
            localStorage.setItem("currentMangaId", manga.id);
            window.location.href = "DTR.html";
        };

        chapterList.appendChild(item);
    });
}

function renderSuggestMangas(){
    var suggestList = document.getElementById("suggestList");

    if(!suggestList) return;

    if(mangas.length === 0){
        suggestList.innerHTML = "<p>Chưa có truyện đề xuất.</p>";
        return;
    }

    suggestList.innerHTML = mangas.map(function(item){
        return `
            <div class="suggest-item" onclick="openSuggestManga(${item.id})">
                <img src="${item.cover || 'Image/LOGO WEB.png'}" alt="">

                <div>
                    <h4>${item.title || "Không tên"}</h4>
                    <p>Ch. ${getChapterNumber(item)}</p>
                </div>
            </div>
        `;
    }).join("");
}

function openSuggestManga(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

function setupContinueButton(){
    var continueBtn = document.getElementById("continueBtn");

    if(!continueBtn) return;

    var readingProgress = JSON.parse(localStorage.getItem("readingProgress")) || {};
    var lastChapterId = readingProgress[manga.id];

    if(lastChapterId){
        continueBtn.style.display = "inline-flex";

        continueBtn.onclick = function(){
            localStorage.setItem("currentMangaId", manga.id);
            localStorage.setItem("currentChapterId", lastChapterId);
            window.location.href = "DTR.html";
        };
    }else{
        continueBtn.style.display = "none";
    }
}

var followBtn = document.getElementById("followBtn");

function getFollowList(){
    return JSON.parse(localStorage.getItem("followList")) || [];
}

function saveFollowList(list){
    localStorage.setItem("followList", JSON.stringify(list));
}

function getCurrentFollowItem(){
    var latest = getChapterNumber(manga);

    return {
        id: manga.id,
        title: manga.title || "Không tên",
        image: manga.cover || "Image/LOGO WEB.png",
        latestChapter: latest,
        seenChapter: latest,
        status: manga.status || "Đang tiến hành",
        followDate: new Date().toLocaleString("vi-VN"),
        updatedAt: manga.updated_at || manga.created_at || ""
    };
}

function isCurrentMangaFollowed(){
    var followList = getFollowList();

    return followList.some(function(item){
        return Number(item.id) === Number(manga.id);
    });
}

function updateFollowButton(){
    if(!followBtn) return;

    if(isCurrentMangaFollowed()){
        followBtn.classList.add("followed");

        followBtn.innerHTML = `
            <img src="Image/bookmark.svg" alt="">
            <span>Đã theo dõi</span>
        `;
    }else{
        followBtn.classList.remove("followed");

        followBtn.innerHTML = `
            <img src="Image/bookmark.svg" alt="">
            <span>Theo dõi</span>
        `;
    }
}

function setupFollowButton(){
    if(!followBtn) return;

    followBtn.onclick = function(){
        var followList = getFollowList();

        var index = followList.findIndex(function(item){
            return Number(item.id) === Number(manga.id);
        });

        if(index === -1){
            followList.push(getCurrentFollowItem());
        }else{
            followList.splice(index, 1);
        }

        saveFollowList(followList);
        updateFollowButton();
    };

    updateFollowButton();
}

function setupRating(){
    var ratingStars = document.querySelectorAll("#ratingStars span");
    var ratingText = document.getElementById("ratingText");

    function getRatings(){
        return JSON.parse(localStorage.getItem("mangaRatings")) || {};
    }

    function saveRatings(ratings){
        localStorage.setItem("mangaRatings", JSON.stringify(ratings));
    }

    function getCurrentRating(){
        var ratings = getRatings();
        return Number(ratings[manga.id]) || 0;
    }

    function renderRating(){
        var currentRating = getCurrentRating();

        ratingStars.forEach(function(star){
            var starValue = Number(star.getAttribute("data-star"));

            if(starValue <= currentRating){
                star.classList.add("active");
            }else{
                star.classList.remove("active");
            }
        });

        if(ratingText){
            ratingText.textContent = currentRating + "/5";
        }
    }

    if(ratingStars.length > 0){
        ratingStars.forEach(function(star){
            star.onclick = function(){
                var value = Number(this.getAttribute("data-star"));
                var ratings = getRatings();

                ratings[manga.id] = value;
                saveRatings(ratings);

                renderRating();
            };
        });

        renderRating();
    }
}

function setupCommentButton(){
    var sendComment = document.getElementById("sendComment");

    if(sendComment){
        sendComment.onclick = function(){
            sendCommentNow();
        };
    }
}

function getCurrentCommentUser(){
    var user = null;

    if(typeof getCurrentUser === "function"){
        user = getCurrentUser();
    }

    if(!user){
        user = JSON.parse(localStorage.getItem("currentUser")) ||
               JSON.parse(localStorage.getItem("loginUser")) ||
               JSON.parse(localStorage.getItem("loggedInUser"));
    }

    return user || {
        username:"Khách",
        name:"Khách",
        avatar:"Image/user.svg"
    };
}

function sendCommentNow(){
    var commentInput = document.getElementById("commentInput");

    if(!commentInput) return;

    var text = commentInput.value.trim();

    if(text === ""){
        alert("Vui lòng nhập bình luận!");
        return;
    }

    var user = getCurrentCommentUser();

    var comments = JSON.parse(localStorage.getItem("mangaComments")) || {};
    var key = "manga_" + mangaId;

    if(!comments[key]){
        comments[key] = [];
    }

    comments[key].push({
        id: Date.now(),
        mangaId: mangaId,
        chapterId: null,
        chapterNumber: "",
        text: text,
        userName: user.username || user.name || "Khách",
        avatar: user.avatar || "Image/user.svg",
        createdAt: new Date().toLocaleString("vi-VN"),
        from: "TD"
    });

    localStorage.setItem("mangaComments", JSON.stringify(comments));

    commentInput.value = "";

    commentPage = 1;
    renderComments();
}

function renderComments(){
    var commentList = document.getElementById("commentList");
    var commentPagination = document.getElementById("commentPagination");

    if(!commentList) return;

    var comments = JSON.parse(localStorage.getItem("mangaComments")) || {};
    var key = "manga_" + mangaId;

    var list = comments[key] || [];
    list = list.slice().reverse();

    var totalPages = Math.ceil(list.length / commentsPerPage);

    if(commentPage > totalPages){
        commentPage = totalPages || 1;
    }

    var start = (commentPage - 1) * commentsPerPage;
    var end = start + commentsPerPage;
    var pageItems = list.slice(start, end);

    if(pageItems.length === 0){
        commentList.innerHTML = "<p>Chưa có bình luận nào.</p>";
        if(commentPagination) commentPagination.innerHTML = "";
        return;
    }

    commentList.innerHTML = pageItems.map(function(item){
        return `
            <div class="comment-item">
                <img class="comment-avatar" src="${item.avatar || "Image/user.svg"}" alt="">

                <div class="comment-body">
                    <div class="comment-head">
                        <b>${item.userName || "Khách"}</b>
                        ${item.chapterNumber ? `<span>Chapter ${item.chapterNumber}</span>` : ""}
                    </div>

                    <p>${item.text}</p>
                    <small>${item.createdAt}</small>
                </div>
            </div>
        `;
    }).join("");

    renderCommentPagination(totalPages);
}

function renderCommentPagination(totalPages){
    var commentPagination = document.getElementById("commentPagination");

    if(!commentPagination) return;

    if(totalPages <= 1){
        commentPagination.innerHTML = "";
        return;
    }

    var html = "";

    for(var i = 1; i <= totalPages; i++){
        html += `
            <button class="${i === commentPage ? "active" : ""}"
                    type="button"
                    onclick="goCommentPage(${i})">
                ${i}
            </button>
        `;
    }

    commentPagination.innerHTML = html;
}

function goCommentPage(page){
    commentPage = page;
    renderComments();
}

loadMangaDetail();