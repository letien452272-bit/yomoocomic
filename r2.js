const R2_WORKER_URL = "https://dark-snow-9711.letien-452272.workers.dev";

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