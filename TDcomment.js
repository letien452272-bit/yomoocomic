document.addEventListener("DOMContentLoaded", function(){

    var commentInput = document.getElementById("commentInput");
    var sendCommentBtn = document.getElementById("sendComment");
    var commentList = document.getElementById("commentList");
    var commentPagination = document.getElementById("commentPagination");

    var mangaId = localStorage.getItem("currentMangaId");
    var currentPage = 1;
    var perPage = 30;

    function safeParse(key, fallback){
        try{
            return JSON.parse(localStorage.getItem(key)) || fallback;
        }catch(e){
            return fallback;
        }
    }

    function getCurrentAccount(){
        var user = null;

        if(typeof getCurrentUser === "function"){
            user = getCurrentUser();
        }

        if(!user) user = safeParse("currentUser", null);
        if(!user) user = safeParse("loginUser", null);
        if(!user) user = safeParse("loggedInUser", null);

        return {
            name: user?.username || user?.name || user?.email || "Khách",
            avatar: user?.avatar || user?.avatarUrl || "Image/user.svg"
        };
    }

    function getMangaInfo(){
        var mangas = safeParse("mangas", []);
        var manga = mangas.find(function(item){
            return String(item.id) === String(mangaId);
        });

        return manga || {
            title: "Không tên truyện"
        };
    }

    function getAllMangaComments(){
        var all = [];

        Object.keys(localStorage).forEach(function(key){
            if(key.startsWith("comments_" + mangaId + "_")){
                var comments = safeParse(key, []);

                comments.forEach(function(cmt){
                    all.push(cmt);
                });
            }
        });

        all.sort(function(a, b){
            return Number(b.id || 0) - Number(a.id || 0);
        });

        return all;
    }

    function saveMangaComment(comment){
        var key = "comments_" + mangaId + "_TD";
        var comments = safeParse(key, []);

        comments.push(comment);

        if(comments.length > 100){
            comments = comments.slice(comments.length - 100);
        }

        localStorage.setItem(key, JSON.stringify(comments));

        var userComments = safeParse("userComments", []);
        userComments.push(comment);

        if(userComments.length > 100){
            userComments = userComments.slice(userComments.length - 100);
        }

        localStorage.setItem("userComments", JSON.stringify(userComments));
    }

    function renderComments(){
        if(!commentList) return;

        var comments = getAllMangaComments();

        if(comments.length === 0){
            commentList.innerHTML = '<p class="no-comment">Chưa có bình luận nào.</p>';
            if(commentPagination) commentPagination.innerHTML = "";
            return;
        }

        var start = (currentPage - 1) * perPage;
        var pageData = comments.slice(start, start + perPage);

        commentList.innerHTML = "";

        pageData.forEach(function(cmt){
            var item = document.createElement("div");
            item.className = "comment-item";

            item.innerHTML = `
                <img src="${cmt.avatar || 'Image/user.svg'}" alt="">

                <div>
                    <h4>${cmt.name || "Khách"}</h4>
                    <p>${cmt.text || ""}</p>
                    <span class="comment-time">
                        ${cmt.chapterName || "Trang truyện"} · ${cmt.createdAt || ""}
                    </span>
                </div>
            `;

            commentList.appendChild(item);
        });

        renderPagination(comments.length);
    }

    function renderPagination(total){
        if(!commentPagination) return;

        var totalPage = Math.ceil(total / perPage);

        if(totalPage <= 1){
            commentPagination.innerHTML = "";
            return;
        }

        commentPagination.innerHTML = "";


        for(var i = 1; i <= totalPage; i++){
            var btn = document.createElement("button");
            btn.type = "button";
            btn.innerText = i;

            if(i === currentPage){
                btn.className = "active";
            }

            btn.onclick = function(){
                currentPage = Number(this.innerText);
                renderComments();
            };

            commentPagination.appendChild(btn);
        }
    }

    function sendComment(){
        var text = commentInput.value.trim();

        if(text === ""){
            alert("Bạn chưa nhập bình luận.");
            return;
        }

        var account = getCurrentAccount();
        var manga = getMangaInfo();

        var newComment = {
            id: Date.now(),
            mangaId: mangaId,
            chapterId: "TD",
            mangaTitle: manga.title || "Không tên truyện",
            chapterName: "Trang truyện",
            name: account.name,
            avatar: account.avatar,
            text: text,
            createdAt: new Date().toLocaleString("vi-VN")
        };

        saveMangaComment(newComment);

        commentInput.value = "";
        currentPage = 1;
        renderComments();
    }

    if(sendCommentBtn){
        sendCommentBtn.onclick = function(e){
            e.preventDefault();
            sendComment();
        };
    }

    renderComments();
});