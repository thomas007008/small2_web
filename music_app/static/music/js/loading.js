// function autoPlay() {
//     const keys = document.querySelectorAll('.key');
//     setInterval(() => {
//       // 随机选择一个钥匙来弹奏
//       const randomKey = keys[Math.floor(Math.random() * keys.length)];
//       randomKey.classList.add('pressed');
  
//       // 这里，你可以加入音乐播放的代码，使其更真实
  
//       setTimeout(() => randomKey.classList.remove('pressed'), 200);
//     }, 500);
//   }
  
//   autoPlay();

export default function initLoading(){
  let style = document.createElement('style');
  let cssText = '';

  for (let i = 1; i <= 9; i++) {
    const duration = Math.random() * 1.5 + 0.5; // 0.5 to 2 seconds
    const delay = Math.random() * 0.2 - 0.1; // -0.1 to 0.1 seconds
    cssText += `.loading > div:nth-child(${i}) { animation-duration: ${duration}s; animation-delay: ${delay}s; }\n`;
  }

  style.textContent = cssText;
  document.head.appendChild(style);

  const loadingDiv = document.querySelector('.loading');
  for (let i = 0; i < 9; i++) {
    const newDiv = document.createElement('div');
    loadingDiv.appendChild(newDiv);
}
}

// const note = document.querySelector('.music-note');
// let currentLeft = 0;
// let currentTop = 0;

// function animateNote() {
//   const duration = 500;
//   const containerWidth = 1000; // 容器宽度
//   const containerHeight = 200; // 容器高度
//   const noteWidth = note.offsetWidth;
//   const noteHeight = note.offsetHeight;

//   // 随机生成目标位置，确保不超出容器范围
//   const targetLeft = Math.random() * (containerWidth - noteWidth);
//   const targetTop = Math.random() * (containerHeight - noteHeight);
  
//   // 设置CSS动画
//   note.style.transition = `all ${duration}ms ease-in-out`;
//   note.style.left = `${targetLeft}px`;
//   note.style.top = `${targetTop}px`;
  
//   // 在动画结束后，更新音符的当前位置，并重新开始动画
//   setTimeout(() => {
//     currentLeft = targetLeft;
//     currentTop = targetTop;
    
//     note.style.transition = 'none'; // 移除动画
//     note.style.left = `${currentLeft}px`;
//     note.style.top = `${currentTop}px`;
    
//     // 重新开始动画
//     requestAnimationFrame(animateNote);
//   }, duration);
// }

// // 开始动画
// requestAnimationFrame(animateNote);

// let note = document.getElementById('note');
// let obstacle = document.getElementById('obstacle');

// let jumping = false;
// let obstaclePosition = 800;

// function autoJump() {
//   if (obstaclePosition <= 100 && !jumping) {
//     jump();
//   }
// }

// function jump() {
//   let position = 0;
//   jumping = true;
//   let jumpInterval = setInterval(function() {
//     if (position < 100) {
//       position += 10;
//       note.style.bottom = position + 'px';
//     } else {
//       clearInterval(jumpInterval);
//       let fallInterval = setInterval(function() {
//         if (position > 0) {
//           position -= 10;
//           note.style.bottom = position + 'px';
//         } else {
//           clearInterval(fallInterval);
//           jumping = false;
//         }
//       }, 20);
//     }
//   }, 20);
// }

// let obstacleInterval = setInterval(function() {
//   if (obstaclePosition < 0) {
//     obstaclePosition = 800;
//   } else {
//     obstaclePosition -= 10;
//   }
//   obstacle.style.right = obstaclePosition + 'px';
//   autoJump();
// }, 20);

