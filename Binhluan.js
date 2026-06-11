var currentUser = JSON.parse(localStorage.getItem("currentUser"));

if(!currentUser){
    alert("Bạn cần đăng nhập!");
    window.location.href = "Loging.html";
}

var commentList = document.getElementById("commentList");
var emptyText = document.getElementById("emptyText");
var clearBtn = document.getElementById("clearComments");

var mangaComments = JSON.parse(localStorage.getItem("mangaComments")) || {};

var allComments = [];

Object.keys(mangaComments).forEach(function(key){
    var commentsInManga = mangaComments[key];

    if(Array.isArray(commentsInManga)){
        commentsInManga.forEach(function(cmt){
            allComments.push(cmt);
        });
    }
});

var myComments = allComments.filter(function(cmt){
    return cmt.userName === currentUser.username;
});

function renderMyComments(){
    commentList.innerHTML = "";

    if(myComments.length === 0){
        emptyText.style.display = "block";
        return;
    }

    emptyText.style.display = "none";

    myComments.slice().reverse().forEach(function(cmt){
        var div = document.createElement("div");
        div.className = "my-comment-item";

        div.innerHTML = `
            <div class="my-comment-top">
                <img src="${cmt.avatar || currentUser.avatar || 'Image/user.svg'}" alt="">
                <div>
                    <b>${cmt.userName || currentUser.username}</b>
                    <p>Manga ID: ${cmt.mangaId || ""} - Chap ${cmt.chapterNumber || ""}</p>
                </div>
            </div>

            <div class="my-comment-content">
                ${cmt.text || ""}
            </div>
        `;

        commentList.appendChild(div);
    });
}

clearBtn.onclick = function(){
    if(!confirm("Bạn có chắc muốn xóa tất cả bình luận của mình không?")) return;

    Object.keys(mangaComments).forEach(function(key){
        if(Array.isArray(mangaComments[key])){
            mangaComments[key] = mangaComments[key].filter(function(cmt){
                return cmt.userName !== currentUser.username;
            });
        }
    });

    localStorage.setItem("mangaComments", JSON.stringify(mangaComments));

    myComments = [];
    renderMyComments();
};

renderMyComments();