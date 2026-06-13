var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";
var R2_PUBLIC_URL = "https://pub-feac672c19c646b4b97ff6a2ac5ce733.r2.dev";

var currentSupabaseUser = null;

/* ================== SUPABASE ================== */

function getSupabaseClient(){
    return window.supabaseClient || window.supabase || null;
}

async function getCurrentSupabaseUser(){
    var db = getSupabaseClient();

    if(!db || !db.auth){
        return null;
    }

    var result = await db.auth.getUser();

    if(result.error || !result.data || !result.data.user){
        return null;
    }

    return result.data.user;
}

function getUserName(user){
    if(!user){
        return "Khách";
    }

    return (
        user.user_metadata?.username ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Người dùng"
    );
}

function getUserAvatar(user){
    if(!user){
        return "Image/user.svg";
    }

    return user.user_metadata?.avatar || "Image/user.svg";
}

function getUserRole(user){
    if(!user){
        return "user";
    }

    if(user.email === "letien.452272@gmail.com"){
        return "admin";
    }

    return user.user_metadata?.role || "user";
}

async function updateSupabaseUserMetadata(newData){
    var db = getSupabaseClient();

    if(!db || !db.auth){
        throw new Error("Chưa load Supabase.");
    }

    var oldMetadata = currentSupabaseUser?.user_metadata || {};

    var result = await db.auth.updateUser({
        data: Object.assign({}, oldMetadata, newData)
    });

    if(result.error){
        throw new Error(result.error.message);
    }

    currentSupabaseUser = result.data.user;

    return currentSupabaseUser;
}

/* ================== HIỂN THỊ HỒ SƠ ================== */

function setTextOrValue(id, value){
    var el = document.getElementById(id);

    if(!el){
        return;
    }

    if("value" in el){
        el.value = value || "";
    }else{
        el.textContent = value || "";
    }
}

function renderProfile(user){
    var username = getUserName(user);
    var email = user?.email || "";
    var role = getUserRole(user);
    var avatar = getUserAvatar(user);

    var avatarImg = document.getElementById("profileAvatar");

    if(avatarImg){
        avatarImg.src = avatar;
    }

    setTextOrValue("username", username);
    setTextOrValue("userName", username);
    setTextOrValue("profileName", username);
    setTextOrValue("profileUsername", username);
    setTextOrValue("usernameInput", username);

    setTextOrValue("email", email);
    setTextOrValue("userEmail", email);
    setTextOrValue("profileEmail", email);
    setTextOrValue("emailInput", email);

    setTextOrValue("role", role);
    setTextOrValue("userRole", role);
    setTextOrValue("profileRole", role);
    setTextOrValue("roleInput", role);

    var userBtn = document.getElementById("user-btn");

    if(userBtn){
        var avatarMenu = userBtn.querySelector("img");
        var nameMenu = userBtn.querySelector("span");

        if(avatarMenu){
            avatarMenu.src = avatar;
        }

        if(nameMenu){
            nameMenu.textContent = username;
        }
    }

    var userHead = document.querySelector(".user-head");

    if(userHead){
        var h3 = userHead.querySelector("h3");
        var p = userHead.querySelector("p");

        if(h3){
            h3.textContent = username;
        }

        if(p){
            p.textContent = email;
        }
    }

    var authText = document.getElementById("authText");
    var authLink = document.getElementById("authLink");
    var loginLink = document.getElementById("loginLink");
    var adminLink = document.getElementById("adminLink");

    if(authText){
        authText.textContent = "Đăng xuất";
    }

    if(authLink){
        authLink.href = "#";
        authLink.onclick = function(e){
            e.preventDefault();
            logoutAccount();
        };
    }

    if(loginLink){
        loginLink.style.display = "none";
    }

    if(adminLink){
        adminLink.style.display = role === "admin" ? "flex" : "none";
    }
}

async function loadProfile(){
    currentSupabaseUser = await getCurrentSupabaseUser();

    if(!currentSupabaseUser){
        alert("Bạn cần đăng nhập để dùng chức năng này.");
        window.location.href = "Loging.html";
        return;
    }

    renderProfile(currentSupabaseUser);
}

