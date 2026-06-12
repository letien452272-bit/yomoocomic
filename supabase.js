const SUPABASE_URL = "https://tnpdfcjvfkyzmzxvaorb.supabase.co";

const SUPABASE_KEY = "sb_publishable_IOlxiWS-4pfUqR3Sbh0qyg_oZhe8FBT";

window.supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

var supabase = window.supabaseClient;