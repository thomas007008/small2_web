


var g_u_play_icon = `<svg class="bi bi-play-circle-fill u_playPauseIcon" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 16 16">
<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.79 5.093A.5.5 0 0 0 6 5.5v5a.5.5 0 0 0 .79.407l3.5-2.5a.5.5 0 0 0 0-.814l-3.5-2.5z"></path>
</svg>`;


var g_u_pause_icon = `<svg class="bi bi-pause-circle-fill u_playPauseIcon" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 16 16">
<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.25 5C5.56 5 5 5.56 5 6.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C7.5 5.56 6.94 5 6.25 5zm3.5 0c-.69 0-1.25.56-1.25 1.25v3.5a1.25 1.25 0 1 0 2.5 0v-3.5C11 5.56 10.44 5 9.75 5z"></path>
</svg>`;

// if (window.location.href.indexOf('tools.html') !== -1){
window.addEventListener('load', function() {
    // 页面加载完成后要执行的代码
    init()
});




function init()
{
    if ($('.u_playPauseIcon').length > 0) {
        console.log("init player")
        $('.u_playPauseIcon').click(handleUPlayStop); 
        // updateTime();
        // setPlayTime();
        // 当页面加载时，也尝试更新一次（如果音频已经预加载）
        // updateAllTimeDisplay();
        // 监听 durationchange 事件
        // $('.u_myAudio').on('loadedmetadata', updateAllTimeDisplay);


        // 为每个播放按钮添加事件监听
        $('.audio-wrapper').each(function() {
            var audioWrapperId = $(this).data('audio-wrapper');
            var audioId = $(this).data('audio');
            var audioTimeId = $(this).data('audio-time');
            var audioDownloadId = $(this).data('audio-download');
            var audioShareId = $(this).data('audio-share');
            var audioDeleteId = $(this).data('audio-delete');
            var playPauseId = $(this).data('play-pause');
    
        
            
            var audio = $('#' + audioId)[0];
            // 当音频播放结束时，重置进度条
            audio.addEventListener('ended', function() {
                console.log("music_ended")
                var audio_container = $(this).parent();
                var childElements = audio_container.find('.u_playPauseIcon');    
                //播放图标
                var play_icon_jQuery = $(g_u_play_icon);
                childElements.replaceWith(play_icon_jQuery); // 显示暂停图标
                childElements.off('click')
                play_icon_jQuery.click(handleUPlayStop);
            });

        });
    }

}



function handleUPlayStop (){
    console.log("handleUPlayStop")
    
    var clickedIcon = $(this);
    // 停止所有音乐
    $('.u_myAudio').each(function() {
        this.pause();
        if (!clickedIcon.is($(this))){
            this.currentTime = 0; // 可选，重置音频到开始位置
        }
        // if(clickedIcon != $(this)){
        //     this.currentTime = 0; // 可选，重置音频到开始位置
        // }
    });

    $('.u_playPauseIcon').each(function() {
        if (!clickedIcon.is($(this))){
            var play_icon_jQuery = $(g_u_play_icon);
            $(this).replaceWith(play_icon_jQuery); // 
            $(this).off('click')
            play_icon_jQuery.click(handleUPlayStop);
        }
    });

    // 获取当前按钮关联的音频元素
    var iconContainer = clickedIcon.parent(); // 获取图标容器
    var audio = iconContainer.parent().children('.u_myAudio')[0];
    // var music_id = iconContainer.parent().attr('music-id');
    // readProcess(iconContainer,music_id)

    var rect = clickedIcon.find('rect');

    if (clickedIcon.hasClass('bi-pause-circle-fill')) {
        //暂停图标
        var play_icon_jQuery = $(g_u_play_icon);
        clickedIcon.replaceWith(play_icon_jQuery); // 
        clickedIcon.off('click')
        play_icon_jQuery.click(handleUPlayStop);
        audio.pause();
    } else {
        //播放图标
        var pause_icon_jQuery = $(g_u_pause_icon);
        clickedIcon.replaceWith(pause_icon_jQuery); // 显示暂停图标
        clickedIcon.off('click')
        pause_icon_jQuery.click(handleUPlayStop);
        audio.play()
        .then(function() {
            console.log("音频播放成功！");
            // 在这里进行你想要的处理
        })
        .catch(function(error) {
            console.log("音频播放失败：" + error);
            // 在这里进行你想要的处理
        });   
    }
}









// $(document).ready(function() {
//     var audio = $('#u_myAudio')[0]; // 获取原生的 audio 元素
//     var $progressBar = $('#audio-progress');

//     // 更新进度条的函数
//     function updateProgressBar() {
//         if (!audio.duration) {
//             return;
//         }
//         var percentage = (audio.currentTime / audio.duration) * 100;
//         $progressBar.css('background', `linear-gradient(to right, rgba(108, 108, 108, 0.5) ${percentage}%, rgba(108, 108, 108, 0.3) ${percentage}%)`);
//     }

//     // 定期更新进度条
//     setInterval(updateProgressBar, 500);

//     // 当音频播放结束时，重置进度条
//     audio.addEventListener('ended', function() {
//         $progressBar.css('background', 'linear-gradient(to right, rgba(108, 108, 108, 0.3) 0%, rgba(108, 108, 108, 0.3) 100%)');
//         iconContainer.html(g_u_play_icon); // 
//         $("#u_playPauseIcon").off('click')
//         $("#u_playPauseIcon").click(handleUPlayStop);
//     });
// });




// $(document).ready(function() {
//     var audio = $('#myAudio')[0]; // 获取原生的 audio 元素
//     var $progressBar = $('#audio-progress');

//     // 更新进度条的函数
//     function updateProgressBar() {
//         if (!audio.duration) {
//             return;
//         }
//         var percentage = (audio.currentTime / audio.duration) * 100;
//         $progressBar.css('background', `linear-gradient(to right, rgba(108, 108, 108, 0.5) ${percentage}%, rgba(108, 108, 108, 0.3) ${percentage}%)`);
//     }

//     // 定期更新进度条
//     setInterval(updateProgressBar, 500);

//     // 当音频播放结束时，重置进度条
//     audio.addEventListener('ended', function() {
//         $progressBar.css('background', 'linear-gradient(to right, rgba(108, 108, 108, 0.3) 0%, rgba(108, 108, 108, 0.3) 100%)');
//     });
// });