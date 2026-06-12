var ADMIN_EMAIL = "letien.452272@gmail.com";

var mangaBtn = document.getElementById("mangaBtn");
var mangaMenu = document.getElementById("mangaMenu");

if(mangaBtn && mangaMenu){
    mangaBtn.onclick = function(e){
        e.preventDefault();
        mangaMenu.classList.toggle("show");
    };
}

function updateClock(){
    var clock = document.getElementById("clock");

    if(clock){
        var now = new Date();
        clock.innerText =
            now.toLocaleTimeString("vi-VN") + "  " + now.toLocaleDateString("vi-VN");
    }
}

updateClock();
setInterval(updateClock, 1000);

function getSupabase(){
    return window.supabaseClient || null;
}

async function loadAdminInfo(){
    var adminName = document.querySelector(".admin-name");
    var adminRole = document.querySelector(".admin-role");
    var adminAvatar = document.getElementById("adminAvatar");

    var db = getSupabase();

    if(!db){
        console.log("LỖI ADMIN: Không thấy window.supabaseClient");
        return;
    }

    var sessionResult = await db.auth.getSession();

    console.log("ADMIN sessionResult:", sessionResult);

    if(sessionResult.error){
        console.log("LỖI SESSION:", sessionResult.error);
        return;
    }

    var session = sessionResult.data.session;

    if(!session || !session.user){
        console.log("LỖI ADMIN: Chưa có session Supabase. Bạn chưa đăng nhập hoặc login chưa lưu session.");
        return;
    }

    var user = session.user;

    console.log("ADMIN user:", user.email);

    if(String(user.email || "").toLowerCase() !== ADMIN_EMAIL.toLowerCase()){
        console.log("LỖI ADMIN: Email hiện tại không phải admin:", user.email);
        alert("Bạn không có quyền vào admin!");
        window.location.href = "CW.html";
        return;
    }

    if(adminName){
        adminName.textContent =
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email;
    }

    if(adminRole){
        adminRole.textContent = "Admin";
    }

    if(adminAvatar){
        adminAvatar.src = "Image/user.svg";

        var avatarUrl =
            user.user_metadata?.avatar ||
            user.user_metadata?.avatar_url;

        try{
            var profileResult = await db
                .from("profiles")
                .select("avatar, avatar_url")
                .eq("id", user.id)
                .maybeSingle();

            console.log("ADMIN profileResult:", profileResult);

            if(profileResult.data){
                avatarUrl =
                    profileResult.data.avatar ||
                    profileResult.data.avatar_url ||
                    avatarUrl;
            }
        }catch(error){
            console.log("Không đọc được bảng profiles:", error);
        }

        if(avatarUrl){
            adminAvatar.src = avatarUrl;
        }
    }
}

loadAdminInfo();

var themTruyenBtn = document.getElementById("themTruyenBtn");
var danhSachBtn = document.getElementById("danhSachBtn");
var xoaTruyenBtn = document.getElementById("xoaTruyenBtn");

if(themTruyenBtn){
    themTruyenBtn.onclick = function(){
        window.location.href = "ThemTr.html";
    };
}

if(danhSachBtn){
    danhSachBtn.onclick = function(){
        window.location.href = "Danhsach.html";
    };
}

if(xoaTruyenBtn){
    xoaTruyenBtn.onclick = function(e){
        e.preventDefault();
        window.location.href = "Danhsach.html";
    };
}