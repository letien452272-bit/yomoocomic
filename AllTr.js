if(typeof updateUserMenu === "function"){
    updateUserMenu();
}

var allComicList = document.getElementById("allTrComicList");
var pagination = document.getElementById("pagination");
var statusFilter = document.getElementById("statusFilter");
var sortSelect = document.getElementById("sortSelect");

var mangas = [];
var currentPage = 1;
var itemsPerPage = 25;

function getSupabase(){
    return window.supabaseClient || null;
}

function getChapterNumber(manga){
    return Number(manga.latestChapter || 0);
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
        .select("*")
        .order("created_at", { ascending: false });

    if(result.error){
        console.log("Lỗi mangas:", result.error);
        allComicList.innerHTML = "<p>Lỗi tải truyện từ Supabase.</p>";
        return;
    }

    mangas = result.data || [];

    await loadLatestChapters();

    renderAllMangas();
}

async function loadLatestChapters(){
    var db = getSupabase();

    if(!db || mangas.length === 0){
        return;
    }

    var result = await db
        .from("chapters")
        .select("manga_id, number");

    if(result.error){
        console.log("Lỗi chapters:", result.error);
        return;
    }

    var chapters = result.data || [];

    mangas.forEach(function(manga){
        var maxChapter = 0;

        chapters.forEach(function(chapter){
            if(Number(chapter.manga_id) === Number(manga.id)){
                var num = Number(chapter.number) || 0;

                if(num > maxChapter){
                    maxChapter = num;
                }
            }
        });

        manga.latestChapter = maxChapter;
    });
}

function getFilteredMangas(){
    var list = mangas.slice();

    if(statusFilter && statusFilter.value !== ""){
        list = list.filter(function(manga){
            return String(manga.status || "") === String(statusFilter.value);
        });
    }

    if(sortSelect){
        if(sortSelect.value === "newest"){
            list.sort(function(a, b){
                return new Date(b.updated_at || b.created_at || 0) -
                       new Date(a.updated_at || a.created_at || 0);
            });
        }

        if(sortSelect.value === "view"){
            list.sort(function(a, b){
                return Number(b.views || 0) - Number(a.views || 0);
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

        if(pagination){
            pagination.innerHTML = "";
        }

        return;
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
                            ${manga.views || 0}
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

loadMangas();