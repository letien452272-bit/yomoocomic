if(typeof updateUserMenu === "function"){
    updateUserMenu();
}


/* =========================
   MENU THE LOAI
========================= */

var genreBtn = document.getElementById("genre-btn");
var genreDropdown = document.getElementById("genre-dropdown");
var genreMenu = document.getElementById("genre-menu");
var genreArrow = document.getElementById("genre-arrow");

if(genreBtn && genreDropdown && genreMenu && genreArrow){

    genreBtn.onclick = function(e){

        e.preventDefault();
        e.stopPropagation();

        genreDropdown.classList.toggle("show");

        genreArrow.src =
            genreDropdown.classList.contains("show")
                ? "Image/angle-small-up.svg"
                : "Image/angle-small-down.svg";

    };


    document.addEventListener("click", function(e){

        if(!genreMenu.contains(e.target)){

            genreDropdown.classList.remove("show");

            genreArrow.src =
                "Image/angle-small-down.svg";

        }

    });

}


/* =========================
   MENU USER
========================= */

var userBtn = document.getElementById("user-btn");
var userDropdown = document.getElementById("user-dropdown");
var userArrow = document.getElementById("user-arrow");

if(userBtn && userDropdown && userArrow){

    userBtn.onclick = function(e){

        e.preventDefault();
        e.stopPropagation();

        userDropdown.classList.toggle("show");

        userArrow.textContent =
            userDropdown.classList.contains("show")
                ? "^"
                : "v";

    };


    document.addEventListener("click", function(){

        userDropdown.classList.remove("show");

        userArrow.textContent = "v";

    });

}


/* =========================
   DATA
========================= */

var comicList =
    document.getElementById("comicList");

var comingList =
    document.getElementById("comingList");

var mangas = [];


/* =========================
   HÀM LẤY THỜI GIAN CHAPTER
========================= */

function getChapterDate(chapter){

    if(!chapter){
        return 0;
    }

    var dateValue =
        chapter.created_at ||
        chapter.updated_at ||
        chapter.published_at ||
        chapter.createdAt ||
        chapter.updatedAt ||
        "";

    if(!dateValue){
        return 0;
    }

    var time =
        new Date(dateValue).getTime();

    return isNaN(time)
        ? 0
        : time;

}


/* =========================
   HÀM TÌM CHAPTER MỚI NHẤT
   ƯU TIÊN SỐ CHAPTER LỚN NHẤT
========================= */

function getLatestChapter(chapters){

    if(
        !Array.isArray(chapters) ||
        chapters.length === 0
    ){

        return null;

    }


    var validChapters =
        chapters.filter(
            function(chapter){

                return chapter &&
                    chapter.number !== undefined &&
                    chapter.number !== null &&
                    chapter.number !== "";

            }
        );


    if(validChapters.length === 0){

        return null;

    }


    validChapters.sort(
        function(a, b){

            var numberA =
                Number(a.number) || 0;

            var numberB =
                Number(b.number) || 0;


            return numberB - numberA;

        }
    );


    return validChapters[0];

}


/* =========================
   TẢI DỮ LIỆU SUPABASE
========================= */

