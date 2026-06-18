if(typeof updateUserMenu === "function"){
    updateUserMenu();
}

/* MENU THE LOAI */
var genreBtn = document.getElementById("genre-btn");
var genreDropdown = document.getElementById("genre-dropdown");
var genreMenu = document.getElementById("genre-menu");
var genreArrow = document.getElementById("genre-arrow");

if(genreBtn && genreDropdown && genreMenu && genreArrow){
    genreBtn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();

        genreDropdown.classList.toggle("show");
        genreArrow.src = genreDropdown.classList.contains("show")
            ? "Image/angle-small-up.svg"
            : "Image/angle-small-down.svg";
    };

    document.addEventListener("click", function(e){
        if(!genreMenu.contains(e.target)){
            genreDropdown.classList.remove("show");
            genreArrow.src = "Image/angle-small-down.svg";
        }
    });
}

/* MENU USER */
var userBtn = document.getElementById("user-btn");
var userDropdown = document.getElementById("user-dropdown");
var userArrow = document.getElementById("user-arrow");

if(userBtn && userDropdown && userArrow){
    userBtn.onclick = function(e){
        e.preventDefault();
        e.stopPropagation();

        userDropdown.classList.toggle("show");
        userArrow.textContent = userDropdown.classList.contains("show") ? "^" : "v";
    };

    document.addEventListener("click", function(){
        userDropdown.classList.remove("show");
        userArrow.textContent = "v";
    });
}

/* DATA */
var comicList = document.getElementById("comicList");
var comingList = document.getElementById("comingList");

var mangas = [];

async function loadDataFromSupabase(){
    var mangaResult = await supabase
        .from("mangas")
        .select("*")
        .order("id", { ascending:false });

    if(mangaResult.error){
        console.log(mangaResult.error);
        alert("Lỗi tải truyện: " + mangaResult.error.message);
        return;
    }

    var chapterResult = await supabase
        .from("chapters")
        .select("id,manga_id,number,title,created_at")
        .order("number", { ascending:false });

    if(chapterResult.error){
        console.log(chapterResult.error);
        alert("Lỗi tải chapter: " + chapterResult.error.message);
        return;
    }

    var chapters = chapterResult.data || [];

    mangas = (mangaResult.data || []).map(function(manga){
        var mangaChapters = chapters.filter(function(chapter){
            return Number(chapter.manga_id) === Number(manga.id);
        });

        manga.chapters = mangaChapters;

        if(mangaChapters.length > 0){
            manga.releaseStatus = "released";
            manga.latestChapter = Math.max.apply(null, mangaChapters.map(function(chapter){
                return Number(chapter.number) || 0;
            }));

            manga.updatedAt = mangaChapters[0].created_at || manga.created_at;
        }else{
            manga.releaseStatus = "upcoming";
            manga.latestChapter = 0;
            manga.updatedAt = manga.created_at;
        }

        return manga;
    });

    renderUpdatedMangas();
    renderComingMangas();
    renderRanking();
    renderHistory();
    setupBanner();
}

function getChapterNumber(manga){
    if(manga.chapters && manga.chapters.length > 0){
        var maxChapter = 0;

        manga.chapters.forEach(function(chapter){
            var num = Number(chapter.number) || 0;

            if(num > maxChapter){
                maxChapter = num;
            }
        });

        return maxChapter;
    }

    return Number(manga.latestChapter || 0);
}

function getViewNumber(manga){
    return Number(manga.views || manga.view || 0);
}

function getTimeAgo(dateString){
    if(!dateString){
        return "";
    }

    var now = new Date();
    var updateDate = new Date(dateString);

    if(isNaN(updateDate.getTime())){
        return "";
    }

    var diff = now - updateDate;

    var minutes = Math.floor(diff / (1000 * 60));
    var hours = Math.floor(diff / (1000 * 60 * 60));
    var days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if(minutes < 1){
        return "Vừa xong";
    }

    if(hours < 1){
        return minutes + " phút trước";
    }

    if(hours < 24){
        return hours + " giờ trước";
    }

    if(days < 30){
        return days + " ngày trước";
    }

    return "NEW";
}

function openMangaUser(id){
    localStorage.setItem("currentMangaId", id);
    window.location.href = "TD.html?id=" + id;
}

