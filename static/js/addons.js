/*
  This file is part of Libre Lists

  Libre Lists is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  Libre Lists is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with Libre Lists.  If not, see <http://www.gnu.org/licenses/>.

*/

const POPUPS_ZONE =                     document.getElementById("popups-zone");
const NAVBAR =                          document.getElementById("navbar");
const NAVBAR_ADD_COLUMN_BUTTON =        document.getElementById("navbar-add-column");
const NAVBAR_ADD_ROW_BUTTON =           document.getElementById("navbar-add-row");
const DATABASE_DROPDOWN =               document.getElementById("database-dropdown");
const TABLE_DROPDOWN =                  document.getElementById("table-dropdown");
function fancyText(string){
    return string.charAt(0).toUpperCase() + string.slice(1).replace(/_/g, " ");
}

function addButtonToNavbar(text, func, element = NAVBAR, id = null){
    const a = document.createElement("a");
    a.setAttribute("href", "#");
    a.setAttribute("onclick", func);
    if (id){
        a.setAttribute("id", id);
    }
    a.innerText = text;
    element.appendChild(a);
    return a;
}