async function loadDataFromSupabase(){

    console.log(
        "===== BẮT ĐẦU TẢI DỮ LIỆU CW ====="
    );


    /* =========================
       LẤY MANGAS
    ========================= */

    var mangaResult =
        await supabase
            .from("mangas")
            .select("*")
            .order("id", {
                ascending: false
            });


    if(mangaResult.error){

        console.error(
            "Lỗi tải mangas:",
            mangaResult.error
        );

        alert(
            "Lỗi tải truyện: " +
            mangaResult.error.message
        );

        return;

    }


    /* =========================
       LẤY CHAPTERS
       CW ĐỌC TRỰC TIẾP TỪ ĐÂY
    ========================= */

    var chapterResult =
        await supabase
            .from("chapters")
            .select("*");


    if(chapterResult.error){

        console.error(
            "Lỗi tải chapters:",
            chapterResult.error
        );

        alert(
            "Lỗi tải chapter: " +
            chapterResult.error.message
        );

        return;

    }


    var chapters =
        chapterResult.data || [];


    console.log(
        "Tổng số truyện:",
        mangaResult.data
            ? mangaResult.data.length
            : 0
    );


    console.log(
        "Tổng số chapter:",
        chapters.length
    );


    /* =========================
       XỬ LÝ TỪNG TRUYỆN
    ========================= */

    mangas =
        (mangaResult.data || []).map(
            function(manga){

                /* =========================
                   LẤY CHAPTER CỦA TRUYỆN NÀY
                ========================= */

                var mangaChapters =
                    chapters.filter(
                        function(chapter){

                            return Number(
                                chapter.manga_id
                            ) ===
                            Number(
                                manga.id
                            );

                        }
                    );


                manga.chapters =
                    mangaChapters;


                /* =========================
                   CÓ CHAPTER
                ========================= */

                if(mangaChapters.length > 0){

                    manga.releaseStatus =
                        "released";


                    /* =========================
                       TÌM CHAPTER SỐ LỚN NHẤT
                    ========================= */

                    var latestChapter =
                        getLatestChapter(
                            mangaChapters
                        );


                    if(latestChapter){

                        /* =========================
                           SỐ CHAPTER MỚI NHẤT
                        ========================= */

                        manga.latestChapter =
                            Number(
                                latestChapter.number
                            ) || 0;


                        /* =========================
                           THỜI GIAN CHAPTER MỚI NHẤT
                        ========================= */

                        manga.latestChapterCreatedAt =
                            latestChapter.created_at ||
                            latestChapter.updated_at ||
                            latestChapter.published_at ||
                            latestChapter.createdAt ||
                            latestChapter.updatedAt ||
                            "";


                        /* =========================
                           THỜI GIAN UPDATE TRUYỆN
                        ========================= */

                        manga.updatedAt =
                            manga.latestChapterCreatedAt ||
                            manga.updated_at ||
                            manga.created_at ||
                            "";


                        console.log(
                            "===== CW MANGA ====="
                        );


                        console.log(
                            "Tên:",
                            manga.title
                        );


                        console.log(
                            "ID:",
                            manga.id
                        );


                        console.log(
                            "Tổng chapter:",
                            mangaChapters.length
                        );


                        console.log(
                            "Chapter mới nhất:",
                            latestChapter.number
                        );


                        console.log(
                            "Chapter ID:",
                            latestChapter.id
                        );


                        console.log(
                            "Chapter created_at:",
                            latestChapter.created_at
                        );


                        console.log(
                            "Chapter updated_at:",
                            latestChapter.updated_at
                        );


                        console.log(
                            "updatedAt:",
                            manga.updatedAt
                        );

                    }

                }


                /* =========================
                   CHƯA CÓ CHAPTER
                ========================= */

                else{

                    manga.releaseStatus =
                        "upcoming";


                    /*
                       Chỉ dùng latest_chapter
                       làm fallback nếu chưa có
                       chapter thực tế.
                    */

                    manga.latestChapter =
                        Number(
                            manga.latest_chapter
                        ) || 0;


                    manga.latestChapterCreatedAt =
                        "";


                    manga.updatedAt =
                        manga.updated_at ||
                        manga.created_at ||
                        "";

                }


                console.log(
                    "CW:",
                    manga.title,
                    "| Chap:",
                    manga.latestChapter,
                    "| Ngày:",
                    manga.updatedAt
                );


                return manga;

            }
        );


    /* =========================
       RENDER
    ========================= */

    renderUpdatedMangas();

    renderComingMangas();

    renderRanking();

    renderHistory();

    setupBanner();


    console.log(
        "===== CW TẢI DỮ LIỆU XONG ====="
    );

}


/* =========================
   LẤY CHAPTER MỚI NHẤT
========================= */

function getChapterNumber(manga){

    var maxChapter = 0;


    /* =========================
       CHAPTERS LÀ NGUỒN CHÍNH
    ========================= */

    if(
        Array.isArray(manga.chapters) &&
        manga.chapters.length > 0
    ){

        manga.chapters.forEach(
            function(chapter){

                var num =
                    Number(
                        chapter.number
                    ) || 0;


                if(num > maxChapter){

                    maxChapter = num;

                }

            }
        );

    }


    /* =========================
       NẾU CHƯA CÓ CHAPTER
       MỚI DÙNG latest_chapter
    ========================= */

    if(maxChapter === 0){

        maxChapter =
            Number(
                manga.latest_chapter
            ) || 0;

    }


    return maxChapter;

}


