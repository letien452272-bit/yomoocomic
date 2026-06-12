var adminReportList = document.getElementById("adminReportList");

function getReportList(){
    return JSON.parse(localStorage.getItem("reportList")) || [];
}

function saveReportList(list){
    localStorage.setItem("reportList", JSON.stringify(list));
}

function renderReports(){
    var reports = getReportList();

    if(!adminReportList){
        return;
    }

    if(reports.length === 0){
        adminReportList.innerHTML = `
            <div class="empty-notify">
                Chưa có thông báo nào.
            </div>
        `;
        return;
    }

    adminReportList.innerHTML = reports.slice().reverse().map(function(report){
        var isDone = report.status === "Đã xử lý";

        return `
            <div class="admin-report-item ${isDone ? 'done' : 'unread'}">
                <h3>${report.mangaTitle || "Không tên truyện"}</h3>

                <p>${report.chapterName || "Không rõ chương"}</p>
                <p>Loại lỗi: ${report.type || "Không rõ"}</p>
                <p>Ghi chú: ${report.note || "Không có"}</p>
                <p>Thời gian: ${report.createdAt || "Không rõ"}</p>
                <p>Trạng thái: ${report.status || "Chưa xử lý"}</p>

                <div class="report-actions">
                    <button onclick="openReport(${report.mangaId}, ${report.chapterId})">
                        Mở chương lỗi
                    </button>

                    <button onclick="markDone(${report.id})">
                        Đã xử lý
                    </button>

                    <button class="delete-report" onclick="deleteReport(${report.id})">
                        Xóa
                    </button>
                </div>
            </div>
        `;
    }).join("");
}

function openReport(mangaId, chapterId){
    localStorage.setItem("currentMangaId", mangaId);
    localStorage.setItem("currentChapterId", chapterId);
    window.location.href = "DTR.html";
}

function markDone(id){
    var reports = getReportList();

    reports.forEach(function(report){
        if(Number(report.id) === Number(id)){
            report.status = "Đã xử lý";
        }
    });

    saveReportList(reports);
    renderReports();
}

function deleteReport(id){
    var reports = getReportList();

    reports = reports.filter(function(report){
        return Number(report.id) !== Number(id);
    });

    saveReportList(reports);
    renderReports();
}

renderReports();