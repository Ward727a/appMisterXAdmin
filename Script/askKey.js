function checkKey() {

    let key = document.getElementById("keyInput").value;


    console.log(key);

    window.api.sendAsync("CheckKey", key);

}