/* =========================
   LẤY LƯỢT XEM
========================= */

function getViewNumber(manga){

    return Number(
        manga.views ||
        manga.view ||
        0
    );

}


/* =========================
   TÍNH THỜI GIAN
========================= */

function getTimeAgo(dateString){

    if(!dateString){

        return "";

    }


    var now =
        new Date();


    var updateDate =
        new Date(dateString);


    if(
        isNaN(
            updateDate.getTime()
        )
    ){

        return "";

    }


    var diff =
        now - updateDate;


    var minutes =
        Math.floor(
            diff /
            (1000 * 60)
        );


    var hours =
        Math.floor(
            diff /
            (1000 * 60 * 60)
        );


    var days =
        Math.floor(
            diff /
            (1000 * 60 * 60 * 24)
        );


    if(minutes < 1){

        return "Vừa xong";

    }


    if(hours < 1){

        return minutes +
            " phút trước";

    }


    if(hours < 24){

        return hours +
            " giờ trước";

    }


    if(days < 30){

        return days +
            " ngày trước";

    }


    return "NEW";

}


/* =========================
   MỞ TRUYỆN
========================= */

function openMangaUser(id){

    localStorage.setItem(
        "currentMangaId",
        id
    );


    window.location.href =
        "TD.html?id=" + id;

}


/* =========================
   TRUYỆN MỚI CẬP NHẬT
========================= */

function renderUpdatedMangas(){

    if(!comicList){

        return;

    }


    comicList.innerHTML = "";


    /* =========================
       CHỈ LẤY TRUYỆN ĐÃ CÓ CHAPTER
    ========================= */

    var releasedMangas =
        mangas.filter(
            function(manga){

                return getChapterNumber(manga) > 0;

            }
        );


    /* =========================
       SẮP XẾP TRUYỆN
       ƯU TIÊN THỜI GIAN CHAPTER
       NẾU KHÔNG CÓ THỜI GIAN
       THÌ SO SÁNH SỐ CHAPTER
    ========================= */

    releasedMangas.sort(
        function(a, b){

            var timeA =
                new Date(
                    a.latestChapterCreatedAt ||
                    a.updatedAt ||
                    a.updated_at ||
                    a.created_at ||
                    0
                ).getTime();


            var timeB =
                new Date(
                    b.latestChapterCreatedAt ||
                    b.updatedAt ||
                    b.updated_at ||
                    b.created_at ||
                    0
                ).getTime();


            if(isNaN(timeA)){

                timeA = 0;

            }


            if(isNaN(timeB)){

                timeB = 0;

            }


            /* =========================
               CÓ THỜI GIAN
            ========================= */

            if(timeA !== timeB){

                return timeB - timeA;

            }


            /* =========================
               KHÔNG CÓ THỜI GIAN
               SO SÁNH SỐ CHAPTER
            ========================= */

            return (
                getChapterNumber(b) -
                getChapterNumber(a)
            );

        }
    );


    var limitUpdatedMangas =
        window.innerWidth <= 768
            ? 9
            : 14;


    var displayMangas =
        releasedMangas.slice(
            0,
            limitUpdatedMangas
        );


    /* =========================
       KHÔNG CÓ TRUYỆN
    ========================= */

    if(displayMangas.length === 0){

        comicList.innerHTML = `

            <p
                style="
                    color:white;
                    text-align:center;
                    width:100%;
                    grid-column:1/-1;
                "
            >
                Chưa có truyện mới cập nhật
            </p>


            <a
                href="alltr.html"
                class="new-comic-card new-more-card"
            >

                <div class="more-icon">
                    ›
                </div>


                <p>
                    Xem thêm
                </p>

            </a>

        `;

        return;

    }


    /* =========================
       HIỂN THỊ TRUYỆN
    ========================= */

    displayMangas.forEach(
        function(manga){

            var comic =
                document.createElement("a");


            comic.className =
                "new-comic-card";


            comic.href =
                "TD.html?id=" +
                manga.id;


            var updateTime =
                manga.latestChapterCreatedAt ||
                manga.updatedAt ||
                manga.updated_at ||
                manga.created_at;


            var timeText =
                getTimeAgo(updateTime) ||
                "NEW";


            comic.innerHTML = `

                <div class="new-comic-cover">

                    ${
                        timeText
                            ? `
                                <div class="time-badge">
                                    ${timeText}
                                </div>
                              `
                            : ""
                    }


                    <img
                        src="${
                            manga.cover ||
                            "Image/no-image.png"
                        }"
                        alt="${
                            manga.title ||
                            "Không tên"
                        }"
                        onerror="
                            this.src='Image/no-image.png'
                        "
                    >

                </div>


                <h3 class="new-comic-title">

                    ${
                        manga.title ||
                        "Không tên"
                    }

                </h3>


                <div class="new-comic-bottom">

                    <span>
                        Ch.${getChapterNumber(manga)}
                    </span>


                    <span class="new-comic-view">

                        <img
                            src="Image/eye.svg"
                            alt=""
                        >


                        ${
                            getViewNumber(manga)
                        }

                    </span>

                </div>

            `;


            comic.onclick =
                function(){

                    localStorage.setItem(
                        "currentMangaId",
                        manga.id
                    );

                };


            comicList.appendChild(
                comic
            );

        }
    );


    /* =========================
       XEM THÊM
    ========================= */

    comicList.innerHTML += `

        <a
            href="alltr.html"
            class="new-comic-card new-more-card"
        >

            <div class="more-icon">
                ›
            </div>


            <p>
                Xem thêm
            </p>

        </a>

    `;

}


