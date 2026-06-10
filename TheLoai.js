updateUserMenu();

var allComicList = document.getElementById("allComicList");
var pageTitle = document.getElementById("pageTitle");
var statusFilter = document.getElementById("statusFilter");
var sortSelect = document.getElementById("sortSelect");

var params = new URLSearchParams(window.location.search);
var currentGenre = params.get("genre");
var currentSearch = params.get("search");
var currentStatusUrl = params.get("status");

var mangas = JSON.parse(localStorage.getItem("mangas")) || [];

if(currentStatusUrl && statusFilter){
    statusFilter.value = currentStatusUrl;
}

function normalizeText(text){
    return String(text || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");
}

function getChapterNumber(manga){
    if(manga.latestChapter !== undefined){
        return Number(manga.latestChapter) || 0;
    }

    if(manga.chapter !== undefined){
        return Number(manga.chapter) || 0;
    }

    if(manga.chapters && manga.chapters.length > 0){
        return manga.chapters.length;
    }

    return 0;
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getMangaStatus(manga){
    if(manga.status === "Đã hoàn thành" || manga.status === "Hoàn thành"){
        return "Đã hoàn thành";
    }

    return "Đang tiến hành";
}

function openMangaUser(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html";
}

function renderMangas(){
    if(!allComicList) return;

    var mangaList = mangas.slice();

    if(currentGenre){
        pageTitle.innerText = "THỂ LOẠI: " + currentGenre;

        mangaList = mangaList.filter(function(manga){
            var genres = manga.genres || [];

            return genres.some(function(genre){
                return normalizeText(genre) === normalizeText(currentGenre);
            });
        });
    }

    if(currentSearch){
        pageTitle.innerText = "TÌM KIẾM: " + currentSearch;

        var keyword = normalizeText(currentSearch);

        mangaList = mangaList.filter(function(manga){
            return normalizeText(manga.title || "").includes(keyword) ||
                   normalizeText(manga.originalName || "").includes(keyword) ||
                   normalizeText(manga.author || "").includes(keyword);
        });
    }

    if(currentStatusUrl){
        pageTitle.innerText = "TRUYỆN ĐÃ HOÀN THÀNH";

        mangaList = mangaList.filter(function(manga){
            return getMangaStatus(manga) === "Đã hoàn thành";
        });
    }

    if(!currentGenre && !currentSearch && !currentStatusUrl){
        pageTitle.innerText = "TẤT CẢ TRUYỆN";
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
                return (a.title || "").localeCompare(b.title || "");
            });
        }else{
            mangaList.sort(function(a, b){
                return new Date(b.updatedAt || b.createdAtISO || 0)
                     - new Date(a.updatedAt || a.createdAtISO || 0);
            });
        }
    }

    allComicList.innerHTML = "";

    if(mangaList.length === 0){
        allComicList.innerHTML = "<p>Không có truyện phù hợp.</p>";
        return;
    }

    mangaList.forEach(function(manga){
        var comic = document.createElement("div");
        comic.className = "comic";

        comic.innerHTML = `
            <div class="comic-cover">
                <img src="${manga.cover || 'Image/no-image.png'}" alt="">
            </div>

            <div class="comic-info">
                <h3>${manga.title || "Không tên"}</h3>

                <div class="comic-bottom">
                    <span>Chap ${getChapterNumber(manga)}</span>

                    <span class="comic-view">
                        <img src="Image/eye.svg" alt="">
                        ${getViewNumber(manga)}
                    </span>
                </div>
            </div>
        `;

        comic.onclick = function(){
            openMangaUser(manga.id);
        };

        allComicList.appendChild(comic);
    });
}

if(statusFilter){
    statusFilter.onchange = renderMangas;
}

if(sortSelect){
    sortSelect.onchange = renderMangas;
}

renderMangas();