/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "https://tnpdfcjvfkyzmzxvaorb.supabase.co";
const SUPABASE_KEY = "sb_publishable_IOlxiWS-4pfUqR3Sbh0qyg_oZhe8FBT";

/* ================= INIT SUPABASE ================= */

if(!window.supabase){
    console.error("Lỗi: Chưa load thư viện Supabase CDN trước supabase.js");
}else{
    window.supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );

    var supabase = window.supabaseClient;

    console.log("Supabase đã kết nối thành công.");
}

/* ================= HELPER ================= */

function getSupabaseClient(){
    return window.supabaseClient || supabase || null;
}

async function waitForSupabase(){
    var db = getSupabaseClient();

    if(db){
        return db;
    }

    for(var i = 0; i < 20; i++){
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
