const API_URL = "http://10.144.11.142:5001/api/login";

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const msgDom = document.getElementById("msg");

async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    msgDom.innerText = "";

    if (!username || !password) {
        msgDom.innerText = "用户名和密码不能为空";
        msgDom.style.color = "red";
        return;
    }

    try {
        const res = await fetch(API_URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        const data = await res.json();
        if (data.success) {
            msgDom.innerText = data.msg;
            msgDom.style.color = "green";

            // 前端直接跳转到对应等级页面
            if(data.level === 1){
                window.location.href = "/level1";
            }else if(data.level === 2){
                window.location.href = "/level2";
            }else if(data.level === 3){
                window.location.href = "/level3";
            }
        }
        else {
            msgDom.innerText = data.msg;
            msgDom.style.color = "red";
        }
    }catch (err) {
        msgDom.innerText = "网络请求失败，请检查服务";
        msgDom.style.color = "red";
        console.error(err);
    }
}

loginBtn.addEventListener('click', handleLogin);
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
});
