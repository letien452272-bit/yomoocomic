var ADMIN_EMAIL = "letien.452272@gmail.com";
var isRegistering = false;

/* ================== ĐỔI ALERT LỖI TIẾNG ANH SANG TIẾNG VIỆT ================== */

var oldAlert = window.alert;

window.alert = function(message){
    var text = String(message || "");

    if(text.includes("Password should be at least 6 characters")){
        oldAlert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }

    if(text.includes("User already registered") || text.includes("already registered")){
        oldAlert("Email này đã được đăng ký rồi!");
        return;
    }

    if(text.includes("Invalid email") || text.includes("invalid email")){
        oldAlert("Email không hợp lệ!");
        return;
    }

    if(text.includes("Signup disabled") || text.includes("signup disabled")){
        oldAlert("Chức năng đăng ký đang bị tắt!");
        return;
    }

    oldAlert(message);
};

/* ================== ĐỔI LỖI SUPABASE SANG TIẾNG VIỆT ================== */

function getRegisterErrorMessage(errorMessage){

    var message = String(errorMessage || "").toLowerCase();

    if(message.includes("password should be at least 6 characters")){
        return "Mật khẩu phải có ít nhất 6 ký tự!";
    }

    if(message.includes("user already registered") || message.includes("already registered")){
        return "Email này đã được đăng ký rồi!";
    }

    if(message.includes("invalid email")){
        return "Email không hợp lệ!";
    }

    if(message.includes("signup disabled")){
        return "Chức năng đăng ký đang bị tắt!";
    }

    if(message.includes("email rate limit exceeded")){
        return "Bạn thao tác quá nhanh, vui lòng thử lại sau!";
    }

    if(message.includes("weak password")){
        return "Mật khẩu quá yếu, vui lòng nhập mật khẩu mạnh hơn!";
    }

    return "Lỗi đăng ký, vui lòng kiểm tra lại thông tin!";
}

/* ================== LẤY ĐÚNG FORM ĐĂNG KÝ ================== */

function getRegisterButton(){
    return (
        document.getElementById("registerBtn") ||
        document.getElementById("signupBtn") ||
        document.querySelector(".register-btn") ||
        document.querySelector(".signup-btn") ||
        Array.from(document.querySelectorAll("button")).find(function(btn){
            return String(btn.innerText || "").trim().toLowerCase().includes("đăng ký");
        })
    );
}

function getRegisterRoot(){

    var btn = getRegisterButton();

    if(btn){
        var form = btn.closest("form");

        if(form){
            return form;
        }

        var parent = btn.parentElement;

        while(parent && parent !== document.body){
            var hasEmail = parent.querySelector('input[type="email"], input[id*="email"], input[name*="email"]');
            var hasPassword = parent.querySelector('input[type="password"]');

            if(hasEmail || hasPassword){
                return parent;
            }

            parent = parent.parentElement;
        }
    }

    var forms = document.querySelectorAll("form");

    for(var i = 0; i < forms.length; i++){
        var formItem = forms[i];

        if(
            formItem.querySelector('input[type="password"]') ||
            formItem.innerText.includes("Đăng Ký") ||
            formItem.innerText.includes("Đăng ký")
        ){
            return formItem;
        }
    }

    return document.body;
}

function isCaptchaInput(input){

    var id = String(input.id || "").toLowerCase();
    var name = String(input.name || "").toLowerCase();
    var placeholder = String(input.placeholder || "").toLowerCase();

    if(id.includes("captcha") || id.includes("code") || id.includes("bot")){
        return true;
    }

    if(name.includes("captcha") || name.includes("code") || name.includes("bot")){
        return true;
    }

    if(placeholder.includes("captcha") || placeholder.includes("mã") || placeholder.includes("bot")){
        return true;
    }

    return false;
}