/* =========================
   TRUYỆN SẮP RA MẮT
========================= */

function renderComingMangas(){

    if(!comingList){

        return;

    }


    var upcomingMangas =
        mangas.filter(
            function(manga){

                return getChapterNumber(manga) === 0;

            }
        );


    upcomingMangas.sort(
        function(a, b){

            return Number(b.id) -
                Number(a.id);

        }
    );


    if(upcomingMangas.length === 0){

        comingList.innerHTML =
            "<p>Chưa có truyện sắp ra mắt</p>";

        return;

    }


    comingList.innerHTML =
        upcomingMangas.map(
            function(manga){

                return `

                    <div
                        class="coming-item"
                        onclick="
                            openMangaUser(${manga.id})
                        "
                    >

                        <img
                            src="${
                                manga.cover ||
                                "Image/no-image.png"
                            }"
                            alt=""
                        >


                        <h3>
                            ${
                                manga.title ||
                                "Không tên"
                            }
                        </h3>


                        <p>

                            <img
                                class="bookmark"
                                src="Image/bookmark.svg"
                                alt=""
                            >


                            ${
                                manga.follows ||
                                0
                            }

                        </p>

                    </div>

                `;

            }
        ).join("");

}


/* =========================
   BẢNG XẾP HẠNG
========================= */

