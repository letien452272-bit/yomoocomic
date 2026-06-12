function showAdblockPopup(){
    var popup = document.getElementById("adblockPopup");

    if(popup){
        popup.style.display = "flex";
        document.body.style.overflow = "hidden";
    }
}

function hideAdblockPopup(){
    var popup = document.getElementById("adblockPopup");

    if(popup){
        popup.style.display = "none";
        document.body.style.overflow = "";
    }
}

function isAdBlocked(){
    var ad728 = document.querySelector(".ad-728 iframe");
    var ad320 = document.querySelector(".ad-320 iframe");

    if(!ad728 && !ad320){
        return true;
    }

    return false;
}

window.addEventListener("load", function(){

    setTimeout(function(){
        if(isAdBlocked()){
            showAdblockPopup();
        }
    }, 3000);

    var checkBtn = document.getElementById("checkAdblockAgain");

    if(checkBtn){
        checkBtn.onclick = function(){
            location.reload();
        };
    }

});
