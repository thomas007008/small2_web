// import {
//     enterEditPage,
//     eBackAudioSourceSeparationMIDI,
//     eBackAudioSourceSeparation,
//     eBackSelectAudio,
//     eBackConvertToMidi,
//     externalCacheEnterEditPage,
//     externalIndexDBEnterEditPage
// } from './music_edit.mjs'
import {
    enterRecordPage,
    loadProcessedMusic,
    releaseRecordResource,
    getOpenRecordPageStatus
} from './record.mjs'
// import { enterDescribePage, dLoadProcessedMusic } from './describe.mjs'
// import { enterUserInfoPage, setInitFlag,updateCollectInfo,releasePageStopAllTimer } from './user_info.mjs'
import { generateUUID } from './bs-init.js'
import { isMobileDevice, getSessionId } from './navbar.js'
import { openUserDatabase, openUserDatabaseSync } from './indexdb_process.mjs'
import {
    save_data,
    get_data,
    get_all_data,
    get_data_param
} from './indexdb_process.mjs'

// import _ from 'https://unpkg.com/lodash-es@4.17.21/lodash.js';

var g_inRelease = false

var g_firstEnter = true

var g_audio_info_map = null

let g_heartbeatInterval = 30000; // 心跳间隔，例如30秒
let g_heartbeatTimeout = 10000;  // 等待响应的超时时间
let g_heartbeatTimer;
let g_heartbeatTimeoutTimer;
let g_reconnectInterval = 5000;  // 重连间隔，例如5秒

// var g_fileNameWithoutExtension
// var g_music_file_name
// var g_up_music_blob
let g_socket

class audioManage {
    key = ''
    item_id = ''
    add_id = ''
    gain = 0
    origin_blob = null
    base64_origin_blob = ''
    origin_blob_type = ''
    music_file_name = ''
    music_name_is_edit = false
    music_file_from_type = ''
    is_need_update = false
}

export let g_music_name_maxLen = 40


export function handleSpacebar(actionFunction, event) {
    if (event.which === 32) {
        event.preventDefault();
        actionFunction();  // 调用传递进来的函数
    }
}

export function downloadFile(url, file_title = null) {
    // var fileExtension = url.split('.').pop().toLowerCase();

    // console.log('downloadFile:' + url)
    // // 创建一个<a>元素用于下载
    // const a = document.createElement('a')
    // // 创建 Blob 对象的 URL
    // const musicUrl = url

    // a.href = musicUrl
    // // 提示用户选择下载目录
    // a.download = title + '.' + fileExtension
    // a.style.display = 'none' // 这会确保链接不会在页面上显示
    // // a.style.display = 'none';
    // document.body.appendChild(a)
    // a.click()
    // document.body.removeChild(a)

    var download_url = '/download_static_file/?file_title=' + encodeURIComponent(file_title) + '&file_path=' + encodeURIComponent(url);

    // 创建一个临时的 a 元素
    const link = document.createElement('a')

    // 设置下载链接 (href)
    link.href = download_url

    // 设置下载文件名 (download)
    // 这一步是可选的，如果你希望浏览器自动使用指定的名称保存文件
    if (file_title) {
        link.download = file_title
    }

    // 将链接添加到文档中（这一步是必须的，因为 Firefox 要求链接在文档中才能触发下载）
    document.body.appendChild(link)

    // 模拟点击链接
    link.click()

    // 从文档中移除链接
    document.body.removeChild(link)
}

export function constructVocalAcapellaName(old_name, algo_type) {
    var new_name
    if ('instrument' === algo_type) {
        new_name = old_name + '_vocal_remover'
    } else {
        new_name = old_name + '_acapella_exteactor'
    }

    if (new_name.length > g_music_name_maxLen) new_name = old_name
    return new_name
}

export function constructSplitterName(old_name, type) {
    var new_name

    if (type == 'piano') {
        new_name = old_name + '_piano'
    } else if (type == 'guitar') {
        new_name = old_name + '_guitar'
    } else if (type == 'bass') {
        new_name = old_name + '_bass'
    } else if (type == 'drums') {
        new_name = old_name + '_drums'
    } else if (type == 'vocals') {
        new_name = old_name + '_vocals'
    }

    if (new_name.length > g_music_name_maxLen) new_name = old_name

    return new_name
}

export function getMapAudioInfo(key) {
    return g_audio_info_map
}

export function getAudioInfo(key) {
    const audio = g_audio_info_map.get(key)
    return audio
}

export function getAudioInfoByAddId(add_id) {
    for (let [key, audio] of g_audio_info_map.entries()) {
        // console.log(key, audio);
        // 使用key和audio进行操作
        if (audio.add_id == add_id) {
            return key
        }
    }
    return null
}

// edit_origin_audio.key = 'edit_origin_collect'
//         edit_origin_audio.item_id = 'edit_origin_collect'

//         var edit_origin_multi_tracks = new audioManage();
//         edit_origin_multi_tracks.key = 'edit_origin_multi_tracks_collect'
//         edit_origin_multi_tracks.key = 'edit_origin_multi_tracks_collect'

