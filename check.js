console.log("check.js loaded");

window.addEventListener("load", function(){
    setTimeout(function(){
        var popup = document.getElementById("adblockPopup");

        if(!popup){
            console.log("Không thấy adblockPopup");
            return;
        }

        var ad728 = document.querySelector(".ad-728 iframe");
        var ad320 = document.querySelector(".ad-320 iframe");

        if(!ad728 && !ad320){
            popup.style.display = "flex";
            document.body.style.overflow = "hidden";
        }
    }, 2500);

    var btn = document.getElementById("checkAdblockAgain");

    if(btn){
        btn.onclick = function(){
            location.reload();
        };
    }
});// JavaScript Document