function btnAddcustomer() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "userId": 0,
        "userName": document.getElementById("customerUserName").value,
        "emailId": document.getElementById("customerEmail").value,
        "fullName": document.getElementById("customerFullName").value,
        "password": document.getElementById("customerPass").value
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("https://api.freeprojectapi.com/api/BankLoan/RegisterCustomer", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            if (result.result) {
                window.location.href = "login.html";
            } else {
                // alert("Registration Failed: " + result.message);
                document.getElementById("fail").textContent = result.message;
            }
        })
        .catch((error) => console.error(error));
}

//-----------------------------------------------------------------------

const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
    "userId": 0,
    "userName": "string",
    "emailId": "string",
    "fullName": "string",
    "password": "string"
});

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
};

fetch("https://api.freeprojectapi.com/api/BankLoan/RegisterAsBankUser", requestOptions)
    .then((response) => response.json())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));