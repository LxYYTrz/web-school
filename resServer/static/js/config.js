// 后端业务服务地址：自动跟随当前访问的主机名，部署到其他机器无需改动
const API_BASE = `http://${window.location.hostname}:5001`;

async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        window.location.href = "/";
        throw new Error("未登录");
    }
    return data;
}
