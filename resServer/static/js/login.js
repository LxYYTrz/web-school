const card = document.getElementById("card");

// ---- 元素 ----
const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");

const regUsername = document.getElementById("regUsername");
const regPassword = document.getElementById("regPassword");
const regPassword2 = document.getElementById("regPassword2");
const registerBtn = document.getElementById("registerBtn");
const regMsg = document.getElementById("regMsg");

const loginBox = document.getElementById("loginBox");
const registerBox = document.getElementById("registerBox");
const welcomeLogin = document.getElementById("welcomeLogin");
const welcomeRegister = document.getElementById("welcomeRegister");

// ---- 登录 / 注册面板切换（左右滑动） ----
function showRegister() {
    card.classList.add("register");
    loginBox.classList.add("hidden");
    registerBox.classList.remove("hidden");
    welcomeLogin.classList.add("hidden");
    welcomeRegister.classList.remove("hidden");
    loginMsg.innerText = "";
}
function showLogin() {
    card.classList.remove("register");
    registerBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
    welcomeRegister.classList.add("hidden");
    welcomeLogin.classList.remove("hidden");
    regMsg.innerText = "";
}
document.getElementById("goRegister").addEventListener("click", showRegister);
document.getElementById("goLogin").addEventListener("click", showLogin);

function setMsg(dom, text, ok) {
    dom.innerText = text;
    dom.style.color = ok ? "#eafff0" : "#ffe2e2";
}

// ---- 登录 ----
async function handleLogin() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    setMsg(loginMsg, "", true);
    if (!username || !password) {
        setMsg(loginMsg, "用户名和密码不能为空");
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/login`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            window.location.href = "/index.html";
        } else {
            setMsg(loginMsg, data.msg);
        }
    } catch (err) {
        setMsg(loginMsg, "网络请求失败，请检查服务");
        console.error(err);
    }
}
loginBtn.addEventListener("click", handleLogin);

// ---- 注册 ----
async function handleRegister() {
    const username = regUsername.value.trim();
    const password = regPassword.value;
    const password2 = regPassword2.value;
    setMsg(regMsg, "", true);

    if (!username || !password) {
        setMsg(regMsg, "用户名和密码不能为空");
        return;
    }
    if (password !== password2) {
        setMsg(regMsg, "两次输入的密码不一致");
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            setMsg(regMsg, "注册成功，请登录", true);
            regUsername.value = "";
            regPassword.value = "";
            regPassword2.value = "";
            // 自动切回登录页并带入用户名
            showLogin();
            loginUsername.value = username;
            loginPassword.focus();
        } else {
            setMsg(regMsg, data.msg);
        }
    } catch (err) {
        setMsg(regMsg, "网络请求失败，请检查服务");
        console.error(err);
    }
}
registerBtn.addEventListener("click", handleRegister);

// 回车提交
document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (card.classList.contains("register")) handleRegister();
    else handleLogin();
});
