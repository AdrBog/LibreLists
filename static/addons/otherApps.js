// A small addon to add the Other Apps button in
// the home page

addButtonToNavbar("Other Apps", "openOtherApps()");

async function openOtherApps(){
    window.open(await getConfig("Ohter_Apps_host"), "_blank")
}