function allowDrop(ev) {
    ev.preventDefault();
  }
  
  function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
  }
  
  function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const draggedImg = document.getElementById(data);
    const answer = draggedImg.getAttribute("data-answer");
    const target = ev.currentTarget.getAttribute("data-name");
  
    if (answer === target) {
      ev.currentTarget.innerHTML = "✅ " + answer;
      draggedImg.style.display = "none";
      document.getElementById("match-result").innerText = "Correct Match!";
      new Audio("/static/sounds/star.mp3").play();
  
      // Update score via AJAX
      fetch("/update-face-match-score", {
        method: "POST"
      }).then(response => response.json())
        .then(data => {
          if (data.badge_unlocked) {
            alert("🎉 Congrats! You've unlocked a badge!");
          }
        });
  
    } else {
      document.getElementById("match-result").innerText = "Oops! Try again.";
    }
  }
  
  