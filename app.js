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

function btnAddemployee() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "userId": 0,
        "userName": document.getElementById("employeeUserName").value,
        "emailId": document.getElementById("employeeEmail").value,
        "fullName": document.getElementById("employeeFullName").value,
        "password": document.getElementById("employeePass").value
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("https://api.freeprojectapi.com/api/BankLoan/RegisterAsBankUser", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            if (result.result) {
                window.location.href = "login.html";
            } else {
                // alert("Registration Failed: " + result.message);
                document.getElementById("error").textContent = result.message;
            }
        })
        .catch((error) => console.error(error));
}
// -----------------------------------------------------------------------------



function btnAddlogin() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "userName": document.getElementById("loginName").value,
        "password": document.getElementById("loginPass").value
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("https://api.freeprojectapi.com/api/BankLoan/login", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            if (result.result === false || !result.data) {
                document.getElementById("errorLogin").textContent = result.message;
            } else if (result.data.role === "BankEmployee") {
                window.location.href = "employee.html";
            } else {
                localStorage.setItem("customerId", result.data.userId);
                localStorage.setItem("UserName", result.data.userName || "User");
                localStorage.setItem("email", result.data.emailId || "N/A");
                localStorage.setItem("role", result.data.role || "Customer");

                window.location.href = "customer.html";
            }
        })
        .catch((error) => console.error(error));
}

document.addEventListener("DOMContentLoaded", function () {


    const savedCustomerId = localStorage.getItem("customerId");
    const savedUsername = localStorage.getItem("UserName");
    const savedEmail = localStorage.getItem("email");
    const savedRole = localStorage.getItem("role");

    // const cardIdEl = document.getElementById("cardId");
    // const cardNameEl = document.getElementById("cardName");
    // const cardEmailEl = document.getElementById("cardEmail");
    // const cardRoleEl = document.getElementById("cardRole");
    // const cardAvatarEl = document.getElementById("cardAvatar");

    document.getElementById("cardId").textContent = savedCustomerId;
    document.getElementById("carduserName").textContent = savedUsername;
    document.getElementById("cardEmail").textContent = savedEmail;
    document.getElementById("cardRole").textContent = savedRole;
    document.getElementById("cardAvatar").textContent = savedName.charAt(0).toUpperCase();


});