export function changeAudioGainForKey(key, gain) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.gain = gain
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function changeAudioAddIdForKey(key, newAddId) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.add_id = newAddId
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function changeAudioNameForKey(key, newName) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.music_file_name = newName
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function changeAudioNameEdtiForKey(key, is_edit) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.music_name_is_edit = is_edit
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function changeAudioBlobForKey(key, newBlob) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.origin_blob = newBlob
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function changeAudioFromTypeForKey(key, newFromType) {
    var keys_item = []

    if (key == 'edit_origin_collect') {
        keys_item.push('edit_origin_multi_tracks_collect')
    } else if (key == 'edit_origin_multi_tracks_collect') {
        keys_item.push('edit_origin_collect')
    }

    keys_item.push(key)

    for (var item of keys_item) {
        const audio = g_audio_info_map.get(item)
        if (audio) {
            audio.music_file_from_type = newFromType
            audio.is_need_update = true
        } else {
            console.error(`No audioManage object found for key: ${item}`)
        }
    }
}

export function updateUnreadNum(num) {
    // 获取#unread-num元素当前的文本值，它应该是一个数字
    var currentUnreadNum = parseInt($('#unread-num').text(), 10)

    // 检查currentUnreadNum是否是一个有效的数字
    if (!isNaN(currentUnreadNum)) {
        // 将当前未读数量减一，确保结果不小于零
        var newUnreadNum = Math.max(0, currentUnreadNum + num)

        // 将新的未读数量更新回#unread-num元素
        $('#unread-num').text(newUnreadNum)
    } else {
        console.error('#unread-num does not contain a valid number')
    }
}

export function waitForElementToShow(selector, timeout = 0) {
    return new Promise((resolve, reject) => {
        let elapsed = 0
        const interval = 100 // 检查间隔，以毫秒为单位

        // 设置定时器周期性检查元素的显示状态
        const timer = setInterval(() => {
            if ($(selector).css('display') !== 'none') {
                clearInterval(timer) // 停止定时器
                resolve(true) // 元素已显示，解析 Promise
            } else if (elapsed > timeout && timeout != 0) {
                clearInterval(timer) // 超时，停止定时器
                reject(new Error('Timeout waiting for element to show')) // 超时，拒绝 Promise
            } else {
                elapsed += interval // 更新经过时间
            }
        }, interval)
    })
}

export function enterToCompose() {
    // 移除所有按钮的背景颜色
    $('.e-user-btn').css('background-color', 'rgba(255, 255, 255, 0.2)')
    $('#compose-btn').css('background-color', 'rgba(255, 255, 255, 0.5)')
}

export function enterToEdit() {
    // 移除所有按钮的背景颜色
    $('.e-user-btn').css('background-color', 'rgba(255, 255, 255, 0.2)')
    $('#edit-btn').css('background-color', 'rgba(255, 255, 255, 0.5)')
}

export function enterToRelease() {
    // 移除所有按钮的背景颜色
    $('.e-user-btn').css('background-color', 'rgba(255, 255, 255, 0.2)')
    $('#release-btn').css('background-color', 'rgba(255, 255, 255, 0.5)')
}

export function leavePage() {
    // setInitFlag(false)
    // $(document).off('click');
    // // 获取所有元素
    // var allElements = $('*').not('.e-user-btn');

    // // 遍历所有元素并禁用点击事件
    // allElements.each(function() {
    //     $(this).off('click'); // 移除所有点击事件处理程序
    // });

    // // 找到ID为first-row的元素
    // var firstRow = $('#first-row');
    // // 删除其后的所有兄弟元素
    // firstRow.nextAll().remove();
    // // $('#first-row').remove();
    // $('#page-notice').remove();

    $('#tools-page-container').hide()
    $('#edit-page-container').hide()
    $('#record-page-container').hide()
    // releasePageStopAllTimer();
    $('#release-page-container').remove()

    // $('#tools-page-container').css('visibility', 'hidden');
    // $('#edit-page-container').css('visibility', 'hidden');

    // $('#tools-page-container').css({
    //     'display': 'block',
    //     'position': 'absolute',
    //     'z-index': '-1000'
    // });

    // $('#edit-page-container').css({
    //     'display': 'block',
    //     'position': 'absolute',
    //     'z-index': '-1000'
    // });
}

