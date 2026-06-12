var DEFAULT_AVATAR = "Image/user.svg";
var ADMIN_EMAIL = "letien.452272@gmail.com";

var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";

function getSupabase(){
    if(window.supabaseClient){
        return window.supabaseClient;
    }

    if(window.supabase && window.supabase.auth){
        return window.supabase;
    }

    if(typeof supabase !== "undefined" && supabase.auth){
        return supabase;
    }

    return null;
}

async function waitForSupabase(){
    var db = getSupabase();

    if(db){
        return db;
    }

    for(var i = 0; i < 20; i++){
        await new Promise(function(resolve){
            setTimeout(resolve, 100);
        });

        db = getSupabase();

        if(db){
            return db;
        }
    }

    return null;
}

async function getCurrentUser(){
    var db = await waitForSupabase();

    if(!db){
        return null;
    }

    var result = await db.auth.getUser();

    if(result.error || !result.data.user){
        return null;
    }

    var user = result.data.user;

    return {
        id: user.id,
        email: user.email,
        username:
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email,
        avatar:
            user.user_metadata?.avatar ||
            user.user_metadata?.avatar_url ||
            DEFAULT_AVATAR,
        role: String(user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase() ? "admin" : "user",
        raw: user
    };
}

async function registerUser(username, email, password){
    var db = await waitForSupabase();

    if(!db){
        alert("Lỗi: Chưa load supabase.js trước auth.js");
        return false;
    }

    username = String(username || "").trim();
    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    if(!username || !email || !password){
        alert("Vui lòng nhập đầy đủ thông tin.");
        return false;
    }

    var result = await db.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username,
                avatar: DEFAULT_AVATAR
            }
        }
    });

    if(result.error){
        alert("Lỗi đăng ký: " + result.error.message);
        console.log(result.error);
        return false;
    }

    if(result.data && result.data.user){
        await db.from("profiles").upsert({
            id: result.data.user.id,
            email: email,
            username: username,
            avatar: DEFAULT_AVATAR,
            role: email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user"
        });
    }

    alert("Đăng ký thành công.");
    window.location.href = "Loging.html";
    return true;
}

async function loginUser(email, password){
    var db = await waitForSupabase();

    if(!db){
        alert("Lỗi: Chưa load supabase.js trước auth.js");
        return false;
    }

    email = String(email || "").trim().toLowerCase();
    password = String(password || "").trim();

    if(!email || !password){
        alert("Vui lòng nhập email và mật khẩu.");
        return false;
    }

    var result = await db.auth.signInWithPassword({
        email: email,
        password: password
    });

    if(result.error){
        alert("Sai email hoặc mật khẩu.");
        console.log(result.error);
        return false;
    }

    alert("Đăng nhập thành công.");
    window.location.href = "CW.html";
    return true;
}

async function logout(){
    var db = await waitForSupabase();

    if(db){
        await db.auth.signOut();
    }

    window.location.href = "CW.html";
}

async function requireLogin(){
    var user = await getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để dùng chức năng này.");
        window.location.href = "Loging.html";
        return false;
    }

    return true;
}

