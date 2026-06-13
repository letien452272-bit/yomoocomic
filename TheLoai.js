console.log("TheoDoi.js v200 đã chạy");

/* ================= KHAI BÁO ================= */

var followListBox = document.getElementById("followList");
var followPagination = document.getElementById("followPagination");

var currentPage = 1;
var perPage = 20;

var followedMangas = [];
var currentUser = null;

/* ================= SUPABASE ================= */

function getDb(){
    if(typeof getSupabase === "function"){
        return getSupabase();
    }

    return window.supabaseClient || window.db || window.yomooSupabase || null;
}

async function getLoginUser(){
    if(typeof getCurrentUser === "function"){
        var user = await getCurrentUser();

        if(user){
            return user;
        }
    }

    var db = getDb();

    if(db && db.auth){
        var result = await db.auth.getUser();

        if(result && result.data && result.data.user){
            return result.data.user;
        }
    }

    return null;
}

/* ================= HIỂN THỊ THÔNG BÁO ================= */

function showFollowMessage(text){
    if(!followListBox){
        console.log("Không tìm thấy #followList trong HTML");
        return;
    }

    followListBox.innerHTML = `
        <div class="empty-follow">
            ${text}
        </div>
    `;
}

/* ================= CHAPTER ================= */

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

    return Number(manga.latestChapter || manga.latest_chapter || manga.chapter || 0);
}

/* ================= LOAD DANH SÁCH THEO DÕI ================= */

async function loadFollowList(){
    console.log("Bắt đầu load danh sách theo dõi...");

    if(!followListBox){
        console.log("Lỗi: Không có thẻ #followList");
        return;
    }

    showFollowMessage("Đang tải danh sách theo dõi...");

    var db = getDb();

    if(!db){
        console.log("Không tìm thấy Supabase client");
        showFollowMessage("Lỗi: Chưa kết nối Supabase.");
        return;
    }

    currentUser = await getLoginUser();

    console.log("currentUser:", currentUser);

    if(!currentUser){
        showFollowMessage("Bạn cần đăng nhập để xem danh sách theo dõi.");
        return;
    }

    var followResult = await db
        .from("follows")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending:false });

    console.log("followResult:", followResult);

    if(followResult.error){
        showFollowMessage("Lỗi tải danh sách theo dõi: " + followResult.error.message);
        return;
    }

    var followList = followResult.data || [];

    if(followList.length === 0){
        followedMangas = [];
        window.followedMangas = followedMangas;
        renderFollowList();
        return;
    }

    var mangaIds = followList.map(function(item){
        return Number(item.manga_id);
    }).filter(function(id){
        return id && !isNaN(id);
    });

    console.log("mangaIds:", mangaIds);

    if(mangaIds.length === 0){
        followedMangas = [];
        window.followedMangas = followedMangas;
        showFollowMessage("Có dữ liệu theo dõi nhưng manga_id bị lỗi.");
        return;
    }

    var mangaResult = await db
        .from("mangas")
        .select("*")
        .in("id", mangaIds);

    console.log("mangaResult:", mangaResult);

    if(mangaResult.error){
        showFollowMessage("Lỗi tải truyện theo dõi: " + mangaResult.error.message);
        return;
    }

    var mangas = mangaResult.data || [];

    if(mangas.length === 0){
        followedMangas = [];
        window.followedMangas = followedMangas;
        showFollowMessage("Có theo dõi nhưng không tìm thấy truyện trong bảng mangas.");
        return;
    }

    var chapterResult = await db
        .from("chapters")
        .select("manga_id, number")
        .in("manga_id", mangaIds);

    var chapters = [];

    if(chapterResult.error){
        console.log("Lỗi tải chapters:", chapterResult.error);
    }else{
        chapters = chapterResult.data || [];
    }

    followedMangas = followList.map(function(followItem){
        var mangaId = Number(followItem.manga_id);

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
        var seenChapter = Number(followItem.seen_chapter || 0);
        var newChapterCount = currentChapter - seenChapter;

        if(newChapterCount < 0){
            newChapterCount = 0;
        }

        return {
            id: manga.id,
            title: manga.title || "Không có tên",
            image: manga.cover || "Image/LOGO WEB.png",
            status: manga.status || "Đang tiến hành",
            currentChapter: currentChapter,
            seenChapter: seenChapter,
            newChapterCount: newChapterCount,
            updatedAt: manga.updated_at || manga.created_at || "",
            createdAt: followItem.created_at || ""
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

    window.followedMangas = followedMangas;

    console.log("followedMangas:", followedMangas);

    renderFollowList();
}

/* ================= RENDER ================= */

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
                <img class="follow-cover" src="${truyen.image}" alt="Ảnh truyện">
            </div>

            <div class="follow-info">
                <h3>${truyen.title}</h3>
                <p>${chapterText}</p>
                ${hasNew ? `<span class="new-chapter-text">Có ${truyen.newChapterCount} chương mới</span>` : ""}
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

/* ================= PHÂN TRANG ================= */

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

/* ================= ĐỌC / XÓA ================= */

async function markAsRead(id){
    var db = getDb();

    if(!db || !currentUser){
        return;
    }

    var manga = followedMangas.find(function(item){
        return Number(item.id) === Number(id);
    });

    if(!manga){
        return;
    }

    var result = await db
        .from("follows")
        .update({
            seen_chapter: Number(manga.currentChapter || 0)
        })
        .eq("user_id", currentUser.id)
        .eq("manga_id", Number(id));

    if(result.error){
        console.log("Lỗi cập nhật đã đọc:", result.error);
    }
}

async function goToStory(id){
    await markAsRead(id);

    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

async function removeFollowById(id){
    var db = getDb();

    if(!db || !currentUser){
        return;
    }

    if(!confirm("Bạn có chắc muốn xóa truyện này khỏi danh sách theo dõi không?")){
        return;
    }

    var result = await db
        .from("follows")
        .delete()
        .eq("user_id", currentUser.id)
        .eq("manga_id", Number(id));

    if(result.error){
        alert("Lỗi xóa theo dõi: " + result.error.message);
        console.log(result.error);
        return;
    }

    followedMangas = followedMangas.filter(function(item){
        return Number(item.id) !== Number(id);
    });

    window.followedMangas = followedMangas;

    renderFollowList();
}

async function clearFollowList(){
    var db = getDb();

    if(!db || !currentUser){
        return;
    }

    if(!confirm("Bạn có chắc muốn xóa tất cả truyện theo dõi không?")){
        return;
    }

    var result = await db
        .from("follows")
        .delete()
        .eq("user_id", currentUser.id);

    if(result.error){
        alert("Lỗi xóa tất cả theo dõi: " + result.error.message);
        console.log(result.error);
        return;
    }

    followedMangas = [];
    window.followedMangas = followedMangas;

    renderFollowList();
}

/* ================= GẮN RA WINDOW ĐỂ TEST ================= */

window.loadFollowList = loadFollowList;
window.renderFollowList = renderFollowList;
window.followedMangas = followedMangas;
window.goToStory = goToStory;
window.removeFollowById = removeFollowById;
window.clearFollowList = clearFollowList;

console.log("TheoDoi.js đã gắn loadFollowList ra window");

loadFollowList();