/* ================== AVATAR R2 ================== */

async function uploadAvatarToR2(file){
    if(!currentSupabaseUser){
        throw new Error("Bạn cần đăng nhập.");
    }

    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", "avatar");
    formData.append("userEmail", currentSupabaseUser.email);

    var response = await fetch(R2_UPLOAD_URL, {
        method: "POST",
        body: formData
    });

    if(!response.ok){
        var errorText = await response.text();
        throw new Error(errorText || "Upload avatar lên R2 thất bại!");
    }

    var data = await response.json();

    if(!data.url){
        throw new Error("Worker không trả về URL ảnh.");
    }

    return data.url;
}

async function changeAvatar(input){
    var file = input.files[0];

    if(!file){
        return;
    }

    if(!file.type.startsWith("image/")){
        alert("Vui lòng chọn file ảnh!");
        input.value = "";
        return;
    }

    try{
        var avatarUrl = await uploadAvatarToR2(file);

        await updateSupabaseUserMetadata({
            avatar: avatarUrl
        });

        var avatarImg = document.getElementById("profileAvatar");

        if(avatarImg){
            avatarImg.src = avatarUrl;
        }

        renderProfile(currentSupabaseUser);

        input.value = "";

        alert("Đã đổi avatar thành công!");

    }catch(error){
        input.value = "";
        alert("Lỗi đổi avatar: " + error.message);
        console.log(error);
    }
}

async function resetAvatar(){
    try{
        await updateSupabaseUserMetadata({
            avatar: "Image/user.svg"
        });

        var avatarImg = document.getElementById("profileAvatar");

        if(avatarImg){
            avatarImg.src = "Image/user.svg";
        }

        renderProfile(currentSupabaseUser);

        alert("Đã đặt avatar về mặc định.");

    }catch(error){
        alert("Lỗi đặt lại avatar: " + error.message);
        console.log(error);
    }
}

/* ================== LƯU HỒ SƠ ================== */

async function saveProfile(){
    if(!currentSupabaseUser){
        alert("Bạn cần đăng nhập.");
        window.location.href = "Loging.html";
        return;
    }

    var usernameInput =
        document.getElementById("usernameInput") ||
        document.getElementById("profileUsername") ||
        document.getElementById("username") ||
        document.getElementById("userName");

    var username = usernameInput ? usernameInput.value.trim() : getUserName(currentSupabaseUser);

    if(username === ""){
        alert("Tên đăng nhập không được để trống.");
        return;
    }

    try{
        await updateSupabaseUserMetadata({
            username: username,
            name: username
        });

        renderProfile(currentSupabaseUser);

        alert("Đã lưu hồ sơ.");

    }catch(error){
        alert("Lỗi lưu hồ sơ: " + error.message);
        console.log(error);
    }
}

/* ================== ĐỔI MẬT KHẨU SUPABASE ================== */

async function changePassword(){
    var db = getSupabaseClient();

    if(!db || !db.auth){
        alert("Chưa load Supabase.");
        return;
    }

    if(!currentSupabaseUser){
        alert("Bạn cần đăng nhập.");
        window.location.href = "Loging.html";
        return;
    }

    var oldPasswordInput = document.getElementById("oldPassword");
    var newPasswordInput = document.getElementById("newPassword");
    var confirmPasswordInput = document.getElementById("confirmPassword");

    var oldPassword = oldPasswordInput ? oldPasswordInput.value.trim() : "";
    var newPassword = newPasswordInput ? newPasswordInput.value.trim() : "";
    var confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : "";

    if(oldPassword === "" || newPassword === "" || confirmPassword === ""){
        alert("Vui lòng nhập đầy đủ mật khẩu.");
        return;
    }

    if(newPassword.length < 6){
        alert("Mật khẩu mới phải từ 6 ký tự.");
        return;
    }

    if(newPassword !== confirmPassword){
        alert("Mật khẩu nhập lại không khớp.");
        return;
    }

    try{
        var checkLogin = await db.auth.signInWithPassword({
            email: currentSupabaseUser.email,
            password: oldPassword
        });

        if(checkLogin.error){
            alert("Mật khẩu cũ không đúng.");
            return;
        }

        var result = await db.auth.updateUser({
            password: newPassword
        });

        if(result.error){
            alert("Lỗi đổi mật khẩu: " + result.error.message);
            return;
        }

        alert("Đổi mật khẩu thành công.");

        if(oldPasswordInput) oldPasswordInput.value = "";
        if(newPasswordInput) newPasswordInput.value = "";
        if(confirmPasswordInput) confirmPasswordInput.value = "";

        var passwordOverlay = document.getElementById("passwordOverlay");

        if(passwordOverlay){
            passwordOverlay.classList.remove("show");
        }

    }catch(error){
        alert("Lỗi đổi mật khẩu: " + error.message);
        console.log(error);
    }
}

