var DEFAULT_AVATAR = "Image/user.svg";
var ADMIN_EMAIL = "letien.452272@gmail.com";

var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";
var R2_PUBLIC_URL = "https://pub-feac672c19c646b4b97ff6a2ac5ce733.r2.dev";

function getUsers(){
    return JSON.parse(localStorage.getItem("users")) || [];
}

function saveUsers(users){
    localStorage.setItem("users", JSON.stringify(users));
}

function getCurrentUser(){
    return JSON.parse(localStorage.getItem("currentUser"));
}

function setCurrentUser(user){
    localStorage.setItem("currentUser", JSON.stringify(user));
}

function logout(){
    localStorage.removeItem("currentUser");
    window.location.href = "Loging.html";
}

function registerUser(username, email, password){
    var users = getUsers();

    username = username.trim();
    email = email.trim().toLowerCase();
    password = password.trim();

    if(!username || !email || !password){
        alert("Vui lòng nhập đầy đủ thông tin.");
        return false;
    }

    var existed = users.find(function(user){
        return user.email === email;
    });

    if(existed){
        alert("Email này đã được đăng ký.");
        return false;
    }

    var role = email === ADMIN_EMAIL ? "admin" : "user";

    var newUser = {
        id: Date.now(),
        username: username,
        email: email,
        password: password,
        role: role,
        avatar: DEFAULT_AVATAR,
        following: []
    };

    users.push(newUser);
    saveUsers(users);

    alert("Đăng ký thành công.");
    window.location.href = "Loging.html";
    return true;
}

function loginUser(email, password){
    var users = getUsers();

    email = email.trim().toLowerCase();
    password = password.trim();

    if(!email || !password){
        alert("Vui lòng nhập email và mật khẩu.");
        return false;
    }

    var user = users.find(function(item){
        return item.email === email && item.password === password;
    });

    if(!user){
        alert("Sai email hoặc mật khẩu.");
        return false;
    }

    user.avatar = user.avatar || DEFAULT_AVATAR;
    user.following = user.following || [];

    setCurrentUser(user);
    alert("Đăng nhập thành công.");

    window.location.href = "CW.html";
    return true;
}

function requireLogin(){
    var user = getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để dùng chức năng này.");
        window.location.href = "Loging.html";
        return false;
    }

    return true;
}

function requireAdmin(){
    var user = getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập tài khoản Admin.");
        window.location.href = "Loging.html";
        return false;
    }

    if(user.role !== "admin"){
        alert("Tài khoản này không có quyền Admin.");
        window.location.href = "CW.html";
        return false;
    }

    return true;
}

function isAdmin(){
    var user = getCurrentUser();
    return user && user.role === "admin";
}

function isUser(){
    var user = getCurrentUser();
    return user && user.role === "user";
}

function updateUserMenu(){
    var user = getCurrentUser();
    var userBtn = document.getElementById("user-btn");
    var userDropdown = document.getElementById("user-dropdown");

    if(!userBtn) return;

    var avatar = userBtn.querySelector("img");
    var name = userBtn.querySelector("span");

    if(avatar){
        avatar.src = user ? (user.avatar || DEFAULT_AVATAR) : DEFAULT_AVATAR;
    }

    if(name){
        name.textContent = user ? user.username : "Khách";
    }

    if(!userDropdown) return;

    var headName = userDropdown.querySelector(".user-head h3");
    var headEmail = userDropdown.querySelector(".user-head p");

    if(headName){
        headName.textContent = user ? user.username : "Khách";
    }

    if(headEmail){
        headEmail.textContent = user ? user.email : "Chưa đăng nhập";
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

function updateUser(userUpdate){
    var user = getCurrentUser();

    if(!user) return;

    Object.assign(user, userUpdate);
    setCurrentUser(user);

    var users = getUsers();

    users = users.map(function(item){
        if(item.id === user.id){
            return user;
        }

        return item;
    });

    saveUsers(users);
    updateUserMenu();
}

function makeSafeAvatarName(fileName){
    var ext = fileName.split(".").pop().toLowerCase();
    return Date.now() + "-" + Math.random().toString(36).substring(2) + "." + ext;
}

async function uploadAvatarToR2(file){
    var user = getCurrentUser();

    if(!user){
        throw new Error("Bạn cần đăng nhập.");
    }

    var safeEmail = user.email.replace(/[^a-zA-Z0-9]/g, "-");
    var fileName = makeSafeAvatarName(file.name);

    var r2Path = "avatars/" + safeEmail + "/" + fileName;
    var uploadUrl = R2_UPLOAD_URL + "/" + r2Path;

    var response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
            "Content-Type": file.type || "image/webp"
        }
    });

    if(!response.ok){
        throw new Error("Upload avatar lên R2 thất bại.");
    }

    return R2_PUBLIC_URL + "/" + r2Path;
}

async function changeAvatar(input){
    var user = getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để đổi avatar.");
        window.location.href = "Loging.html";
        return;
    }

    var file = input.files[0];

    if(!file) return;

    if(!file.type.startsWith("image/")){
        alert("Vui lòng chọn file ảnh.");
        return;
    }

    try{
        var avatarUrl = await uploadAvatarToR2(file);

        updateUser({
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

function resetAvatar(){
    var user = getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập.");
        return;
    }

    updateUser({
        avatar: DEFAULT_AVATAR
    });

    var profileAvatar = document.getElementById("profileAvatar");

    if(profileAvatar){
        profileAvatar.src = DEFAULT_AVATAR;
    }

    alert("Đã đổi về avatar mặc định.");
}

function followStory(storyId){
    var user = getCurrentUser();

    if(!user){
        alert("Bạn cần đăng nhập để theo dõi truyện.");
        window.location.href = "Loging.html";
        return;
    }

    if(!user.following){
        user.following = [];
    }

    if(!user.following.includes(storyId)){
        user.following.push(storyId);
        updateUser(user);
        alert("Đã theo dõi truyện.");
    }else{
        alert("Bạn đã theo dõi truyện này rồi.");
    }
}

function unfollowStory(storyId){
    var user = getCurrentUser();

    if(!user || !user.following) return;

    user.following = user.following.filter(function(id){
        return id !== storyId;
    });

    updateUser(user);
    alert("Đã bỏ theo dõi truyện.");
}

document.addEventListener("DOMContentLoaded", function(){
    updateUserMenu();
});
function getCurrentUser(){
    try{
        return JSON.parse(localStorage.getItem("currentUser")) || null;
    }catch(e){
        return null;
    }
}

function isAdmin(){
    var user = getCurrentUser();

    if(!user) return false;

    return user.role === "admin" ||
           user.email === "letien.452272@gmail.com";
}

function requireAdmin(){
    if(!isAdmin()){
        alert("Bạn không có quyền truy cập!");
        window.location.href = "CW.html";
    }
}

async function logout(){
    await supabase.auth.signOut();
    localStorage.removeItem("currentUser");
    window.location.href = "CW.html";
}