function renderRanking(){

    var rankList =
        document.getElementById(
            "rankList"
        );


    if(!rankList){

        return;

    }


    var ranking =
        mangas.filter(
            function(manga){

                return getChapterNumber(manga) > 0;

            }
        );


    ranking.sort(
        function(a, b){

            return getViewNumber(b) -
                getViewNumber(a);

        }
    );


    ranking =
        ranking.slice(0, 10);


    if(ranking.length === 0){

        rankList.innerHTML =
            "<p>Chưa có truyện xếp hạng</p>";

        return;

    }


    rankList.innerHTML =
        ranking.map(
            function(
                manga,
                index
            ){

                return `

                    <div
                        class="rank-card"
                        onclick="
                            openMangaUser(${manga.id})
                        "
                    >

                        <div class="rank-stt">
                            ${index + 1}
                        </div>


                        <img
                            class="rank-cover-img"
                            src="${
                                manga.cover ||
                                "Image/LOGO WEB.png"
                            }"
                            alt=""
                        >


                        <div class="rank-text">

                            <h3>
                                ${
                                    manga.title ||
                                    "Không tên"
                                }
                            </h3>


                            <div class="rank-row">

                                <span
                                    class="rank-chap"
                                >
                                    Ch.${
                                        getChapterNumber(
                                            manga
                                        )
                                    }
                                </span>


                                <span
                                    class="rank-eye"
                                >

                                    <img
                                        src="Image/eye.svg"
                                        alt=""
                                    >


                                    ${
                                        getViewNumber(
                                            manga
                                        )
                                    }

                                </span>

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================
   BANNER
========================= */

function setupBanner(){

    var bannerImg =
        document.getElementById(
            "bannerImg"
        );


    var bannerTitle =
        document.getElementById(
            "bannerTitle"
        );


    var bannerBtn =
        document.getElementById(
            "bannerBtn"
        );


    var prevBanner =
        document.getElementById(
            "prevBanner"
        );


    var nextBanner =
        document.getElementById(
            "nextBanner"
        );


    var bannerList =
        mangas.filter(
            function(manga){

                return manga.cover;

            }
        ).slice(0, 10);


    var currentBanner = 0;


    function showBanner(index){

        if(
            !bannerImg ||
            bannerList.length === 0
        ){

            return;

        }


        bannerImg.classList.add(
            "slide-out"
        );


        setTimeout(
            function(){

                if(index < 0){

                    currentBanner =
                        bannerList.length - 1;

                }else if(
                    index >=
                    bannerList.length
                ){

                    currentBanner = 0;

                }else{

                    currentBanner =
                        index;

                }


                var manga =
                    bannerList[
                        currentBanner
                    ];


                bannerImg.src =
                    manga.cover ||
                    "Image/6.jpg";


                bannerTitle.innerText =
                    manga.title ||
                    "Không tên";


                if(bannerBtn){

                    bannerBtn.onclick =
                        function(e){

                            e.preventDefault();

                            openMangaUser(
                                manga.id
                            );

                        };

                }


                bannerImg.classList.remove(
                    "slide-out"
                );

            },
            300
        );

    }


    if(bannerList.length > 0){

        showBanner(0);


        setInterval(
            function(){

                showBanner(
                    currentBanner + 1
                );

            },
            5500
        );

    }


    if(prevBanner){

        prevBanner.onclick =
            function(){

                showBanner(
                    currentBanner - 1
                );

            };

    }


    if(nextBanner){

        nextBanner.onclick =
            function(){

                showBanner(
                    currentBanner + 1
                );

            };

    }

}


/* =========================
   LỊCH SỬ ĐỌC
========================= */

function renderHistory(){

    var historyList =
        document.getElementById(
            "historyList"
        );


    if(!historyList){

        return;

    }


    var history = [];


    try{

        history =
            JSON.parse(
                localStorage.getItem(
                    "readingHistory"
                )
            ) || [];

    }catch(e){

        history = [];

    }


    historyList.classList.add(
        "history-grid"
    );


    historyList.innerHTML = "";


    if(history.length === 0){

        historyList.innerHTML =
            `<p class="history-empty">
                Chưa có lịch sử đọc
             </p>`;

        return;

    }


    history
        .slice(0, 10)
        .forEach(
            function(id){

                var manga =
                    mangas.find(
                        function(item){

                            return Number(
                                item.id
                            ) === Number(id);

                        }
                    );


                if(!manga){

                    return;

                }


                var card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "history-card";


                card.onclick =
                    function(){

                        openMangaUser(
                            manga.id
                        );

                    };


                card.innerHTML = `

                    <div class="history-cover">

                        <img
                            src="${
                                manga.cover ||
                                "Image/no-image.png"
                            }"
                            alt="${
                                manga.title ||
                                "Không tên"
                            }"
                            onerror="
                                this.src='Image/no-image.png'
                            "
                        >

                    </div>


                    <h3 class="history-title">

                        ${
                            manga.title ||
                            "Không tên"
                        }

                    </h3>


                    <div class="history-bottom">

                        <span>
                            Chap ${
                                getChapterNumber(
                                    manga
                                )
                            }
                        </span>

                    </div>

                `;


                historyList.appendChild(
                    card
                );

            }
        );


    if(
        historyList.innerHTML.trim() === ""
    ){

        historyList.innerHTML =
            `<p class="history-empty">
                Chưa có lịch sử đọc
             </p>`;

    }

}


/* =========================================================
   CSS - TRUYỆN MỚI
========================================================= */

var fixNewComicStyle =
    document.createElement("style");


fixNewComicStyle.innerHTML = `

@media screen and (min-width:769px){

    #comicList{
        display:grid !important;
        grid-template-columns:
            repeat(5, 150px) !important;
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


    #comicList .new-comic-bottom
    span:first-child{

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


document.head.appendChild(
    fixNewComicStyle
);


/* =========================================================
   CSS - RANKING DESKTOP
========================================================= */

var fixRankingStyle =
    document.createElement("style");


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

        grid-template-columns:
            32px 90px 1fr !important;

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


document.head.appendChild(
    fixRankingStyle
);


/* =========================================================
   CSS - MOBILE RANKING
========================================================= */

var fixRankingMobileStyle =
    document.createElement("style");


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

        -webkit-line-clamp:2 !important;

        -webkit-box-orient:vertical !important;

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


document.head.appendChild(
    fixRankingMobileStyle
);


/* =========================================================
   FIX ẢNH RANKING CŨ
========================================================= */

setTimeout(
    function(){

        document
            .querySelectorAll(
                "#rankList .rank-item img"
            )
            .forEach(
                function(img){

                    img.style.width =
                        "90px";

                    img.style.height =
                        "120px";

                    img.style.objectFit =
                        "cover";

                    img.style.borderRadius =
                        "5px";

                }
            );

    },
    1000
);


/* =========================================================
   CSS - MOBILE TRUYỆN + RANKING
========================================================= */

var fixMobileComicAndRankStyle =
    document.createElement("style");


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

        grid-template-columns:
            repeat(3, minmax(0, 1fr))
            !important;

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


    #comicList .new-more-card
    .more-icon{

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


document.head.appendChild(
    fixMobileComicAndRankStyle
);


/* =========================================================
   CSS - LỊCH SỬ ĐỌC
========================================================= */

var fixHistoryStyle =
    document.createElement("style");


fixHistoryStyle.innerHTML = `

#historyList.history-grid{

    width:100% !important;

    display:flex !important;

    flex-direction:row !important;

    justify-content:center !important;

    align-items:flex-start !important;

    gap:16px !important;

    flex-wrap:wrap !important;

    margin-top:18px !important;

    padding:0 10px 25px !important;

    box-sizing:border-box !important;

}


#historyList .history-card{

    width:135px !important;

    min-width:135px !important;

    max-width:135px !important;

    display:flex !important;

    flex-direction:column !important;

    align-items:center !important;

    background:transparent !important;

    color:#fff !important;

    text-align:center !important;

    cursor:pointer !important;

    overflow:hidden !important;

}


#historyList .history-cover{

    width:120px !important;

    height:170px !important;

    border-radius:6px !important;

    overflow:hidden !important;

    background:#26364a !important;

}


#historyList .history-cover img{

    width:100% !important;

    height:100% !important;

    object-fit:cover !important;

    display:block !important;

}


#historyList .history-title{

    width:120px !important;

    font-size:13px !important;

    line-height:16px !important;

    height:32px !important;

    margin:8px 0 4px 0 !important;

    color:#fff !important;

    font-weight:700 !important;

    text-align:center !important;

    overflow:hidden !important;

    display:-webkit-box !important;

    -webkit-line-clamp:2 !important;

    -webkit-box-orient:vertical !important;

}


#historyList .history-bottom{

    width:120px !important;

    display:flex !important;

    justify-content:center !important;

    align-items:center !important;

    font-size:12px !important;

    color:#69ff7e !important;

    font-weight:700 !important;

}


#historyList .history-empty{

    width:100% !important;

    text-align:center !important;

    color:#fff !important;

    font-size:16px !important;

    margin:0 !important;

}


/* MOBILE */

@media screen and (max-width:768px){

    #historyList.history-grid{

        justify-content:flex-start !important;

        flex-wrap:nowrap !important;

        overflow-x:auto !important;

        overflow-y:hidden !important;

        gap:10px !important;

        padding:0 8px 12px !important;

        box-sizing:border-box !important;

    }


    #historyList .history-card{

        width:105px !important;

        min-width:105px !important;

        max-width:105px !important;

    }


    #historyList .history-cover{

        width:90px !important;

        height:128px !important;

    }


    #historyList .history-title{

        width:90px !important;

        font-size:12px !important;

        line-height:15px !important;

        height:30px !important;

        margin:6px 0 4px 0 !important;

    }


    #historyList .history-bottom{

        width:90px !important;

        font-size:11px !important;

    }

}

`;

document.head.appendChild(
    fixHistoryStyle
);


/* =========================================================
   CHẠY DỮ LIỆU
========================================================= */

loadDataFromSupabase();
