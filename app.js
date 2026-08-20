function btnAddcustomer() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "userId": 0,
        "userName": document.getElementById("userName").value,
        "emailId": document.getElementById("email").value,
        "fullName": document.getElementById("fullName").value,
        "password": document.getElementById("pass").value
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
                alert("Customer Registered Successfully!");
                window.location.href = "login.html";
            } else {
                alert("Registration Failed: " + result.message);
            }
        })
        .catch((error) => console.error(error));
}

