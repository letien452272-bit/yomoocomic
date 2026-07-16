const R2_UPLOAD_URL = atob("aHR0cHM6Ly9kYXJrLXNub3ctOTcxMS5sZXRpZW4tNDUyMjcyLndvcmtlcnMuZGV2");
async function uploadFileToR2(file, options){

    var formData = new FormData();

    formData.append("file", file);
    formData.append("type", options.type);

    if(options.mangaId){
        formData.append("mangaId", options.mangaId);
    }

    if(options.chapterNumber){
        formData.append("chapterNumber", options.chapterNumber);
    }

    var response = await fetch(R2_WORKER_URL, {
        method: "POST",
        body: formData
    });

    var data = await response.json();

    if(!response.ok || !data.success){
        throw new Error(data.error || "Upload R2 thất bại");
    }

    return data.url;
}