/* TRUYEN MOI CAP NHAT */
function renderUpdatedMangas(){
    if(!comicList) return;

    comicList.innerHTML = "";

    var releasedMangas = mangas.filter(function(manga){
        return getChapterNumber(manga) > 0;
    });

    releasedMangas.sort(function(a, b){
        return new Date(b.updatedAt || b.created_at || 0)
             - new Date(a.updatedAt || a.created_at || 0);
    });

    var limitUpdatedMangas = window.innerWidth <= 768 ? 9 : 15;
    var displayMangas = releasedMangas.slice(0, limitUpdatedMangas);

    displayMangas.forEach(function(manga){
        var comic = document.createElement("a");

        comic.className = "new-comic-card";
        comic.href = "TD.html?id=" + manga.id;

        var timeText = getTimeAgo(manga.updatedAt || manga.created_at) || "NEW";

        comic.innerHTML = `
            <div class="new-comic-cover">
                ${timeText ? `<div class="time-badge">${timeText}</div>` : ""}
                <img src="${manga.cover || "Image/no-image.png"}" alt="${manga.title || "Không tên"}">
            </div>

            <h3 class="new-comic-title">${manga.title || "Không tên"}</h3>

            <div class="new-comic-bottom">
                <span>Ch.${getChapterNumber(manga)}</span>

                <span class="new-comic-view">
                    <img src="Image/eye.svg" alt="">
                    ${getViewNumber(manga)}
                </span>
            </div>
        `;

        comic.onclick = function(){
            localStorage.setItem("currentMangaId", manga.id);
        };

        comicList.appendChild(comic);
    });

    comicList.innerHTML += `
        <a href="alltr.html" class="new-comic-card new-more-card">
            <div class="more-icon">›</div>
            <p>Xem thêm</p>
        </a>
    `;
}
/* TRUYEN SAP RA MAT */
function renderComingMangas(){
    if(!comingList) return;

    var upcomingMangas = mangas.filter(function(manga){
        return getChapterNumber(manga) === 0;
    });

    upcomingMangas.sort(function(a, b){
        return Number(b.id) - Number(a.id);
    });

    if(upcomingMangas.length === 0){
        comingList.innerHTML = "<p>Chưa có truyện sắp ra mắt</p>";
        return;
    }

    comingList.innerHTML = upcomingMangas.map(function(manga){
        return `
            <div class="coming-item" onclick="openMangaUser(${manga.id})">
                <img src="${manga.cover || "Image/no-image.png"}" alt="">
                <h3>${manga.title || "Không tên"}</h3>
                <p>
                    <img class="bookmark" src="Image/bookmark.svg" alt="">
                    ${manga.follows || 0}
                </p>
            </div>
        `;
    }).join("");
}

