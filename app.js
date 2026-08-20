const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
    "userId": document.getElementById("customerId").value,
    "userName": document.getElementById("userName").value,
    "emailId": document.getElementById("customerId").value,
    "fullName": document.getElementById("customerId").value,
    "password": document.getElementById("customerId").value
});

const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
};

fetch("https://api.freeprojectapi.com/api/BankLoan/RegisterCustomer", requestOptions)
    .then((response) => response.json())
    .then((result) => console.log(result))
    .catch((error) => console.error(error));