export function enterToolsPage() {
    if (!isMobileDevice()) {
        if ($('#tools-page-container').length > 0) {
            $('#tools-page-container').show()
            // $('#tools-page-container').css('visibility', 'visible');

            // $('#tools-page-container').css({
            //     'display': '', // 或者 'block'，取决于元素默认应有的显示方式
            //     'position': '', // 移除 'absolute' 定位，让元素回归正常文档流，或者设置为期望的其他定位方式
            //     'z-index': '' // 移除 z-index 设定，或者设置为一个正值以确保其位于其他元素之上
            // });
        } else {
            var firstRow = $('#first-row')
            firstRow.removeClass().addClass('row item')
            firstRow.after(`
            <div id="tools-page-container" class="row item special5" style="width:100%;height:100%">
                <div id="tools-page-container-row" class="col d-flex flex-column justify-content-around align-items-around" style="width:100%;height:100%">
                    <div class="row item">
                        <div class="col d-flex d-xl-flex flex-row justify-content-center align-items-center align-items-lg-start align-items-xl-start align-items-xxl-start" style="padding: 0px;">
                            <h1 class="d-flex flex-column justify-content-center align-items-center e-heading"><strong>Choose a method to reliaze your music ideas</strong></h1>
                        </div>
                    </div>
                    <div class="row item special">
                        <div class="col d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start">
                            <a class="d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-center t-enter-link  t-enter-link-left cursor-pointer" id="t-record"></a>
                                <p class="d-xxl-flex justify-content-xxl-center t-section-para t-enter-link-left" style="/*margin: 0px;*/margin-bottom: 0px;">Hum</p>
                        </div>
                        
                        <div class="col d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start">
                            <form id="t-upload" class="d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start t-enter-link  " method="post" enctype="multipart/form-data" action="/upload" style="background: url('/static/music/img/t12.png') top / contain no-repeat;">
                                <input id="fileInput" class="form-control form-control-file" type="file" name="file" style="display: none;" accept=".mp3,.wav" /></form>
                            <p class="t-section-para " style="margin-bottom: 0px;">Upload</p>
                        </div>

                        <div class="col d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start" style="padding: 0px;">
                            <a class="d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start t-enter-link t-enter-link-right" id="t-wait" style="background:url('/static/music/img/wait.png') top / contain no-repeat;"></a>
                            <p class="d-xxl-flex justify-content-xxl-center t-section-para t-enter-link-right wait-colour" style="/*margin: 0px;*/margin-bottom: 0px;">Upcoming</p>
                        </div>
                    </div>
                    <div id="page-notice" class="container">
                        <div class="row">
                            <div class="col">
                               
                            </div>
                        </div>
                        <div class="row">
                            <div class="col d-flex flex-row justify-content-center align-items-center align-content-center"><a class="priacy-link-size" href="/terms-of-use.html" style="color: var(--bs-white);font-weight: bold;">Terms of Use </a>
                                <p class="d-flex d-xxl-flex flex-column reg-word-size" style="margin: 0px;">and </p><a class="priacy-link-size" href="/priacy.html" style="color: var(--bs-white);font-weight: bold;">Priacy Policy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `)
            init()
        }
    } else {
        if ($('#tools-page-container').length > 0) {
            $('#tools-page-container').show()
        }
        else{
            var firstRow = $('#first-row')
            firstRow.nextAll().remove()
            firstRow.after(`
            <div id="tools-page-container" class="row item special8" style="width:100%;height:100%">
                <div id="tools-page-container-row" class="col d-flex flex-column justify-content-around align-items-center" style="width:100%;height:100%">
                    <div class="row item special mobile-row-long">
                        <div class="col d-flex d-xl-flex flex-row justify-content-center align-items-start" style="padding: 0px;">
                            <h1 class="d-flex flex-column justify-content-center align-items-center e-heading"><strong>Choose a method to reliaze your music ideas</strong></h1>
                        </div>
                    </div>

                    <div class="row item special mobile-row-long">
                        <div class="col d-flex flex-column justify-content-center align-items-center " style="padding: 0px;">
                            <a class="d-flex align-items-center t-enter-link" id="t-record">
                                <img src="{% static 'music/img/t1x.png' %}" alt="Hum" style="width: 12vh; height: auto;">
                                <p class="t-section-para" >Hum&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</p>
                            </a>
                        </div>
                    </div>
                    <div class="row item special mobile-row-long">
                        <div class="col d-flex flex-column justify-content-center align-items-center " style="padding: 0px;">
                            <a class="d-flex align-items-center t-enter-link" id="t-wait">
                                <img src="{% static 'music/img/wait.png' %}" alt="Describe" style="width: 12vh; height: auto;">
                                <p class="t-section-para" style="color:gray" >Upcoming</p>
                            </a>
                        </div>
                    </div>
                    
            

                </div>
            </div>
            `)
            init()
        }


    }
}

export function resetUserBtnClick() {
    $('.e-user-btn').off('click')
    var throttledHandleUserBtn = _.throttle(handleUserBtn, 300)
    $('.e-user-btn').click(throttledHandleUserBtn)
    // $(document).off("click", ".e-user-btn").on("click", ".e-user-btn", throttledHandleUserBtn);
}

export function increaseProgress(update_id, targetProgress) {
    // 使用Math.floor确保targetProgress只有整数部分
    targetProgress = Math.floor(targetProgress)
    const interval = setInterval(() => {
        if ($(update_id).length > 0) {
            var update_percent = $(update_id).text()
            var number_percent = parseInt(update_percent, 10) // 解析为十进制数
            if (number_percent < targetProgress) {
                number_percent += 1 // 每次增加1%
                $(update_id).text(number_percent + '%') // 更新进度文本
            } else {
                clearInterval(interval) // 达到目标进度，停止增加
            }
        }
    }, 500) // 调整间隔时间以控制增加的速度
}

function blobToBase64(blob, callback) {
    var reader = new FileReader();
    reader.onload = function() {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        callback(base64);
    };
    reader.readAsDataURL(blob);
}


function base64ToBlob(base64, type = '') {
    // 将Base64字符串解码为二进制数据
    var binary = atob(base64);
    var len = binary.length;
    var buffer = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
    }

    // 使用Blob构造函数将二进制数据转换为Blob
    return new Blob([buffer], {type: type});
}

function read_init_data_callback(status, contains, records, inRelase = false) {
    var edit_origin_collect = null
    if (null === status) {
        if ('tools' === contains) {
            // 在这里进行对数据的处理，例如遍历数据并展示在页面上
            //edit{pagenum,origin_blob,algo_blob,origin_is_save,algo_is_save}
            for (var i = 0; i < records.length; i++) {
                var record = records[i]
                if ('edit_origin_collect' === record.key) {
                    edit_origin_collect = record.value
                }
            }
        }
    } else {
        alert('indexeddb_call_back_' + status)
        console.error('indexeddb_call_back_' + status)
    }

    g_firstEnter = false

    if (edit_origin_collect != null) {
        // class audioManage {
        //     key = ''
        //     item_id = ''
        //     add_id = '';
        //     gain = 0;
        //     origin_blob = null;
        //     music_file_name = '';
        //     music_name_is_edit = false
        //     music_file_from_type = '';
        //     is_need_update = false;
        // }
        var origin_blob = null;
        if(edit_origin_collect.base64_origin_blob != ''){
            origin_blob = base64ToBlob(edit_origin_collect.base64_origin_blob, edit_origin_collect.origin_blob_type)
        }

        enterEditPage(
            '',
            false,
            origin_blob,
            edit_origin_collect.music_file_name,
            edit_origin_collect.music_file_from_type,
            true
        )
    } else {
        enterEditPage('')
    }
}

