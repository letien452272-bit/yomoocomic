function lockPage(){
    var popup = document.getElementById("adblockPopup");

    if(popup){
        popup.style.display = "flex";
        document.body.classList.add("adblock-active");
    }
}

function unlockPage(){
    var popup = document.getElementById("adblockPopup");

    if(popup){
        popup.style.display = "none";
        document.body.classList.remove("adblock-active");
    }
}

function checkAdblock(){
    return new Promise(function(resolve){
        var bait = document.createElement("div");

        bait.className = "ads adsbox ad-banner adsbygoogle ad-placement";
        bait.style.width = "1px";
        bait.style.height = "1px";
        bait.style.position = "absolute";
        bait.style.left = "-9999px";

        document.body.appendChild(bait);

        setTimeout(function(){
            var style = window.getComputedStyle(bait);

            var blocked =
                bait.offsetHeight === 0 ||
                bait.offsetWidth === 0 ||
                style.display === "none" ||
                style.visibility === "hidden";

            bait.remove();
            resolve(blocked);
        }, 500);
    });
}

window.addEventListener("load", async function(){
    var blocked = await checkAdblock();

    if(blocked){
        lockPage();
    }

    var checkBtn = document.getElementById("checkAdblockAgain");

    if(checkBtn){
        checkBtn.onclick = async function(){
            var stillBlocked = await checkAdblock();

            if(stillBlocked){
                alert("Bạn vẫn đang bật AdBlock á 😭");
                lockPage();
            }else{
                unlockPage();
            }
        };
    }
});
