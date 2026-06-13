var ADMIN_EMAIL = "letien.452272@gmail.com";

var commentList = document.getElementById("commentList");
var emptyText = document.getElementById("emptyText");
var clearBtn = document.getElementById("clearComments");

var currentUser = null;
var mangaComments = {};
var allComments = [];
var myComments = [];

/* ================== CHECK ADMIN ================== */

function isAdminEmail(email){
    return String(email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
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

/* ================== USER SUPABASE ================== */

async function getCurrentCommentPageUser(){
    var user = null;

    if(typeof getCurrentUser === "function"){
        user = await getCurrentUser();
    }

    if(!user){
        user = JSON.parse(localStorage.getItem("currentUser")) ||
               JSON.parse(localStorage.getItem("loginUser")) ||
               JSON.parse(localStorage.getItem("loggedInUser"));
    }

    if(!user){
        return null;
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

/* ================== LOAD COMMENT ================== */

function loadAllComments(){
    mangaComments = JSON.parse(localStorage.getItem("mangaComments")) || {};
    allComments = [];

    Object.keys(mangaComments).forEach(function(key){
        var commentsInManga = mangaComments[key];

        if(Array.isArray(commentsInManga)){
            commentsInManga.forEach(function(cmt){
                allComments.push(cmt);
            });
        }
    });
}

function isMyComment(cmt){
    var myEmail = String(currentUser.email || "").toLowerCase();
    var cmtEmail = String(cmt.userEmail || "").toLowerCase();

    /*
        Cách mới: so bằng email là chuẩn nhất.
    */
    if(myEmail && cmtEmail && myEmail === cmtEmail){
        return true;
    }

    /*
        Cách cũ: comment cũ chưa có userEmail thì so bằng tên.
        Admin cũ có thể đã lưu là Admin.
    */
    var myName = String(currentUser.username || currentUser.name || "").toLowerCase();
    var cmtName = String(cmt.userName || "").toLowerCase();

    if(myName && cmtName && myName === cmtName){
        return true;
    }

    /*
        Nếu là admin, gom cả bình luận cũ đã lưu tên Admin.
    */
    if(isAdminEmail(myEmail) && cmtName === "admin"){
        return true;
    }

    return false;
}

function filterMyComments(){
    myComments = allComments.filter(function(cmt){
        return isMyComment(cmt);
    });
}

/* ================== RENDER ================== */

function renderMyComments(){
    if(!commentList){
        return;
    }

    commentList.innerHTML = "";

    if(myComments.length === 0){
        if(emptyText){
            emptyText.style.display = "block";
        }
        return;
    }

    if(emptyText){
        emptyText.style.display = "none";
    }

    myComments.slice().reverse().forEach(function(cmt){
        var div = document.createElement("div");
        div.className = "my-comment-item";

        var name = cmt.userName || currentUser.username || "Khách";
        var email = String(cmt.userEmail || "").toLowerCase();
        var role = cmt.role || "user";

        if(isAdminEmail(email) || role === "admin" || isAdminEmail(currentUser.email)){
            name = "Admin";
        }

        var adminBadge = "";

        if(isAdminEmail(email) || role === "admin" || isAdminEmail(currentUser.email)){
            adminBadge = `<span class="admin-badge">ADMIN</span>`;
        }

        var chapterText = "";

        if(cmt.chapterNumber){
            chapterText = "Chapter " + cmt.chapterNumber;
        }else{
            chapterText = "Trang chi tiết truyện";
        }

        div.innerHTML = `
            <div class="my-comment-top">
                <img src="${cmt.avatar || currentUser.avatar || 'Image/user.svg'}" alt="">

                <div>
                    <b>${name}</b>
                    ${adminBadge}
                    <p>Manga ID: ${cmt.mangaId || ""} - ${chapterText}</p>
                </div>
            </div>

            <div class="my-comment-content">
                ${cmt.text || ""}
            </div>

            <small class="my-comment-time">
                ${cmt.createdAt || ""}
            </small>
        `;

        commentList.appendChild(div);
    });
}

/* ================== CLEAR MY COMMENT ================== */

function clearMyComments(){
    if(!confirm("Bạn có chắc muốn xóa tất cả bình luận của mình không?")){
        return;
    }

    Object.keys(mangaComments).forEach(function(key){
        if(Array.isArray(mangaComments[key])){
            mangaComments[key] = mangaComments[key].filter(function(cmt){
                return !isMyComment(cmt);
            });
        }
    });

    localStorage.setItem("mangaComments", JSON.stringify(mangaComments));

    loadAllComments();
    filterMyComments();
    renderMyComments();
}

/* ================== START ================== */

async function startBinhLuanPage(){
    currentUser = await getCurrentCommentPageUser();

    if(!currentUser){
        alert("Bạn cần đăng nhập!");
        window.location.href = "Loging.html";
        return;
    }

    if(typeof updateUserMenu === "function"){
        updateUserMenu();
    }

    loadAllComments();
    filterMyComments();
    renderMyComments();

    if(clearBtn){
        clearBtn.onclick = clearMyComments;
    }
}

startBinhLuanPage();
