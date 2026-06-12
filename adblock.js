window.addEventListener("load", function(){

    var popup = document.getElementById("adblockPopup");
    var closeBtn = document.getElementById("closeAdblock");
    var okBtn = document.getElementById("okAdblock");

    if(!popup){
        alert("Chưa có HTML adblockPopup");
        return;
    }

    popup.style.display = "flex";

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
