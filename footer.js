async function loadTotalViews(){
    var totalViewEl = document.getElementById("totalViewCount");
    if(!totalViewEl) return;

    var db = window.supabaseClient || window.supabase || null;
    if(!db){
        totalViewEl.innerText = "0";
        return;
    }

    var result = await db
        .from("mangas")
        .select("views");

    if(result.error){
        console.log("Lỗi lấy tổng view:", result.error);
        totalViewEl.innerText = "0";
        return;
    }

    var total = 0;

    if(result.data && result.data.length > 0){
        result.data.forEach(function(item){
            total += Number(item.views || 0);
        });
    }

    totalViewEl.innerText = total.toLocaleString("vi-VN");
}

function setupOnlineUsers(){
    var onlineEl = document.getElementById("onlineUserCount");
    if(!onlineEl) return;

    var db = window.supabaseClient || window.supabase || null;
    if(!db){
        onlineEl.innerText = "1";
        return;
    }

    var visitorId = localStorage.getItem("yomoo_visitor_id");

    if(!visitorId){
        visitorId = "guest_" + Date.now() + "_" + Math.random().toString(36).substring(2);
        localStorage.setItem("yomoo_visitor_id", visitorId);
    }

    var channel = db.channel("yomoo-online-users", {
        config:{
            presence:{
                key: visitorId
            }
        }
    });

    channel
        .on("presence", { event:"sync" }, function(){
            var state = channel.presenceState();
            var count = Object.keys(state).length;

            onlineEl.innerText = count.toLocaleString("vi-VN");
        })
        .subscribe(function(status){
            if(status === "SUBSCRIBED"){
                channel.track({
                    online_at: new Date().toISOString()
                });
            }
        });
}

document.addEventListener("DOMContentLoaded", function(){
    loadTotalViews();
    setupOnlineUsers();
});