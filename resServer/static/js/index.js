const welcomeDom = document.getElementById("welcome");
const userTbody = document.getElementById("userTbody");
const addUserBox = document.getElementById("addUserBox");
const globalMsg = document.getElementById("globalMsg");
const addMsg = document.getElementById("addMsg");

let me = null;
let users = [];

const LEVEL_NAMES = { 1: "普通用户", 2: "二级用户", 3: "管理员" };

function showMsg(dom, text, ok) {
    dom.innerText = text;
    dom.style.color = ok ? "green" : "red";
    if (text) setTimeout(() => { dom.innerText = ""; }, 3000);
}

async function loadMe() {
    me = await api("/api/me");
    welcomeDom.innerText = `欢迎，${me.username}（${LEVEL_NAMES[me.level] || me.level}）`;
    addUserBox.style.display = me.level === 3 ? "block" : "none";
}

async function loadUsers() {
    const data = await api("/api/users");
    users = data.users || [];
    renderUsers();
}

function renderUsers() {
    userTbody.innerHTML = "";
    users.forEach(u => {
        const isSelf = u.username === me.username;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.username}${isSelf ? "（我）" : ""}</td>
            <td>${LEVEL_NAMES[u.level] || u.level}</td>
            <td></td>
        `;
        const actionCell = tr.querySelector("td:last-child");

        const pwdBtn = document.createElement("button");
        pwdBtn.className = "btn";
        pwdBtn.textContent = "改密码";
        pwdBtn.onclick = () => changePwd(u.username);
        actionCell.appendChild(pwdBtn);

        if (me.level === 3) {
            const levelBtn = document.createElement("button");
            levelBtn.className = "btn";
            levelBtn.textContent = "改等级";
            levelBtn.onclick = () => changeLevel(u.username, u.level);
            actionCell.appendChild(levelBtn);

            if (!isSelf) {
                const delBtn = document.createElement("button");
                delBtn.className = "btn btn-danger";
                delBtn.textContent = "删除";
                delBtn.onclick = () => deleteUser(u.username);
                actionCell.appendChild(delBtn);
            }
        }
        userTbody.appendChild(tr);
    });
}

async function changePwd(username) {
    const newPwd = prompt(`请输入 ${username} 的新密码`);
    if (!newPwd) return;
    const data = await api("/api/users/" + encodeURIComponent(username), {
        method: "PUT",
        body: JSON.stringify({ new_password: newPwd }),
    });
    showMsg(globalMsg, data.msg, data.code === 200);
}

async function changeLevel(username, level) {
    const input = prompt(`请输入 ${username} 的新等级（1/2/3），当前为 ${level}`);
    if (!input) return;
    const newLevel = Number(input);
    if (![1, 2, 3].includes(newLevel)) {
        showMsg(globalMsg, "等级必须是1、2或3", false);
        return;
    }
    const data = await api("/api/users/" + encodeURIComponent(username), {
        method: "PUT",
        body: JSON.stringify({ new_level: newLevel }),
    });
    showMsg(globalMsg, data.msg, data.code === 200);
    await loadUsers();
}

async function deleteUser(username) {
    if (!confirm(`确定删除用户 ${username} 吗？该操作不可恢复`)) return;
    const data = await api("/api/users/" + encodeURIComponent(username), { method: "DELETE" });
    showMsg(globalMsg, data.msg, data.code === 200);
    await loadUsers();
}

document.getElementById("addUserBtn").addEventListener("click", async () => {
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const level = Number(document.getElementById("newLevel").value);
    if (!username || !password) {
        showMsg(addMsg, "用户名和密码不能为空", false);
        return;
    }
    const data = await api("/api/add_user", {
        method: "POST",
        body: JSON.stringify({ username, password, level }),
    });
    showMsg(addMsg, data.msg, data.code === 200);
    if (data.code === 200) {
        document.getElementById("newUsername").value = "";
        document.getElementById("newPassword").value = "";
        await loadUsers();
    }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    window.location.href = "/";
});

(async () => {
    try {
        await loadMe();
        await loadUsers();
    } catch (err) {
        console.error(err);
    }
})();
