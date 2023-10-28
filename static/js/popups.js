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

class Popup{
    constructor(id, title, html, visibleAtStart = true, w = "500px", h ="300px"){
        this.id = id;
        this.title = title;
        this.html = html;
        this.visibleAtStart = visibleAtStart;
        this.w = w;
        this.h = h;
        this.div = document.createElement("div");
    }

    build(){
        this.div.setAttribute("id", this.id);
        this.div.setAttribute("class", "popup");
        this.div.innerHTML = "<div class='titlebar'><span class='title'>" + this.title + "</span><button onclick='document.getElementById(\"" + this.id + "\").style.visibility = \"hidden\"'>X</button></div><div class='body'>" + this.html + "</div>";
        if(!this.visibleAtStart){
            this.div.style.visibility = "hidden";
        }
        this.div.style.width = this.w;
        this.div.style.height = this.h;
        return this.div;
    }

    resetHTML(html = ""){
        this.body = this.div.querySelector(".body");
        this.body.innerHTML = "";
        this.body.innerHTML += html;
    }

    resetElement(element){
        this.body = this.div.querySelector(".body");
        this.body.innerHTML = "";
        this.body.appendChild(element);
    }

    appendHTML(html = ""){
        this.body = this.div.querySelector(".body");
        this.body.innerHTML += html;
    }

    appendElement(element){
        this.body = this.div.querySelector(".body");
        this.body.appendChild(element);
    }

    show(){
        this.div.style.visibility = "visible";
    }

    hide(){
        this.div.style.visibility = "hidden";
    }
}