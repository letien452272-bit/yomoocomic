document.addEventListener("DOMContentLoaded", function(){

    if(typeof updateUserMenu === "function"){
        updateUserMenu();
    }

    /* ẨN HEADER TRÊN MOBILE */
    if(window.matchMedia("(max-width: 768px)").matches){

        var headerLinks = document.querySelectorAll(".up-header h3 > a");

        headerLinks.forEach(function(link){
            var text = link.textContent.trim();

            if(text === "Trang Chủ" || text === "Đã Hoàn Thành"){
                link.style.display = "none";
            }
        });

        var searchBox = document.querySelector(".up-header .search");

        if(searchBox){
            searchBox.style.display = "none";
        }

        var userName = document.querySelector("#user-btn span:first-of-type");

        if(userName){
            userName.style.display = "none";
        }

    }

    /* MENU THỂ LOẠI */
    var genreBtn = document.getElementById("genre-btn");
    var genreDropdown = document.getElementById("genre-dropdown");
    var genreMenu = document.getElementById("genre-menu");
    var genreArrow = document.getElementById("genre-arrow");

    if(genreBtn && genreDropdown && genreMenu && genreArrow){
        genreBtn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();

            genreDropdown.classList.toggle("show");

            genreArrow.src = genreDropdown.classList.contains("show")
                ? "Image/angle-small-up.svg"
                : "Image/angle-small-down.svg";
        };

        genreDropdown.onclick = function(e){
            e.stopPropagation();
        };
    }

    /* MENU USER */
    var userBtn = document.getElementById("user-btn");
    var userDropdown = document.getElementById("user-dropdown");
    var userArrow = document.getElementById("user-arrow");

    if(userBtn && userDropdown && userArrow){
        userBtn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();

            userDropdown.classList.toggle("show");
            userArrow.textContent = userDropdown.classList.contains("show")
                ? "^"
                : "v";
        };

        userDropdown.onclick = function(e){
            e.stopPropagation();
        };
    }

    document.addEventListener("click", function(){

        if(genreDropdown){
            genreDropdown.classList.remove("show");
        }

        if(genreArrow){
            genreArrow.src = "Image/angle-small-down.svg";
        }

        if(userDropdown){
            userDropdown.classList.remove("show");
        }

        if(userArrow){
            userArrow.textContent = "v";
        }

    });

    updateFollowNotifyDot();

});

function updateFollowNotifyDot(){

    var followLink = document.querySelector('a[href="Theodoi.html"]');

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

            manga.chapters.forEach(function(chapter){

                var num = Number(chapter.number) || 0;

                if(num > maxChap){
                    maxChap = num;
                }

            });

        }

        var seen = Number(item.seenChapter || item.latestChapter || 0);

        if(maxChap > seen){
            hasNew = true;
        }

    });

    var oldDot = followLink.querySelector(".follow-menu-dot");

    if(hasNew){

        followLink.classList.add("follow-menu-link");

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