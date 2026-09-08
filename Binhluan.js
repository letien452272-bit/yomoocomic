var commentList = document.getElementById("commentList");
var emptyText = document.getElementById("emptyText");
var clearBtn = document.getElementById("clearComments");

var currentUser = null;
var mangaComments = {};
var allComments = [];
var myComments = [];

/* ================= ADMIN ================= */

/*
    Email admin được mã hóa Base64
    Không khai báo ADMIN_EMAIL global
    => tránh lỗi ADMIN_EMAIL is not defined
    => tránh lỗi ADMIN_EMAIL already been declared
*/

function isAdminEmail(email){
    var adminEmail = atob("bGV0aWVuLjQ1MjI3MkBnbWFpbC5jb20=");

    return String(email || "").toLowerCase() === adminEmail.toLowerCase();
}

/* ================= USER ================= */

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

    return user.username ||
           user.name ||
           user.email ||
           "Người dùng";
}


async function getCurrentCommentPageUser(){

    var user = null;

    /*
        Ưu tiên lấy user từ auth.js
    */
    if(typeof getCurrentUser === "function"){
        try{
            user = await getCurrentUser();
        }catch(error){
            console.log("Không lấy được user từ getCurrentUser:", error);
        }
    }

    /*
        Nếu không có thì lấy từ localStorage
    */
    if(!user){

        try{

            user =
                JSON.parse(localStorage.getItem("currentUser")) ||
                JSON.parse(localStorage.getItem("loginUser")) ||
                JSON.parse(localStorage.getItem("loggedInUser"));

        }catch(error){

            console.log("Lỗi đọc localStorage:", error);

            user = null;
        }
    }

    /*
        Không có user
    */
    if(!user){
        return null;
    }

    var displayName = getCommentDisplayName(user);

    return {

        username: displayName,

        name: displayName,

        email: user.email || "",

        avatar: user.avatar || "Image/user.svg",

        role: isAdminEmail(user.email)
            ? "admin"
            : (user.role || "user")
    };
}


/* ================= LOAD COMMENT ================= */

function loadAllComments(){

    try{

        mangaComments =
            JSON.parse(
                localStorage.getItem("mangaComments")
            ) || {};

    }catch(error){

        console.log("Lỗi đọc mangaComments:", error);

        mangaComments = {};
    }

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


/* ================= CHECK COMMENT CỦA TÔI ================= */

function isMyComment(cmt){

    if(!currentUser || !cmt){
        return false;
    }

    var myEmail =
        String(currentUser.email || "")
        .toLowerCase();

    var myName =
        String(
            currentUser.username ||
            currentUser.name ||
            ""
        )
        .toLowerCase();

    var cmtEmail =
        String(cmt.userEmail || "")
        .toLowerCase();

    var cmtName =
        String(cmt.userName || "")
        .toLowerCase();

    var cmtRole =
        String(cmt.role || "")
        .toLowerCase();


    /*
        Cách chính:
        So sánh bằng email
    */

    if(
        myEmail &&
        cmtEmail &&
        myEmail === cmtEmail
    ){
        return true;
    }


    /*
        Admin mới:
        Nếu tài khoản hiện tại là admin
        và comment có role admin
    */

    if(
        isAdminEmail(myEmail) &&
        cmtRole === "admin"
    ){
        return true;
    }


    /*
        Comment cũ:
        Nếu comment chưa có email
        thì so bằng tên
    */

    if(
        myName &&
        cmtName &&
        myName === cmtName
    ){
        return true;
    }


    /*
        Fix comment cũ của admin
        từng bị lưu thành "Khách"
    */

    if(

        isAdminEmail(myEmail) &&

        cmtName === "khách" &&

        !cmtEmail &&

        !cmtRole

    ){
        return true;
    }


    return false;
}


function filterMyComments(){

    myComments =
        allComments.filter(function(cmt){

            return isMyComment(cmt);

        });
}


/* ================= RENDER ================= */

function renderMyComments(){

    if(!commentList){
        return;
    }

    commentList.innerHTML = "";


    /*
        Không có comment
    */

    if(myComments.length === 0){

        if(emptyText){

            emptyText.style.display = "block";

            emptyText.innerText =
                "Bạn chưa có bình luận nào.";

        }

        return;
    }


    /*
        Có comment
    */

    if(emptyText){
        emptyText.style.display = "none";
    }


    myComments
        .slice()
        .reverse()
        .forEach(function(cmt){

            var div =
                document.createElement("div");

            div.className =
                "my-comment-item";


            /*
                Tên người bình luận
            */

            var name =
                cmt.userName ||
                currentUser.username ||
                "Khách";


            var email =
                String(
                    cmt.userEmail || ""
                ).toLowerCase();


            var role =
                String(
                    cmt.role || ""
                ).toLowerCase();


            /*
                Xác định comment của admin
            */

            var isAdminComment =
                isAdminEmail(email) ||
                role === "admin" ||
                isAdminEmail(currentUser.email);


            if(isAdminComment){
                name = "Admin";
            }


            /*
                Badge ADMIN
            */

            var adminBadge = "";

            if(isAdminComment){

                adminBadge =
                    `<span class="admin-badge">ADMIN</span>`;

            }


            /*
                Chapter
            */

            var chapterText = "";

            if(cmt.chapterNumber){

                chapterText =
                    "Chapter " +
                    cmt.chapterNumber;

            }else{

                chapterText =
                    "Trang chi tiết truyện";

            }


            /*
                Avatar
            */

            var avatar =
                cmt.avatar ||
                currentUser.avatar ||
                "Image/user.svg";


            /*
                Render
            */

            div.innerHTML = `

                <div class="my-comment-top">

                    <img
                        src="${avatar}"
                        alt=""
                    >

                    <div>

                        <b>${name}</b>

                        ${adminBadge}

                        <p>
                            Manga ID:
                            ${cmt.mangaId || ""}
                            -
                            ${chapterText}
                        </p>

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


/* ================= XÓA BÌNH LUẬN CÁ NHÂN ================= */

function clearMyComments(){

    if(
        !confirm(
            "Bạn có chắc muốn xóa tất cả bình luận của mình không?"
        )
    ){
        return;
    }


    Object.keys(mangaComments).forEach(function(key){

        if(Array.isArray(mangaComments[key])){

            mangaComments[key] =
                mangaComments[key].filter(function(cmt){

                    return !isMyComment(cmt);

                });

        }

    });


    /*
        Lưu lại localStorage
    */

    localStorage.setItem(
        "mangaComments",
        JSON.stringify(mangaComments)
    );


    /*
        Load lại
    */

    loadAllComments();

    filterMyComments();

    renderMyComments();
}


/* ================= START ================= */

async function startBinhLuanPage(){

    /*
        Lấy user hiện tại
    */

    currentUser =
        await getCurrentCommentPageUser();


    /*
        Không đăng nhập
    */

    if(!currentUser){

        alert("Bạn cần đăng nhập!");

        window.location.href =
            "Loging.html";

        return;
    }


    /*
        Cập nhật menu
    */

    if(typeof updateUserMenu === "function"){

        try{

            updateUserMenu();

        }catch(error){

            console.log(
                "Lỗi updateUserMenu:",
                error
            );

        }
    }


    /*
        Load comment
    */

    loadAllComments();

    filterMyComments();

    renderMyComments();


    /*
        Nút xóa tất cả comment
    */

    if(clearBtn){

        clearBtn.onclick =
            clearMyComments;

    }
}


/* ================= RUN ================= */

startBinhLuanPage();
