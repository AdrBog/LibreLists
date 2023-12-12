// A small addon to add the Other Apps button in
// the home page

async function openOtherApps(){
    window.open(await getConfig("Ohter_Apps_host"), "_blank")
}

window.addEventListener("load", () => {
    const a = document.createElement("a");
    a.href = "#";
    a.setAttribute("onclick", "openOtherApps()");
    a.innerText = "Other Apps"
    document.getElementById("navbar").appendChild(a);
})