/* BANG XEP HANG */
function renderRanking(){
    var rankList = document.getElementById("rankList");

    if(!rankList) return;

    var ranking = mangas.filter(function(manga){
        return getChapterNumber(manga) > 0;
    });

    ranking.sort(function(a, b){
        return getViewNumber(b) - getViewNumber(a);
    });

    ranking = ranking.slice(0, 10);

    if(ranking.length === 0){
        rankList.innerHTML = "<p>Chưa có truyện xếp hạng</p>";
        return;
    }

    rankList.innerHTML = ranking.map(function(manga, index){
        return `
            <div class="rank-card" onclick="openMangaUser(${manga.id})">
                <div class="rank-stt">${index + 1}</div>

                <img class="rank-cover-img" src="${manga.cover || 'Image/LOGO WEB.png'}" alt="">

                <div class="rank-text">
                    <h3>${manga.title || "Không tên"}</h3>

                    <div class="rank-row">
                        <span class="rank-chap">Ch.${getChapterNumber(manga)}</span>

                        <span class="rank-eye">
                            <img src="Image/eye.svg" alt="">
                            ${getViewNumber(manga)}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join("");
}
/* BANNER */
function setupBanner(){
    var bannerImg = document.getElementById("bannerImg");
    var bannerTitle = document.getElementById("bannerTitle");
    var bannerBtn = document.getElementById("bannerBtn");
    var prevBanner = document.getElementById("prevBanner");
    var nextBanner = document.getElementById("nextBanner");

    var bannerList = mangas.filter(function(manga){
        return manga.cover;
    }).slice(0, 10);

    var currentBanner = 0;

    function showBanner(index){
        if(!bannerImg || bannerList.length === 0) return;

        bannerImg.classList.add("slide-out");

        setTimeout(function(){
            if(index < 0){
                currentBanner = bannerList.length - 1;
            }else if(index >= bannerList.length){
                currentBanner = 0;
            }else{
                currentBanner = index;
            }

            var manga = bannerList[currentBanner];

            bannerImg.src = manga.cover || "Image/6.jpg";
            bannerTitle.innerText = manga.title || "Không tên";

            if(bannerBtn){
                bannerBtn.onclick = function(e){
                    e.preventDefault();
                    openMangaUser(manga.id);
                };
            }

            bannerImg.classList.remove("slide-out");
        }, 300);
    }

    if(bannerList.length > 0){
        showBanner(0);

        setInterval(function(){
            showBanner(currentBanner + 1);
        }, 5500);
    }

    if(prevBanner){
        prevBanner.onclick = function(){
            showBanner(currentBanner - 1);
        };
    }

    if(nextBanner){
        nextBanner.onclick = function(){
            showBanner(currentBanner + 1);
        };
    }
}

/* LICH SU DOC */
function renderHistory(){
    var historyList = document.getElementById("historyList");

    if(!historyList) return;

    var history = JSON.parse(localStorage.getItem("readingHistory")) || [];

    if(history.length === 0){
        historyList.innerHTML = "<p>Chưa có lịch sử đọc</p>";
        return;
    }

    historyList.innerHTML = "";

    history.forEach(function(id){
        var manga = mangas.find(function(item){
            return Number(item.id) === Number(id);
        });

        if(!manga) return;

        historyList.innerHTML += `
            <div class="history-item" onclick="openMangaUser(${manga.id})">
                <img src="${manga.cover || 'Image/no-image.png'}" alt="">

                <div>
                    <h4>${manga.title || "Không tên"}</h4>
                    <p>Chap ${getChapterNumber(manga)}</p>
                </div>
            </div>
        `;
    });
}

/* CHAY */
var fixNewComicStyle = document.createElement("style");
fixNewComicStyle.innerHTML = `
@media screen and (min-width:769px){
    #comicList{
        display:grid !important;
        grid-template-columns:repeat(5, 150px) !important;
        gap:18px !important;
        justify-content:center !important;
    }

    #comicList .new-comic-card{
        width:150px !important;
        height:260px !important;
        background:#26364a !important;
        border-radius:8px !important;
        padding:8px !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
        cursor:pointer !important;
        color:#fff !important;
        text-decoration:none !important;
    }

    #comicList .new-comic-cover{
        width:134px !important;
        height:190px !important;
        border-radius:6px !important;
        overflow:hidden !important;
        position:relative !important;
    }

    #comicList .new-comic-cover img{
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
        display:block !important;
    }

    #comicList .new-comic-title{
    font-size:14px !important;
    line-height:18px !important;
    height:18px !important;
    margin:7px 0 6px !important;

    white-space:nowrap !important;
    overflow:hidden !important;
    text-overflow:ellipsis !important;

    color:#fff !important;
}
    #comicList .new-comic-bottom{
    display:flex !important;
    justify-content:space-between !important;
    align-items:center !important;

    width:100% !important;
    font-size:12px !important;
}

#comicList .new-comic-bottom span:first-child{
    color:#7cff8b !important;
}

#comicList .new-comic-view{
    color:#ffd54f !important;
    display:flex !important;
    align-items:center !important;
    gap:3px !important;
}

