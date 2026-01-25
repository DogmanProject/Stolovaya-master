let historyStack = ["start"];
let currentRole = null;
let chosenMeal = null;
let chosenDish = null;
let allUsers = [];

function show(id){
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    if(historyStack[historyStack.length-1]!==id){ historyStack.push(id); }
}

function goBack(){
    if(historyStack.length>1){
        historyStack.pop();
        let last = historyStack[historyStack.length-1];
        show(last);
    }
}

function openLogin(role){
    currentRole = role;
    loginTitle.innerText = "Вход: " + role;
    loginError.innerText = "";
    show("login");
}

function chooseRole(role){
    currentRole = role;
    registerTitle.innerText = "Регистрация: " + role;
    classRow.style.display = role==="student" ? "flex" : "none";
    show("register");
}

function strongPassword(password) {
    if (password.length < 8) return false;
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    const complexity = 
        [hasUpperCase, hasLowerCase, hasDigit, hasSpecialChar]
        .filter(Boolean).length;
    
    return complexity >= 1;
}

function registerUser(){
    registerError.innerText = "";
    registerSuccess.innerText = "";

    if(regPass1.value !== regPass2.value){
        registerError.innerText = "Пароли не совпадают";
        return;
    }
    if(!strongPassword(regPass1.value)){
        registerError.innerText = "Пароль слишком слабый, он должен содержать минимум 8 символов";
        return;
    }


    fetch("http://127.0.0.1:5000/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            email: regEmail.value,
            password: regPass1.value,
            role: currentRole,
            surname: surname.value,
            name: name.value,
            patronymic: patronymic.value,
            birthdate: birthdate.value,
            class_number: classNumber.value || null,
            class_letter: classLetter.value || null
        })
    })
    .then(r=>r.json())
    .then(data=>{
        if(data.error){
            registerError.innerText = data.error;
        } else {
            registerSuccess.innerText = "Вы успешно зарегистрировались!";
            setTimeout(()=>{ historyStack=["start"]; show("start"); },3000);
        }
    });
}

function login(){
    loginError.innerText = "";

    fetch("http://127.0.0.1:5000/login",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            email: loginEmail.value,
            password: loginPassword.value,
            role: currentRole
        })
    })
    .then(r=>r.json())
    .then(data=>{
        if(data.error){
            loginError.innerText="Неверный логин или пароль";
        } else {
            show(currentRole);
        }
    });
}

function showMenu(){
    show("menuScreen");
}

function loadDayMenu(){
    let day = daySelect.value;
    fetch("http://127.0.0.1:5000/menu/"+day)
    .then(r=>r.json())
    .then(data=>{
        menuContent.innerHTML = `
            <h4>Завтрак:</h4>
            <ul>${data.breakfast.map(d=>`<li>${d}</li>`).join("")}</ul>
            <h4>Обед:</h4>
            <ul>${data.lunch.map(d=>`<li>${d}</li>`).join("")}</ul>
        `;
    });
}

function openFood(){
    show("foodType");
}

function chooseMeal(meal){
    chosenMeal = meal;
    show("foodChoose");

    let day = new Date().toLocaleString("ru",{weekday:"long"});
    day = day[0].toUpperCase()+day.slice(1);

    fetch("http://127.0.0.1:5000/menu/"+day)
    .then(r=>r.json())
    .then(data=>{
        dishList.innerHTML = data[meal].map(d=>`<button onclick="selectDish('${d}')">${d}</button>`).join("");
        mealTitle.innerText = "Выберите блюдо: " + (meal==="breakfast"?"Завтрак":"Обед");
    });
}

function selectDish(dish){
    chosenDish = dish;
    show("foodPay");
}

function confirmPay(){
    fetch("http://127.0.0.1:5000/order",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            dish: chosenDish,
            meal: chosenMeal
        })
    });
    show("foodReceive");
}

function finishReceive(){
    show("foodReview");
}

function sendReview(){
    fetch("http://127.0.0.1:5000/review",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            dish: chosenDish,
            meal: chosenMeal,
            review: reviewText.value
        })
    });
    show("student");
}

function skipReview(){
    show("student");
}

function openCookMenu(){
    show("cookMenu");
}

function loadCookMenu(){
    let day = cookDay.value;
    fetch("http://127.0.0.1:5000/menu/"+day)
    .then(r=>r.json())
    .then(data=>{
        cookBreakfast.innerHTML = data.breakfast.map(i=>"<div>"+i+"</div>").join("");
        cookLunch.innerHTML = data.lunch.map(i=>"<div>"+i+"</div>").join("");
    });
}

