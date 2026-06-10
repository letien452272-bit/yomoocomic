var mangaBtn = document.getElementById("mangaBtn");
var mangaMenu = document.getElementById("mangaMenu");

if (mangaBtn && mangaMenu) {
    mangaBtn.onclick = function (e) {
        e.preventDefault();
        mangaMenu.classList.toggle("show");
    };
}

function updateClock() {
    var clock = document.getElementById("clock");

    if (clock) {
        var now = new Date();
        clock.innerText =
            now.toLocaleTimeString("vi-VN") + "  " + now.toLocaleDateString("vi-VN");
    }
}

updateClock();
setInterval(updateClock, 1000);

/* CHẶN USER THƯỜNG VÀO ADMIN */
if (typeof requireAdmin === "function") {
    if (requireAdmin()) {
        var user = getCurrentUser();

        var adminName = document.querySelector(".admin-name");
        var adminRole = document.querySelector(".admin-role");

        if (adminName) {
            adminName.textContent = user.username;
        }

        if (adminRole) {
            adminRole.textContent = "Admin";
        }
    }
}

/* CHUYỂN TRANG TRONG ADMIN */
var themTruyenBtn = document.getElementById("themTruyenBtn");
var danhSachBtn = document.getElementById("danhSachBtn");
var xoaTruyenBtn = document.getElementById("xoaTruyenBtn");

if (themTruyenBtn) {
    themTruyenBtn.onclick = function () {
        window.location.href = "ThemTr.html";
    };
}

if (danhSachBtn) {
    danhSachBtn.onclick = function () {
        window.location.href = "Danhsach.html";
    };
}

if (xoaTruyenBtn) {
    xoaTruyenBtn.onclick = function (e) {
        e.preventDefault();
        window.location.href = "Danhsach.html";
    };
}