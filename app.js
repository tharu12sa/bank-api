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
        .then((result) => {console.log(result);
            if(result.result=== false || !result.data){
                document.getElementById("errorLogin").textContent = result.message;
            }else if (result.data.role === "BankEmployee"){
                window.location.href = "employee.html";
            }else {
                window.location.href = "customer.html"
            }
        })
        .catch((error) => console.error(error));
}
// ----------------------------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
    loadNavbarProfile();
});

// Profile Data Navbar එකට Load කිරීම
function loadNavbarProfile() {
    const fullName = localStorage.getItem("fullName") || "User";
    const email = localStorage.getItem("email") || "user@gmail.com";

    document.getElementById("menuName").textContent = fullName;
    document.getElementById("menuEmail").textContent = email;

    // නමේ මුල් අකුර Avatar එකට දැමීම (උදා: Sadu -> S)
    document.getElementById("avatarInitials").textContent = fullName.charAt(0).toUpperCase();
}

// Icon එක Click කළ විට Dropdown එක Open/Close කිරීම
function toggleDropdown() {
    const menu = document.getElementById("dropdownMenu");
    menu.classList.toggle("show");
}

// පිටත තැනක් Click කළ විට Dropdown එක Auto Hide වීම
window.onclick = function(event) {
    if (!event.target.matches('.avatar') && !event.target.matches('#avatarInitials')) {
        const dropdowns = document.getElementsByClassName("dropdown-menu");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

// Logout Functionality
function logout() {
    localStorage.clear(); // Clear all saved session data
    window.location.href = "login.html"; // Redirect to login
}