#comicList .new-comic-view img{
    width:12px !important;
    height:12px !important;
}

    #comicList .new-more-card{
        display:flex !important;
        align-items:center !important;
        justify-content:center !important;
        flex-direction:column !important;
    }
}
`;
document.head.appendChild(fixNewComicStyle);
var fixRankingStyle = document.createElement("style");
fixRankingStyle.innerHTML = `
@media screen and (min-width:769px){

    .sidebar{
        width:360px !important;
        min-width:360px !important;
        max-width:360px !important;
        padding:18px !important;
    }

    #rankList{
        width:100% !important;
        display:flex !important;
        flex-direction:column !important;
        gap:12px !important;
    }

    .rank-card{
        width:100% !important;
        height:135px !important;

        display:grid !important;
        grid-template-columns:32px 90px 1fr !important;
        align-items:center !important;
        gap:12px !important;

        background:#33415a !important;
        border-radius:8px !important;
        padding:8px 10px !important;
        box-sizing:border-box !important;

        cursor:pointer !important;
        overflow:hidden !important;
    }

    .rank-stt{
        color:#ffd54f !important;
        font-size:22px !important;
        font-weight:700 !important;
        text-align:center !important;
    }

    .rank-cover-img{
        width:90px !important;
        height:120px !important;
        min-width:90px !important;
        max-width:90px !important;
        object-fit:cover !important;
        border-radius:6px !important;
        display:block !important;
    }

    .rank-text{
        min-width:0 !important;
        width:100% !important;
    }

    .rank-text h3{
        font-size:15px !important;
        line-height:18px !important;
        height:18px !important;
        margin:0 0 12px 0 !important;

        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;

        color:#fff !important;
        font-weight:700 !important;
    }

    .rank-row{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        width:100% !important;
    }

    .rank-chap{
        color:#69ff7e !important;
        font-size:13px !important;
        font-weight:700 !important;
    }

    .rank-eye{
        display:flex !important;
        align-items:center !important;
        gap:4px !important;
        color:#d7dde8 !important;
        font-size:13px !important;
    }

    .rank-eye img{
        width:13px !important;
        height:13px !important;
    }
}
`;
document.head.appendChild(fixRankingStyle);
var fixRankingMobileStyle = document.createElement("style");
fixRankingMobileStyle.innerHTML = `
@media screen and (max-width:768px){

    .sidebar{
        width:100% !important;
        max-width:100% !important;
    }

    #rankList{
        display:flex !important;
        justify-content:center !important;
        align-items:flex-start !important;
    }

    .rank-card{
        width:105px !important;
        height:190px !important;

        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;

        background:#33415a !important;
        border-radius:8px !important;
        padding:8px !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
    }

    .rank-stt{
        font-size:18px !important;
        margin-bottom:6px !important;
    }

    .rank-cover-img{
        width:80px !important;
        height:110px !important;
        object-fit:cover !important;
        border-radius:6px !important;
    }

    .rank-text{
        width:100% !important;
    }

    .rank-text h3{
        font-size:12px !important;
        line-height:15px !important;
        height:30px !important;
        margin:6px 0 5px 0 !important;

        overflow:hidden !important;
        text-align:center !important;
    }

    .rank-row{
        width:100% !important;
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        font-size:11px !important;
    }

    .rank-chap{
        color:#69ff7e !important;
        font-size:11px !important;
    }

    .rank-eye{
        display:flex !important;
        align-items:center !important;
        gap:3px !important;
        font-size:11px !important;
    }

    .rank-eye img{
        width:11px !important;
        height:11px !important;
    }
}
`;
document.head.appendChild(fixRankingMobileStyle);
var fixRankingMobileStyle = document.createElement("style");
fixRankingMobileStyle.innerHTML = `
@media screen and (max-width:768px){

    .sidebar{
        width:100% !important;
        max-width:100% !important;
        padding:15px 10px !important;
        box-sizing:border-box !important;
    }

    #rankList{
        width:100% !important;
        display:flex !important;
        flex-direction:row !important;
        justify-content:flex-start !important;
        align-items:flex-start !important;
        gap:10px !important;
        overflow-x:auto !important;
        overflow-y:hidden !important;
        padding:0 5px 10px !important;
        box-sizing:border-box !important;
    }

    .rank-card{
        width:115px !important;
        min-width:115px !important;
        max-width:115px !important;
        height:215px !important;

        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;

        background:#33415a !important;
        border-radius:8px !important;
        padding:8px !important;
        box-sizing:border-box !important;
        overflow:hidden !important;
    }

    .rank-stt{
        font-size:18px !important;
        line-height:20px !important;
        margin:0 0 6px 0 !important;
    }

    .rank-cover-img{
        width:80px !important;
        height:110px !important;
        object-fit:cover !important;
        border-radius:6px !important;
        display:block !important;
    }

    .rank-text{
        width:100% !important;
        min-width:0 !important;
    }

    .rank-text h3{
        width:100% !important;
        font-size:12px !important;
        line-height:15px !important;
        height:30px !important;
        margin:6px 0 6px 0 !important;

        overflow:hidden !important;
        text-align:left !important;

        display:-webkit-box !important;
        -webkit-line-clamp:2;
        -webkit-box-orient:vertical;
    }

    .rank-row{
        width:100% !important;
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
    }

    .rank-chap{
        color:#69ff7e !important;
        font-size:11px !important;
        white-space:nowrap !important;
    }

    .rank-eye{
        display:flex !important;
        align-items:center !important;
        gap:3px !important;
        font-size:11px !important;
        white-space:nowrap !important;
    }

    .rank-eye img{
        width:11px !important;
        height:11px !important;
    }
}
`;
document.head.appendChild(fixRankingMobileStyle);
setTimeout(function(){

    document.querySelectorAll("#rankList .rank-item img")
    .forEach(function(img){

        img.style.width = "90px";
        img.style.height = "120px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "5px";
    });

},1000);
var fixMobileComicAndRankStyle = document.createElement("style");

fixMobileComicAndRankStyle.innerHTML = `
@media screen and (max-width:768px){

    .main-content{
        display:block !important;
        width:100% !important;
        max-width:100% !important;
        height:auto !important;
        overflow:visible !important;
    }

    .content{
        display:block !important;
        width:100% !important;
        max-width:100% !important;
        height:auto !important;
        overflow:visible !important;
    }

    #comicList{
        width:100% !important;
        display:grid !important;
        grid-template-columns:repeat(3, minmax(0, 1fr)) !important;
        gap:10px !important;
        align-items:start !important;

        height:auto !important;
        max-height:none !important;
        overflow:visible !important;

        box-sizing:border-box !important;
    }

    #comicList .new-comic-card{
        width:100% !important;
        min-width:0 !important;
        max-width:none !important;

        height:215px !important;
        background:#33415a !important;
        border-radius:8px !important;
        padding:6px !important;
        box-sizing:border-box !important;

        overflow:hidden !important;
        color:#fff !important;
        text-decoration:none !important;
    }

    #comicList .new-comic-cover{
        width:100% !important;
        height:150px !important;
        border-radius:6px !important;
        overflow:hidden !important;
        position:relative !important;
    }

    #comicList .new-comic-cover img{
        width:100% !important;
        height:100% !important;
        object-fit:cover !important;
        display:block !important;
    }

    #comicList .new-comic-title{
        font-size:12px !important;
        line-height:15px !important;
        height:30px !important;
        margin:5px 0 5px 0 !important;

        overflow:hidden !important;
        display:-webkit-box !important;
        -webkit-line-clamp:2 !important;
        -webkit-box-orient:vertical !important;
    }

    #comicList .new-comic-bottom{
        display:flex !important;
        justify-content:space-between !important;
        align-items:center !important;
        font-size:11px !important;
    }

    #comicList .new-more-card{
        grid-column:1 / -1 !important;

        width:100% !important;
        height:90px !important;
        min-height:90px !important;
        max-height:90px !important;

        display:flex !important;
        flex-direction:column !important;
        align-items:center !important;
        justify-content:center !important;

        margin:0 0 22px 0 !important;
        padding:0 !important;
    }

    #comicList .new-more-card .more-icon{
        font-size:28px !important;
        line-height:24px !important;
        color:#2ecc71 !important;
        margin-bottom:6px !important;
    }

    #comicList .new-more-card p{
        margin:0 !important;
        font-size:18px !important;
        font-weight:700 !important;
        color:#fff !important;
    }

    .sidebar{
        display:block !important;
        width:100% !important;
        min-width:0 !important;
        max-width:100% !important;

        margin-top:20px !important;
        clear:both !important;

        position:relative !important;
        transform:none !important;
        box-sizing:border-box !important;
    }
}
`;

document.head.appendChild(fixMobileComicAndRankStyle);
loadDataFromSupabase();
