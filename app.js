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
            if(document.getElementById("loginName").value==="admin" && document.getElementById("loginPass").value==="admin" ){
                window.location.href = "admin.html";
            }else if (result.result === false || !result.data) {
                document.getElementById("errorLogin").textContent = result.message;
            } else if (result.data.role === "BankEmployee") {
                localStorage.setItem("EmployeeId", result.data.userId);
                localStorage.setItem("UserName", result.data.userName || "User");
                localStorage.setItem("email", result.data.emailId || "N/A");
                localStorage.setItem("fullName", result.data.fullName || "Full Name");
                window.location.href = "employee.html";
            } else if (result.data.role === "Customer") {
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

function saveLoan() {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "applicantID": 0,
        "fullName": document.getElementById("loanName").value,
        "applicationStatus": "pending",
        "panCard": document.getElementById("loanNIC").value,
        "dateOfBirth": "2026-08-23T02:46:09.790Z",
        "email": document.getElementById("loanEmail").value,
        "phone": document.getElementById("loanPhoneNumber").value,
        "address": document.getElementById("loanAddress").value,
        "city": document.getElementById("loanCity").value,
        "state": document.getElementById("loanState").value,
        "zipCode": document.getElementById("loanZipecode").value,
        "annualIncome": document.getElementById("loanIcome").value,
        "employmentStatus": document.getElementById("loanStatus").value,
        "creditScore": 750,
        "assets": document.getElementById("loanAsset").value,
        "dateApplied": new Date().toISOString().split('T')[0],
        "loans": [
            {
                "loanID": 0,
                "applicantID": 0,
                "bankName": "lanka bank",
                "loanAmount": document.getElementById("loanAmount").value,
                "emi": document.getElementById("loanAmount").value * 4 / 100
            }
        ],
        "customerId": localStorage.getItem("customerId")
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
    };

    fetch("https://api.freeprojectapi.com/api/BankLoan/AddNewApplication", requestOptions)
        .then((response) => response.json())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));

    localStorage.setItem("loan amount", document.getElementById("loanAmount").value);

    document.getElementById("loanForm").reset();
    const modalEl = document.getElementById('loanModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();



}

// function viewLoan(){
//     const requestOptions = {
//         method: "GET",
//         redirect: "follow"
//     };

//     fetch("https://api.freeprojectapi.com/api/BankLoan/GetMyApplications?customerId=14952", requestOptions)
//         .then((response) => response.json())
//         .then((result) => console.log(result))
//         .catch((error) => console.error(error));
// }

function viewLoan() {
    const savedCustomerId = localStorage.getItem("customerId");

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch(`https://api.freeprojectapi.com/api/BankLoan/GetMyApplications?customerId=${savedCustomerId}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);


            const tableBody = document.getElementById("loanTableBody");
            let body = "";

            result.data.forEach((item) => {
                const formattedDate = item.dateApplied ? item.dateApplied.split('T')[0] : '-';

                body += `
                        <tr>
                            <td class="fw-bold">${item.applicantID}</td>
                            <td>${formattedDate}</td>
                            <td>${item.assignedToBankEmployee}</td>
                            <td><span class="badge bg-warning text-dark">${item.applicationStatus}</span></td>
                        </tr>
                    `;
            });

            tableBody.innerHTML = body;
        }
        )
        .catch((error) => console.error(error));
}

function viewApplication() {
    const savedEmployeeID = localStorage.getItem("EmployeeId");
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch(`https://api.freeprojectapi.com/api/BankLoan/GetApplicationAssigneedToMe?bankEmployeeId=${savedEmployeeID}`, requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            let body = "";

            if (result.data && Array.isArray(result.data)) {
                result.data.forEach((item) => {
                    if (item.applicationStatus != "Approved" && item.applicationStatus != "Rejected") {
                        const formattedDate = item.dateApplied ? item.dateApplied.split('T')[0] : '-';

                        body += `
                            <tr>
                                <td class="fw-bold">${item.applicantID}</td>
                                <td>${formattedDate}</td>
                                <td>${item.panCard}</td>
                                <td>${item.customerPhone}</td>
                                <td>
                                    <button class="btn btn-sm btn-success me-2 fw-bold" onclick="updateStatus(this, '${item.panCard}', 'Approved')">
                                        Approve
                                    </button>
                                    <button class="btn btn-sm btn-danger fw-bold" onclick="updateStatus(this, '${item.panCard}', 'Rejected')">
                                        Reject
                                    </button>
                                </td>
                            </tr>`;
                    }
                });
            }

            document.getElementById("loanTableBody2").innerHTML = body;
        })
        .catch((error) => console.error(error));
}


function updateStatus(btnElement, nic, statusview) {
    const row = btnElement.closest("tr");
    if (row) {
        row.remove();
    }

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    fetch(`https://api.freeprojectapi.com/api/BankLoan/CheckApplicationStatus?panNo=${nic}&status=${statusview}`, requestOptions)
        .then((response) => response.json())
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
}