var mangaId = Number(localStorage.getItem("currentMangaId"));

if(!mangaId){
    alert("Không tìm thấy ID truyện!");
    window.location.href = "Danhsach.html";
}

var manga = null;

var currentPage = 1;
var rowsPerPage = 10;
var currentChapterList = [];

function formatDate(dateString){
    if(!dateString){
        return "-";
    }

    var date = new Date(dateString);

    if(isNaN(date.getTime())){
        return "-";
    }

    var day = String(date.getDate()).padStart(2, "0");
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var year = date.getFullYear();

    return day + "-" + month + "-" + year;
}

async function loadMangaFromSupabase(){

    var result = await supabase
        .from("mangas")
        .select("*")
        .eq("id", mangaId)
        .single();

    if(result.error || !result.data){
        console.log(result.error);
        alert("Không tìm thấy truyện trong Supabase!");
        window.location.href = "Danhsach.html";
        return;
    }

    manga = result.data;

    renderMangaInfo();
    await loadChaptersFromSupabase();

}

function renderMangaInfo(){

    if(!manga){
        return;
    }

    document.getElementById("mangaTitleTop").innerText = manga.title || "Không tên";
    document.getElementById("mangaTitle").innerText = manga.title || "Không tên";
    document.getElementById("mangaOriginalName").innerText = manga.original_name || "";

    document.getElementById("mangaCover").src = manga.cover || "Image/no-image.png";
    document.getElementById("mangaAuthor").innerText = manga.author || "Đang cập nhật";
    document.getElementById("mangaTeam").innerText = manga.team || "Lion Team";
    document.getElementById("mangaViews").innerText = manga.views || 0;

    document.getElementById("mangaLatestChapter").innerText =
        currentChapterList.length > 0 ? "Chapter " + currentChapterList[0].number : "0";

    document.getElementById("mangaStatus").innerText =
        manga.status === "Đã hoàn thành" ? "Completed" : "Ongoing";

    var genresBox = document.getElementById("mangaGenres");
    var genres = manga.genres || [];

    if(!Array.isArray(genres)){
        genres = [];
    }

    if(genres.length === 0){
        genresBox.innerHTML = `<span class="tag gray">Không có</span>`;
    }else{
        genresBox.innerHTML = genres.map(function(genre){
            return `<span class="genre-tag">${genre}</span>`;
        }).join("");
    }

}

async function loadChaptersFromSupabase(){

    var result = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("number", { ascending: false });

    if(result.error){
        console.log(result.error);
        alert("Lỗi tải danh sách chapter: " + result.error.message);
        renderChapters([]);
        return;
    }

    currentChapterList = result.data || [];

    renderMangaInfo();
    renderChapters(currentChapterList);

}

