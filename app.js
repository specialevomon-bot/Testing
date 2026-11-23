const form = document.getElementById("lookupForm");
const input = document.getElementById("username");
const button = document.getElementById("searchBtn");
const result = document.getElementById("result");
const errorBox = document.getElementById("errorBox");
let current = null;

const byId = id => document.getElementById(id);
const text = (id, value) => { byId(id).textContent = value ?? "—"; };
function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove("hidden");
  result.classList.add("hidden");
}
function setBusy(busy) {
  button.disabled = busy;
  button.querySelector("span").textContent = busy ? "Searching…" : "Search";
}
function statusClass(type) {
  return type === 2 ? "ingame" : type === 1 ? "online" : "offline";
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const username = input.value.trim();
  if (!username) return;
  errorBox.classList.add("hidden");
  result.classList.add("hidden");
  setBusy(true);
  try {
    const response = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Lookup failed.");
    current = data;
    text("displayName", data.user.displayName || data.user.name);
    text("handle", "@" + data.user.name);
    text("userId", "· ID " + data.user.id);
    text("avatar", (data.user.displayName || data.user.name || "R").slice(0,1).toUpperCase());
    text("experience", data.experienceName || data.lastLocation || "Not available");
    text("creator", data.creatorName ? "By " + data.creatorName : "Creator unavailable");
    text("placeId", data.placeId || "Not provided");
    text("universeId", data.universeId || "Not provided");
    text("jobId", data.gameId || "Not provided by Roblox");
    text("rootPlaceId", data.rootPlaceId || data.gameRootPlaceId || "Not provided");
    const status = byId("status");
    status.textContent = data.status.toUpperCase();
    status.className = "status " + statusClass(data.presenceType);
    byId("notice").textContent = data.note || "Presence information received from Roblox.";
    byId("joinBtn").disabled = !data.joinUrl;
    byId("joinBtn").textContent = data.joinUrl ? "↗ Join available server" : "Server join unavailable";
    byId("profileBtn").onclick = () => window.open("https://www.roblox.com/users/" + data.user.id + "/profile", "_blank", "noopener");
    text("checkedAt", "Checked " + new Date().toLocaleString());
    result.classList.remove("hidden");
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
  } finally {
    setBusy(false);
  }
});
document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
  const key = btn.dataset.copy;
  const value = key === "jobId" ? current?.gameId : current?.[key];
  if (!value) return;
  try {
    await navigator.clipboard.writeText(String(value));
    const old = btn.textContent;
    btn.textContent = "COPIED";
    setTimeout(() => btn.textContent = old, 1200);
  } catch { btn.textContent = "FAILED"; }
}));
byId("joinBtn").addEventListener("click", () => {
  if (current?.joinUrl) window.location.href = current.joinUrl;
});
