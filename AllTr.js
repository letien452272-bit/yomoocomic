if(typeof updateUserMenu === "function"){
    updateUserMenu();
}

var allComicList = document.getElementById("allTrComicList");
var pagination = document.getElementById("pagination");
var statusFilter = document.getElementById("statusFilter");
var sortSelect = document.getElementById("sortSelect");

var mangas = [];
var currentPage = 1;

function getSupabase(){
    return window.supabaseClient || window.supabase || null;
}

function getItemsPerPage(){
    if(window.innerWidth <= 768){
        return 15; // mobile: 3 cột x 5 hàng
    }

    return 28; // PC: 7 cột x 4 hàng
}

function normalizeText(text){
    return String(text || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getChapterNumber(manga){
    return Number(manga.latestChapter || manga.latest_chapter || 0);
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getUpdateScore(manga){
    return Number(manga.latestChapterId || 0);
}

function getUpdateTime(manga){
    var time =
        manga.latestChapterAt ||
        manga.updated_at ||
        manga.created_at ||
        "";

    var timeNumber = new Date(time).getTime();

    if(isNaN(timeNumber)){
        return 0;
    }

    return timeNumber;
}

function openManga(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

async function loadMangas(){
    if(!allComicList){
        return;
    }

    allComicList.innerHTML = "<p>Đang tải truyện...</p>";

    var db = getSupabase();

    if(!db){
        allComicList.innerHTML = "<p>Lỗi: Chưa load supabase.js trước AllTr.js.</p>";
        return;
    }

    var result = await db
        .from("mangas")
        .select("*");

    if(result.error){
        console.log("Lỗi mangas:", result.error);
        allComicList.innerHTML = "<p>Lỗi tải truyện từ Supabase.</p>";
        return;
    }

    mangas = result.data || [];

    await loadLatestChapters();

    sortByLatestUpdate(mangas);

    currentPage = 1;
    renderAllMangas();
}

async function loadLatestChapters(){
    var db = getSupabase();

    if(!db || mangas.length === 0){
        return;
    }

    var result = await db
        .from("chapters")
        .select("id, manga_id, number, created_at")
        .order("id", { ascending: false });

    if(result.error){
        console.log("Lỗi chapters:", result.error);

        mangas.forEach(function(manga){
            manga.latestChapter = Number(manga.latest_chapter || 0);
            manga.latestChapterId = 0;
            manga.latestChapterAt = manga.updated_at || manga.created_at || "";
        });

        return;
    }

    var chapters = result.data || [];
    var chapterInfo = {};

    chapters.forEach(function(chapter){

        var mangaId = chapter.manga_id;

        if(!chapterInfo[mangaId]){
            chapterInfo[mangaId] = {
                latestChapter: 0,
                latestChapterId: 0,
                latestChapterAt: ""
            };
        }

        var chapterNumber = Number(chapter.number) || 0;
        var chapterId = Number(chapter.id) || 0;
        var chapterTime = chapter.created_at || "";

        if(chapterNumber > chapterInfo[mangaId].latestChapter){
            chapterInfo[mangaId].latestChapter = chapterNumber;
        }

        /*
            Chap nào có ID lớn hơn thì là chap mới up sau.
            Cái này chắc hơn so với chỉ dùng số chapter.
        */
        if(chapterId > Number(chapterInfo[mangaId].latestChapterId || 0)){
            chapterInfo[mangaId].latestChapterId = chapterId;
            chapterInfo[mangaId].latestChapterAt = chapterTime;
        }
    });

    mangas.forEach(function(manga){

        var info = chapterInfo[manga.id];

        if(info){
            manga.latestChapter = info.latestChapter;
            manga.latestChapterId = info.latestChapterId;
            manga.latestChapterAt = info.latestChapterAt || manga.updated_at || manga.created_at || "";
        }else{
            manga.latestChapter = Number(manga.latest_chapter || 0);
            manga.latestChapterId = 0;
            manga.latestChapterAt = manga.updated_at || manga.created_at || "";
        }
    });
}

function sortByLatestUpdate(list){
    list.sort(function(a, b){

        var chapterIdB = getUpdateScore(b);
        var chapterIdA = getUpdateScore(a);

        if(chapterIdB !== chapterIdA){
            return chapterIdB - chapterIdA;
        }

        var timeB = getUpdateTime(b);
        var timeA = getUpdateTime(a);

        if(timeB !== timeA){
            return timeB - timeA;
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });
}

function getFilteredMangas(){
    var list = mangas.slice();

    if(statusFilter && statusFilter.value !== ""){
        list = list.filter(function(manga){
            return String(manga.status || "") === String(statusFilter.value);
        });
    }

    var sortValue = sortSelect ? normalizeText(sortSelect.value) : "";

    if(
        sortValue === "" ||
        sortValue === "default" ||
        sortValue === "mac dinh" ||
        sortValue === "newest" ||
        sortValue === "moi nhat"
    ){
        sortByLatestUpdate(list);
    }

    if(sortValue === "view"){
        list.sort(function(a, b){
            return getViewNumber(b) - getViewNumber(a);
        });
    }

    if(sortValue === "az"){
        list.sort(function(a, b){
            return String(a.title || "").localeCompare(String(b.title || ""));
        });
    }

    if(sortValue === "oldest"){
        list.sort(function(a, b){

            var chapterIdA = getUpdateScore(a);
            var chapterIdB = getUpdateScore(b);

            if(chapterIdA !== chapterIdB){
                return chapterIdA - chapterIdB;
            }

            return getUpdateTime(a) - getUpdateTime(b);
        });
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

        if(pagination){
            pagination.innerHTML = "";
        }

        return;
    }

    var itemsPerPage = getItemsPerPage();
    var totalPages = Math.ceil(list.length / itemsPerPage);

    if(currentPage > totalPages){
        currentPage = totalPages;
    }

    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    var pageItems = list.slice(start, end);

    allComicList.innerHTML = pageItems.map(function(manga){
        return `
            <div class="alltr-comic" onclick="openManga(${manga.id})">
                <div class="alltr-cover">
                    <img src="${manga.cover || 'Image/no-image.png'}" alt="">
                </div>

                <div class="alltr-info">
                    <h3>${manga.title || "Không tên"}</h3>

                    <div class="alltr-bottom">
                        <span class="alltr-chapter">
                            <span class="green-dot"></span>
                            Chapter ${getChapterNumber(manga)}
                        </span>

                        <span class="alltr-view">
                            <img src="Image/eye.svg" alt="">
                            ${getViewNumber(manga)}
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

    var itemsPerPage = getItemsPerPage();
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

window.addEventListener("resize", function(){
    currentPage = 1;
    renderAllMangas();
});

loadMangas();