function renderChapters(list){

    var displayList = list || [];

    var chapterBody = document.getElementById("chapterBody");
    var chapterInfo = document.getElementById("chapter-info");
    var pagination = document.getElementById("chapter-pagination");

    if(displayList.length === 0){
        chapterBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align:center; padding:30px;">
                    Chưa có chapter nào
                </td>
            </tr>
        `;

        chapterInfo.innerText = "Showing 0 to 0 of 0 entries";
        pagination.innerHTML = "";
        return;
    }

    var totalPages = Math.ceil(displayList.length / rowsPerPage);

    if(currentPage > totalPages){
        currentPage = totalPages;
    }

    var start = (currentPage - 1) * rowsPerPage;
    var end = start + rowsPerPage;

    var pageList = displayList.slice(start, end);

    chapterBody.innerHTML = pageList.map(function(chapter, index){
        return `
            <tr>
                <td>Chapter ${chapter.number || start + index + 1}</td>

                <td>${chapter.title || "-"}</td>

                <td>
                    <a href="#" onclick="openChapter(${chapter.id})">↗</a>
                </td>

                <td>
                    <span class="tag green">${chapter.status || "Công khai"}</span>
                </td>

                <td>${chapter.schedule || "-"}</td>

                <td>${formatDate(chapter.created_at)}</td>

                <td>${formatDate(chapter.updated_at || chapter.created_at)}</td>

                <td>
                    <button class="edit-btn" onclick="editChapter(${chapter.id})">✎</button>
                    <button class="delete-btn" onclick="deleteChapter(${chapter.id})">🗑</button>
                </td>
            </tr>
        `;
    }).join("");

    chapterInfo.innerText =
        "Showing " + (start + 1) + " to " +
        Math.min(end, displayList.length) +
        " of " + displayList.length + " entries";

    renderPagination(totalPages, displayList);

}

function renderPagination(totalPages, displayList){

    var pagination = document.getElementById("chapter-pagination");
    pagination.innerHTML = "";

    if(totalPages <= 1){
        return;
    }

    var prev = document.createElement("button");
    prev.innerText = "Previous";
    prev.disabled = currentPage === 1;

    prev.onclick = function(){
        if(currentPage > 1){
            currentPage--;
            renderChapters(displayList);
        }
    };

    pagination.appendChild(prev);

    for(var i = 1; i <= totalPages; i++){
        var btn = document.createElement("button");
        btn.innerText = i;

        if(i === currentPage){
            btn.classList.add("active");
        }

        btn.onclick = function(){
            currentPage = Number(this.innerText);
            renderChapters(displayList);
        };

        pagination.appendChild(btn);
    }

    var next = document.createElement("button");
    next.innerText = "Next";
    next.disabled = currentPage === totalPages;

    next.onclick = function(){
        if(currentPage < totalPages){
            currentPage++;
            renderChapters(displayList);
        }
    };

    pagination.appendChild(next);

}

function openChapter(chapterId){
    localStorage.setItem("currentChapterId", chapterId);
    localStorage.setItem("currentMangaId", mangaId);
    window.location.href = "DTR.html";
}

function editChapter(chapterId){
    localStorage.setItem("currentChapterId", chapterId);
    localStorage.setItem("editChapterId", chapterId);
    localStorage.setItem("currentMangaId", mangaId);

    window.location.href = "Upchap.html";
}

async function deleteChapter(chapterId){

    var confirmDelete = confirm("Bạn có chắc muốn xóa chapter này không?");

    if(!confirmDelete){
        return;
    }

    var result = await supabase
        .from("chapters")
        .delete()
        .eq("id", chapterId);

    if(result.error){
        alert("Lỗi xóa chapter: " + result.error.message);
        return;
    }

    currentPage = 1;
    await loadChaptersFromSupabase();

}

document.getElementById("addChapterBtn").onclick = function(){
    localStorage.setItem("currentMangaId", mangaId);
    localStorage.removeItem("editChapterId");
    localStorage.removeItem("currentChapterId");

    window.location.href = "Upchap.html";
};

document.getElementById("chapterSearch").onkeyup = function(){

    var keyword = this.value.toLowerCase().trim();

    var filtered = currentChapterList.filter(function(chapter){
        var chapterNumber = String(chapter.number || "");
        var chapterTitle = chapter.title || "";

        return chapterNumber.includes(keyword) ||
               chapterTitle.toLowerCase().includes(keyword);
    });

    currentPage = 1;
    renderChapters(filtered);

};

document.getElementById("chapterSearchBtn").onclick = function(){

    var keyword = document.getElementById("chapterSearch").value.toLowerCase().trim();

    var filtered = currentChapterList.filter(function(chapter){
        var chapterNumber = String(chapter.number || "");
        var chapterTitle = chapter.title || "";

        return chapterNumber.includes(keyword) ||
               chapterTitle.toLowerCase().includes(keyword);
    });

    currentPage = 1;
    renderChapters(filtered);

};

document.getElementById("reloadBtn").onclick = function(){
    document.getElementById("chapterSearch").value = "";
    currentPage = 1;
    loadChaptersFromSupabase();
};

loadMangaFromSupabase();