async function isAdmin(){
    var user = await getCurrentUser();

    if(!user){
        return false;
    }

    return String(user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

async function requireAdmin(){
    var admin = await isAdmin();

    if(!admin){
        alert("Bạn không có quyền truy cập!");
        window.location.href = "CW.html";
        return false;
    }

    return true;
}

async function updateUserMenu(){
    var user = await getCurrentUser();

    var userBtn = document.getElementById("user-btn");
    var userDropdown = document.getElementById("user-dropdown");

    if(!userBtn){
        return;
    }

    var avatar = userBtn.querySelector("img");
    var name = userBtn.querySelector("span");

    if(avatar){
        avatar.src = user ? user.avatar : DEFAULT_AVATAR;
    }

    if(name){
        name.textContent = user ? user.username : "Khách";
    }

    if(userDropdown){
        var headName = userDropdown.querySelector(".user-head h3");
        var headEmail = userDropdown.querySelector(".user-head p");

        if(headName){
            headName.textContent = user ? user.username : "Khách";
        }

        if(headEmail){
            headEmail.textContent = user ? user.email : "Chưa đăng nhập";
        }
    }

    var adminLink = document.getElementById("adminLink");

    if(adminLink){
        adminLink.style.display = user && user.role === "admin" ? "flex" : "none";
    }

    var authLink = document.getElementById("authLink");
    var authText = document.getElementById("authText");

    if(authLink && authText){
        var authIcon = authLink.querySelector("img");

        if(user){
            if(authIcon){
                authIcon.src = "Image/fingerprint-identification.svg";
            }

            authText.textContent = "Đăng Xuất";
            authText.style.color = "#ff4d4f";
            authText.style.fontWeight = "600";
            authLink.href = "#";

            authLink.onclick = function(e){
                e.preventDefault();
                logout();
            };
        }else{
            if(authIcon){
                authIcon.src = "Image/fingerprint.svg";
            }

            authText.textContent = "Đăng Ký";
            authText.style.color = "";
            authText.style.fontWeight = "";
            authLink.href = "Dangky.html";
            authLink.onclick = null;
        }
    }

    var loginLink = document.getElementById("loginLink");

    if(loginLink){
        loginLink.style.display = user ? "none" : "flex";
    }
}

async function updateUser(userUpdate){
    var db = await waitForSupabase();

    if(!db){
        alert("Lỗi Supabase.");
        return;
    }

    var user = await getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập.");
        return;
    }

    var newMetadata = {
        username: userUpdate.username || user.username,
        avatar: userUpdate.avatar || user.avatar
    };

    var result = await db.auth.updateUser({
        data: newMetadata
    });

    if(result.error){
        alert("Lỗi cập nhật tài khoản: " + result.error.message);
        console.log(result.error);
        return;
    }

    await db.from("profiles").upsert({
        id: user.id,
        email: user.email,
        username: newMetadata.username,
        avatar: newMetadata.avatar,
        role: user.role
    });

    await updateUserMenu();
}

async function uploadAvatarToR2(file){
    var user = await getCurrentUser();

    if(!user){
        throw new Error("Bạn cần đăng nhập.");
    }

    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", "avatar");

    var response = await fetch(R2_UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    if(!response.ok){
        var errorText = await response.text();
        throw new Error(errorText || "Upload avatar lên R2 thất bại.");
    }

    var data = await response.json();

    if(!data.url){
        throw new Error("Worker không trả về URL avatar.");
    }

    return data.url;
}

async function changeAvatar(input){
    var user = await getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để đổi avatar.");
        window.location.href = "Loging.html";
        return;
    }

    var file = input.files[0];

    if(!file){
        return;
    }

    if(!file.type.startsWith("image/")){
        alert("Vui lòng chọn file ảnh.");
        return;
    }

    try{
        var avatarUrl = await uploadAvatarToR2(file);

        await updateUser({
            avatar: avatarUrl
        });

        var profileAvatar = document.getElementById("profileAvatar");

        if(profileAvatar){
            profileAvatar.src = avatarUrl;
        }

        alert("Đổi avatar thành công.");
    }catch(error){
        alert("Lỗi đổi avatar: " + error.message);
        console.log(error);
    }
}

async function resetAvatar(){
    var user = await getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập.");
        return;
    }

    await updateUser({
        avatar: DEFAULT_AVATAR
    });

    var profileAvatar = document.getElementById("profileAvatar");

    if(profileAvatar){
        profileAvatar.src = DEFAULT_AVATAR;
    }

    alert("Đã đổi về avatar mặc định.");
}

async function followStory(storyId){
    var user = await getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để theo dõi truyện.");
        window.location.href = "Loging.html";
        return;
    }

    var followList = JSON.parse(localStorage.getItem("followList")) || [];

    var existed = followList.some(function(item){
        return Number(item.id || item.manga_id || item.mangaId) === Number(storyId);
    });

    if(existed){
        alert("Bạn đã theo dõi truyện này rồi.");
        return;
    }

    followList.push({
        id: Number(storyId),
        seenChapter: 0,
        latestChapter: 0,
        createdAt: new Date().toISOString()
    });

    localStorage.setItem("followList", JSON.stringify(followList));
    alert("Đã theo dõi truyện.");
}

async function unfollowStory(storyId){
    var user = await getCurrentUser();

    if(!user){
        return;
    }

    var followList = JSON.parse(localStorage.getItem("followList")) || [];

    followList = followList.filter(function(item){
        return Number(item.id || item.manga_id || item.mangaId) !== Number(storyId);
    });

    localStorage.setItem("followList", JSON.stringify(followList));
    alert("Đã bỏ theo dõi truyện.");
}

document.addEventListener("DOMContentLoaded", function(){
    updateUserMenu();
});
