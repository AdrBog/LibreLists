/**
 * This addon allows you to configure keyboard shortcuts for the Libre Lists. 
 */

const TEXTAREA_TABS_REGEX = /^\t*/g;

document.addEventListener("keydown", e => {
    switch (e.target.tagName.toLowerCase()) {
        case 'input':
            break;
        case 'textarea':
            const textarea = e.target;
            if (e.key === "Tab"){
                e.preventDefault();
                insertTextInTextarea(textarea, "\t");
            } else if (e.key === "Enter"){
                e.preventDefault();
                const oldLine = getTextareaLine(textarea, textarea.selectionStart);
                insertTextInTextarea(textarea, "\n");
                insertTextInTextarea(textarea, oldLine.match(TEXTAREA_TABS_REGEX));
            } else if (e.key === "{"){
                e.preventDefault();
                insertTextInTextarea(textarea, "{}");
                textarea.selectionEnd = textarea.selectionEnd - 1;
                textarea.selectionStart = textarea.selectionEnd;
            } else if (e.key === "("){
                e.preventDefault();
                insertTextInTextarea(textarea, "()");
                textarea.selectionEnd = textarea.selectionEnd - 1;
                textarea.selectionStart = textarea.selectionEnd;
            } else if (e.ctrlKey && e.key === '+'){
                e.preventDefault()
                changeTextareaFontSize(textarea, 1)
            } else if (e.ctrlKey && e.key === '-'){
                e.preventDefault()
                changeTextareaFontSize(textarea, -1)
            }
            break;
        default:
            if (e.key === 'Insert'){
                e.preventDefault();
                addRecordDialog();
            }
    }
})

function changeTextareaFontSize(textarea, value){
    const currentFontSize = parseInt(window.getComputedStyle(textarea).fontSize.match(/\d+/).join(""));
    textarea.style.fontSize = (currentFontSize + value) + "px";
}

function getTextareaLine(textarea, selectionStart){
    const lines = textarea.value.split("\n");
    let selection = 0;
    for (const line of lines) {
        for (let index = 0; index <= line.length; index++){
            selection ++;
            if (selection >= selectionStart)
                return line;
        }
    }
    return null;
}

function insertTextInTextarea(textarea, text){
    const position = textarea.selectionStart;
    const end = position;
    textarea.setRangeText(text, position, end, 'select');
    textarea.selectionStart = textarea.selectionEnd;
}
