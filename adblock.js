window.addEventListener("load", function(){

    var popup = document.getElementById("adblockPopup");
    var closeBtn = document.getElementById("closeAdblock");
    var okBtn = document.getElementById("okAdblock");

    var bait = document.createElement("div");

    bait.className =
    "ads adsbox ad-banner ad-placement adsbygoogle";

    bait.style.height = "1px";

    document.body.appendChild(bait);

    setTimeout(function(){

        var blocked =
            bait.offsetHeight === 0 ||
            window.getComputedStyle(bait).display === "none";

        bait.remove();

        if(blocked){
            popup.style.display = "flex";
        }

    },500);

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