function handleUserBtn() {
    var index = $(this).attr('id')
    // 移除所有按钮的背景颜色
    $('.e-user-btn').css('background-color', 'rgba(255, 255, 255, 0.2)')
    // 将当前按钮的背景颜色更改
    $(this).css('background-color', 'rgba(255, 255, 255, 0.5)')
    if (index === 'compose-btn') {
        // releaseRecordResource();
        var is_record = getOpenRecordPageStatus();
        if(is_record){
            leavePage()
            enterRecordPage('')
        }

        if ($('#record-page-container').is(':visible')) {
            return
        }
        leavePage()
        enterToolsPage()
        g_inRelease = false
    } else if (index === 'edit-btn') {
        // releaseRecordResource();
        leavePage()
        // enterEditPage("memory",g_inRelease);
        if (g_firstEnter) {
            get_all_data('tools', read_init_data_callback)
        } else {
            externalCacheEnterEditPage()
        }

        g_inRelease = false
    } else if (index === 'release-btn') {
        // releaseRecordResource();
        leavePage()
        enterUserInfoPage()
        g_inRelease = true
    }
}



function startHeartbeat() {
    g_heartbeatTimer = setInterval(() => {
        if (g_socket.readyState === WebSocket.OPEN) {
            g_socket.send(JSON.stringify({ message: "ping" }));
            g_heartbeatTimeoutTimer = setTimeout(() => {
                console.log("Heartbeat failed.");
                g_socket.close(); // 若未收到pong响应，手动关闭触发重连
            }, g_heartbeatTimeout);
        }
    }, g_heartbeatInterval);
}

function stopHeartbeat() {
    clearInterval(g_heartbeatTimer);
    clearTimeout(g_heartbeatTimeoutTimer);
}



function connectWs(sessionID){
    console.time('new_WebSocket')
    
    g_socket = new WebSocket(
        ``
    )
    
    // g_socket = new WebSocket(`ws://192.168.1.9:9001/ws/music_processing?token=${""}&userUuid=${sessionID}`);
    console.timeEnd('new_WebSocket')

    g_socket.onopen = function (e) {
        console.log('[open] Connection established')
        startHeartbeat(); // 开始心跳
    }

    g_socket.onclose = function (event) {
        console.log("WebSocket connection closed. Attempting to reconnect...");
        setTimeout(connectWs, g_reconnectInterval,sessionID); // 尝试重新连接
    }


    g_socket.onerror = function (error) {
        alert('connect service failed',error.message)
        console.error(`[error] ${error.message}`)
    }



    g_socket.onmessage = function (event) {
        console.log('g_socket.onmessage')
        

        const data = JSON.parse(event.data)

        if (data.message === "pong") {
            // console.log("Heartbeat received.");
            clearTimeout(g_heartbeatTimeoutTimer); // 收到pong，取消超时计时器
            return;
        }

        if(data.type === 'send_collect_audio_finish'){
            updateCollectInfo(data.collect_info)
            return;
        }
        
        var edit_algo_uuid = $('#edit-algo-uuid').text()
        var record_algo_uuid = $('#record-algo-uuid').text()
        if(record_algo_uuid == data.algo_uuid){
            if (data.type === 'send_record_convert_midi_finish') {
                console.log(
                    'g_socket.send_record_convert_midi_finish done'
                )
                loadProcessedMusic(
                    data.algo_type,
                    data.audio_file_url,
                    data.percent,
                    data.midi_file_url,
                    data.midi_mp3_file_url,
                    data.zip_file_url,
                    data.status,
                    data.error_message
                )
            } 
        }
        if (edit_algo_uuid == data.algo_uuid) {
            if (
                data.type === 'send_describe_update' &&
                data.status === 'done'
            ) {
                // console.log('g_socket.ondescribemessage done')
                // dLoadProcessedMusic(data.processed_file_url)
            } else if (
                data.type ===
                'send_audio_source_separation_midi_finish'
            ) {
                console.log(
                    'g_socket.send_audio_source_separation_midi_finish done'
                )
                eBackAudioSourceSeparationMIDI(
                    data.processed_file_url,
                    data.save_id,
                    data.status,
                    data.error_message
                )
            } else if (
                data.type === 'send_audio_source_separation_finish'
            ) {
                console.log(
                    'send_audio_source_separation_finish done'
                )
                // eBackAudioSourceSeparation(data.processed_file_url,data.save_id,data.status,data.error_message);
                eBackAudioSourceSeparation(
                    data.algo_type,
                    data.percent,
                    data.processed_json,
                    data.status,
                    data.error_message
                )
            } else if (data.type === 'send_select_audio_finish') {
                console.log('send_select_audio_finish done')
                eBackSelectAudio(
                    data.algo_type,
                    data.percent,
                    data.processed_json,
                    data.save_id,
                    data.status,
                    data.error_message
                )
                // eBackSelectAudio(percent,fileUrl,save_id,status,error_message)
            } else if (
                data.type === 'send_convert_to_midi_task_finish'
            ) {
                console.log('send_convert_to_midi_task_finish done')
                eBackConvertToMidi(
                    data.algo_type,
                    data.percent,
                    data.processed_json,
                    data.status,
                    data.error_message
                )
            }
        }
    }

   

}



