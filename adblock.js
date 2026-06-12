<script>
window.addEventListener("load", function(){

    var bait = document.createElement("div");

    bait.className = "adsbox ad-banner ads";

    bait.style.height = "1px";

    document.body.appendChild(bait);

    setTimeout(function(){

        var blocked =
            bait.offsetHeight === 0 ||
            getComputedStyle(bait).display === "none";

        bait.remove();

        if(blocked){
            document.getElementById("adblockPopup").style.display = "flex";
        }

    },300);

    document.getElementById("closeAdblock").onclick = function(){
        document.getElementById("adblockPopup").style.display = "none";
    };

    document.getElementById("okAdblock").onclick = function(){
        document.getElementById("adblockPopup").style.display = "none";
    };

});
</script>