function addCookDish(){
    fetch("http://127.0.0.1:5000/menu/add",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            day: cookDay.value,
            meal: addType.value,
            dish: addDish.value
        })
    }).then(()=>loadCookMenu());
}

function removeCookDish(){
    fetch("http://127.0.0.1:5000/menu/delete",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
            day: cookDay.value,
            meal: removeType.value,
            dish: removeDish.value
        })
    }).then(()=>loadCookMenu());
}

function openCookOrders(){
    show("cookOrders");

    fetch("http://127.0.0.1:5000/cook/orders_today")
    .then(r=>r.json())
    .then(data=>{
        ordersList.innerHTML = data.map((o,i)=>`
            <div style="border:1px solid #ccc;padding:10px;margin:5px">
                ${o.meal}: ${o.dish}<br>
                Статус: ${o.given?"выдано":"не выдано"}<br>
                <button onclick="markGiven(${i})">Отметить как выдано</button>
            </div>
        `).join("");
    });
}

function markGiven(index){
    fetch("http://127.0.0.1:5000/cook/mark_given",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({index:index})
    }).then(()=>openCookOrders());
}

function openCookReviews(){
    show("cookReviewsList");

    fetch("http://127.0.0.1:5000/cook/reviews")
    .then(r=>r.json())
    .then(data=>{
        reviewsOutput.innerHTML = data.map(r=>`<li>${r.dish}: ${r.review}</li>`).join("");
    });
}

function openAdminUsers(){
    show("adminUsers");

    fetch("http://127.0.0.1:5000/admin/users")
    .then(r=>r.json())
    .then(data=>{
        allUsers = data;
        renderUsers(data);
    });
}

function renderUsers(list){
    usersList.innerHTML = list.map(u=>`
        <div style="border:1px solid #ccc;padding:10px;margin:5px">
            <b>${u.surname} ${u.name} ${u.patronymic}</b><br>
            Email: ${u.email}<br>
            Роль:
            <select onchange="changeUserRole(${u.id},this.value)">
                <option value="student" ${u.role=="student"?"selected":""}>Ученик</option>
                <option value="cook" ${u.role=="cook"?"selected":""}>Повар</option>
                <option value="admin" ${u.role=="admin"?"selected":""}>Администратор</option>
            </select>
            <br>
            <button onclick="deleteUser(${u.id})">Удалить</button>
        </div>
    `).join("");
}

function filterUsers(){
    let q = userSearch.value.toLowerCase();
    let filtered = allUsers.filter(u=>u.surname.toLowerCase().includes(q));
    renderUsers(filtered);
}

function deleteUser(id){
    fetch("http://127.0.0.1:5000/admin/users/delete",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:id})
    }).then(()=>openAdminUsers());
}

function changeUserRole(id,role){
    fetch("http://127.0.0.1:5000/admin/users/role",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:id,role:role})
    });
}

function openAdminMenu(){
    show("adminMenu");
}

function openAdminOrders(){
    show("adminOrders");
    loadAdminOrders();
}

function loadAdminOrders(){
    fetch("http://127.0.0.1:5000/cook/orders_today")
    .then(r=>r.json())
    .then(data=>{
        adminOrdersList.innerHTML = data.map(o=>`
            <div style="border:1px solid #ccc;padding:10px;margin:5px">
                ${o.meal}: ${o.dish} — ${o.given?"выдано":"не выдано"}
            </div>
        `).join("");
    });
}

function openAdminReviews(){
    show("adminReviews");

    fetch("http://127.0.0.1:5000/cook/reviews")
    .then(r=>r.json())
    .then(data=>{
        adminReviewsList.innerHTML = data.map(r=>`
            <div style="border:1px solid #ccc;padding:10px;margin:5px">
                <b>${r.dish}</b>: ${r.review}
            </div>
        `).join("");
    });
}

function openAdminSystem(){
    show("adminSystem");
}

function clearStats(){
    fetch("http://127.0.0.1:5000/admin/clear",{
        method:"POST"
    }).then(()=>alert("Статистика очищена"));
}

// заполнение классов
for(let i=1;i<=11;i++){
    classNumber.innerHTML+=`<option>${i}</option>`;
}
"АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯ".split("").forEach(l=>{
    classLetter.innerHTML+=`<option>${l}</option>`;
});