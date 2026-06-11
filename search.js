var ADMIN_EMAIL = "letien.452272@gmail.com";

var emailInput = document.getElementById("email");
var passwordInput = document.getElementById("password");
var loginBtn = document.getElementById("loginBtn");

if(loginBtn){
    loginBtn.onclick = async function(e){
        e.preventDefault();

        var email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        var password = passwordInput ? passwordInput.value.trim() : "";

        if(email === "" || password === ""){
            alert("Vui lòng nhập email và mật khẩu!");
            return;
        }

        loginBtn.disabled = true;
        loginBtn.innerText = "Đang đăng nhập...";

        var result = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if(result.error){
            alert("Sai email hoặc mật khẩu!");
            loginBtn.disabled = false;
            loginBtn.innerText = "Đăng nhập";
            return;
        }

        var authUser = result.data.user;

        var profileResult = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .single();

        var profile = profileResult.data;

        if(!profile){
            var role = email === ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

            var newProfile = {
                id: authUser.id,
                email: email,
                username: authUser.user_metadata.username || email,
                avatar: authUser.user_metadata.avatar || "Image/user.svg",
                role: role
            };

            await supabase
                .from("profiles")
                .insert([newProfile]);

            profile = newProfile;
        }

        if(email === ADMIN_EMAIL.toLowerCase()){
            profile.role = "admin";

            await supabase
                .from("profiles")
                .update({ role: "admin" })
                .eq("id", authUser.id);
        }

        localStorage.setItem("currentUser", JSON.stringify(profile));

        alert("Đăng nhập thành công!");

        window.location.href = "CW.html";
    };
}