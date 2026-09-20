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

// ---- 通用弹窗：确认时 resolve 输入值（确认型弹窗 resolve true），取消 resolve null ----
const modalOverlay = document.getElementById("modalOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalInput = document.getElementById("modalInput");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");

function openModal({ title, message = "", inputType = "text", placeholder = "", confirmText = "确 定", danger = false }) {
    return new Promise((resolve) => {
        modalTitle.innerText = title;
        modalText.innerText = message;
        modalInput.type = inputType;
        modalInput.placeholder = placeholder;
        modalInput.value = "";
        modalInput.classList.toggle("hidden", inputType === "none");
        modalConfirm.innerText = confirmText;
        modalConfirm.classList.toggle("btn-danger", danger);
        modalOverlay.classList.add("show");
        if (inputType !== "none") setTimeout(() => modalInput.focus(), 60);

        const done = (value) => {
            modalOverlay.classList.remove("show");
            modalCancel.onclick = null;
            modalConfirm.onclick = null;
            modalInput.onkeydown = null;
            resolve(value);
        };
        modalCancel.onclick = () => done(null);
        modalConfirm.onclick = () => done(inputType === "none" ? true : modalInput.value);
        modalInput.onkeydown = (e) => {
            if (e.key === "Enter" && inputType !== "none") done(modalInput.value);
        };
    });
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

const LEVEL_ICONS = { 1: "🐣", 2: "🦊", 3: "👑" };

function renderUsers() {
    userTbody.innerHTML = "";
    users.forEach(u => {
        const isSelf = u.username === me.username;
        const badge = `<span class="badge badge-${u.level}">${LEVEL_ICONS[u.level] || ""} ${LEVEL_NAMES[u.level] || u.level}</span>`;
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${u.username}${isSelf ? "（我）" : ""}</td>
            <td>${badge}</td>
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
    const newPwd = await openModal({
        title: "🔑 修改密码",
        message: `为用户 ${username} 设置新密码`,
        inputType: "password",
        placeholder: "请输入新密码",
        confirmText: "保 存",
    });
    if (!newPwd) return;
    const data = await api("/api/users/" + encodeURIComponent(username), {
        method: "PUT",
        body: JSON.stringify({ new_password: newPwd }),
    });
    showMsg(globalMsg, data.msg, data.code === 200);
}

async function changeLevel(username, level) {
    const input = await openModal({
        title: "🎖 修改等级",
        message: `用户 ${username} 当前为 ${LEVEL_NAMES[level] || level}，请输入新等级`,
        inputType: "text",
        placeholder: "（1 普通 / 2 二级 / 3 管理员）",
        confirmText: "更 新",
    });
    if (input === null || input === "") return;
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
    const ok = await openModal({
        title: "🗑 删除用户",
        message: `确定删除用户 ${username} 吗？该操作不可恢复。`,
        inputType: "none",
        confirmText: "确认删除",
        danger: true,
    });
    if (!ok) return;
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

// ---- 自定义等级下拉 ----
const levelSelect = document.getElementById("levelSelect");
const levelDisplay = document.getElementById("levelDisplay");
const levelDisplayText = document.getElementById("levelDisplayText");
const levelOptions = document.querySelectorAll("#levelOptions .select-option");
const newLevelSelect = document.getElementById("newLevel");

levelDisplay.addEventListener("click", (e) => {
    e.stopPropagation();
    levelSelect.classList.toggle("open");
});
levelOptions.forEach((opt) => {
    opt.addEventListener("click", () => {
        levelOptions.forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        levelDisplayText.textContent = opt.textContent.trim();
        newLevelSelect.value = opt.dataset.value;
        levelSelect.classList.remove("open");
    });
});
document.addEventListener("click", (e) => {
    if (!levelSelect.contains(e.target)) levelSelect.classList.remove("open");
});

(async () => {
    try {
        await loadMe();
        await loadUsers();
    } catch (err) {
        console.error(err);
    }
})();
