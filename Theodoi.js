var followListBox = document.getElementById("followList");
var followPagination = document.getElementById("followPagination");

var currentPage = 1;
var perPage = 20;

var followedMangas = [];

function getSupabase(){
    return window.supabaseClient || window.supabase || null;
}

function getFollowList(){
    return JSON.parse(localStorage.getItem("followList")) || [];
}

function saveFollowList(list){
    localStorage.setItem("followList", JSON.stringify(list));
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

async function loadFollowList(){
    if(!followListBox){
        return;
    }

    followListBox.innerHTML = `
        <div class="empty-follow">
            Đang tải danh sách theo dõi...
        </div>
    `;

    var db = getSupabase();

    if(!db){
        followListBox.innerHTML = `
            <div class="empty-follow">
                Lỗi: Chưa load supabase.js trước TheoDoi.js.
            </div>
        `;
        return;
    }

    var followList = getFollowList();

    if(followList.length === 0){
        followedMangas = [];
        renderFollowList();
        return;
    }

    var mangaIds = followList.map(function(item){
        return Number(item.id || item.manga_id || item.mangaId);
    }).filter(function(id){
        return !isNaN(id);
    });

    if(mangaIds.length === 0){
        followedMangas = [];
        renderFollowList();
        return;
    }

    var mangaResult = await db
        .from("mangas")
        .select("*")
        .in("id", mangaIds);

    if(mangaResult.error){
        console.log("Lỗi mangas:", mangaResult.error);
        followListBox.innerHTML = `
            <div class="empty-follow">
                Lỗi tải truyện theo dõi.
            </div>
        `;
        return;
    }

    var chapterResult = await db
        .from("chapters")
        .select("manga_id, number")
        .in("manga_id", mangaIds);

    if(chapterResult.error){
        console.log("Lỗi chapters:", chapterResult.error);
    }

    var mangas = mangaResult.data || [];
    var chapters = chapterResult.data || [];

    followedMangas = followList.map(function(followItem){
        var mangaId = Number(followItem.id || followItem.manga_id || followItem.mangaId);

        var manga = mangas.find(function(item){
            return Number(item.id) === mangaId;
        });

        if(!manga){
            return null;
        }

        var mangaChapters = chapters.filter(function(chapter){
            return Number(chapter.manga_id) === mangaId;
        });

        manga.chapters = mangaChapters;

        var currentChapter = getChapterNumber(manga);
        var seenChapter = Number(followItem.seenChapter || followItem.latestChapter || 0);
        var newChapterCount = currentChapter - seenChapter;

        if(newChapterCount < 0){
            newChapterCount = 0;
        }

        return {
            id: manga.id,
            title: manga.title || followItem.title || "Không có tên",
            image: manga.cover || followItem.image || "Image/LOGO WEB.png",
            status: manga.status || "Đang tiến hành",
            currentChapter: currentChapter,
            seenChapter: seenChapter,
            newChapterCount: newChapterCount,
            updatedAt: manga.updated_at || manga.created_at || ""
        };
    }).filter(function(item){
        return item !== null;
    });

    followedMangas.sort(function(a, b){
        if(Number(b.newChapterCount || 0) !== Number(a.newChapterCount || 0)){
            return Number(b.newChapterCount || 0) - Number(a.newChapterCount || 0);
        }

        return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });

    renderFollowList();
}

function renderFollowList(){
    if(!followListBox){
        return;
    }

    if(followedMangas.length === 0){
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
    var pageItems = followedMangas.slice(start, start + perPage);

    followListBox.innerHTML = "";

    pageItems.forEach(function(truyen){
        var hasNew = Number(truyen.newChapterCount || 0) > 0;

        var chapterText = "Chưa có chap";

        if(Number(truyen.currentChapter || 0) > 0){
            chapterText = "Chapter " + truyen.currentChapter;
        }

        var item = document.createElement("div");
        item.className = "follow-item" + (hasNew ? " has-new-chapter" : "");

        item.innerHTML = `
            <div class="follow-cover-box">
				${hasNew ? '<img class="new-chapter-icon" src="Image/massage.svg" alt="Mới">' : ''}

				<img class="follow-cover" src="${truyen.image || 'Image/LOGO WEB.png'}" alt="Ảnh truyện">
			</div>

            <div class="follow-info">
                <h3>${truyen.title || "Không có tên"}</h3>
                <p>${chapterText}</p>
            </div>

            <div class="follow-actions">
                <button class="read-follow-btn" onclick="goToStory(${truyen.id})">
                    Đọc truyện
                </button>

                <button class="delete-follow-btn" onclick="removeFollowById(${truyen.id})">
                    Xóa
                </button>
            </div>
        `;

        followListBox.appendChild(item);
    });

    renderPagination(followedMangas.length);
}

function renderPagination(total){
    if(!followPagination){
        return;
    }

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

function markAsRead(id){
    var list = getFollowList();

    var manga = followedMangas.find(function(item){
        return Number(item.id) === Number(id);
    });

    list.forEach(function(item){
        var itemId = Number(item.id || item.manga_id || item.mangaId);

        if(itemId === Number(id) && manga){
            item.id = Number(id);
            item.seenChapter = Number(manga.currentChapter || 0);
            item.latestChapter = Number(manga.currentChapter || 0);
            item.newChapterCount = 0;
        }
    });

    saveFollowList(list);
}

function goToStory(id){
    markAsRead(id);

    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

function removeFollowById(id){
    var list = getFollowList();

    list = list.filter(function(item){
        var itemId = Number(item.id || item.manga_id || item.mangaId);
        return itemId !== Number(id);
    });

    saveFollowList(list);

    followedMangas = followedMangas.filter(function(item){
        return Number(item.id) !== Number(id);
    });

    renderFollowList();
}

function clearFollowList(){
    if(confirm("Bạn có chắc muốn xóa tất cả truyện theo dõi không?")){
        localStorage.removeItem("followList");
        followedMangas = [];
        renderFollowList();
    }
}

loadFollowList();