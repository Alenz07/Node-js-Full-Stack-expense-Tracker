console.log("this is working")
window.onload = function () {
    receive();
    check_premium();
    createButton();
};
const token = localStorage.getItem('userId')


const cashfree = Cashfree({
    mode: "sandbox",
});

document.getElementById("payBtn").addEventListener("click", async () => {
    try {
        // ✅ Fixed port from 3000 to 2000
        const response = await axios.post("http://localhost:2000/pay")
        const paymentSessionId = response.data.sessionId

        const email = localStorage.getItem("email")
        console.log(email)
        const mail = { email: email }
        const orderId = response.data.orderId


        let checkoutOptions = {
            paymentSessionId: paymentSessionId,
            redirectTarget: "_modal",
        };

        cashfree.checkout(checkoutOptions).then(async (result) => {

            // Step 3: Check if payment was completed
            if (result.paymentDetails) {
                console.log("Payment completed! Checking status...");

                // ✅ Added: Verify payment status
                const statusResponse = await axios.get(
                    `http://localhost:2000/cashfree/payment-status/${orderId}`
                );

                const paymentStatus = statusResponse.data.orderStatus;
                console.log("Status:", paymentStatus);

                alert("Your payment is " + paymentStatus);

                // Step 4: Only set premium if PAID
                if (paymentStatus === "PAID") {
                    const email = localStorage.getItem("email");
                    const mail = { email: email };

                    // ✅ Fixed: lowercase 'premium'
                    const premium = await axios.post(
                        "http://localhost:2000/auth/Premium",
                        mail
                    );

                    alert("🎉 You are now premium!");
                    location.reload();
                }
            }
        });
      


    }
    catch (error) {
        console.log("Payment error:", error)
        alert("Payment failed. Please try again.")
    }
});


async function posting(event) {
    event.preventDefault()
    obj = {
        amountSpend: document.querySelector("#amountSpend").value,
        where: document.querySelector("#where").value,
        description: document.querySelector("#description").value
    }
    try {
        await axios.post("http://localhost:2000/expense", obj, {
            headers: { "authorization": token }
        })

        console.log("yes sent")
        console.log(token)
        receive()
    } catch (error) {
        console.log(error)

    }

}

let list = document.createElement("ul") 
let currPage = 1 
let buttonContainer = null 

function createButton(){ 
    const totalPages = Number(localStorage.getItem("totalPages")) 
    // Remove old buttons first 
    if (buttonContainer) { 
        buttonContainer.remove() 
    } 
    // Create container 
    buttonContainer = document.createElement("div") 
    const button1 = document.createElement("button") 
    const button2 = document.createElement("button") 
    button1.textContent = "Prev" 
    button2.textContent = "Next" 
    // Now conditionally disable 
    if(currPage == 1){ 
        button1.disabled = true 
    } 
    if(currPage >= totalPages){ 
        button2.disabled = true 
    } 
    buttonContainer.appendChild(button1) 
    buttonContainer.appendChild(button2) 
    document.body.appendChild(buttonContainer) 
    button1.onclick = function(){ 
        currPage = currPage - 1 
        receive() 
    } 
    button2.onclick = function(){ 
        currPage = currPage + 1 
        receive() 
    } 
} 

async function receive() { 
    const premium = await check_premium() 
    console.log(premium) 
    const rows = document.getElementById("rowsPage").value 
    try { 
        const response = await axios.get(`http://localhost:2000/expense/?rows=${rows}&currPage=${currPage}`, { 
            headers: { "authorization": token } 
        }) 
        console.log("data is received") 
        const data = response.data.data 
        localStorage.setItem("totalPages",response.data.totalPages) 
        if (premium == false) { 
            document.getElementById("payBtn").style.display = "block";
            document.getElementById("filterSelect").style.display = "none"
             
            list.innerHTML = data.map(item => 
                ` <li> Amount Spend: ${item.amountSpend} Where ${item.where} description: ${item.description} <button id="${item.id}" class="buttons">Delete</button>  <button onclick="edit_element(${item.id}, ${item.amountSpend}, '${item.where}', '${item.description}</li> ')">Edit</button>` 
            ) 
            document.body.appendChild(list) 
            const deleted = document.querySelectorAll(".buttons") 
          
            deleted.forEach(item => { item.addEventListener("click", delete_element) }) 
          
            console.log(list) 
            createButton() 
        } else if (premium == true) { 
            add_LeaderBoard() 
            add_List(data) 
            document.getElementById("filterSelect").style.display = "block"; 
            document.getElementById("leaderBoard").style.display = "block"; 

        } 
    } catch (error) { 
        console.log(error) 
    } 
} 

delete_element = async (event) => { 
    try { 
        const currId = event.target.getAttribute("id") 
        console.log(currId) 
        await axios.delete(`http://localhost:2000/expense/users/${currId}`, { 
            headers: { "authorization": token } 
        }) 
        receive() 
    } catch (error) { 
        console.log(error) 
    } 
} 