if (window.location.href.indexOf('tools.html') !== -1 || window.location.href.indexOf('m-tools.html') !== -1) {
    window.onload = function () {
        // 页面加载完成后要执行的代码
        init()
    }

    

    // 使用 Lodash 的 _.throttle 来包装你的函数
    // 例如，这里设置了 300 毫秒的节流时间
    var throttledHandleUserBtn = _.throttle(handleUserBtn, 300)

    window.init = function () {
        console.time('window.init')
        console.log('pre_detectPhoneOrComputer')
        var ret_detect =  detectPhoneOrComputer();
        if(ret_detect){
            return;
        }
        console.log('detectPhoneOrComputer')
        // 使用函数作为点击事件处理程序
        // $(".e-user-btn").click(throttledHandleUserBtn );
        resetUserBtnClick()
        enterToCompose()
        var elements = document.querySelectorAll('[id$="t-upload"]')
        elements.forEach((element) => {
            // 对每个匹配的元素执行操作
            element.onclick = handleUpload
        })

        // 添加change事件监听器到fileInput
        // const fileInput = document.getElementById('fileInput');
        // fileInput.addEventListener('cancel', function () {
        //     $("#t-upload").off("click");
        // })

        // fileInput.addEventListener('change', function () {
        //     // 检查是否选择了文件
        //     if (fileInput.files && fileInput.files.length > 0) {
        //         // 获取用户选择的文件
        //         const selectedFile = fileInput.files[0];

        //         g_up_music_blob = new Blob([selectedFile], { type: selectedFile.type });

        //         var fileName = selectedFile.name;
        //         var fileExt = fileName.includes('.') ? fileName.substring(fileName.lastIndexOf('.')) : '';
        //         var nameWithoutExt = fileName.replace(fileExt, '');

        //         // 如果文件名长度超过10个字符，截取前10个字符
        //         if (nameWithoutExt.length > 10) {
        //             nameWithoutExt = nameWithoutExt.substring(0, 10);
        //             fileName = nameWithoutExt + fileExt;
        //         }

        //             // 获取文件名
        //         const fileNameWithExtension = fileName;

        //         // 获取文件名（不包含后缀名）
        //         g_fileNameWithoutExtension = fileNameWithExtension.split('.').slice(0, -1).join('.');
        //         g_music_file_name = g_fileNameWithoutExtension

        //         // 创建一个FormData对象来包含文件数据
        //         const formData = new FormData();
        //         formData.append('file', selectedFile);
        //         formData.append('user_id', user_id);
        //         formData.append('music_title', g_music_file_name);
        //         formData.append('music_type', 'NO_PROCESSED');
        //         // formData.append('play_time', 'your-play-time');
        //         // formData.append('score', 'your-score');
        //         // 设置CSRF token头部
        //         // xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
        //         // // 发送请求
        //         // xhr.send(formData);

        //         //切换界面
        //         leavePage();
        //         enterUploadPage();

        //         var progressText = $('#u-progressText');
        //         var xhr = new XMLHttpRequest();
        //         xhr.upload.addEventListener('progress', function(event) {
        //             var percent = Math.round((event.loaded / event.total) * 100);
        //             // 更新进度文本
        //             progressText.text(percent + '%');
        //         });

        //         xhr.onreadystatechange = function() {
        //             $("#t-upload").off("click");
        //             $("#t-upload").click(handleUpload);
        //             if (xhr.readyState === 4) {
        //                 if (xhr.status === 200 ) {
        //                     // 上传成功，执行切换到播放界面和加载音乐的操作
        //                     leavePage();
        //                     enterEditPage("direct",g_inRelease,g_up_music_blob,g_music_file_name,"NO_PROCESSED");
        //                 } else {
        //                     // 上传失败，执行相应的错误处理操作
        //                     alert("Error upload:" + xhr.status);
        //                 }
        //             }
        //         };

        //         xhr.open('POST', '/music_upload/', true);
        //         // Set the CSRF token header
        //         xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
        //         xhr.send(formData);

        //         // 重定向到上传进度页面，并将FormData数据传递给新页面
        //         // window.location.href = 'music-upload.html';
        //         // sessionStorage.setItem('formData', JSON.stringify(Array.from(formData.entries())));
        //     } else {
        //         alert('please select one file!');
        //     }
        // });

        // 使用函数作为点击事件处理程序
        // $(".edit-up-btn").click(handleUpBtn);

        $('#t-record').click(handleTRecordBtn)

        $('#t-describe').click(handleTDescribeBtn)

        // var token = localStorage.getItem('token');

        // if (token === null) {
        //     // 没有存储过 token，执行相应的处理
        //     console.log('Token not found in Local Storage');
        //     alert("please login");
        //     return;
        // }

        // if ($('#algo-uuid').is(':empty')) {
        //     // 生成一个UUID
        //     var uuid = generateUUID()
        //     // 将UUID放入div中
        //     $('#algo-uuid').text(uuid)
        // }
        if(isMobileDevice()){
            var first_height = $('#first-row').height()
            $('#first-row').css('min-height', first_height)

            var second_height = $('#second-row').height()
            $('#second-row').css('min-height', second_height)

            var third_height = $('#third-row').height()
            $('#third-row').css('min-height', third_height)

            var page_notice = $('#page-notice').height()
            $('#page-notice').css('min-height', page_notice)
        }

        console.time('getSessionId')
        var sessionID = getSessionId()
        console.log('tools clientUUID:sessionid' + sessionID)
        console.timeEnd('getSessionId')

        openUserDatabaseSync(sessionID)
            .then(() => {
                console.log('数据库操作完成')
                // 在这里调用 getCollectionCount
                getCollectionCount()  // <-- 这里调用了该函数

                updateCollectionCount()

                updateAudioManage()

                // connectWs(sessionID);

                $(window).on('blur', function () {
                    console.log('标签页失去焦点')
                    changeAudioNameEdtiForKey('edit_origin_collect', false)
                    $('.hover-content').remove()
                })


                

                console.timeEnd('window.init')
            })
            .catch((error) => {
                console.error('can not open db:', error)
                alert('can not open db:', error)
            })
    }

    function detectPhoneOrComputer(){
        var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        var isiPad = /iPad/i.test(navigator.userAgent);
        var isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);
    
        var ret_detect = redirectToAppropriateVersion(isiPad,isMobile,isSafari); // 调用函数以便在文档加载时重定向

        // 监听屏幕尺寸变化
        $(window).resize(function() {
            if (isiPad) {
                // redirectToAppropriateVersion(isiPad,isMobile,isSafari); // 屏幕尺寸变化时重新检测并可能重定向
            }
        });
        return ret_detect;
    }

    function redirectToAppropriateVersion(isiPad,isMobile,isSafari) {
        var isLandscape = window.matchMedia("(orientation: landscape)").matches;
        var width = $(window).width();
        try {
            if (isiPad || isSafari) {
                // 检测横屏模式
                if (isLandscape || width > 991) {
                    // iPad横屏时，认为是电脑模式
                    if(window.location.href.indexOf('/tools.html') !== -1)
                        return false;
                    window.location.href = '/tools.html';
                    return true
                } else {
                    // iPad竖屏时，认为是移动设备模式
                    if(window.location.href.indexOf('/m-tools.html') !== -1)
                        return false;
                    window.location.href = '/m-tools.html';
                    return true
                }
            } else if (isMobile) {
                if(window.location.href.indexOf('/m-tools.html') !== -1)
                    return false;
                window.location.href = '/m-tools.html';
                return true
            } else {
                if(window.location.href.indexOf('/tools.html') !== -1)
                    return false;
                window.location.href = '/tools.html';
                return true
            }
        } catch (error) {
            console.error('Error during redirection:', error);
            alert('Error during redirection:', error)
            return false
        }

    }

    // "tools", "edit_origin_collect"

    var g_unread_dot_num = 0

    function updateCollectionCount() {
        setInterval(function () {
            var unread_num = $('#unread-num').text()
            if (g_unread_dot_num != unread_num) {
                if (unread_num > 0) {
                    if (unread_num > 99) {
                        unread_num = '99+'
                        $('#unread-notification-dot-id').css(
                            'font-size',
                            '0.8vh'
                        )
                    } else
                        $('#unread-notification-dot-id').css('font-size', '1vh')

                    $('#unread-notification-dot-id').text(unread_num)
                    $('#unread-notification-dot-id').show()
                    // font-size: 1vh; /* 文字大小，根据需要调整 */
                } else {
                    $('#unread-notification-dot-id').hide()
                }
                g_unread_dot_num = unread_num
            }
        }, 100)
    }

    function update_music_name(audio_info) {
        if (!audio_info.music_name_is_edit) {
            var musicNameText = $('#music-name')
            musicNameText.text(audio_info.music_file_name)
            var mobileAlgoMusicNameText = $('#mobile-algo-music-name')
            mobileAlgoMusicNameText.text(audio_info.music_file_name)
        }
    }

    function set_heart_colour(type, item_id) {

        var data = $('#' + item_id)
        if((!isMobileDevice()) || (item_id == 'edit_origin_collect') || 
        (item_id == 'edit_origin_multi_tracks_collect') || (item_id == 'record_algo_audio_collect') ||
        (item_id == 'edit_vocal_remover_collect') || (item_id == 'edit_acapella_extractor_collect') ||
        (item_id == 'like-piano-btn') || (item_id == 'like-guitar-btn') ||
        (item_id == 'like-bass-btn') || (item_id == 'like-drums-btn') ||
        (item_id == 'like-vocal-btn')){
            if ('red' == type) {

                var img_src = 'static/music/img/ze-like-1.svg'
                if(isMobileDevice()){
                    if ($('#phone_tracks_collect_switch').length > 0) {
                        img_src = 'static/music/img/ze-like-1.svg'
                    }
                    else{
                        img_src = 'static/music/img/ze-like-1.svg'
                    }
                }
                else{
                    img_src = 'static/music/img/ze-like-1.svg'
                }

                data.find('img').each(function () {
                    if (
                        $(this).attr('src') == img_src
                    ) {
                        return false
                    }
                })
                var src = data.attr('src')
                if (src == img_src) {
                    return false
                }
                data.attr('src', img_src) // 替换为第二张图片的路径
                data.find('img').attr('src',img_src) // 替换为第二张图片的路径
                data.removeAttr('title')
    
            } else {
    
                var img_src = 'static/music/img/ze-like-white.svg'
                if(isMobileDevice()){
                    if ($('#phone_tracks_collect_switch').length > 0) {
                        img_src = 'static/music/img/ze-like-collect.svg'
                    }
                    else{
                        img_src = 'static/music/img/ze-like-white-no-add.svg'
                    }
                }
                else{
                    img_src = 'static/music/img/ze-like-white.svg'
                }

                data.find('img').each(function () {
                if (
                    $(this).attr('src') ==
                    img_src
                ) {
                    return false
                }
                })
                var src = data.attr('src')
                if (src == img_src) {
                    return false
                }
                data.attr('src', img_src) // 替换为第二张图片的路径
                data.find('img').attr(
                'src',
                img_src
                ) // 替换为第二张图片的路径
                data.attr('title', 'Add my music')
            }
        }
        else{
            // background-color:rgba(233, 157, 66, 0.5);
            if ('red' == type) {
                data.css('background-color','rgba(233, 157, 66, 0.5)')
            }
            else {
                data.css('background-color','rgba(255, 255, 255, 0.2)')
            }
        }

        
        return true
    }

    // class audioManage {
    //     constructor(key='',item_id='',add_id=null, gain=0) {
    //         this.key = key
    //         this.item_id = item_id
    //         this.add_id = add_id;
    //         this.gain = gain;
    //     }
    // }

    function readCollectInfoCallback(
        status,
        contains,
        records,
        inRelase = false
    ) {
        if (null === status) {
            if ('tools' === contains) {
                var edit_origin_audio = null
                for (var i = 0; i < records.length; i++) {
                    var record = records[i]
                    if ('edit_origin_collect' === record.key) {
                        edit_origin_audio = record.value
                    }
                }
                if (edit_origin_audio != null)
                    g_audio_info_map.set(
                        'edit_origin_collect',
                        edit_origin_audio
                    )
            }
        } else {
            console.error('tools_indexeddb_call_back_' + status)
        }
    }

    

    function updateAudioManage() {
        g_audio_info_map = new Map()
        var edit_origin_audio = new audioManage()
        edit_origin_audio.key = 'edit_origin_collect'
        edit_origin_audio.item_id = 'edit_origin_collect'

        var edit_origin_multi_tracks = new audioManage()
        edit_origin_multi_tracks.key = 'edit_origin_multi_tracks_collect'
        edit_origin_multi_tracks.item_id = 'edit_origin_multi_tracks_collect'

        var record_algo_audio = new audioManage()
        record_algo_audio.key = 'record_algo_audio_collect'
        record_algo_audio.item_id = 'record_algo_audio_collect'

        var edit_vocal_remover_audio = new audioManage()
        edit_vocal_remover_audio.key = 'edit_vocal_remover_collect'
        edit_vocal_remover_audio.item_id = 'edit_vocal_remover_collect'

        var edit_acapella_extractor_audio = new audioManage()
        edit_acapella_extractor_audio.key = 'edit_acapella_extractor_collect'
        edit_acapella_extractor_audio.item_id =
            'edit_acapella_extractor_collect'

        var edit_splitter_piano_audio = new audioManage()
        edit_splitter_piano_audio.key = 'like-piano-btn'
        edit_splitter_piano_audio.item_id = 'like-piano-btn'

        var edit_splitter_guitar_audio = new audioManage()
        edit_splitter_guitar_audio.key = 'like-guitar-btn'
        edit_splitter_guitar_audio.item_id = 'like-guitar-btn'

        var edit_splitter_bass_audio = new audioManage()
        edit_splitter_bass_audio.key = 'like-bass-btn'
        edit_splitter_bass_audio.item_id = 'like-bass-btn'

        var edit_splitter_drum_audio = new audioManage()
        edit_splitter_drum_audio.key = 'like-drums-btn'
        edit_splitter_drum_audio.item_id = 'like-drums-btn'

        var edit_splitter_vocal_audio = new audioManage()
        edit_splitter_vocal_audio.key = 'like-vocal-btn'
        edit_splitter_vocal_audio.item_id = 'like-vocal-btn'

        g_audio_info_map.set('edit_origin_collect', edit_origin_audio)
        g_audio_info_map.set(
            'edit_origin_multi_tracks_collect',
            edit_origin_multi_tracks
        )
        g_audio_info_map.set('record_algo_audio_collect', record_algo_audio)
        g_audio_info_map.set(
            'edit_vocal_remover_collect',
            edit_vocal_remover_audio
        )
        g_audio_info_map.set(
            'edit_acapella_extractor_collect',
            edit_acapella_extractor_audio
        )

        g_audio_info_map.set('like-piano-btn', edit_splitter_piano_audio)
        g_audio_info_map.set('like-guitar-btn', edit_splitter_guitar_audio)
        g_audio_info_map.set('like-bass-btn', edit_splitter_bass_audio)
        g_audio_info_map.set('like-drums-btn', edit_splitter_drum_audio)
        g_audio_info_map.set('like-vocal-btn', edit_splitter_vocal_audio)

        get_all_data('tools', readCollectInfoCallback)

        var last_edit_origin_collect_add_id = ''
        var music_file_name = ''

        setInterval(function () {
            for (let [key, audio] of g_audio_info_map.entries()) {
                // console.log(key, audio);
                // 使用key和audio进行操作
                var is_update = false
                if (audio.add_id != '') {
                    is_update = set_heart_colour('red', audio.item_id)
                } else {
                    is_update = set_heart_colour(
                        'white',
                       audio.item_id
                    )
                }

                //////save
                if (key == 'edit_origin_collect') {
                    update_music_name(audio)
                    music_file_name = audio.music_file_name
                    if (audio.is_need_update == true) {
                        if(audio.origin_blob != null){
                            blobToBase64(audio.origin_blob , function(base64_origin_blob) {
                                // console.log(base64); // 输出: SGVsbG8sIHdvcmxkIQ==
                                audio.base64_origin_blob = base64_origin_blob;
                                audio.origin_blob_type = audio.origin_blob.type
                                save_data('tools', 'edit_origin_collect', audio)
                                audio.is_need_update = false
                            });
                        }
                        else{
                            audio.base64_origin_blob = ''
                            audio.origin_blob_type = ''
                            save_data('tools', 'edit_origin_collect', audio)
                            audio.is_need_update = false
                        }


                        
                    }
                } else {
                    if (key == 'record_algo_audio_collect') {
                    } else if (key == 'edit_vocal_remover_collect') {
                        audio.music_file_name = constructVocalAcapellaName(
                            music_file_name,
                            'instrument'
                        )
                    } else if (key == 'edit_acapella_extractor_collect') {
                        audio.music_file_name = constructVocalAcapellaName(
                            music_file_name,
                            'vocals'
                        )
                    } else if (key == 'like-piano-btn') {
                        audio.music_file_name = constructSplitterName(
                            music_file_name,
                            'piano'
                        )
                    } else if (key == 'like-guitar-btn') {
                        audio.music_file_name = constructSplitterName(
                            music_file_name,
                            'guitar'
                        )
                    } else if (key == 'like-bass-btn') {
                        audio.music_file_name = constructSplitterName(
                            music_file_name,
                            'bass'
                        )
                    } else if (key == 'like-drums-btn') {
                        audio.music_file_name = constructSplitterName(
                            music_file_name,
                            'drums'
                        )
                    } else if (key == 'like-vocal-btn') {
                        audio.music_file_name = constructSplitterName(
                            music_file_name,
                            'vocals'
                        )
                    }
                }
            }
        }, 500)
    }

    function getCollectionCount() {

    }

    function handleTRecordBtn() {
        leavePage()
        enterRecordPage('')
    }

    function handleTDescribeBtn() {
        leavePage()
        enterDescribePage()
    }

    function handleUpload() {
        if (!isMobileDevice()) {
            const fileInput = document.getElementById('fileInput').click() // 触发文件选择对话框
            $('#t-upload').off('click')
        } else {
            enterEditPage('direct', false, null, null, 'NO_PROCESSED')
        }
    }

    function enterUploadPage() {
        var firstRow = $('#first-row')
        firstRow.removeClass().addClass('row edit-item special')
        firstRow.after(`
        <div class="row item special">
            <div class="col d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start">
            </div>
            <div class="col d-flex flex-column justify-content-center align-items-center">
                <div id="u-progressContainer" class="d-sm-flex flex-column">
                    <svg id="upload-progress" class="bi bi-circle-fill" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 16 16">
                        <circle cx="8" cy="8" r="8"></circle>
                    </svg>
                    <div id="u-progressText" class="d-flex d-xxl-flex flex-column justify-content-center align-items-center justify-content-xxl-center align-items-xxl-center"><span>0%</span></div>
                </div>
            </div>
            <div class="col d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-start" style="padding: 0px;">
            </div>
        </div>
        <div class="row item"></div>
        
        `)

        $('#id-e-all-container').after(`
        <div id="page-notice" class="container">
            <div class="row">
                <div class="col">
                    <p class="d-flex flex-row justify-content-center reg-word-size" style="margin: 0px;"></p>
                </div>
            </div>
            <div class="row">
                <div class="col d-flex flex-row justify-content-center align-items-center align-content-center"><a class="priacy-link-size" href="/terms-of-use.html" style="color: var(--bs-white);font-weight: bold;">Terms of Use </a>
                    <p class="d-flex d-xxl-flex flex-column reg-word-size" style="margin: 0px;">and </p><a class="priacy-link-size" href="/priacy.html" style="color: var(--bs-white);font-weight: bold;">Priacy Policy</a>
                </div>
            </div>
        </div>
        `)
    }

    function handleUpBtn() {
        var index = $(this).attr('id')
        // 移除所有按钮的背景颜色
        $('.edit-up-btn').css('background-color', 'rgba(255, 255, 255, 0.2)')
        // 将当前按钮的背景颜色更改
        $(this).css('background-color', 'rgba(255, 255, 255, 0.5)')

        // 显示与当前按钮索引对应的内容项
        if (index === 'compose-btn') {
        } else if (index === 'edit-btn') {
        } else if (index === 'release-btn') {
        }
    }
}

if (window.location.href.indexOf('music_upload') !== -1) {
    window.onload = function () {
        // 页面加载完成后要执行的代码
        simulateUpload()
    }

    function simulateUpload() {
        const progressText = document.getElementById('u-progressText')

        // 模拟上传进度
        const totalSize = 1024 * 1024 * 5 // 5MB 文件
        let uploadedSize = 0

        const uploadInterval = setInterval(() => {
            uploadedSize += 512 * 1024 // 每秒上传 500kb 数据

            // 计算上传进度百分比
            const progress = (uploadedSize / totalSize) * 100

            // 更新上传进度百分比文本
            progressText.textContent = progress + '%'

            // 如果上传完成，清除定时器
            if (uploadedSize >= totalSize) {
                clearInterval(uploadInterval)
            }
        }, 1000)
    }
}
