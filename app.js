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
                localStorage.setItem("EmployeeId", result.data.userId);
                localStorage.setItem("UserName", result.data.userName || "User");
                localStorage.setItem("email", result.data.emailId || "N/A");
                localStorage.setItem("fullName", result.data.fullName || "Full Name");
                window.location.href = "employee.html";
            } else {
                localStorage.setItem("customerId", result.data.userId);
                localStorage.setItem("UserName", result.data.userName || "User");
                localStorage.setItem("email", result.data.emailId || "N/A");
                localStorage.setItem("fullName", result.data.fullName || "Full Name");

                window.location.href = "customer.html";
            }
        })
        .catch((error) => console.error(error));
}
// --------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", function () {

    if (localStorage.getItem("customerId") && document.getElementById("cardId")) {
        document.getElementById("cardId").textContent = localStorage.getItem("customerId");
        document.getElementById("carduserName").textContent = localStorage.getItem("UserName");
        document.getElementById("cardEmail").textContent = localStorage.getItem("email");
        document.getElementById("cardName").textContent = localStorage.getItem("fullName");
        document.getElementById("cardAvatar").textContent = localStorage.getItem("UserName").charAt(0).toUpperCase()
    } else {
        document.getElementById("cardEmployeeID").textContent = localStorage.getItem("EmployeeId");
        document.getElementById("cardEmployeeUsername").textContent = localStorage.getItem("UserName");
        document.getElementById("cardEmployeeEmail").textContent = localStorage.getItem("email");
        document.getElementById("cardEmployeeName").textContent = localStorage.getItem("fullName");
        document.getElementById("cardAvatar2").textContent = localStorage.getItem("UserName").charAt(0).toUpperCase()
    }

});
// -----------------------------------------------------------------------------------------------

function saveLoan(){
    console.log("save");
    
}