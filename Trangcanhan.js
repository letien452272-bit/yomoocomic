var R2_UPLOAD_URL = "https://dark-snow-9711.letien-452272.workers.dev";
var R2_PUBLIC_URL = "https://pub-feac672c19c646b4b97ff6a2ac5ce733.r2.dev";

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
        throw new Error("Upload avatar lên R2 thất bại!");
    }

    return R2_PUBLIC_URL + "/" + r2Path;
}

async function changeAvatar(input){
    var file = input.files[0];

    if(!file){
        return;
    }

    if(!file.type.startsWith("image/")){
        alert("Vui lòng chọn file ảnh!");
        return;
    }

    try{
        var avatarUrl = await uploadAvatarToR2(file);

        updateUser({
            avatar: avatarUrl
        });

        document.getElementById("profileAvatar").src = avatarUrl;

        alert("Đã đổi avatar thành công!");

    }catch(error){
        alert("Lỗi đổi avatar: " + error.message);
        console.log(error);
    }
}

document.addEventListener("DOMContentLoaded", function(){

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
    }

    if(resetAvatarBtn){
        resetAvatarBtn.onclick = function(){
            updateUser({
                avatar: "Image/user.svg"
            });

            document.getElementById("profileAvatar").src = "Image/user.svg";

            alert("Đã đặt avatar về mặc định.");
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

            var user = getCurrentUser();

            if(!user){
                alert("Bạn cần đăng nhập.");
                window.location.href = "Loging.html";
                return;
            }

            var oldPassword = document.getElementById("oldPassword").value.trim();
            var newPassword = document.getElementById("newPassword").value.trim();
            var confirmPassword = document.getElementById("confirmPassword").value.trim();

            if(oldPassword === "" || newPassword === "" || confirmPassword === ""){
                alert("Vui lòng nhập đầy đủ mật khẩu.");
                return;
            }

            if(oldPassword !== user.password){
                alert("Mật khẩu cũ không đúng.");
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

            updateUser({
                password: newPassword
            });

            alert("Đổi mật khẩu thành công.");

            document.getElementById("oldPassword").value = "";
            document.getElementById("newPassword").value = "";
            document.getElementById("confirmPassword").value = "";

            passwordOverlay.classList.remove("show");
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