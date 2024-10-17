/*
    This add-on simplifies column reordering, just by drag and drop
*/

let ths;
let dragged;

document.addEventListener("table-selected", e => {
    prepareHeaders();
})

function prepareHeaders() {
    const ths = document.querySelectorAll('#tableEditor th');
    let dragged = null;

    ths.forEach(th => {
        th.draggable = true;

        th.addEventListener('dragstart', (e) => {
            dragged = th;
            e.dataTransfer.effectAllowed = 'move';
            th.classList.add('dragging');
        });

        th.addEventListener('dragend', () => {
            th.classList.remove('dragging');
        });

        th.addEventListener('dragover', (e) => {
            e.preventDefault();
            th.classList.add('over');
        });

        th.addEventListener('dragleave', () => {
            th.classList.remove('over');
        });

        th.addEventListener('drop', (e) => {
            e.preventDefault();
            th.classList.remove('over');
            if (th !== dragged) {
                const parent = dragged.parentNode;
                if (th.nextSibling === dragged) {
                    parent.insertBefore(dragged, th);
                } else {
                    parent.insertBefore(dragged, th.nextSibling);
                }
                updateColumnOrder();
            }
        });
    });
}

async function updateColumnOrder() {
    ths = document.querySelectorAll('#tableEditor th');
    const order = Array.from(ths).map(th => th.textContent.trim()).join(', ');
    await setDatabaseConfig(DATABASE_ID, `table_${currentTable}_columns`, order);
    select(currentTable);
}

const style = document.createElement('style');
style.innerHTML = `
    #tableEditor th {
        transition: background-color 0.3s ease;
    }
    #tableEditor th.dragging {
        opacity: 0.5;
        background-color: #f0f0f0; /* Color de fondo al arrastrar */
    }
    #tableEditor th.over {
        border: 2px dashed #007bff; /* Borde al arrastrar sobre */
    }
`;
document.head.appendChild(style);