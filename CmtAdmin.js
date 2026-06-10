var adminCommentList = document.getElementById("adminCommentList");

function getUserComments(){
    return JSON.parse(localStorage.getItem("userComments")) || [];
}

function saveUserComments(list){
    localStorage.setItem("userComments", JSON.stringify(list));
}

function getChapterCommentKey(cmt){
    return "comments_" + cmt.mangaId + "_" + cmt.chapterId;
}

function deleteCommentFromChapter(targetComment){
    if(!targetComment) return;

    var keys = [
        "comments_" + targetComment.mangaId + "_" + targetComment.chapterId,
        "comments_" + targetComment.mangaId + "_TD"
    ];

    keys.forEach(function(key){
        var comments = JSON.parse(localStorage.getItem(key)) || [];

        comments = comments.filter(function(cmt){
            return Number(cmt.id) !== Number(targetComment.id);
        });

        localStorage.setItem(key, JSON.stringify(comments));
    });
}

function renderAdminComments(){
    if(!adminCommentList){
        return;
    }

    var comments = getUserComments();

    if(comments.length === 0){
        adminCommentList.innerHTML = `
            <div class="empty-notify">
                Chưa có bình luận nào.
            </div>
        `;
        return;
    }

    adminCommentList.innerHTML = comments.slice().reverse().map(function(cmt){
        var isChecked = cmt.status === "Đã xem";

        return `
            <div class="admin-report-item ${isChecked ? 'done' : 'unread'}">
                <h3>${cmt.name || "Khách"}</h3>

                <p>Truyện: ${cmt.mangaTitle || "Không rõ"}</p>
                <p>Chương: ${cmt.chapterName || "Không rõ"}</p>
                <p>Nội dung: ${cmt.text || ""}</p>
                <p>Thời gian: ${cmt.createdAt || "Không rõ"}</p>
                <p>Trạng thái: ${cmt.status || "Chưa xem"}</p>

                <div class="report-actions">
                    <button onclick="openCommentChapter(${cmt.mangaId}, ${cmt.chapterId})">
                        Mở chương
                    </button>

                    <button onclick="markCommentChecked(${cmt.id})">
                        Đã xem
                    </button>

                    <button class="delete-report" onclick="deleteComment(${cmt.id})">
                        Xóa
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function openCommentChapter(mangaId, chapterId){
    localStorage.setItem("currentMangaId", mangaId);
    localStorage.setItem("currentChapterId", chapterId);
    window.location.href = "DTR.html";
}

function markCommentChecked(id){
    var comments = getUserComments();

    comments.forEach(function(cmt){
        if(Number(cmt.id) === Number(id)){
            cmt.status = "Đã xem";
        }
    });

    saveUserComments(comments);
    renderAdminComments();
}

function deleteComment(id){
    var comments = getUserComments();

    var targetComment = comments.find(function(cmt){
        return Number(cmt.id) === Number(id);
    });

    comments = comments.filter(function(cmt){
        return Number(cmt.id) !== Number(id);
    });

    saveUserComments(comments);
    deleteCommentFromChapter(targetComment);

    renderAdminComments();
}

renderAdminComments();