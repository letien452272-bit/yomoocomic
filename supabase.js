/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "https://tnpdfcjvfkyzmzxvaorb.supabase.co";
const SUPABASE_KEY = "sb_publishable_IOlxiWS-4pfUqR3Sbh0qyg_oZhe8FBT";

/* ================= INIT SUPABASE ================= */

if(!window.supabase || !window.supabase.createClient){
    console.error("Lỗi: Chưa load thư viện Supabase CDN trước supabase.js");
}else{
    var supabaseLibrary = window.supabase;

    window.supabaseClient = supabaseLibrary.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    /*
        Dòng này để các file cũ đang dùng biến supabase vẫn chạy được:
        await supabase.from(...)
        await supabase.auth.getUser()
    */
    window.db = window.supabaseClient;
    window.yomooSupabase = window.supabaseClient;

    console.log("Supabase đã kết nối thành công.");
}

/* ================= HELPER ================= */

function getSupabase(){
    return window.supabaseClient || window.db || window.yomooSupabase || null;
}

function getSupabaseClient(){
    return window.supabaseClient || window.db || window.yomooSupabase || null;
}

async function waitForSupabase(){
    var db = getSupabaseClient();

    if(db){
        return db;
    }

    for(var i = 0; i < 30; i++){
        await new Promise(function(resolve){
            setTimeout(resolve, 100);
        });

        db = getSupabaseClient();

        if(db){
            return db;
        }
    }

    console.error("Không tìm thấy Supabase client.");
    return null;
}

/* ================= USER HELPER ================= */

async function getSupabaseUser(){
    var db = await waitForSupabase();

    if(!db || !db.auth){
        return null;
    }

    var result = await db.auth.getUser();

    if(result.error || !result.data || !result.data.user){
        return null;
    }

    return result.data.user;
}

async function getSupabaseSession(){
    var db = await waitForSupabase();

    if(!db || !db.auth){
        return null;
    }

    var result = await db.auth.getSession();

    if(result.error || !result.data || !result.data.session){
        return null;
    }

    return result.data.session;
}

/* ================= BIẾN SUPABASE CHO CODE CŨ ================= */

/*
    Không được khai báo var supabase = null ở đầu file.
    Chỉ gán sau khi Supabase client đã tạo xong.
*/
var supabase = window.supabaseClient;
