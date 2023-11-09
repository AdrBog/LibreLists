<div align="center">
  <img src="./static/logo.svg">
  <h1>Libre Lists</h1>
  <p>Minimalistic Free and Open Source alternative to Microsoft Lists written in Python and Flask.</p>
</div>
<hr>

![https://www.gnu.org/licenses/gpl-3.0.en.html](https://img.shields.io/badge/License-GPL%20v3-blue)

Create simple SQLite databases with Libre Lists, then use them in your [Other Apps](https://github.com/AdrBog/OtherApps) applications.

## Installation
You need to have Python with virtualenv and Git installed

Install flask-cors to avoid CORS issues when connecting Other Apps with Libre Lists

```bash
git clone https://github.com/AdrBog/LibreLists.git
cd LibreLists
python -m venv venv
source venv/bin/activate
pip install flask flask-cors
python -m flask run -p 5001
```

## Screenshots
![Screenshot1](res/1.png)
![Screenshot2](res/2.png)
![Screenshot3](res/3.png)
![Screenshot4](res/4.png)
![Screenshot5](res/5.png)