async function check_premium() { 
    try { 
        console.log("this is wokring") 
        const email = localStorage.getItem("email") 
        const premium_data = await axios.get("http://localhost:2000/auth/checkPremium", 
            { headers: { "email": email } } 
        ) 
        if (premium_data.data.isPremium) { 
            return true 
        } else { 
            return false 
        } 
    } catch (error) { 
        console.log(error) 
    } 
} 

async function add_LeaderBoard() { 
    console.log("leaderborad created ") 
    const leaderboard = await axios.get("http://localhost:2000/expense/leaderboard") 
    const data = leaderboard.data 
    const table = document.getElementById("leaderboard-body") 
    table.innerHTML = data.map((item, index) => { 
        return ` 
          <tr> 
            <td>#${index + 1}</td> 
            <td>${item.user.name}</td> 
            <td>₹${item.totalexpenses}</td> 
          </tr> 
        `; 
    }).join(''); 
    console.log(data) 
} 

async function askAi(event) { 
    event.preventDefault() 
    try { 
        console.log("ask Ai working") 
        const query = document.getElementById("askBox").value 
        const sending = await axios.post("http://localhost:2000/expense/ai", { query }) 
        const response = sending.data 
        const data = document.getElementById("aiResponse") 
        data.textContent = response 
    } catch (error) { 
        console.log(error) 
    } 
} 

let allExpenses = []; 

function add_List(data) { 
    document.getElementById("downloadCSV").style.display = "block"; 
    document.getElementById("downloadCSV").addEventListener("click", () => { 
        downloadCSV(allExpenses); 
    }); 
    
 
    allExpenses = data; 
    const select = document.getElementById("filterSelect"); 
    const filter = select ? select.value : 'all'; 
    const now = new Date(); 
    let filtered = data; 
    if (filter === 'daily') { 
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
        console.log(today) 
        filtered = data.filter(item => new Date(item.createdAt) >= today); 
    } 
    if (filter === 'weekly') { 
        const weekAgo = new Date(now); 
        weekAgo.setDate(weekAgo.getDate() - 7); 
        filtered = data.filter(item => new Date(item.createdAt) >= weekAgo); 
    } 
    if (filter === 'monthly') { 
        filtered = data.filter(item => { 
            const date = new Date(item.createdAt); 
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear(); 
        }); 
    } 
    list.innerHTML = filtered.map(item => { 
        const date = new Date(item.createdAt).toLocaleDateString(); 
        return ` 
            <li> 
                Amount: ₹${item.amountSpend} | 
                Where: ${item.where} | 
                Description: ${item.description} | 
                Date: ${date} 
            <button id="${item.id}" class="buttons">Delete</button> 
             <button onclick="edit_element(${item.id}, ${item.amountSpend}, '${item.where}', '${item.description}')">Edit</button>
            </li> 

        `; 
    }).join(''); 
    document.body.appendChild(list); 
    createButton() 
    const deleted = document.querySelectorAll(".buttons"); 
    deleted.forEach(item => item.addEventListener("click", delete_element)); 

} 

function filterChange() { 
    add_List(allExpenses); 
} 

function downloadCSV(data) { 
    if (!data || data.length === 0) { 
        alert("No data to download"); 
        return; 
    } 
    let csv = ""; 
    // Headings 
    const headings = Object.keys(data[0]).join(","); 
    csv += headings + "\n"; 
    // Rows 
    data.forEach(row => { 
        csv += Object.values(row).join(",") + "\n"; 
    }); 
    const blob = new Blob([csv], { type: "text/csv" }); 
    const link = document.createElement("a"); 
    link.href = URL.createObjectURL(blob); 
    link.download = "expenses.csv"; 
    link.click(); 
}
async function edit_element(id){
    

}
let currentEditId = null;

async function edit_element(id, amountSpend, where, description) {
    // Just fill the form directly - no axios.get needed!
    document.getElementById("UpdateamountSpend").value = amountSpend;
    document.getElementById("Updatewhere").value = where;
    document.getElementById("updatedescription").value = description;
    
    // Store the id
    currentEditId = id;
    
    // Show the form
    document.getElementById("editForm").style.display = "block";
}

async function updateData(event){
event.preventDefault()
try {
    const updatedData = {
        amountSpend: document.getElementById("UpdateamountSpend").value,
        where: document.getElementById("Updatewhere").value,
        description: document.getElementById("updatedescription").value
    };
    
    await axios.put(`http://localhost:2000/expense/users/${currentEditId}`, updatedData, {
        headers: { "authorization": token }
    });
    
    alert("Expense updated successfully!");
    
    // Hide the form
    document.getElementById("editForm").style.display = "none";
    
    // Refresh the list
    receive();
    
} catch (error) {
    console.log(error);
    alert("Failed to update expense");
}
}
