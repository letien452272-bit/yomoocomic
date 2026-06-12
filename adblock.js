console.log("Adblock JS loaded");

window.addEventListener("load", function(){

    var popup = document.getElementById("adblockPopup");
    var closeBtn = document.getElementById("closeAdblock");
    var okBtn = document.getElementById("okAdblock");

    if(!popup){
        console.log("Không tìm thấy #adblockPopup");
        return;
    }

    var bait = document.createElement("div");

    bait.className = "ads adsbox ad-banner adsbygoogle ad-placement";

    bait.style.width = "1px";
    bait.style.height = "1px";
    bait.style.position = "absolute";
    bait.style.left = "-9999px";
    bait.style.top = "-9999px";

    document.body.appendChild(bait);

    setTimeout(function(){

        var style = window.getComputedStyle(bait);

        var blocked =
            bait.offsetHeight === 0 ||
            bait.offsetWidth === 0 ||
            style.display === "none" ||
            style.visibility === "hidden";

        bait.remove();

        if(blocked){
            popup.style.display = "flex";
        }

    }, 800);

    if(closeBtn){
        closeBtn.onclick = function(){
            popup.style.display = "none";
        };
    }

    if(okBtn){
        okBtn.onclick = function(){
            popup.style.display = "none";
        };
    }

});
