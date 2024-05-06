const inputs = document.querySelectorAll('.image-input');
const divs = document.querySelectorAll('.additional-image');

for (let i = 0; i < inputs.length; i++) {
  const input = inputs[i];
  const div = divs[i];

  input.addEventListener('change', function() {
    const file = this.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
      div.style.backgroundImage = `url('${e.target.result}')`;
    };

    reader.readAsDataURL(file);
    div.setAttribute('data-filename', file.name);
  });

  div.addEventListener('click', function() {
    input.click();
  });
}


function toggleBold() {
    var textarea = document.getElementById("descriptionTextarea");
    textarea.style.fontWeight = textarea.style.fontWeight === "bold" ? "normal" : "bold";
}

function toggleItalic() {
    var textarea = document.getElementById("descriptionTextarea");
    textarea.style.fontStyle = textarea.style.fontStyle === "italic" ? "normal" : "italic";
}

function toggleParagraph() {
    var textarea = document.getElementById("descriptionTextarea");
    textarea.value += "\n\n";
}

function toggleBulletList() {
    var textarea = document.getElementById("descriptionTextarea");
    textarea.value += "• ";
}

function toggleNumberList() {
    var textarea = document.getElementById("descriptionTextarea");
    var lines = textarea.value.split("\n");

    for (var i = 0; i < lines.length; i++) {
        lines[i] = (i + 1) + ". " + lines[i];
    }

    textarea.value = lines.join("\n");
}

function copyText() {
    var textarea = document.getElementById("descriptionTextarea");
    textarea.select();
    document.execCommand("copy");
}