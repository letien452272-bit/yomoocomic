if(typeof updateUserMenu === "function"){
    updateUserMenu();
}

var allComicList = document.getElementById("allComicList");
var pagination = document.getElementById("pagination");
var statusFilter = document.getElementById("statusFilter");
var sortSelect = document.getElementById("sortSelect");

var mangas = JSON.parse(localStorage.getItem("mangas")) || [];

var currentPage = 1;
var itemsPerPage = 25; // 5 dong, moi dong 5 truyen

function getChapterNumber(manga){
    if(manga.chapters && manga.chapters.length > 0){
        var max = 0;

        manga.chapters.forEach(function(chapter){
            var num = Number(chapter.number) || 0;
            if(num > max) max = num;
        });

        return max;
    }

    return Number(manga.latestChapter || manga.chapter || 0);
}

function openManga(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

function getFilteredMangas(){
    var list = mangas.slice();

    if(statusFilter && statusFilter.value !== ""){
        list = list.filter(function(manga){
            return manga.status === statusFilter.value;
        });
    }

    if(sortSelect){
        if(sortSelect.value === "newest"){
            list.sort(function(a, b){
                return new Date(b.updatedAt || b.createdAt || b.createdAtISO || 0) -
                       new Date(a.updatedAt || a.createdAt || a.createdAtISO || 0);
            });
        }

        if(sortSelect.value === "view"){
            list.sort(function(a, b){
                return Number(b.views || b.view || 0) - Number(a.views || a.view || 0);
            });
        }
    }

    return list;
}

function renderAllMangas(){
    if(!allComicList){
        return;
    }

    var list = getFilteredMangas();

    if(list.length === 0){
        allComicList.innerHTML = "<p>Chưa có truyện nào.</p>";
        if(pagination) pagination.innerHTML = "";
        return;
    }

    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    var pageItems = list.slice(start, end);

    allComicList.innerHTML = pageItems.map(function(manga){
        return `
            <div class="comic" onclick="openManga(${manga.id})">
                <div class="comic-cover">
                    <img src="${manga.cover || 'Image/no-image.png'}" alt="">
                </div>

                <div class="comic-info">
					<h3>${manga.title || "Không tên"}</h3>

					<div class="comic-bottom">

						<span class="chapter-status">
							<span class="green-dot"></span>
							Chapter ${getChapterNumber(manga)}
						</span>

						<span class="comic-view">
							<img src="Image/eye.svg" alt="">
							${manga.views || manga.view || 0}
						</span>

					</div>
				</div>
            </div>
        `;
    }).join("");

    renderPagination(list.length);
}

function renderPagination(totalItems){
    if(!pagination){
        return;
    }

    var totalPages = Math.ceil(totalItems / itemsPerPage);

    if(totalPages <= 1){
        pagination.innerHTML = "";
        return;
    }

    pagination.innerHTML = "";

    for(var i = 1; i <= totalPages; i++){
        var btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;

        if(i === currentPage){
            btn.className = "active";
        }

        btn.onclick = function(){
            currentPage = Number(this.innerText);
            renderAllMangas();
            window.scrollTo(0, 0);
        };

        pagination.appendChild(btn);
    }
}

if(statusFilter){
    statusFilter.onchange = function(){
        currentPage = 1;
        renderAllMangas();
    };
}

if(sortSelect){
    sortSelect.onchange = function(){
        currentPage = 1;
        renderAllMangas();
    };
}

renderAllMangas();