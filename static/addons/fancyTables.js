/*
    This addon makes your tables look more like Microsoft Lists tables
*/

window.addEventListener("load", () => {
    var sheet = document.createElement('style')
    sheet.innerHTML = `
        td[entry-type="BOOLEAN"]{
            color:rgba(0,0,0,0);
            font-family: 'aurulent-sans-mono';
        }

        td[entry-type="BOOLEAN"][value="1"]::after{
            color:var(--fg-2);
            content: "";
        }

        td[entry-type="BOOLEAN"][value="0"]::after{
            color:var(--fg-2);
            content: "";
        }

        th[entry-type]::before{
            font-family: 'aurulent-sans-mono';
        }

        th:not([entry-pk="0"])::before{
            content: "󰻾 " !important;
            font-weight: normal;
        }

        th[entry-type^="BOOLEAN"]::before{content: " ";}

        th[entry-type^="COLOR"]::before{content: "󰌁 ";}

        th[entry-type^="DATE"]::before, 
        th[entry-type^="DATETIME"]::before, 
        th[entry-type^="MONTH"]::before, 
        th[entry-type^="WEEK"]::before{
            content: " ";
        }

        th[entry-type^="TIME"]::before{content: " ";}

        th[entry-type^="BLOB"]::before{content: " ";}

        th[entry-type^="TEXT"]::before{content: "󰦩 ";}

        th[entry-type^="EMAIL"]::before{content: " ";}

        th[entry-type^="URL"]::before{content: " ";}

        th[entry-type^="NUMBER"]::before, 
        th[entry-type^="NUMERIC"]::before, 
        th[entry-type^="INTEGER"]::before,
        th[entry-type^="BIGINT"]::before,
        th[entry-type^="INT"]::before,
        th[entry-type^="REAL"]::before{
            content: " ";
        }

        th[entry-type*="VARCHAR"]::before{
            content: "󰦪 ";
        }
        
    `;
    document.body.appendChild(sheet);
})