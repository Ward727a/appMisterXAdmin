function askStatus(){

    // Checking the status of the bot (if is on, or not)
    console.log("ask");

    sendRequest();

    function sendRequest(){
        window.api.sendAsync("askStatusBot");
    }

    setInterval(sendRequest, 50000)

    window.api.receive("statusBot", (status)=>{

        if(status === "loading"){
            let statusObject = document.getElementById("roundStatus");

            statusObject.className = "loading";
            return;
        }

        if(status !== null && status){
            let statusObject = document.getElementById("roundStatus");

            statusObject.className = "success";

        } else {
            let statusObject = document.getElementById("roundStatus");

            statusObject.className = "warning";

        }

    })


}

function openEventStatus(){

    let iconExpand = document.getElementById("statusBotExpandIcon");
    let iconCompress = document.getElementById("statusBotCompressIcon");
    let statusContainer = document.getElementById("statusBotContainer");

        if(statusContainer.className === "closed"){
            statusContainer.className = "opened";
            iconExpand.style.display = "none";
            iconCompress.style.display = "inherit";

        } else if(statusContainer.className === "opened"){

            statusContainer.className = "closed";
            iconExpand.style.display = "inherit";
            iconCompress.style.display = "none";
        }


}

askStatus()
