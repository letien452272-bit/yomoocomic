var DEFAULT_AVATAR = "Image/user.svg";
const R2_UPLOAD_URL = atob("aHR0cHM6Ly9kYXJrLXNub3ctOTcxMS5sZXRpZW4tNDUyMjcyLndvcmtlcnMuZGV2");

/* ================== ADMIN NAME RULE ================== */

function normalizeName(name){
    return String(name || "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "");
}

function isAdminEmail(){
    return false;
}
function isBlockedAdminName(name){
    var cleanName = normalizeName(name);

    /*
        Chặn:
        admin
        admin1
        admin2
        admin123
        Admin
        ADMIN
        a d m i n
    */
    return /^admin\d*$/.test(cleanName);
}

function getSafeUsername(username, email){
    if(isAdminEmail(email)){
        return "Admin";
    }

    return String(username || "").trim();
}

function getDisplayName(user){
    if(!user){
        return "Khách";
    }

    var email = String(user.email || "").toLowerCase();

    if(isAdminEmail(email)){
        return "Admin";
    }

    return (
        user.username ||
        user.name ||
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Người dùng"
    );
}

/* ================== SUPABASE ================== */

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

    var role = "user";

    try{
        var profile = await db
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if(profile.data){
            role = profile.data.role || "user";
        }
    }catch(e){}

    return {
        id: user.id,
        email: user.email,
        username:
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email,
        name:
            user.user_metadata?.username ||
            user.user_metadata?.name ||
            user.email,
        avatar:
            user.user_metadata?.avatar ||
            user.user_metadata?.avatar_url ||
            DEFAULT_AVATAR,
        role: role,
        raw: user
    };
}

/* ================== REGISTER / LOGIN ================== */

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

    if(isBlockedAdminName(username)){
        alert("Tên này không được phép sử dụng.");
        return false;
    }

    username = getSafeUsername(username, email);

    var role = "user";

    var result = await db.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                username: username,
                name: username,
                avatar: DEFAULT_AVATAR,
                role: role
            }
        }
    });

    if(result.error){
        alert("Lỗi đăng ký: " + result.error.message);
        console.log(result.error);
        return false;
    }

    if(result.data && result.data.user){
        console.log("User created:", result.data.user);
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

    /*
        Nếu là admin thật thì ép metadata tên Admin sau khi login.
    */
    if(isAdminEmail(email)){
        await db.auth.updateUser({
            data: {
                username: "Admin",
                name: "Admin",
                role: "admin"
            }
        });
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

    localStorage.removeItem("currentUser");
    localStorage.removeItem("loginUser");
    localStorage.removeItem("loggedInUser");

    window.location.href = "CW.html";
}

/* ================== REQUIRE LOGIN / ADMIN ================== */

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
    const db = await waitForSupabase();

    const user = await getCurrentUser();

    if(!user) return false;

    const { data, error } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if(error || !data){
        return false;
    }

    return data.role === "admin";
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

/* ================== UPDATE MENU ================== */

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
        name.textContent = user ? getDisplayName(user) : "Khách";
    }

    if(userDropdown){
        var headName = userDropdown.querySelector(".user-head h3");
        var headEmail = userDropdown.querySelector(".user-head p");

        if(headName){
            headName.textContent = user ? getDisplayName(user) : "Khách";
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

/* ================== UPDATE USER ================== */

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

    var newUsername = userUpdate.username || user.username;
    var newAvatar = userUpdate.avatar || user.avatar;

    if(user.role === "admin"){
    newUsername = "Admin";
}else{
        if(isBlockedAdminName(newUsername)){
            alert("Tên này không được phép sử dụng.");
            return;
        }
    }

    var newMetadata = {
        username: newUsername,
        name: newUsername,
        avatar: newAvatar,
        role: user.role
    };

    var result = await db.auth.updateUser({
        data: newMetadata
    });

    if(result.error){
        alert("Lỗi cập nhật tài khoản: " + result.error.message);
        console.log(result.error);
        return;
    }

    /*
        Nếu có bảng profiles thì cập nhật.
        Nếu bảng chưa có hoặc RLS chặn thì chỉ log lỗi, không làm hỏng web.
    */
    try{
        var profileResult = await db.from("profiles").upsert({
            id: user.id,
            email: user.email,
            username: newUsername,
            avatar: newAvatar,
            role: user.role
        });

        if(profileResult.error){
            console.log("Không cập nhật được profiles:", profileResult.error);
        }
    }catch(e){
        console.log("Bỏ qua cập nhật profiles:", e);
    }

    await updateUserMenu();
}

/* ================== AVATAR ================== */

async function uploadAvatarToR2(file){
    var user = await getCurrentUser();

    if(!user){
        throw new Error("Bạn cần đăng nhập.");
    }

    var formData = new FormData();

    formData.append("file", file);

    /*
        Worker hiện tại của bạn chưa nhận type avatar,
        dùng cover để upload được ảnh rồi lấy URL làm avatar.
    */
    formData.append("type", "cover");

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
        input.value = "";
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

        input.value = "";

        alert("Đổi avatar thành công.");
    }catch(error){
        input.value = "";
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

/* ================== FOLLOW ================== */

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
