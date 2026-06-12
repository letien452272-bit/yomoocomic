if(typeof updateUserMenu === "function"){
    updateUserMenu();
}

var allComicList = document.getElementById("allComicList");
var pageTitle = document.getElementById("pageTitle");
var pagination = document.getElementById("pagination");
var statusFilter = document.getElementById("statusFilter");
var sortSelect = document.getElementById("sortSelect");

var params = new URLSearchParams(window.location.search);
var currentGenre = params.get("genre");
var currentSearch = params.get("search");
var currentStatusUrl = params.get("status");

var mangas = [];
var currentPage = 1;
var itemsPerPage = window.innerWidth <= 768 ? 15 : 25;

if(currentStatusUrl && statusFilter){
    statusFilter.value = currentStatusUrl;
}

function getSupabase(){
    return window.supabaseClient || window.supabaseDB || window.supabase || null;
}

function normalizeText(text){
    return String(text || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d");
}

function parseGenres(genres){
    if(!genres){
        return [];
    }

    if(Array.isArray(genres)){
        return genres;
    }

    if(typeof genres === "string"){
        try{
            var parsed = JSON.parse(genres);
            if(Array.isArray(parsed)){
                return parsed;
            }
        }catch(e){}

        return genres.split(",").map(function(item){
            return item.trim();
        });
    }

    return [];
}

function getChapterNumber(manga){
    if(Array.isArray(manga.chapters) && manga.chapters.length > 0){
        var max = 0;

        manga.chapters.forEach(function(chapter){
            var num = Number(chapter.number) || 0;

            if(num > max){
                max = num;
            }
        });

        return max;
    }

    return Number(manga.latestChapter || manga.chapter || 0);
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getMangaStatus(manga){
    var status = String(manga.status || "").trim();

    if(status === "Đã hoàn thành" || status === "Hoàn thành"){
        return "Đã hoàn thành";
    }

    return "Đang tiến hành";
}

function getOriginalName(manga){
    return manga.original_name || manga.originalName || "";
}

function getDate(manga){
    return new Date(manga.updated_at || manga.created_at || 0);
}

function openMangaUser(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

async function loadMangasFromSupabase(){
    if(!allComicList){
        return;
    }

    allComicList.innerHTML = "<p>Đang tải truyện...</p>";

    var db = getSupabase();

    if(!db){
        allComicList.innerHTML = "<p>Lỗi: Chưa load supabase.js trước TheLoai.js.</p>";
        return;
    }

    try{
        var mangaResult = await db
            .from("mangas")
            .select("*")
            .order("created_at", { ascending: false });

        if(mangaResult.error){
            console.log("Lỗi mangas:", mangaResult.error);
            allComicList.innerHTML = "<p>Lỗi tải truyện: " + mangaResult.error.message + "</p>";
            return;
        }

        mangas = mangaResult.data || [];

        var chapterResult = await db
            .from("chapters")
            .select("manga_id, number");

        if(chapterResult.error){
            console.log("Lỗi chapters:", chapterResult.error);
        }

        var chapters = chapterResult.data || [];

        mangas.forEach(function(manga){
            manga.chapters = chapters.filter(function(chapter){
                return Number(chapter.manga_id) === Number(manga.id);
            });
        });

        currentPage = 1;
        renderMangas();

    }catch(error){
        console.log("Lỗi TheLoai.js:", error);
        allComicList.innerHTML = "<p>Lỗi JS: " + error.message + "</p>";
    }
}

function getFilteredMangas(){
    var mangaList = mangas.slice();

    if(currentGenre){
        if(pageTitle){
            pageTitle.innerText = "THỂ LOẠI: " + currentGenre;
        }

        mangaList = mangaList.filter(function(manga){
            var genres = parseGenres(manga.genres);

            return genres.some(function(genre){
                return normalizeText(genre) === normalizeText(currentGenre);
            });
        });
    }

    if(currentSearch){
        if(pageTitle){
            pageTitle.innerText = "TÌM KIẾM: " + currentSearch;
        }

        var keyword = normalizeText(currentSearch);

        mangaList = mangaList.filter(function(manga){
            return normalizeText(manga.title).includes(keyword) ||
                   normalizeText(getOriginalName(manga)).includes(keyword) ||
                   normalizeText(manga.author).includes(keyword);
        });
    }

    if(currentStatusUrl){
        if(pageTitle){
            pageTitle.innerText = "TRUYỆN ĐÃ HOÀN THÀNH";
        }

        mangaList = mangaList.filter(function(manga){
            return getMangaStatus(manga) === "Đã hoàn thành";
        });
    }

    if(!currentGenre && !currentSearch && !currentStatusUrl){
        if(pageTitle){
            pageTitle.innerText = "TẤT CẢ TRUYỆN";
        }
    }

    if(statusFilter && statusFilter.value !== ""){
        mangaList = mangaList.filter(function(manga){
            return getMangaStatus(manga) === statusFilter.value;
        });
    }

    if(sortSelect){
        if(sortSelect.value === "view"){
            mangaList.sort(function(a, b){
                return getViewNumber(b) - getViewNumber(a);
            });
        }else if(sortSelect.value === "chapter"){
            mangaList.sort(function(a, b){
                return getChapterNumber(b) - getChapterNumber(a);
            });
        }else if(sortSelect.value === "az"){
            mangaList.sort(function(a, b){
                return String(a.title || "").localeCompare(String(b.title || ""));
            });
        }else{
            mangaList.sort(function(a, b){
                return getDate(b) - getDate(a);
            });
        }
    }

    return mangaList;
}

function renderMangas(){
    if(!allComicList){
        return;
    }

    var mangaList = getFilteredMangas();

    if(mangaList.length === 0){
    allComicList.classList.add("empty-list");

    allComicList.innerHTML = `
        <p class="empty-message">
            Không có truyện phù hợp.
        </p>
    `;

        if(pagination){
            pagination.innerHTML = "";
        }

        return;
    }

    var start = (currentPage - 1) * itemsPerPage;
    var end = start + itemsPerPage;
    var pageItems = mangaList.slice(start, end);

    allComicList.innerHTML = pageItems.map(function(manga){
		allComicList.classList.remove("empty-list");
        return `
            <div class="comic" onclick="openMangaUser(${manga.id})">
                <div class="comic-cover">
                    <img src="${manga.cover || 'Image/no-image.png'}" alt="">
                </div>

                <div class="comic-info">
                    <h3>${manga.title || "Không tên"}</h3>

                    <div class="comic-bottom">
                        <span class="chapter-status">
                            <span class="green-dot"></span>
                            Chap ${getChapterNumber(manga)}
                        </span>

                        <span class="comic-view">
                            <img src="Image/eye.svg" alt="">
                            ${getViewNumber(manga)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    renderPagination(mangaList.length);
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
            renderMangas();
            window.scrollTo(0, 0);
        };

        pagination.appendChild(btn);
    }
}

if(statusFilter){
    statusFilter.onchange = function(){
        currentPage = 1;
        renderMangas();
    };
}

if(sortSelect){
    sortSelect.onchange = function(){
        currentPage = 1;
        renderMangas();
    };
}

loadMangasFromSupabase();