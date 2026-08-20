const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

const raw = JSON.stringify({
    "userId": document.getElementById("customerId").value,
    "userName": "yamuna",
    "emailId": "yamu@gmail.com",
    "fullName": "yamunawwww",
    "password": "yamuna12"
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