function getRegisterFields(){

    var root = getRegisterRoot();
    var inputs = Array.from(root.querySelectorAll("input"));

    var usernameInput = null;
    var emailInput = null;
    var passwordInput = null;
    var confirmPasswordInput = null;

    emailInput =
        root.querySelector("#email") ||
        root.querySelector('input[type="email"]') ||
        root.querySelector('input[name="email"]');

    passwordInput =
        root.querySelector("#password") ||
        root.querySelector('input[type="password"]');

    confirmPasswordInput =
        root.querySelector("#confirmPassword") ||
        root.querySelector("#rePassword") ||
        root.querySelector('input[name="confirmPassword"]') ||
        root.querySelector('input[name="rePassword"]');

    usernameInput =
        root.querySelector("#username") ||
        root.querySelector("#name") ||
        root.querySelector("#userName") ||
        root.querySelector("#displayName") ||
        root.querySelector('input[name="username"]') ||
        root.querySelector('input[name="name"]');

    if(!emailInput){
        emailInput = inputs.find(function(input){
            var value = String(input.value || "");
            var placeholder = String(input.placeholder || "").toLowerCase();
            var id = String(input.id || "").toLowerCase();
            var name = String(input.name || "").toLowerCase();

            return (
                input.type === "email" ||
                value.includes("@") ||
                placeholder.includes("email") ||
                id.includes("email") ||
                name.includes("email")
            );
        });
    }

    if(!passwordInput){
        passwordInput = inputs.find(function(input){
            return input.type === "password";
        });
    }

    if(!usernameInput){
        var emailIndex = inputs.indexOf(emailInput);

        usernameInput = inputs.find(function(input, index){
            if(input === emailInput){
                return false;
            }

            if(input === passwordInput){
                return false;
            }

            if(input.type === "password"){
                return false;
            }

            if(isCaptchaInput(input)){
                return false;
            }

            if(emailIndex > 0 && index > emailIndex){
                return false;
            }

            return true;
        });
    }

    return {
        root: root,
        usernameInput: usernameInput,
        emailInput: emailInput,
        passwordInput: passwordInput,
        confirmPasswordInput: confirmPasswordInput
    };
}

/* ================== LOADING BUTTON ================== */

function setRegisterLoading(isLoading){

    var registerBtn = getRegisterButton();

    if(!registerBtn){
        return;
    }

    registerBtn.disabled = isLoading;
    registerBtn.innerText = isLoading ? "Đang đăng ký..." : "Đăng ký";
}

/* ================== ĐĂNG KÝ ================== */

async function handleRegister(e){

    if(e){
        e.preventDefault();
        e.stopPropagation();
    }

    if(isRegistering){
        return;
    }

    var fields = getRegisterFields();

    var username = fields.usernameInput ? fields.usernameInput.value.trim() : "";
    var email = fields.emailInput ? fields.emailInput.value.trim().toLowerCase() : "";
    var password = fields.passwordInput ? fields.passwordInput.value.trim() : "";
    var confirmPassword = fields.confirmPasswordInput ? fields.confirmPasswordInput.value.trim() : "";

    console.log("REGISTER ROOT:", fields.root);
    console.log("USERNAME INPUT:", fields.usernameInput);
    console.log("EMAIL INPUT:", fields.emailInput);
    console.log("PASSWORD INPUT:", fields.passwordInput);
    console.log("USERNAME VALUE:", username);
    console.log("EMAIL VALUE:", email);

    if(username === ""){
        alert("Vui lòng nhập tên người dùng!");
        return;
    }

    if(email === ""){
        alert("Vui lòng nhập email!");
        return;
    }

    if(password === ""){
        alert("Vui lòng nhập mật khẩu!");
        return;
    }

    if(password.length < 6){
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }

    if(fields.confirmPasswordInput && confirmPassword !== password){
        alert("Mật khẩu nhập lại không khớp!");
        return;
    }

    if(typeof supabase === "undefined"){
        alert("Lỗi: Chưa load supabase.js!");
        return;
    }

    isRegistering = true;
    setRegisterLoading(true);

    try{
        var signUpResult = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    username: username,
                    avatar: "Image/user.svg"
                }
            }
        });

        if(signUpResult.error){
            alert(getRegisterErrorMessage(signUpResult.error.message));
            isRegistering = false;
            setRegisterLoading(false);
            return;
        }

        var authUser = signUpResult.data ? signUpResult.data.user : null;

        if(!authUser){
            alert("Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.");
            window.location.href = "Loging.html";
            return;
        }

        var role = email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

        var profile = {
            id: authUser.id,
            email: email,
            username: username,
            avatar: "Image/user.svg",
            role: role
        };

        var profileResult = await supabase
            .from("profiles")
            .insert([profile]);

        if(profileResult.error){
            console.log(profileResult.error);

            if(profileResult.error.code === "23505"){
                alert("Email này đã có hồ sơ rồi, vui lòng đăng nhập!");
            }else{
                alert("Tài khoản đã tạo nhưng lỗi lưu hồ sơ, vui lòng đăng nhập lại!");
            }

            isRegistering = false;
            setRegisterLoading(false);
            return;
        }

        localStorage.setItem("currentUser", JSON.stringify(profile));

        alert("Đăng ký thành công!");
        window.location.href = "CW.html";

    }catch(error){
        console.log(error);
        alert("Lỗi đăng ký, vui lòng thử lại!");

        isRegistering = false;
        setRegisterLoading(false);
    }
}

/* ================== KHỞI ĐỘNG ================== */

document.addEventListener("DOMContentLoaded", function(){

    var root = getRegisterRoot();
    var registerBtn = getRegisterButton();

    if(root && root.tagName && root.tagName.toLowerCase() === "form"){
        root.onsubmit = function(e){
            handleRegister(e);
        };
    }

    if(registerBtn){
        registerBtn.onclick = function(e){
            handleRegister(e);
        };
    }

});
