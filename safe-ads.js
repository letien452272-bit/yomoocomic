var YOMOO_PC_AD_KEY = "a5e37a3101f1a538797518fb69cd108b";
var YOMOO_MOBILE_AD_KEY = "68c5dd71d67d6721b98864fec634a4d9";

function loadSafeAd(boxId){

    var box = document.getElementById(boxId);

    if(!box){
        return;
    }

    box.innerHTML = "";

    var isMobile = window.innerWidth <= 768;

    var key = isMobile ? YOMOO_MOBILE_AD_KEY : YOMOO_PC_AD_KEY;
    var width = isMobile ? 320 : 728;
    var height = isMobile ? 50 : 90;

    var iframe = document.createElement("iframe");

    iframe.className = "safe-ad-frame";
    iframe.width = width;
    iframe.height = height;
    iframe.src = "ad-frame.html?key=" + key + "&width=" + width + "&height=" + height;

    iframe.setAttribute("sandbox", "allow-scripts");
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("title", "Advertisement");

    iframe.style.border = "0";
    iframe.style.overflow = "hidden";
    iframe.style.display = "block";

    box.appendChild(iframe);
}