document.addEventListener("DOMContentLoaded", function(){

    var commentInput = document.getElementById("commentInput");
    var sendCommentBtn = document.getElementById("sendComment");
    var commentList = document.getElementById("commentList");
    var commentPagination = document.getElementById("commentPagination");

    var mangaId = localStorage.getItem("currentMangaId");
    var chapterId = localStorage.getItem("currentChapterId");

    var commentKey = "comments_" + mangaId + "_" + chapterId;

    var currentPage = 1;
    var perPage = 30;

    function safeParse(key, fallback){
        try{
            return JSON.parse(localStorage.getItem(key)) || fallback;
        }catch(e){
            return fallback;
        }
    }

    function safeSave(key, value){
        try{
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        }catch(error){
            console.error("Không lưu được key:", key, error);
            return false;
        }
    }

    function getCurrentAccount(){
        var user = null;

        try{
            if(typeof getCurrentUser === "function"){
                user = getCurrentUser();
            }
        }catch(e){}

        if(!user){
            user = safeParse("currentUser", null);
        }

        if(!user){
            user = safeParse("loginUser", null);
        }

        if(!user){
            user = safeParse("loggedInUser", null);
        }

        return {
            name: user && (user.username || user.name || user.email) ? (user.username || user.name || user.email) : "Khách",
            avatar: user && (user.avatar || user.avatarUrl) ? (user.avatar || user.avatarUrl) : "Image/user.svg"
        };
    }

    function getMangaInfo(){
        var mangas = safeParse("mangas", []);

        var manga = mangas.find(function(item){
            return String(item.id) === String(mangaId);
        });

        if(!manga){
            return {
                title: "Không tên truyện",
                chapterName: "Chapter"
            };
        }

        var chapterName = "Chapter";

        if(manga.chapters && manga.chapters.length > 0){
            var chapter = manga.chapters.find(function(item){
                return String(item.id) === String(chapterId);
            });

            if(chapter){
                chapterName = "Chapter " + (chapter.number || "");
            }
        }

        return {
            title: manga.title || "Không tên truyện",
            chapterName: chapterName
        };
    }

    function getComments(){
        return safeParse(commentKey, []);
    }

    function getUserComments(){
        return safeParse("userComments", []);
    }

    function renderComments(){
        if(!commentList){
            return;
        }

        var comments = getComments();

        if(comments.length === 0){
            commentList.innerHTML = '<p class="no-comment">Chưa có bình luận nào.</p>';

            if(commentPagination){
                commentPagination.innerHTML = "";
            }

            return;
        }

        var reverse = comments.slice().reverse();
        var start = (currentPage - 1) * perPage;
        var pageData = reverse.slice(start, start + perPage);

        commentList.innerHTML = "";

        pageData.forEach(function(cmt){
            var item = document.createElement("div");
            item.className = "comment-item";

            item.innerHTML = `
                <img src="${cmt.avatar || 'Image/user.svg'}" alt="">

                <div>
                    <h4>${cmt.name || "Khách"}</h4>
                    <p>${cmt.text || ""}</p>
                    <span class="comment-time">${cmt.createdAt || ""}</span>
                </div>
            `;

            commentList.appendChild(item);
        });

        renderPagination(comments.length);
    }

    function renderPagination(total){
        if(!commentPagination){
            return;
        }

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
        if(!commentInput){
            alert("Không tìm thấy ô nhập bình luận.");
            return;
        }

        if(!mangaId || !chapterId){
            alert("Không tìm thấy truyện hoặc chương hiện tại.");
            return;
        }

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
            chapterId: chapterId,
            mangaTitle: manga.title,
            chapterName: manga.chapterName,
            name: account.name,
            avatar: account.avatar,
            text: text,
            createdAt: new Date().toLocaleString("vi-VN")
        };

        var comments = getComments();
        comments.push(newComment);

        if(comments.length > 100){
            comments = comments.slice(comments.length - 100);
        }

        var savedChapter = safeSave(commentKey, comments);

        var userComments = getUserComments();

        userComments.push({
            id: newComment.id,
            mangaId: newComment.mangaId,
            chapterId: newComment.chapterId,
            mangaTitle: newComment.mangaTitle,
            chapterName: newComment.chapterName,
            name: newComment.name,
            avatar: newComment.avatar,
            text: newComment.text,
            createdAt: newComment.createdAt
        });

        if(userComments.length > 100){
            userComments = userComments.slice(userComments.length - 100);
        }

        var savedUser = safeSave("userComments", userComments);

        if(!savedChapter || !savedUser){
            alert("Không lưu được bình luận vì localStorage gần đầy. Cần xóa bớt dữ liệu ảnh/chapter.");
            return;
        }

        console.log("Đã lưu bình luận vào:", commentKey);
        console.log("Danh sách bình luận hiện tại:", getComments());

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

    window.sendCommentNow = sendComment;

    renderComments();
});