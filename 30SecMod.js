(function() {  
    'use strict';  
  
    var bg = document.createElement("div");  
  
    bg.style.position = "absolute";  
    bg.style.top = "1.5em";  
    bg.style.left = "50%";  
    bg.style.transform = "translateX(-50%)";  
    bg.style.backgroundColor = "#eb2b6d";  
    bg.style.borderRadius = "0.75em";  
    bg.style.padding = "0.25em 0.5em 0.25em 0.25em";  
    bg.style.display = "none";  
    bg.style.flexDirection = "column";  
    bg.style.alignItems = "center";  
    bg.style.justifyContent = "center";  
    bg.style.boxShadow = "0 0.25em 0 #00000040";  
    bg.style.boxSizing = "border-box";  
    bg.style.pointerEvents = "none";  
    bg.style.zIndex = "9999";  
    bg.style.fontFamily = "Comfortaa-Bold";  
    bg.style.fontSize = "clamp(16px, 4vh, 32px)";  
    bg.style.width = "8.5em";  
  
    var timerDisplay = document.createElement("div");  
  
    timerDisplay.style.display = "flex";  
    timerDisplay.style.justifyContent = "center";  
    timerDisplay.style.alignItems = "center";  
    timerDisplay.style.width = "100%";  
    timerDisplay.style.whiteSpace = "nowrap";  
    timerDisplay.style.color = "#fff";  
    timerDisplay.style.pointerEvents = "none";  
    timerDisplay.style.userSelect = "none";  
    timerDisplay.style.textShadow = "0 2px 0 rgba(0, 0, 0, 0.25)";  
  
    var label = document.createElement("div");  
  
    label.textContent = "Seconds Left";  
    label.style.color = "#fff";  
    label.style.fontSize = "0.85em";  
    label.style.lineHeight = "1";  
    label.style.marginTop = "0.15em";  
    label.style.whiteSpace = "nowrap";  
    label.style.textShadow = "0 1px 0 rgba(0, 0, 0, 0.25)";  
    label.style.pointerEvents = "none";  
    label.style.userSelect = "none";  
  
    bg.appendChild(timerDisplay);  
    bg.appendChild(label);  
    appElement.appendChild(bg);  
  
    var triggered = false;  
  
    function hideUI() {  
        bg.style.display = "none";  
    }  
  
    window.addEventListener("pageMounted", function() {  
        hideUI();  
    });  
  
    function updateUI() {  
        var timer = Number(app.timer);  
  
        if (!app.play || isNaN(timer)) {  
            hideUI();  
            triggered = false;  
            return;  
        }  
  
        bg.style.display = "flex";  
  
        var remaining = Math.max(0, 30 - timer);  
  
        if (remaining <= 0) {  
            label.style.display = "none";  
            timerDisplay.innerHTML = "";  
            timerDisplay.textContent = "Time's Up!";  
            timerDisplay.style.justifyContent = "center";  
        } else {  
            label.style.display = "block";  
            timerDisplay.innerHTML = "";  
            timerDisplay.textContent = "";  
            timerDisplay.style.justifyContent = "center";  
  
            var text = remaining.toFixed(2);  
  
            for (var i = 0; i < text.length; i++) {  
                var span = document.createElement("span");  
  
                span.textContent = text[i];  
                span.style.display = "inline-block";  
                span.style.width = "0.8em";  
                span.style.textAlign = "center";  
  
                timerDisplay.appendChild(span);  
            }  
        }  
  
        if (timer >= 30 && !triggered) {  
            triggered = true;  
            app.player.removeCheckpoint();  
            app.player.kill();  
        }  
  
        if (timer < 30) {  
            triggered = false;  
        }  
    }  
  
    addUpdateFunction(updateUI);  
    addModToList("30 Seconds Mod");  
})();
