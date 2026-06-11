var mangaTableBody = document.getElementById("mangaTableBody");
var totalManga = document.getElementById("totalManga");
var showingText = document.getElementById("showingText");

var searchInput = document.getElementById("searchInput");
var searchBtn = document.getElementById("searchBtn");
var statusFilter = document.getElementById("statusFilter");
var activeFilter = document.getElementById("activeFilter");
var sortSelect = document.getElementById("sortSelect");

var mangas = [];

async function loadMangasFromSupabase(){

    var result = await supabase
        .from("mangas")
        .select("*")
        .order("id", { ascending: false });

    if(result.error){
        console.log(result.error);
        alert("Lỗi tải danh sách truyện: " + result.error.message);
        return;
    }

    mangas = result.data || [];
    renderMangas(mangas);

}

async function getChapterCount(mangaId){

    var result = await supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .eq("manga_id", mangaId);

    if(result.error){
        console.log(result.error);
        return 0;
    }

    return result.count || 0;
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getActiveStatus(manga){
    if(manga.active === false || manga.active === "Inactive"){
        return "Inactive";
    }

    return "Active";
}

function getMangaStatus(manga){
    if(manga.status === "Đã hoàn thành" || manga.status === "Hoàn thành"){
        return "Đã hoàn thành";
    }

    return "Đang tiến hành";
}

function renderGenres(genres){

    if(!genres || !Array.isArray(genres) || genres.length === 0){
        return `<span class="tag gray">Không có</span>`;
    }

    return genres.map(function(genre){
        return `<span class="genre-tag">${genre}</span>`;
    }).join("");
}

function openMangaDetail(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "Quanlytruyenchitiet.html";
}

async function renderMangas(list){

    totalManga.innerText = "Quản lý tất cả " + mangas.length + " truyện trên hệ thống";

    if(!list || list.length === 0){
        mangaTableBody.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center; padding:30px;">
                    Không tìm thấy truyện nào
                </td>
            </tr>
        `;

        showingText.innerText = "Showing 0 to 0 of 0 entries";
        return;
    }

    mangaTableBody.innerHTML = list.map(function(manga){
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

                <td id="chapter-count-${manga.id}">Đang tải...</td>

                <td>
                    <span class="tag orange">
                        ${getMangaStatus(manga) === "Đã hoàn thành" ? "Completed" : "Ongoing"}
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

    showingText.innerText = "Showing 1 to " + list.length + " of " + list.length + " entries";

    for(var i = 0; i < list.length; i++){
        var count = await getChapterCount(list[i].id);
        var countBox = document.getElementById("chapter-count-" + list[i].id);

        if(countBox){
            countBox.innerText = count;
        }
    }
}

function filterMangas(){

    var keyword = searchInput.value.toLowerCase().trim();
    var status = statusFilter.value;
    var active = activeFilter.value;
    var sort = sortSelect.value;

    var filtered = mangas.filter(function(manga){

        var title = manga.title || "";
        var author = manga.author || "";
        var originalName = manga.original_name || "";
        var genres = manga.genres || [];
        var genreText = Array.isArray(genres) ? genres.join(" ").toLowerCase() : "";

        var matchKeyword =
            title.toLowerCase().includes(keyword) ||
            author.toLowerCase().includes(keyword) ||
            originalName.toLowerCase().includes(keyword) ||
            genreText.includes(keyword);

        var matchStatus = status === "" || getMangaStatus(manga) === status;
        var matchActive = active === "" || getActiveStatus(manga) === active;

        return matchKeyword && matchStatus && matchActive;
    });

    if(sort === "newest"){
        filtered.sort(function(a, b){
            return Number(b.id) - Number(a.id);
        });
    }

    if(sort === "oldest"){
        filtered.sort(function(a, b){
            return Number(a.id) - Number(b.id);
        });
    }

    if(sort === "view"){
        filtered.sort(function(a, b){
            return getViewNumber(b) - getViewNumber(a);
        });
    }

    if(sort === "az"){
        filtered.sort(function(a, b){
            return (a.title || "").localeCompare(b.title || "");
        });
    }

    renderMangas(filtered);
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

searchBtn.onclick = function(){
    filterMangas();
};

searchInput.onkeyup = function(){
    filterMangas();
};

statusFilter.onchange = function(){
    filterMangas();
};

activeFilter.onchange = function(){
    filterMangas();
};

sortSelect.onchange = function(){
    filterMangas();
};

loadMangasFromSupabase();