var followListBox = document.getElementById("followList");
var followPagination = document.getElementById("followPagination");

var currentPage = 1;
var perPage = 20;

function getFollowList(){
    return JSON.parse(localStorage.getItem("followList")) || [];
}

function saveFollowList(list){
    localStorage.setItem("followList", JSON.stringify(list));
}

function getMangas(){
    return JSON.parse(localStorage.getItem("mangas")) || [];
}

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

function getMangaById(id){
    var mangas = getMangas();

    return mangas.find(function(item){
        return Number(item.id) === Number(id);
    });
}

function enrichFollowList(){
    var list = getFollowList();

    list.forEach(function(item){
        var manga = getMangaById(item.id);

        if(manga){
            item.currentChapter = getChapterNumber(manga);
            item.newChapterCount = item.currentChapter - Number(item.seenChapter || item.latestChapter || 0);
            item.image = manga.cover || item.image || "Image/LOGO WEB.png";
            item.title = manga.title || item.title;
            item.status = manga.status || item.status || "Đang tiến hành";
            item.updatedAt = manga.updatedAt || manga.createdAtISO || manga.createdAt || "";
        }else{
            item.currentChapter = Number(item.latestChapter || 0);
            item.newChapterCount = 0;
        }
    });

    list.sort(function(a, b){
        if((b.newChapterCount || 0) !== (a.newChapterCount || 0)){
            return (b.newChapterCount || 0) - (a.newChapterCount || 0);
        }

        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    saveFollowList(list);

    return list;
}

function renderFollowList(){
    if(!followListBox) return;

    var list = enrichFollowList();

    if(list.length === 0){
        followListBox.innerHTML = `
            <div class="empty-follow">
                Bạn chưa theo dõi truyện nào.
            </div>
        `;

        if(followPagination){
            followPagination.innerHTML = "";
        }

        return;
    }

    var start = (currentPage - 1) * perPage;
    var pageItems = list.slice(start, start + perPage);

    followListBox.innerHTML = "";

    pageItems.forEach(function(truyen, index){
        var realIndex = start + index;

        var hasNew = Number(truyen.newChapterCount || 0) > 0;

        var chapterText = "Chưa có chap";

        if(Number(truyen.currentChapter || 0) > 0){
            chapterText = "Chapter " + truyen.currentChapter;
        }

        var item = document.createElement("div");
        item.className = "follow-item" + (hasNew ? " has-new-chapter" : "");

        item.innerHTML = `
            ${hasNew ? '<div class="new-chapter-badge">Mới</div>' : ''}

            <img class="follow-cover" src="${truyen.image || 'Image/LOGO WEB.png'}" alt="Ảnh truyện">

            <div class="follow-info">
                <h3>${truyen.title || "Không có tên"}</h3>
                <p>${chapterText}</p>
            </div>

            <div class="follow-actions">
                <button class="read-follow-btn" onclick="goToStory(${truyen.id})">
                    Đọc truyện
                </button>

                <button class="delete-follow-btn" onclick="removeFollow(${realIndex})">
                    Xóa
                </button>
            </div>
        `;

        followListBox.appendChild(item);
    });

    renderPagination(list.length);
}

function renderPagination(total){
    if(!followPagination) return;

    var totalPage = Math.ceil(total / perPage);

    if(totalPage <= 1){
        followPagination.innerHTML = "";
        return;
    }

    followPagination.innerHTML = "";

    for(var i = 1; i <= totalPage; i++){
        var btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = i;

        if(i === currentPage){
            btn.className = "active";
        }

        btn.onclick = function(){
            currentPage = Number(this.innerText);
            renderFollowList();
        };

        followPagination.appendChild(btn);
    }
}

function goToStory(id){
    var list = getFollowList();
    var manga = getMangaById(id);

    list.forEach(function(item){
        if(Number(item.id) === Number(id) && manga){
            item.seenChapter = getChapterNumber(manga);
            item.latestChapter = getChapterNumber(manga);
            item.newChapterCount = 0;
        }
    });

    saveFollowList(list);

    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

function removeFollow(index){
    var list = getFollowList();
    list.splice(index, 1);
    saveFollowList(list);
    renderFollowList();
}

function clearFollowList(){
    if(confirm("Bạn có chắc muốn xóa tất cả truyện theo dõi không?")){
        localStorage.removeItem("followList");
        renderFollowList();
    }
}

renderFollowList();
renderFollowList();