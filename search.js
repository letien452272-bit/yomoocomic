function updateFollowNotifyDot(){

    var followLink = document.querySelector(".follow-menu-link");

    if(!followLink) return;

    var followList = JSON.parse(localStorage.getItem("followList")) || [];
    var mangas = JSON.parse(localStorage.getItem("mangas")) || [];

    var hasNew = false;

    followList.forEach(function(item){

        var manga = mangas.find(function(m){
            return Number(m.id) === Number(item.id);
        });

        if(!manga) return;

        var maxChap = 0;

        if(manga.chapters && manga.chapters.length > 0){
            manga.chapters.forEach(function(ch){
                var num = Number(ch.number) || 0;

                if(num > maxChap){
                    maxChap = num;
                }
            });
        }

        var seenChap = Number(item.seenChapter || 0);

        if(maxChap > seenChap){
            hasNew = true;
        }

    });

    var oldDot = followLink.querySelector(".follow-menu-dot");

    if(hasNew){
        if(!oldDot){
            var dot = document.createElement("span");
            dot.className = "follow-menu-dot";
            followLink.appendChild(dot);
        }
    }else{
        if(oldDot){
            oldDot.remove();
        }
    }
}

function updateNotifyDot(){

    var dot = document.getElementById("notifyDot");

    if(!dot) return;

    var reports = JSON.parse(localStorage.getItem("reportList")) || [];

    var hasUnread = reports.some(function(item){
        return item.status !== "Đã xử lý";
    });

    dot.style.display = hasUnread ? "block" : "none";
}

function showNotifyOnlyAdmin(){

    var notifyLink = document.getElementById("notifyLink");

    if(!notifyLink) return;

    var user = null;

    if(typeof getCurrentUser === "function"){
        user = getCurrentUser();
    }

    if(!user){
        try{
            user = JSON.parse(localStorage.getItem("currentUser")) || null;
        }catch(e){}
    }

    if(!user || user.role !== "admin"){
        notifyLink.style.display = "none";
    }else{
        notifyLink.style.display = "block";
    }
}

function getCurrentUserForAdminMenu(){

    var user = null;

    try{
        if(typeof getCurrentUser === "function"){
            user = getCurrentUser();
        }
    }catch(e){}

    if(!user){
        try{
            user = JSON.parse(localStorage.getItem("currentUser")) || null;
        }catch(e){}
    }

    if(!user){
        try{
            user = JSON.parse(localStorage.getItem("loginUser")) || null;
        }catch(e){}
    }

    if(!user){
        try{
            user = JSON.parse(localStorage.getItem("loggedInUser")) || null;
        }catch(e){}
    }

    return user;
}

function showCommentAdminOnly(){

    var commentAdminLink = document.getElementById("commentAdminLink");

    if(!commentAdminLink) return;

    var user = getCurrentUserForAdminMenu();

    if(!user || user.role !== "admin"){
        commentAdminLink.style.display = "none";
    }else{
        commentAdminLink.style.display = "block";
    }
}

function updateCommentAdminDot(){

    var dot = document.getElementById("commentAdminDot");

    if(!dot) return;

    var comments = JSON.parse(localStorage.getItem("userComments")) || [];

    var hasUnread = comments.some(function(cmt){
        return cmt.status !== "Đã xem";
    });

    dot.style.display = hasUnread ? "block" : "none";
}

document.addEventListener("DOMContentLoaded", function(){

    updateFollowNotifyDot();
    updateNotifyDot();
    showNotifyOnlyAdmin();
    showCommentAdminOnly();
    updateCommentAdminDot();

    var searchInput = document.getElementById("searchInput");
    var searchBtn = document.getElementById("searchBtn");
    var searchBox = document.querySelector(".search");

    function searchManga(){

        if(!searchInput) return;

        var keyword = searchInput.value.trim();

        if(keyword === ""){
            return;
        }


        window.location.href = "TheLoai.html?search=" + encodeURIComponent(keyword);
    }

    if(searchBtn){
        searchBtn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();

            if(window.innerWidth <= 768 && searchBox){

                if(!searchBox.classList.contains("active")){
                    searchBox.classList.add("active");

                    setTimeout(function(){
                        searchInput.focus();
                    }, 100);

                    return;
                }

                if(searchInput.value.trim() === ""){
                    searchBox.classList.remove("active");
                    return;
                }

            }

            searchManga();
        };
    }

    if(searchInput){
        searchInput.onkeydown = function(e){
            if(e.key === "Enter"){
                e.preventDefault();
                e.stopPropagation();
                searchManga();
            }
        };
    }

});