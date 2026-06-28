var mangaTableBody = document.getElementById("mangaTableBody"); 
var totalManga = document.getElementById("totalManga");
var showingText = document.getElementById("showingText");

var searchInput = document.getElementById("searchInput");
var searchBtn = document.getElementById("searchBtn");
var statusFilter = document.getElementById("statusFilter");
var activeFilter = document.getElementById("activeFilter");
var sortSelect = document.getElementById("sortSelect");

var paginationBox =
    document.getElementById("pagination") ||
    document.querySelector(".pagination") ||
    document.querySelector(".dataTables_paginate") ||
    document.querySelector(".table-pagination");
var mangas = [];
var filteredMangas = [];

var currentPage = 1;
var perPage = 10;

async function loadMangasFromSupabase(){

    var mangaResult = await supabase
        .from("mangas")
        .select("*")
        .order("id", { ascending: false });

    if(mangaResult.error){
        console.log(mangaResult.error);
        alert("Lỗi tải danh sách truyện: " + mangaResult.error.message);
        return;
    }

    var mangaList = mangaResult.data || [];

    var chapterResult = await supabase
        .from("chapters")
        .select("id, manga_id, created_at")
        .order("id", { ascending: false });

    var chapterList = [];

    if(chapterResult.error){
        console.log("Lỗi tải chapter:", chapterResult.error);

        /*
            Nếu bảng chapters lỗi quyền RLS hoặc thiếu cột,
            vẫn cho hiện danh sách truyện, chỉ để số chương = 0.
        */
        chapterList = [];
    }
    else {
        chapterList = chapterResult.data || [];
    }

    var chapterInfo = {};

    chapterList.forEach(function(chap){

        var mangaId = chap.manga_id;

        if(!chapterInfo[mangaId]){
            chapterInfo[mangaId] = {
                count: 0,
                latestChapterAt: "",
                latestChapterId: 0
            };
        }

        chapterInfo[mangaId].count++;

        var chapTime = chap.created_at || "";

        if(
            !chapterInfo[mangaId].latestChapterAt ||
            new Date(chapTime).getTime() > new Date(chapterInfo[mangaId].latestChapterAt).getTime()
        ){
            chapterInfo[mangaId].latestChapterAt = chapTime;
            chapterInfo[mangaId].latestChapterId = chap.id;
        }

        if(Number(chap.id) > Number(chapterInfo[mangaId].latestChapterId || 0)){
            chapterInfo[mangaId].latestChapterId = chap.id;
        }
    });

    mangas = mangaList.map(function(manga){

        var info = chapterInfo[manga.id] || {
            count: 0,
            latestChapterAt: manga.created_at || "",
            latestChapterId: 0
        };

        manga.chapter_count = info.count;
        manga.latest_chapter_at = info.latestChapterAt || manga.created_at || "";
        manga.latest_chapter_id = info.latestChapterId || 0;

        return manga;
    });

    filterMangas();
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getActiveStatus(manga){
    if(
        manga.active === false ||
        manga.active === "Inactive" ||
        manga.active === "inactive" ||
        manga.active === "Ẩn"
    ){
        return "Inactive";
    }

    return "Active";
}

function normalizeText(text){
    return String(text || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function isAllValue(value){

    var text = normalizeText(value);

    if(
        value === "" ||
        text === "all" ||
        text === "tat ca" ||
        text.includes("tat ca")
    ){
        return true;
    }

    return false;
}

function getMangaStatus(manga){

    var rawStatus =
        manga.complete_status ||
        manga.completion_status ||
        manga.finish_status ||
        manga.manga_status ||
        manga.status ||
        "";

    var status = normalizeText(rawStatus);

    if(
        status === "da hoan thanh" ||
        status === "hoan thanh" ||
        status === "completed" ||
        status === "complete" ||
        status === "done" ||
        status === "finished"
    ){
        return "completed";
    }

    return "ongoing";
}

function getMangaStatusText(manga){
    return getMangaStatus(manga) === "completed" ? "Completed" : "Ongoing";
}

function getMangaStatusClass(manga){
    return getMangaStatus(manga) === "completed" ? "green" : "orange";
}

function getGenresArray(genres){

    if(!genres){
        return [];
    }

    if(Array.isArray(genres)){
        return genres;
    }

    if(typeof genres === "string"){
        return genres
            .split(",")
            .map(function(item){
                return item.trim();
            })
            .filter(function(item){
                return item !== "";
            });
    }

    return [];
}

function renderGenres(genres){

    var genreList = getGenresArray(genres);

    if(genreList.length === 0){
        return `<span class="tag gray">Không có</span>`;
    }

    return genreList.map(function(genre){
        return `<span class="genre-tag">${genre}</span>`;
    }).join("");
}

function openMangaDetail(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "Quanlytruyenchitiet.html";
}

function sortMangaList(list){

    var sort = sortSelect ? sortSelect.value : "";

    if(sort === "newest"){
        list.sort(function(a, b){
            return Number(b.id) - Number(a.id);
        });
    }
    else if(sort === "oldest"){
        list.sort(function(a, b){
            return Number(a.id) - Number(b.id);
        });
    }
    else if(sort === "view"){
        list.sort(function(a, b){
            return getViewNumber(b) - getViewNumber(a);
        });
    }
    else if(sort === "az"){
        list.sort(function(a, b){
            return (a.title || "").localeCompare(b.title || "");
        });
    }
    else {
        /*
            Mặc định:
            Truyện nào vừa up chap mới nhất sẽ lên đầu.
            Nếu truyện chưa có chap thì xếp theo ngày tạo truyện.
        */
        list.sort(function(a, b){

            var timeA = new Date(a.latest_chapter_at || a.created_at || 0).getTime();
            var timeB = new Date(b.latest_chapter_at || b.created_at || 0).getTime();

            if(timeB !== timeA){
                return timeB - timeA;
            }

            return Number(b.latest_chapter_id || b.id || 0) - Number(a.latest_chapter_id || a.id || 0);
        });
    }

    return list;
}

function filterMangas(){

    var keyword = searchInput ? normalizeText(searchInput.value) : "";
    var status = statusFilter ? statusFilter.value : "";
    var active = activeFilter ? activeFilter.value : "";

    filteredMangas = mangas.filter(function(manga){

        var title = normalizeText(manga.title || "");
        var author = normalizeText(manga.author || "");
        var originalName = normalizeText(manga.original_name || "");

        var genres = getGenresArray(manga.genres);
        var genreText = normalizeText(genres.join(" "));

        var matchKeyword =
            keyword === "" ||
            title.includes(keyword) ||
            author.includes(keyword) ||
            originalName.includes(keyword) ||
            genreText.includes(keyword);

        var mangaStatus = getMangaStatus(manga);
        var normalizedFilterStatus = normalizeText(status);

        var matchStatus =
            isAllValue(status) ||
            normalizedFilterStatus === mangaStatus ||
            normalizedFilterStatus === normalizeText(getMangaStatusText(manga)) ||
            normalizedFilterStatus === normalizeText(mangaStatus === "completed" ? "Đã hoàn thành" : "Đang tiến hành");

        var matchActive =
            isAllValue(active) ||
            normalizeText(getActiveStatus(manga)) === normalizeText(active);

        return matchKeyword && matchStatus && matchActive;
    });

    filteredMangas = sortMangaList(filteredMangas);

    currentPage = 1;
    renderMangas();
}

function renderMangas(){

    if(totalManga){
        totalManga.innerText = "Quản lý tất cả " + mangas.length + " truyện trên hệ thống";
    }

    if(!filteredMangas || filteredMangas.length === 0){

        mangaTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px;">
                    Không tìm thấy truyện nào
                </td>
            </tr>
        `;

        if(showingText){
            showingText.innerText = "Showing 0 to 0 of 0 entries";
        }

        if(paginationBox){
            paginationBox.innerHTML = "";
        }

        return;
    }

    var start = (currentPage - 1) * perPage;
    var end = start + perPage;

    var pageList = filteredMangas.slice(start, end);

    mangaTableBody.innerHTML = pageList.map(function(manga){
        return `
            <tr>
                <td>
                    <img src="${manga.cover || 'Image/no-image.png'}" alt="Ảnh bìa">
                </td>

                <td class="manga-name">
                    <a href="#" onclick="openMangaDetail(${manga.id})">
                        ${manga.title || "Không tên"}
                    </a>
                </td>

                <td>${manga.author || "Đang cập nhật"}</td>

                <td>${manga.chapter_count || 0}</td>

                <td>
                    <span class="tag ${getMangaStatusClass(manga)}">
                        ${getMangaStatusText(manga)}
                    </span>
                </td>

                <td>
                    <span class="tag ${getActiveStatus(manga) === "Active" ? "green" : "gray"}">
                        ${getActiveStatus(manga)}
                    </span>
                </td>

                <td>
                    ${renderGenres(manga.genres)}
                </td>

                <td>${getViewNumber(manga)}</td>

                <td class="action-cell">
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="openMangaDetail(${manga.id})">✎</button>
                        <button class="delete-btn" onclick="deleteManga(${manga.id})">X</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    var showingStart = start + 1;
    var showingEnd = Math.min(end, filteredMangas.length);

    if(showingText){
        showingText.innerText =
            "Showing " + showingStart + " to " + showingEnd + " of " + filteredMangas.length + " entries";
    }

    renderPagination();
}

function renderPagination(){

    if(!paginationBox){
        return;
    }

    var totalPages = Math.ceil(filteredMangas.length / perPage);

    if(totalPages <= 1){
        paginationBox.innerHTML = "";
        return;
    }

    var html = "";

    html += `
        <button 
            class="page-btn" 
            onclick="goToPage(${currentPage - 1})" 
            ${currentPage === 1 ? "disabled" : ""}
        >
            Previous
        </button>
    `;

    for(var i = 1; i <= totalPages; i++){
        html += `
            <button 
                class="page-btn ${i === currentPage ? "active" : ""}" 
                onclick="goToPage(${i})"
            >
                ${i}
            </button>
        `;
    }

    html += `
        <button 
            class="page-btn" 
            onclick="goToPage(${currentPage + 1})" 
            ${currentPage === totalPages ? "disabled" : ""}
        >
            Next
        </button>
    `;

    paginationBox.innerHTML = html;
}

function goToPage(page){

    var totalPages = Math.ceil(filteredMangas.length / perPage);

    if(page < 1 || page > totalPages){
        return;
    }

    currentPage = page;
    renderMangas();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

async function deleteManga(id){

    var confirmDelete = confirm("Bạn có chắc muốn xóa truyện này không?");

    if(!confirmDelete){
        return;
    }

    var deleteChapters = await supabase
        .from("chapters")
        .delete()
        .eq("manga_id", id);

    if(deleteChapters.error){
        alert("Lỗi xóa chapter của truyện: " + deleteChapters.error.message);
        return;
    }

    var deleteMangaResult = await supabase
        .from("mangas")
        .delete()
        .eq("id", id);

    if(deleteMangaResult.error){
        alert("Lỗi xóa truyện: " + deleteMangaResult.error.message);
        return;
    }

    alert("Đã xóa truyện!");
    await loadMangasFromSupabase();
}

if(searchBtn){
    searchBtn.onclick = function(){
        filterMangas();
    };
}

if(searchInput){
    searchInput.onkeyup = function(){
        filterMangas();
    };
}

if(statusFilter){
    statusFilter.onchange = function(){
        filterMangas();
    };
}

if(activeFilter){
    activeFilter.onchange = function(){
        filterMangas();
    };
}

if(sortSelect){
    sortSelect.onchange = function(){
        filterMangas();
    };
}

loadMangasFromSupabase();