/* ================== ĐĂNG XUẤT ================== */

async function logoutAccount(){
    var db = getSupabaseClient();

    if(db && db.auth){
        await db.auth.signOut();
    }

    localStorage.removeItem("currentUser");
    localStorage.removeItem("loginUser");
    localStorage.removeItem("loggedInUser");

    window.location.href = "Loging.html";
}

/* ================== MENU + EVENT ================== */

document.addEventListener("DOMContentLoaded", async function(){

    await loadProfile();

    /* MENU THỂ LOẠI */
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

        genreDropdown.onclick = function(e){
            e.stopPropagation();
        };
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

        userDropdown.onclick = function(e){
            e.stopPropagation();
        };
    }

    /* ĐỔI AVATAR */
    var changeAvatarBtn = document.getElementById("changeAvatarBtn");
    var avatarInput = document.getElementById("avatarInput");
    var resetAvatarBtn = document.getElementById("resetAvatarBtn");

    if(changeAvatarBtn && avatarInput){
        changeAvatarBtn.onclick = function(){
            avatarInput.click();
        };

        avatarInput.onchange = function(){
            changeAvatar(avatarInput);
        };
    }

    if(resetAvatarBtn){
        resetAvatarBtn.onclick = function(){
            resetAvatar();
        };
    }

    /* LƯU HỒ SƠ */
    var saveProfileBtn = document.getElementById("saveProfileBtn");

    if(saveProfileBtn){
        saveProfileBtn.onclick = function(e){
            e.preventDefault();
            saveProfile();
        };
    }

    /* ĐĂNG XUẤT */
    var logoutBtn = document.getElementById("logoutBtn");

    if(logoutBtn){
        logoutBtn.onclick = function(e){
            e.preventDefault();
            logoutAccount();
        };
    }

    /* ĐỔI MẬT KHẨU */
    var changePasswordBtn = document.getElementById("changePasswordBtn");
    var passwordOverlay = document.getElementById("passwordOverlay");
    var passwordBox = document.getElementById("passwordBox");
    var savePasswordBtn = document.getElementById("savePasswordBtn");

    if(changePasswordBtn && passwordOverlay){
        changePasswordBtn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();

            passwordOverlay.classList.add("show");
        };
    }

    if(passwordOverlay && passwordBox){
        passwordOverlay.onclick = function(){
            passwordOverlay.classList.remove("show");
        };

        passwordBox.onclick = function(e){
            e.stopPropagation();
        };
    }

    if(savePasswordBtn){
        savePasswordBtn.onclick = function(e){
            e.preventDefault();
            e.stopPropagation();

            changePassword();
        };
    }

    document.addEventListener("click", function(e){

        if(genreMenu && genreDropdown && genreArrow && !genreMenu.contains(e.target)){
            genreDropdown.classList.remove("show");
            genreArrow.src = "Image/angle-small-down.svg";
        }

        if(userDropdown && userBtn && userArrow && !userBtn.contains(e.target) && !userDropdown.contains(e.target)){
            userDropdown.classList.remove("show");
            userArrow.textContent = "v";
        }

    });

});
