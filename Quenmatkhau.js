var resetPasswordBtn = document.getElementById("resetPasswordBtn");
var message = document.getElementById("message");

resetPasswordBtn.onclick = function(){

    var email = document.getElementById("forgotEmail").value.trim();
    var newPassword = document.getElementById("newPassword").value.trim();
    var confirmPassword = document.getElementById("confirmPassword").value.trim();

    if(email === "" || newPassword === "" || confirmPassword === ""){
        message.style.color = "#ff5252";
        message.textContent = "Vui lòng nhập đầy đủ thông tin.";
        return;
    }

    if(newPassword.length < 6){
        message.style.color = "#ff5252";
        message.textContent = "Mật khẩu mới phải từ 6 ký tự.";
        return;
    }

    if(newPassword !== confirmPassword){
        message.style.color = "#ff5252";
        message.textContent = "Mật khẩu nhập lại không khớp.";
        return;
    }

    var users = JSON.parse(localStorage.getItem("users")) || [];

    var userIndex = users.findIndex(function(user){
        return user.email === email;
    });

    if(userIndex === -1){
        message.style.color = "#ff5252";
        message.textContent = "Email này chưa được đăng ký.";
        return;
    }

    users[userIndex].password = newPassword;

    localStorage.setItem("users", JSON.stringify(users));

    var currentUser = JSON.parse(localStorage.getItem("currentUser"));

    if(currentUser && currentUser.email === email){
        currentUser.password = newPassword;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
    }

    message.style.color = "#2ecc71";
    message.textContent = "Đổi mật khẩu thành công. Đang chuyển về đăng nhập...";

    setTimeout(function(){
        window.location.href = "Loging.html";
    }, 1200);
};