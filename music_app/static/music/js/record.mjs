// import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js'
// import RegionsPlugin from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/regions.esm.js'
// import TimelinePlugin from 'https://unpkg.com/wavesurfer.js@7/dist/plugins/timeline.esm.js'
// import Hover from 'https://unpkg.com/wavesurfer.js@7/dist/plugins/hover.esm.js'
import RecordPlugin from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/plugins/record.esm.min.js'
import WaveSurfer from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/wavesurfer.esm.min.js'
import WebAudioPlayer from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/webaudio.min.js'
import TimelinePlugin from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/plugins/timeline.esm.js'
import Hover from './hover.esm.js'
import ZoomPlugin from 'https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.6.4/plugins/zoom.esm.js'
import RegionsPlugin from './regions.esm.js';

import {isMobileDevice} from'./navbar.js'
import initLoading from './loading.js'

// import {enterEditPage,handleAlgoCollectBtn} from './music_edit.mjs';
import {leavePage,enterToEdit,enterToolsPage,resetUserBtnClick,waitForElementToShow,updateUnreadNum,changeAudioAddIdForKey,downloadFile,handleSpacebar} from './tools.mjs'

// import {//save_data} from'./indexdb_process.mjs'
// import {get_data,get_all_data,get_data_param} from'./indexdb_process.mjs'

import { generateUUID } from './bs-init.js'


let exports = {};

(function() {


    let g_activeRegion = null
    // Give regions a random color when they are created
    const g_random = (min, max) => Math.random() * (max - min) + min
    // const g_randomColor = () => `rgba(${g_random(0, 255)}, ${g_random(0, 255)}, ${g_random(0, 255)}, 0.5)`
    const g_randomColor = () => `rgba(255, 255, 255, 0.5)`
    let g_currentPlayPosition = 0
    let g_currentSeekPosition = 0
    let g_recordwaveplaysurfer = null
    let g_wsRecordRegions = null

    // let g_waveplayersurfer = null
    // let g_wsPlayerRegions = null

    // let g_waverecordsurfer = null
    let g_record = null

    let g_containerHeight = 0


    let g_record_timerInterval = 0;
    let g_record_totalTime = 0;

    let g_record_btn_type = 0;//0初始状态，1录音完成，2截取完成

    let g_record_blob;

    let g_all_file_url;
    let g_all_midi_url;
    let g_all_zip_url;

    let g_all_midi_mp3_url;
    let g_save_id;

    let g_randomFileName;

    let g_handlePlayformAudioprocess;

    let g_algo_type ="record_algo_process"

    let g_add_music_id = null;

    let g_create_record_algo_timer = null;

    let g_recordBoundHandleSpacebar = null;

    let g_isOpenRecordPage = false

    let g_encode_mp3_worker = null;

    let g_barHeight = 0.7

    let g_record_duration = 0;

    // var G_MEDIA_URL = "{{ MEDIA_URL }}"; // 来自Django的模板上下文

    exports.enterRecordPage = enterRecordPage;
    exports.loadProcessedMusic = loadProcessedMusic;
    exports.releaseRecordResource = releaseRecordResource;
    exports.getOpenRecordPageStatus = getOpenRecordPageStatus;

    function recordIncreaseProgress(update_id, targetProgress) {
        // 使用Math.floor确保targetProgress只有整数部分
        targetProgress = Math.floor(targetProgress);
        const interval = setInterval(() => {
          if ($(update_id).length > 0) {
                var update_percent = $(update_id).text();
                var number_percent = parseInt(update_percent, 10); // 解析为十进制数
                if (number_percent < targetProgress) {
                    if ($('#record').length > 0){
                        if("Creating" === $('#record').text()){
                            number_percent += 1; // 每次增加1%
                            $(update_id).text(number_percent + '%'); // 更新进度文本

                            var audioDuration = g_recordwaveplaysurfer.getDuration();
                            var update_time = audioDuration * number_percent / 100;

                            
                            var regions = g_wsRecordRegions.getRegions();

                            var already_add = false;
                            for (const region of regions) {
                                var region_color = region.color;
                                if(region_color === 'rgba(189, 49, 36, 0.36)'){
                                    region.setOptions({
                                            start: 0,
                                            end: update_time});
                                    already_add = true;
                                    break;
                                }
                            }
                            if(!already_add){
                                g_wsRecordRegions.addRegion({
                                    start: 0,
                                    end: update_time,
                                    // content: 'Resize me',
                                    color: 'rgba(189, 49, 36, 0.36)',
                                    drag: false,
                                    resize: true,
                                })
                            }
                        }
                    }

                } else {
                    clearInterval(interval); // 达到目标进度，停止增加 
                }
                
            }
        }, 500); // 调整间隔时间以控制增加的速度
    }
    

    function read_record_data_callback(status,contains, records){
        if(null === status){
            if("record" === contains){
                // 在这里进行对数据的处理，例如遍历数据并展示在页面上
                //edit{pagenum,origin_blob,algo_blob,origin_is_save,algo_is_save}
                var pagenum = null;
                var record_blob = null;
                var algo_blob = null;
                var add_music_id = null;
                var audio_url = null;
                var midi_url = null;
                var midi_mp3_url = null;
                var zip_file_url = null;
                for (var i = 0; i < records.length; i++) {
                    var record = records[i];
                    if("pagenum" === record.key){
                        pagenum = record.value;
                    }
                    else if("origin_blob" === record.key){
                        record_blob = record.value;
                    }
                    else if("algo_blob" === record.key){
                        algo_blob = record.value;
                    }
                    else if("add_music_id" === record.key){
                        add_music_id = record.value;
                    }
                    else if("audio_url" == record.key){
                        audio_url = record.value; 
                    }
                    else if("midi_url" == record.key){
                        midi_url = record.value; 
                    }
                    else if("midi_mp3_url" == record.key){
                        midi_mp3_url = record.value; 
                    }
                    else if("zip_file_url" == record.key){
                        zip_file_url = record.value; 
                    }
                }

                g_all_file_url = audio_url;

                g_all_midi_url = midi_url;

                g_all_zip_url = zip_file_url;

                g_all_midi_mp3_url = midi_mp3_url;

                g_record_blob = record_blob;

                g_add_music_id = add_music_id;

                if(0 === pagenum){
                    enterRecordPage("direct");
                    g_record_btn_type = 0;
                    
                }
                else if(1 === pagenum){
                    enterRecordPage("direct");
                    btn.css({"background":"url('static/music/img/t51x.png') top / contain no-repeat"});
                    g_record_btn_type = 1
                }
                else if(2 === pagenum){
                    enterRecordPage("direct");
                    // 定义您要发送的数据
                    var data = JSON.stringify({
                        algo_type: g_algo_type // 替换为实际的算法类型
                    });

                    var xhr = new XMLHttpRequest();
                    xhr.open("POST", '/get_algo_status/', false); // 第三个参数设置为false表示同步

                    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
                    xhr.setRequestHeader("Content-Type", "application/json");

                    // 发送请求
                    xhr.send(data);

                    // 检查请求状态
                    if (xhr.status === 200) {
                        var json = JSON.parse(xhr.responseText);
                        var status = json["status"]
                        if("finish" == status){
                            loadProcessedMusic(g_algo_type,json["music_file_url"],1,json["midi_file_url"],json["midi_mp3_file_url"],json["zip_file_url"],"done","") 
                            // loadProcessedMusic(g_algo_type,audio_file_url,percent,midi_file_url,status,error_message) 
                        }
                        else if("processing" == status){
                            // 在本页面等待完成信息
                            create_upload(true)
                        }
                        else{
                            alert("status error");
                        }

                        console.log(json);
                    } else {
                        console.error('Error:', xhr.statusText);
                    }

                }
                else if(3 === pagenum){
                    enterRecordPage("direct");         
                    create_finish(g_record_blob);  
                }
            }
        }
        else{
            console.error("indexeddb_call_back_"+status);
        }

    }


    function getOpenRecordPageStatus(){
        return g_isOpenRecordPage;
    }

    function releaseRecordResource(){
        if(g_record != null){
            // if (g_record.isRecording()) {
            stopRecordTimer();
            //     g_record.destroy();
            //     g_record = null;
            // }
        }
        if(g_recordwaveplaysurfer != null){
            g_recordwaveplaysurfer.destroy();
            g_recordwaveplaysurfer = null;
        }
    }


    function enterRecordPage(way,is_update = false){
        // if("memory" == way){
        //     get_all_data("record",read_record_data_callback);
        // }
        // else if("direct" == way){
        //     internalEnterRecordPage();
        // }
        internalEnterRecordPage(is_update);
    }



    function internalEnterRecordPage(is_update = false){
        g_isOpenRecordPage = true
        g_encode_mp3_worker = new Worker('static/music/js/mp3EncoderWorker.js');
        if(!isMobileDevice()){
            g_barHeight = 0.7
            if (($('#record-page-container').length > 0) && (!is_update)) {
                $('#record-page-container').show();
            }
            else{
                $('#record-page-container').remove();

                var firstRow = $("#first-row");
                firstRow.removeClass().addClass("row item special");
                firstRow.after(`
                <div id="record-page-container" class="row item special8" style="width:100%;height:100%">
                    <div id="record-page-container-row" class="col d-flex flex-column justify-content-around align-items-around" style="width:100%;height:100%">
                        <div id="record-algo-progress" style="display:none"></div>
                        <div class="row item"></div>
                        <div class="row edit-item special3">
                            <div class="col d-flex flex-column justify-content-around align-items-center d-none d-lg-block"></div>
                            <div class="col d-flex flex-column justify-content-start align-items-center" style="padding: 0px;height: 100%;"><a id="record" class="cursor-pointer d-flex flex-column justify-content-center align-items-center justify-content-sm-center justify-content-md-center justify-content-lg-start justify-content-xl-start justify-content-xxl-center record-link"></a></div>
                            <div class="col d-flex flex-column justify-content-around align-items-center d-none d-lg-block"></div>
                        </div>
                        <div class="row item">
                            <div class="col d-flex flex-row justify-content-center align-items-start align-items-sm-start align-items-md-start align-items-lg-center align-items-xl-center align-items-xxl-center">
                                <p id="record-timer" class="music-time-display" style="margin: 0px;">
                                    Record
                                </p>
                            </div>
                        </div>

                        <div id="record-upload-container" class="row item special5">
                            <div id="record-upload-container-row" class="col d-flex flex-column justify-content-center align-items-center" style="width:100%;height:100%">
                                <div class="row item special">
                                    <div class="col d-flex flex-row justify-content-center align-items-center">
                                        <p class="record-describe-display" style="margin: 0px;">
                                            Hum 'la-la-la' or upload your humming audio
                                        </p>
                                    </div>
                                </div>

                                <div class="row item flex-row justify-content-center align-items-center mobile-item special record-upload-box">
                                    <div class="col d-flex flex-column justify-content-center align-items-center e-custom-col">
                                        <form id="record-t-upload" class="d-flex flex-column justify-content-center align-items-center" style="width:100%;height:100%;" method="post" enctype="multipart/form-data" action="/upload"> 
                                            <p id="record-update-progressText" class="upload-p" style="margin: 0;display:none">0%</p>
                                            <div id="record-update-start" class="container cursor-pointer d-flex flex-column justify-content-evenly align-items-center" style="width:15%;height:100%;margin: 0;">
                                                <img class="upload-icon cursor-pointer" src="static/music/img/upload.svg" />
                                                <p class="upload-p cursor-pointer" style="margin: 0;">Upload</p>
                                            </div>
                                            <p class="upload-p" style="margin: 0;">Supports MP3,WAV,AAC,OGG formats</p>
                                            <input id="recordfileInput" class="form-control form-control-file" type="file" name="file" style="display: none;" accept=".mp3,.wav,.flac,.aac,.ogg" />
                                        </form>   
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="moblie-btn-row" class="row item d-lg-none" style="display: none;">
                            <div class="col d-flex flex-row justify-content-center align-items-center col-6"><svg id="mobile-record-play-stop" class="bi bi-play-fill play-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                            <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                        </g>
                                </svg></div>
                            <div class="col d-flex flex-row justify-content-center align-items-center col-6">
                                <svg id="mobile-delete-record-btn" class="bi bi-trash-fill delete-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"></path>
                                </svg>
                            </div>
                        </div>
                        <div id="record-player-container" class="row item special" style="display: none;">
                            <div id="record-player-container-row" class="row d-flex flex-row justify-content-center item special" style="width: 100%;height: 100%">
                                <div class="col d-flex flex-row justify-content-end align-items-center" style="padding: 0px;">
                                    <div class="d-flex flex-row justify-content-end align-items-center" style="width: 80%;height: 40%"><svg id="record-play-stop" class="bi bi-play-fill play-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                    <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                                    <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                                </g>
                                        </svg></div>
                                </div>
                                <div class="col d-flex d-xl-flex flex-column justify-content-center align-items-center justify-content-xxl-center align-items-xxl-center item special">
                                    <div id="record-mic" class="mic-class"></div>
                                </div>
                                <div class="col d-flex flex-row justify-content-start align-items-center item d-none d-lg-block" style="padding: 0px;">
                                    <div class="d-flex flex-row justify-content-start align-items-center" style="width: 100%;height: 100%;">
                                        <svg id="delete-record-btn" class="bi bi-trash-fill delete-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                                            <title>Delete recording</title>
                                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"></path>
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="row item"></div>
                    </div>
                </div>
            `);

            $("#record-timer").addClass("music-time-big-font");

            var uuid = generateUUID()
            $("#record-algo-uuid").text(uuid)
            init();

            var upload_btn = $('#record-t-upload')

            upload_btn.off('click') // 取消绑定之前的点击事件处理程序
            upload_btn.click(handleUpload)

            
            upload_btn.off('dragenter')
            upload_btn.on('dragenter', handleDragEnter);

            upload_btn.off('dragover')
            upload_btn.on('dragover', handleDragOver);

            upload_btn.off('dragleave')
            upload_btn.on('dragleave', handleDragLeave);

            upload_btn.off('drop')
            upload_btn.on('drop', handleDrop);

            $('#recordfileInput').on('change', handleUploadChange)
            $('#recordfileInput').on('cancel', handleUploadCancel)

            }
            
            
        }
        else{
            g_barHeight = 0.6
            if (($('#record-page-container').length > 0) && (!is_update)) {
                $('#record-page-container').show();
            }
            else{
                $('#record-page-container').remove();
                var firstRow = $("#first-row");
                // firstRow.nextAll().remove()

                // <div id="tools-page-container" class="row item special8" style="width:100%;height:100%">
                // <div id="tools-page-container-row" class="col d-flex flex-column justify-content-around align-items-around" style="width:100%;height:100%">

                firstRow.after(`
                <div id="record-page-container" class="row item special8" style="width:100%;height:100%">
                    <div id="record-page-container-row" class="col d-flex flex-column justify-content-around align-items-center" style="width:100%;height:100%">
                        <div id="record-algo-progress" style="display:none"></div>

                        <div class="row edit-item special3 mobile-row-long">
                            <div class="col d-flex flex-column justify-content-around align-items-center "></div>
                            <div class="col d-flex flex-column justify-content-end align-items-center" style="padding: 0px;height: 100%;">
                                <a id="record" class="cursor-pointer d-flex flex-column justify-content-center align-items-center record-link"></a>
                            </div>
                            <div class="col d-flex flex-column justify-content-around align-items-center "></div>
                        </div>
                        <div class="row edit-item special mobile-row-long">
                            <div class="col d-flex flex-row justify-content-center align-items-end">
                                <p id="record-timer" class="music-time-display" style="margin: 0px;">
                                    Record
                                </p>
                            </div>
                        </div>
                        <div id="record-upload-container" class="row item special4" style="width:100%">
                            <div id="record-upload-container-row" class="col d-flex flex-column justify-content-around align-items-center" style="width:100%;height:100%">
                                <div class="row ">
                                    <div class="col d-flex flex-row justify-content-center align-items-center" stlye="width:100%;height:100%">
                                        <p class="record-describe-display" style="margin: 0px;">
                                            Hum 'la-la-la' or upload your humming audio
                                        </p>
                                    </div>
                                </div>

                                <div class="row  flex-row justify-content-center align-items-evenly  record-upload-box">
                                    <div class="col d-flex flex-column justify-content-center align-items-center e-custom-col">
                                        <form id="record-t-upload" class="d-flex flex-column justify-content-evenly align-items-center" style="width:100%;height:100%;" method="post" enctype="multipart/form-data" action="/upload"> 
                                            <p id="record-update-progressText" class="upload-p" style="margin: 0;display:none">0%</p>
                                            <div id="record-update-start" class="container cursor-pointer d-flex flex-column justify-content-between align-items-center" style="width:30%;height:50%;margin: 0;">
                                                <img class="upload-icon cursor-pointer" src="static/music/img/upload.svg" />
                                                <p class="upload-p cursor-pointer" style="margin: 0;">Upload</p>
                                            </div>
                                            <p class="upload-p" style="margin: 0;">Supports MP3,WAV,AAC,OGG formats</p>
                                            <input id="recordfileInput" class="form-control form-control-file" type="file" name="file" style="display: none;" accept=".mp3,.wav,.flac,.aac,.ogg" />
                                        </form>   
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div  id="moblie-btn-row" class="row edit-item special mobile-row-long" style="display: none;">
                            <div class="col d-flex flex-row justify-content-center align-items-center item " style="padding: 0px;">
                                <div class="d-flex flex-row justify-content-center align-items-center" style="width: auto;height: 70%;"><svg id="record-play-stop" class="bi bi-play-fill play-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16">
                                <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                                <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                            </g>
                                    </svg></div>
                            </div>
                            <div class="col d-flex flex-row justify-content-center align-items-center item " style="padding: 0px;">
                                <div class="d-flex flex-row justify-content-center align-items-center" style="width: 100%;height: 100%;"><svg id="delete-record-btn" class="bi bi-trash-fill delete-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"></path>
                                    </svg></div>
                            </div>
                        </div>
                        <div id="record-player-container" class="row edit-item special mobile-row-long" style="display: none;">
                            <div class="col d-flex flex-column justify-content-center align-items-center" style="width:100%;height:100%">
                                <div id="record-mic" class="mic-class"></div>
                            </div>
                        </div>
                        <div class="row half-item mobile-row-long">
                        </div>
                    </div>
                </div>
                
                `)




                $("#record-timer").addClass("music-time-big-font");

                var uuid = generateUUID()
                $("#record-algo-uuid").text(uuid)
                init();


                var upload_btn = $('#record-t-upload')

                upload_btn.off('click') // 取消绑定之前的点击事件处理程序
                upload_btn.click(handleUpload)

                
                upload_btn.off('dragenter')
                upload_btn.on('dragenter', handleDragEnter);

                upload_btn.off('dragover')
                upload_btn.on('dragover', handleDragOver);

                upload_btn.off('dragleave')
                upload_btn.on('dragleave', handleDragLeave);

                upload_btn.off('drop')
                upload_btn.on('drop', handleDrop);

                $('#recordfileInput').on('change', handleUploadChange)
                $('#recordfileInput').on('cancel', handleUploadCancel)


            }

        }
        
    
    }



    function init()
    {
        // setStyleDisplay("record-play-stop","none")
        // setStyleDisplay("delete-record-btn","none")
     
        $("#record-play-stop").hide();
        $("#delete-record-btn").hide();

        // if(isMobileDevice()){
        //     var first_height = $('#first-row').height()
        //     $('#first-row').css('min-height', first_height)

        //     var second_height = $('#second-row').height()
        //     $('#second-row').css('min-height', second_height)

        //     var third_height = $('third-row').height()
        //     $('#third-row').css('min-height', third_height)
        // }

        // document.getElementById("record-play-stop").style.display = "none";
        var btnPathElement = document.querySelector("#record-play-stop path");
        btnPathElement.setAttribute('d', 'm11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'); // 更改回"暂停"图标为播放
        // document.getElementById("record-play-stop").onclick = handlePlayStopClick;
        // document.getElementById("mobile-record-play-stop").onclick = handlePlayStopClick;

     
        $('[id$="record-play-stop"]').off('click')
        $('[id$="record-play-stop"]').click(handlePlayStopClick);

        $(document).off('keydown', g_recordBoundHandleSpacebar);
        g_recordBoundHandleSpacebar = handleSpacebar.bind(this, handlePlayStopClick)
        $(document).on('keydown', g_recordBoundHandleSpacebar);

        $('[id$="delete-record-btn"]').off('click')
        $('[id$="delete-record-btn"]').click(handleDeleteClick);

        $("#record").off('click')
        $("#record").click(handleRecordBtn);
        

        g_record_btn_type = 0

        // document.getElementById("delete-record-btn").style.display = "none";
        // document.getElementById("delete-record-btn").onclick = handleDeleteClick;
        // document.getElementById("mobile-delete-btn").onclick = handleDeleteClick;
        g_containerHeight = document.getElementById('record-mic').offsetHeight;

        g_recordwaveplaysurfer = WaveSurfer.create({
            container: '#record-mic',
            waveColor: 'rgb(255, 255, 255)',
            progressColor: 'rgb(255, 255, 255)',
            height: g_containerHeight,  // 例如
            barHeight: g_barHeight,
            barWidth:4,
            barRadius:4,
            cursorColor:'rgb(255, 78, 0)',
            cursorWidth: 2,
            loop: false,
        })
        // Initialize the Record plugin
        g_record = g_recordwaveplaysurfer.registerPlugin(RecordPlugin.create())
        // Render recorded audio
        g_record.on('record-end', (blob) => {
            stopRecordTimer()
            // g_record.empty();
            // g_record.destroy()
            // WaveSurfer.empty()
            g_recordwaveplaysurfer.empty()
            
            var micElement = document.getElementById('record-mic');
            if (micElement) {
                micElement.innerHTML = '';
            }
            create_play(blob)
            // g_waverecordsurfer.destroy()
            
        })

        g_record.on('record-start', () => {
            startRecordTimer()
        })

        // g_record.on('destroy', () => {
        //     console.log("g_record.on destroy")
        //     stopRecordTimer()
        // })

        //save_data("record","pagenum",0);


        


    }


    function handleUpload() {
        const fileInput = document.getElementById('recordfileInput').click()
    }


    function handleDragEnter(e) {
        e.stopPropagation();
        e.preventDefault();
        // 可以添加一些视觉反馈，例如改变边框颜色
        $(e.target).addClass('drag-over');
    }

    function handleDragOver(e) {
        e.stopPropagation();
        e.preventDefault();
        // 设置拖放效果
        e.originalEvent.dataTransfer.dropEffect = 'copy';
    }

    function handleDragLeave(e) {
        e.stopPropagation();
        e.preventDefault();
        // 移除视觉反馈
        $(e.target).removeClass('drag-over');
    }

    function handleDrop(e) {
        e.stopPropagation();
        e.preventDefault();
        $(e.target).removeClass('drag-over'); // 移除拖放时的视觉反馈

        var files = e.originalEvent.dataTransfer.files; // 获取拖放的文件列表
        // if (files.length > 0) {
        //     $('#fileInput').prop('files', files);
        //     handleUploadChange(files) // 调用上传处理函数
        // }
        handleUploadChange(1,files) // 调用上传处理函数
    }





    function handleUploadCancel() {
        $('#record-t-upload').off('click')
        $('#record-t-upload').click(handleUpload)

        $('#record-t-upload').off('dragenter')
        $('#record-t-upload').on('dragenter', handleDragEnter);

        $('#record-t-upload').off('dragover')
        $('#record-t-upload').on('dragover', handleDragOver);

        $('#record-t-upload').off('dragleave')
        $('#record-t-upload').on('dragleave', handleDragLeave);

        $('#record-t-upload').off('drop')
        $('#record-t-upload').on('drop', handleDrop);
    }

    function handleUploadChange(type = 0,files) {
        if(type != 1){
            var fileInput = $(this)
            files = fileInput[0].files
        }
        
        // 检查是否选择了文件
        if (files && files.length > 0) {
            $('#record-t-upload').off('click')

            
            $('#record-t-upload').off('dragenter')
            $('#record-t-upload').off('dragover')
            $('#record-t-upload').off('dragleave')
            $('#record-t-upload').off('drop')
            // 获取用户选择的文件
            var selectedFile = files[0]

            var validExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg']

            var up_music_blob = new Blob([selectedFile], {
                type: selectedFile.type
            })

            var fileName = selectedFile.name

            var fileExt = fileName.includes('.')
                ? fileName.substring(fileName.lastIndexOf('.'))
                : ''

            // 检查文件后缀名是否在有效的后缀名列表中
            if (!validExtensions.includes(fileExt.toLowerCase())) {
                alert('Invalid file extension. Please select a valid file.')
                handleUploadCancel()
                return // 终止文件上传操作
            }

            var nameWithoutExt = fileName.replace(fileExt, '')

            // 如果文件名长度超过10个字符，截取前10个字符
            if (nameWithoutExt.length > 10) {
                nameWithoutExt = nameWithoutExt.substring(0, 10)
                fileName = nameWithoutExt + fileExt
            }

            // 获取文件名
            var fileNameWithExtension = fileName

            // 获取文件名（不包含后缀名）
            var fileNameWithoutExtension = fileNameWithExtension
                .split('.')
                .slice(0, -1)
                .join('.')
            var music_file_name = fileNameWithoutExtension

            g_record.stopRecording()
            var btn = $("#record");
            btn.css({"background":"url('static/music/img/t51x.png') top / contain no-repeat"});
            g_record_btn_type = 1
            //save_data("record","pagenum",1);
            g_add_music_id = null;


            // stopRecordTimer()
            // g_record.empty();
            // g_record.destroy()
            // WaveSurfer.empty()
            g_recordwaveplaysurfer.empty()
            
            stopRecordTimer()
            // g_record.empty();
            // g_record.destroy()
            // WaveSurfer.empty()

            var micElement = document.getElementById('record-mic');
            if (micElement) {
                micElement.innerHTML = '';
            }
            
            // g_waverecordsurfer.destroy()
            
            g_randomFileName = music_file_name;

            $('#record-upload-container').css('display', 'none');

            $('#record-player-container').css('display', 'block');
                         
            g_containerHeight = document.getElementById('record-mic').offsetHeight;
            create_play(up_music_blob)
            return;
        
            //save_data("record","origin_blob",mp3Blob); 

            // let algo_/uuid = $('#algo-uuid').text();
            // 创建一个FormData对象来包含文件数据
            // const formData = new FormData();
            // formData.append('file', audio_file);
            // formData.append('user_id', user_id);
            // formData.append('music_title', 'record');
            // formData.append('music_type', 'RECORDED');
            // formData.append('clientUUID', window.clientUUID);
            // formData.append('algo_uuid', $('#record-algo-uuid').text());
            // let xhr = new XMLHttpRequest();
            // // 设置CSRF token头部
            // xhr.open('POST', '/music_upload/', true);
            // 设置CSRF token头部
            // xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));

            
            // 创建一个FormData对象来包含文件数据
            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('user_id', window.user_id)
            formData.append('music_title', music_file_name)
            formData.append('music_type', 'RECORDED')
            formData.append('algo_uuid', $('#record-algo-uuid').text());
            formData.append('clientUUID', window.clientUUID);

            var progressText = $('#record-update-progressText')
            progressText.css('display', 'block')

            var startText = $('#edit-update-start')
            startText.attr('style', 'display: none !important')

            // class="d-flex d-xxl-flex flex-column justify-content-center align-items-center justify-content-xxl-center align-items-xxl-center"
            var xhr = new XMLHttpRequest()
            xhr.upload.addEventListener('progress', function (event) {
                var percent = Math.round((event.loaded / event.total) * 100)
                // 更新进度文本
                progressText.text(percent + '%')
            })
            g_create_record_algo_timer = new createRecordAlgoTimer()
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        // 上传成功，执行切换到播放界面和加载音乐的操作
                        leavePage()
                        enterEditPage(
                            'direct',
                            false,
                            up_music_blob,
                            music_file_name,
                            'NO_PROCESSED',
                            true
                        )
                    } else {
                        $('#t-upload').off('click')
                        $('#t-upload').click(handleUpload)
                        // 上传失败，执行相应的错误处理操作
                        alert('Error upload:' + xhr.status)
                    }
                }
            }

            xhr.open('POST', '/music_upload/', true)
            // 设置CSRF token头部
            xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'))
            // data: JSON.stringify(requestData), // 将整个对象作为 JSON 字符串发送
            xhr.send(formData)
        } else {
            alert('please select one file!')
            handleUploadCancel()
        }
    }







    function startRecordTimer() {
        g_record_timerInterval = setInterval(function () {
            g_record_totalTime++;
            let minutes = Math.floor(g_record_totalTime / 60);
            let seconds = g_record_totalTime - (minutes * 60);
            document.getElementById('record-timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }, 1000);
    }

    function stopRecordTimer() {
        clearInterval(g_record_timerInterval);
        g_record_totalTime = 0;
        var timerElement = document.getElementById('record-timer');

        if (timerElement) {
            // 清空 timer 元素的内容
            timerElement.innerHTML = '';

            // 设置新的 HTML 结构并添加 music-time-display 类
            timerElement.className = 'music-time-display'; // 添加类
            timerElement.style.margin = '0px'; // 设置样式
            timerElement.innerHTML = '<span class="time-large">00:00</span>/<span class="time-small">00:00</span>';
            if(!isMobileDevice()){
                $("#record-timer").addClass("music-time-big-font");
            }

        }
    }


    // 定义录音触发事件
    function handleRecordBtn(){
        var btn = $("#record");
        if (btn.length){
            if(1 === g_record_btn_type){//上传
                g_record_btn_type = 2
                create_upload()
                return
            }

            if (g_record.isRecording()) {
                g_record.stopRecording()
                btn.css({"background":"url('static/music/img/t51x.png') top / contain no-repeat"});
                g_record_btn_type = 1
                //save_data("record","pagenum",1);
                g_add_music_id = null;
                //save_data("record",'add_music_id',null);
                
                return
            }

            btn.prop("disabled", true);

            try {

                $('#record-upload-container').css('display', 'none');

                $('#record-player-container').css('display', 'block');

                init();

                g_record.startRecording()
                .then(() => {
                    // recButton.textContent = 'Stop'
                    btn.css({"background":"url('static/music/img/t14.png') top / contain no-repeat"});
                    document.getElementById('record-timer').textContent = `00:00`;
                    // recButton.disabled = false
                })
                .catch(err => {
                    // 这里捕获异步错误
                    console.error("Error during recording:", err);
                    alert("Error during recording:" + err.toString());
                });
            } catch (err) {
                console.error("Error accessing the microphone:", err);
                alert("Error accessing the microphone:" + err.toString());
            }

            btn.prop("disabled", false);
        }
    }




    // Buttons
    // {
    //   // Start recording
    //   const recButton = document.querySelector('#record')
    //   recButton.onclick = () => {
    //     if (record.isRecording()) {
    //       record.stopRecording()
    //       recButton.textContent = 'Record'
    //       return
    //     }

    //     recButton.disabled = true


    //     try {
    //       if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
    //       {
    //         throw new Error("Cannot read property 'getUserMedia' of undefined");
    //       }
    //       record.startRecording().then(() => {
    //         recButton.textContent = 'Stop'
    //         recButton.disabled = false
    //       })}catch (err) {
    //         console.error("Error accessing the microphone:", err);
    //         alert("Error accessing the microphone:" + err.toString());
    //         }
    //     }
    // }

    // function audioBufferToWav(audioBuffer) {
    //     // 获取 AudioBuffer 中的信息
    //     const numChannels = audioBuffer.numberOfChannels;
    //     const sampleRate = audioBuffer.sampleRate;
    //     const length = audioBuffer.length;
    
    //     // 创建一个 ArrayBuffer 来存储 WAV 格式的头信息和音频数据
    //     const buffer = new ArrayBuffer(44 + length * 2);
    //     const view = new DataView(buffer);
    
    //     // 写入 WAV 头信息
    //     // RIFF header
    //     writeString(view, 0, 'RIFF');
    //     view.setUint32(4, 32 + length * 2, true);
    //     writeString(view, 8, 'WAVE');
    
    //     // fmt chunk
    //     writeString(view, 12, 'fmt ');
    //     view.setUint32(16, 16, true);
    //     view.setUint16(20, 1, true);
    //     view.setUint16(22, numChannels, true);
    //     view.setUint32(24, sampleRate, true);
    //     view.setUint32(28, sampleRate * 2, true);
    //     view.setUint16(32, 2, true);
    //     view.setUint16(34, 16, true);
    
    //     // data chunk
    //     writeString(view, 36, 'data');
    //     view.setUint32(40, length * 2, true);
    
    //     // 写入 PCM 数据
    //     const data = audioBuffer.getChannelData(0);
    //     let offset = 44;
    //     for (let i = 0; i < data.length; i++, offset += 2) {
    //     const s = Math.max(-1, Math.min(1, data[i]));
    //     view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    //     }
    
    //     // 生成 Blob
    //     return new Blob([view], { type: 'audio/wav' });
    // }

    function convertAudioBufferToMp3(audioBuffer) {
        return new Promise((resolve, reject) => {
            try {
                const channels = audioBuffer.numberOfChannels;
                const sampleRate = audioBuffer.sampleRate;
                const mp3Encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128); // 128 is the bit rate
                const buffers = [];
    
                for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
                    buffers.push(convertFloat32ToInt16(audioBuffer.getChannelData(i)));
                }
    
                const mp3Data = [];
                const mp3Buffer = mp3Encoder.encodeBuffer(...buffers);
                if (mp3Buffer.length > 0) {
                    mp3Data.push(new Int8Array(mp3Buffer));
                }
    
                const finalBuffer = mp3Encoder.flush();
                if (finalBuffer.length > 0) {
                    mp3Data.push(new Int8Array(finalBuffer));
                }
    
                const mp3Blob = new Blob(mp3Data, { type: 'audio/mpeg' });
                resolve(mp3Blob);
            } catch (error) {
                reject(error);
            }
        });
    }
    
    function convertFloat32ToInt16(buffer) {
        const l = buffer.length;
        const buf = new Int16Array(l);
        for (let i = 0; i < l; i++) {
            buf[i] = Math.min(1, buffer[i]) * 0x7FFF;
        }
        return buf;
    }

    
    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    function updateRecordAlgoProgress(region_seek,progress_value,audioDuration){

        $('#record-timer').text(Math.round(progress_value * 100) + '%');

        var update_time = audioDuration * progress_value ;
        region_seek.setOptions({
            id:'region_seek',
            start: 0,  // 开始于 0
            end: update_time,  // 结束于音频的总长度
            color: "rgba(189, 49, 36, 0.36)",  // 选择一个颜色
            // waveColor: 'rgb(233, 157, 66, 0.3)',
            drag: false,
            resize: false,
        })
    }

    class createRecordAlgoTimer {
        static currentIntervalId = null; // 使用static声明静态属性来跟踪当前活动的定时器
        
        constructor() {
            // 如果存在活动的定时器，先停止它
            if (createRecordAlgoTimer.currentIntervalId !== null) {
                clearInterval(createRecordAlgoTimer.currentIntervalId);
            }
            var process_over = false;

            var algo_type = 'record_algo_process'

            var midiMp3FileUrl;
            var zip_file_url;

            // $(algoProgress).text(0.2)
            this.dynamicJsonValue = false
            var process_pregress = 0.2
            var index = 0;
            
            g_recordwaveplaysurfer.setOptions({cursorColor:'transparent'});
            g_wsRecordRegions = g_recordwaveplaysurfer.registerPlugin(RegionsPlugin.create({loop: false}))
            g_wsRecordRegions.clearRegions();
            var audioDuration = g_recordwaveplaysurfer.getDuration();
            
            const region_seek = g_wsRecordRegions.addRegion({
                id:'region_seek',
                start: 0,  // 开始于 0
                end: 0,  // 结束于音频的总长度
                color: "rgba(189, 49, 36, 0.36)",  // 选择一个颜色
                // waveColor: 'rgb(233, 157, 66, 0.3)',
                drag: false,
                resize: false,
                // MouseEvent: false,
            })

            this.intervalId = setInterval(() => {
                index += 1
                var record_update_finish = this.dynamicJsonValue
                if(!process_over){
                    if(((index % 10) == 0) && record_update_finish){
                        $.ajax({
                            url: '/get_algo_progress/',  // 接口的路径
                            type: 'GET',
                            success: function(response) {
                                var responseData = JSON.parse(response.data);
                                var process_status = responseData[algo_type]['status']
                                var algo_uuid = responseData[algo_type]['algo_uuid']
                                if($(' #record-algo-uuid').text() != algo_uuid){
                                    return;
                                }
                                if('done' === process_status){
                                    process_over = true;

                                    midiMp3FileUrl = G_MEDIA_URL + responseData[algo_type]['midi_mp3_file_url']
                                    zip_file_url = G_MEDIA_URL + responseData[algo_type]['zip_file_url']

                                    process_pregress = 0.92
                                }
                                else if('run' === process_status){
                                    var pregress = responseData[algo_type]['process_pregress']
                                    if(pregress > 0.2)
                                        process_pregress = Math.floor(pregress * 100) / 100
                                }
                                else{
                                    process_over = true;
                                    var error_message = responseData[algo_type]['error_message']
                                    console.error(error_message);  // 如果发生错误，打印错误信息到控制台
                                    alert('Error process: ' + error_message);  // 在页面上显示错误信息
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error(error);  // 如果发生错误，打印错误信息到控制台
                                alert('Error occurred: ' + error);  // 在页面上显示错误信息
                            }
                        });
                    }
                    
                    // if(process_pregress < 0.92){
                        // 从元素中获取百分比字符串
                        var currentPercentString = $('#record-timer').text()
                        // 移除百分比符号并转换为数字，然后除以100得到小数
                        var currentPercentValue =
                        parseFloat(currentPercentString.replace('%', '')) / 100

                        if (currentPercentValue < process_pregress) {
                            currentPercentValue += 0.01
                            
                            updateRecordAlgoProgress(region_seek,currentPercentValue,audioDuration)  
                        }
                    // }
                    // else{
                        
                    // }            
                }
                else{
                    if(process_pregress >= 0.92){
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', midiMp3FileUrl, true);
                        xhr.responseType = 'arraybuffer';
                        xhr.timeout = 100000; // 设置超时时间为100秒 (10000毫秒)
                        xhr.onload = function(e) {
                            if (this.status == 200) {
                                // Convert array buffer to blob
                                var mp3_blob = new Blob([this.response], {type: 'audio/wav'});
                                // console.log("g_all_midi_url "+g_all_midi_url)
                                for(var i = 0.92;i <= 1; i+=0.01){
                                    setTimeout(() => {}, 500)
                                    updateRecordAlgoProgress(region_seek,i,audioDuration) 
                                }

                                waitForElementToShow('#record-page-container').then(() => {
                                    
                                    create_finish(mp3_blob,zip_file_url,g_record_duration);
                                     

                                    // 为防止错误情况发生，监听error事件
                                    audio.addEventListener('error', function(e) {
                                        console.error('音频加载错误:', e);
                                    });

                                    
                                });
                            } else {
                                console.error("Failed to fetch audio:", this.statusText);
                                alert("Failed to fetch audio:", this.statusText);
                            }
                        };
                        
                        xhr.onerror = function(e) {
                            console.error("Failed to fetch audio:", e);
                            alert("Failed to fetch audio:", e);
                        };
                        xhr.ontimeout = function() {
                            // 处理超时
                            console.error("timeout to fetch audio:", e);
                            alert("timeout to fetch audio:", e);
                        };
            
                        xhr.send();
    
                    }
                    clearInterval(createRecordAlgoTimer.currentIntervalId)
                }
            }, 100) // 每100毫秒执行一次

            // 更新静态属性以跟踪这个新的定时器
            createRecordAlgoTimer.currentIntervalId = this.intervalId;
        }
    
        updateValue(newValue) {
            this.dynamicJsonValue = newValue;
        }
    
        stopTimer() {
            clearInterval(this.intervalId);
            // 清除静态属性的引用，如果当前定时器被停止
            if (createRecordAlgoTimer.currentIntervalId === this.intervalId) {
                createRecordAlgoTimer.currentIntervalId = null;
            }
        }
    }


    

    function create_upload(only_draw = false){
        console.time('create_upload');
        document.getElementById("record").outerHTML = "<h1 id='record'>Creating</h1>";
        document.getElementById('record-mic').innerHTML = '';

        // document.getElementById("record-play-stop").style.display = "none";
        // document.getElementById("delete-record-btn").style.display = "none";

        setStyleDisplay("record-play-stop","none")
        setStyleDisplay("delete-record-btn","none")
        // document.getElementById('timer').style.fontSize = "calc(2rem + 2vh)";
        // document.getElementById('timer').textContent = "0%";
        // recordIncreaseProgress("#record-timer", 10);
        console.time('getDecodedData');
        g_recordwaveplaysurfer.pause();
        // var audioDuration = g_recordwaveplaysurfer.getDuration();
        var regions = g_wsRecordRegions.getRegions();
       
        var region = regions.find(region => region.id === 'region_2');

        var originalBuffer = g_recordwaveplaysurfer.getDecodedData();  // 原始音频缓冲区
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var newBuffer = audioContext.createBuffer(
            originalBuffer.numberOfChannels,
            (region.end - region.start) * originalBuffer.sampleRate,
            originalBuffer.sampleRate
        );
        
        // var newChannelData = []
        let channels = [];
        for (var channel = 0; channel < originalBuffer.numberOfChannels; channel++) {
            channels.push(originalBuffer.getChannelData(channel)); // 获取每个声道的音频数据
            var originalData = originalBuffer.getChannelData(channel);
            var newData = newBuffer.getChannelData(channel);
            for (var i = 0; i < newData.length; i++) {
                newData[i] = originalData[i + Math.floor(region.start * originalBuffer.sampleRate)];
            }
            // newChannelData.push(newData)
        }
      
        console.timeEnd('getDecodedData');

        console.time('create');  
        g_recordwaveplaysurfer = WaveSurfer.create({
            container: '#record-mic',
            waveColor: 'rgb(255, 255, 255)',
            progressColor: 'rgb(255, 255, 255)',
            height: g_containerHeight,  // 例如
            barHeight: g_barHeight,
            barWidth:4,
            barRadius:4,
            cursorColor:'rgb(255, 78, 0)',
            cursorWidth: 2,
            // progressColor:'rgba(189, 49, 36, 0.36)',
            loop: false,

        })
        console.timeEnd('create');
        // g_wsRecordRegions = g_waverecordsurfer.registerPlugin(RegionsPlugin.create({loop: false}))
        console.time('wav_encode');
        var wavData = audioBufferToWav(originalBuffer);
        var wavBlob = new Blob([wavData], { type: 'audio/wav' });
        console.timeEnd('wav_encode');
        console.time('loadBlob');
        g_recordwaveplaysurfer.loadBlob(wavBlob);
        console.timeEnd('loadBlob');
        // g_recordwaveplaysurfer.loadBlob(mp3Blob);
        // g_waverecordsurfer.un('audioprocess', g_handlePlayformAudioprocess);

        // 在主线程中
        

        // originalBuffer
        document.getElementById('record-timer').textContent = `0%`;
        g_encode_mp3_worker.postMessage({
            sampleRate: originalBuffer.sampleRate,
            numberOfChannels: originalBuffer.numberOfChannels,
            channels: channels
        });


        g_encode_mp3_worker.onmessage = function(e) {
            const mp3Blob = e.data;
            console.log('MP3 conversion successful');
            // 进行进一步操作，例如保存文件、播放音频或发送到服务器

            // 进行进一步操作，例如保存文件、播放音频或发送到服务器
            if(!only_draw){
                // 生成一个随机文件名
                let randomFileName = 'record_' + new Date().getTime() + "_" + Math.random().toString(36).substr(2, 9) + '.mp3';
    
                g_randomFileName = randomFileName;
    
    
                // 创建一个新的 File 对象，并指定文件名
                let audio_file = new File([mp3Blob], randomFileName, {type: "audio/mpeg"});
    
                // 假设 audioFile 是你通过 new File([mp3Blob], randomFileName, {type: "audio/mpeg"}) 创建的 File 对象
    
                //save_data("record","pagenum",2);  
                
                g_record_blob = mp3Blob;

                var audio = new Audio();
                var url = URL.createObjectURL(g_record_blob);
                audio.src = url;
                // 监听loadedmetadata事件，当元数据加载完成时获取音频时长
                audio.addEventListener('loadedmetadata', function() {
                    var duration = audio.duration;
                    console.log('音频长度（秒）:', duration);
                    g_record_duration = duration
                    // 释放URL对象
                    URL.revokeObjectURL(url);
                });

                
                
                //save_data("record","origin_blob",mp3Blob); 
    
                // let algo_/uuid = $('#algo-uuid').text();
                // 创建一个FormData对象来包含文件数据
                const formData = new FormData();
                formData.append('file', audio_file);
                formData.append('user_id', user_id);
                formData.append('music_title', 'record');
                formData.append('music_type', 'RECORDED');
                formData.append('clientUUID', window.clientUUID);
                formData.append('algo_uuid', $('#record-algo-uuid').text());



                let xhr = new XMLHttpRequest();

                // 设置CSRF token头部
                xhr.open('POST', '/music_upload/', true);
                // 设置CSRF token头部
                xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    
                g_create_record_algo_timer = new createRecordAlgoTimer()
                g_create_record_algo_timer.updateValue(false)
    
                xhr.onload = function() {
                    console.log("onload");
                    if (xhr.status === 200 ) {
                        console.log("Uploaded successfully!");
                        g_create_record_algo_timer.updateValue(true)
           
                    } else {
                        console.error("else onload");
                        let errorMessage
                        try {
                            let responseObj = JSON.parse(xhr.responseText);
                            errorMessage = responseObj.message || "Error during upload.";
                        } catch (e) {
                            // console.error("Failed to parse response as JSON:", xhr.responseText);
                            errorMessage = xhr.responseText || "Error during upload(json).";
                        }
                        document.getElementById('record-timer').textContent = errorMessage;
                        console.error(errorMessage);
                    }
                };
                xhr.onerror = function() {
                    console.error("Request failed");
                    document.getElementById('record-timer').textContent = "Network error or request was blocked.";
                };
    
                xhr.send(formData);
    
            }



        };

        g_encode_mp3_worker.onerror = function(e) {
            console.error('mp3 Worker error: ', e);
            alert('mp3 Worker error: ', e)
        };


        ////////////////////////////
        console.time('convertAudioBufferToMp3');
        // convertAudioBufferToMp3(newBuffer).then(mp3Blob => {
        //     console.log('MP3 conversion successful');
            

        // }).catch(error => {
        //     console.error('Failed to convert audio to MP3:',error);
        //     alert('Failed to convert audio to MP3:',error)
        // });
        
        console.timeEnd('convertAudioBufferToMp3');
        console.timeEnd('create_upload');
          
        
    }

    function loadProcessedMusic(algo_type,audio_file_url,percent,midi_file_url,midi_mp3_file_url,zip_file_url,status,error_message) {

        console.log("record_loadProcessedMusic "+algo_type);
        // return;
        if(status == 'run'){
            $('#record-algo-progress').text(percent);         
        }
        else if(status == 'done'){
            console.log("record_loadProcessedMusic midi_file_url "+midi_file_url)
            if(status == 'done'){
                // g_create_record_algo_timer

                var send_url_data = {}
                send_url_data['midi_file_url'] = audio_file_url
                send_url_data['midi_mp3_file_url'] = midi_mp3_file_url
                send_url_data['zip_file_url'] = zip_file_url

                g_create_record_algo_timer.dynamicJsonValue = send_url_data;

                $('#record-algo-progress').text(0.91);    
           
            }

        }
        else{
            alert(error_message)
        }
    }

    function create_creating(){
        var allRows = document.querySelectorAll('.row');     
        //只保留第一个  
        for (var i = 1; i < allRows.length; i++) {
            allRows[i].parentNode.removeChild(allRows[i]);
        }

        allRows = document.querySelectorAll(".row");
        allRows.forEach((row) => {
            //console.log(row); // 这里可以对每个 row 进行操作
            row.classList.add("item");
            row.classList.add("special");
        });

        allRows = document.querySelectorAll('.row');  
        var lastRow = allRows[allRows.length - 1];  
        // 创建新的 HTML 内容
        var newRowHTML = `
            <div class="row item"></div>
        `;
        // 在选定的 .row 元素后面插入新的 HTML 内容
        lastRow.insertAdjacentHTML('afterend', newRowHTML);
        if(isMobileDevice()){
            allRows = document.querySelectorAll('.row');  
            lastRow = allRows[allRows.length - 1];  
            // 创建新的 HTML 内容
            newRowHTML = `
            <div class="row item special">
                <div class="col d-flex flex-column justify-content-around align-items-center"></div>
                <div class="col d-flex flex-column justify-content-around align-items-center">
                    <div class="loading la-2x la-white"></div>
                </div>
                <div class="col d-flex flex-column justify-content-around align-items-center"></div>
            </div>
            `;
            // 在选定的 .row 元素后面插入新的 HTML 内容
            lastRow.insertAdjacentHTML('afterend', newRowHTML);
        }
        else{
            allRows = document.querySelectorAll('.row');  
            lastRow = allRows[allRows.length - 1];  
            // 创建新的 HTML 内容
            newRowHTML = `
            <div class="row item special">
                <div class="col d-flex flex-column justify-content-around align-items-center"></div>
                <div class="col d-flex flex-column justify-content-around align-items-center">
                    <div class="loading la-3x la-white"></div>
                </div>
                <div class="col d-flex flex-column justify-content-around align-items-center"></div>
            </div>
            `;
            // 在选定的 .row 元素后面插入新的 HTML 内容
            lastRow.insertAdjacentHTML('afterend', newRowHTML);
        }
        initLoading()
        allRows = document.querySelectorAll('.row');  
        lastRow = allRows[allRows.length - 1];  
        newRowHTML = `
        <div class="row item"></div>
        `;
        // 在选定的 .row 元素后面插入新的 HTML 内容
        lastRow.insertAdjacentHTML('afterend', newRowHTML);

        allRows = document.querySelectorAll('.row');  
        lastRow = allRows[allRows.length - 1];  
        newRowHTML = `
        <div class="row item special">
            <div class="col d-flex flex-row justify-content-center align-items-center">
                <h1>Creating</h1>
            </div>
        </div>
        `;
        // 在选定的 .row 元素后面插入新的 HTML 内容
        lastRow.insertAdjacentHTML('afterend', newRowHTML);

        allRows = document.querySelectorAll('.row');  
        lastRow = allRows[allRows.length - 1];  
        newRowHTML = `
        <div class="row item"></div>
        `;
        // 在选定的 .row 元素后面插入新的 HTML 内容
        lastRow.insertAdjacentHTML('afterend', newRowHTML);
        
    }

    function create_finish(mp3_blob,zip_file_url,duration){
        

        if(!isMobileDevice()){
            $('#record-page-container-row').empty();

            // var newDiv = $(
                //         `
                //         <div class="col d-flex flex-column justify-content-center align-items-center">
                //             <button id="download-midi-back-btn" class="btn btn-primary e-finish-middle-btn control-edit-up-btn" type="button">
                //             <img class="e-2middle-icon" src="static/music/img/iconPark-return.svg" /><span class="edit-btn-text-width">Back to Edit</span></button>
                //         </div>
                //         `
                //     );
                //     $('#last-back-row').append(newDiv);

            var newRowHTML = $(
            `
                <div class="row edit-mobile-half-item d-none d-lg-flex">
                </div>
                <div id="moblie-btn-row" class="row d-lg-none item">
                    <div class="col d-flex flex-row justify-content-start align-items-end col-12">
                        <div class="d-flex flex-row" style="width: 60%;"><svg id="mobile-record-play-stop" class="bi bi-play-fill" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" style="width: 40%;height: auto;border: none;outline: none;cursor: pointer;overflow: hidden;color: var(--bs-white);/*display: none;*/">
                        <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                        <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                    </g>
                            </svg>
                            <p id="mobile-record-timer" class="d-flex flex-column justify-content-center" style="margin: 0px;white-space: nowrap;">00:00 / 05:32</p>
                        </div>
                    </div>
                </div>
                <div  class="row d-flex flex-row justify-content-center item special">
                    <div class="col d-flex flex-column justify-content-center align-items-center col-1 e-custom-col" style="/*height: 50%;*/padding: 0px;">
                        <div class="d-flex flex-column justify-content-center align-items-center" style="width: 60%;height: 60%;">
                            <svg id="record-play-stop" class="bi bi-play-fill" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" style="width: auto;height: 90%;border: none;outline: none;cursor: pointer;overflow: hidden;color: var(--bs-white);/*display: none;*/">
                            <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                        </g>
                            </svg>
                        </div>
                    </div>
                    <div class="col d-flex flex-column justify-content-center align-items-center col-1 e-custom-col e-custom-col" style="/*height: 50%;*/">
                        <div class="row item special" style="width: 100% ;margin: 0px;">
                            <div class="col d-flex flex-row justify-content-center align-items-center" style="width: 100% ;height:100%;margin: 0px;">
                                
                            </div>
                        </div>
                        <div class="row item" style="width: 100% ;margin: 0px;">
                            <div class="d-flex flex-column justify-content-center align-items-center" style="width: 100%;height: 100%;">
                                <p id="record-timer" class="music-time-display" style="margin: 0px;">
                                    <span class="time-large">00:00</span>/<span class="time-small">00:00</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div class="col d-flex d-xl-flex flex-row justify-content-center align-items-center col-9 e-custom-col" style="/*height: 50%;*/">
                        <div id="record-mic" class="mic-class"></div>
                    </div>
                    <div class="col d-flex flex-row justify-content-start align-items-center col-1 e-custom-col" style="padding: 0px;">
                        <div class="d-flex flex-row justify-content-start align-items-center" style="width: 100%;height: 100%;">
                            <svg id="delete-record-btn" class="bi bi-trash-fill delete-icon-btn" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16">
                                <title>Delete recording</title>
                                <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z"></path>
                            </svg></div>
                        </div>
                    </div>
                </div>
                <div id="tmp-area" class="row item">
                </div>
                <div class="row item special">
                    <div class="col d-flex justify-content-center align-items-center col-6 col-lg-4">
                        <button id="r-del-back-tools" class="btn btn-primary d-flex flex-row justify-content-center align-items-center align-content-center r-last-long-btn" type="button">
                            <img class="r-last-icon" src="static/music/img/iconPark-return.svg" /> Re-selected method</button>
                    </div>
                    <div class="col d-flex flex-row justify-content-center align-items-center col-6 col-lg-4">
                       
                    </div>
                    <div class="col d-flex flex-row justify-content-center align-items-center col-6 col-lg-4">
                        <button id="r-download-btn" class="btn btn-primary d-flex flex-row justify-content-center align-items-center align-content-center r-last-long-btn" type="button">
                            <img class="r-last-icon" src="static/music/img/riFill-download-2-fill.svg" width height /> download audio & midi files</button>
                    </div>
                </div>
                <div class="row edit-mobile-half-item">
                </div>
                <div class="row edit-mobile-half-item">
                </div>
            `);
            $('#record-page-container-row').append(newRowHTML);

            $('[id$="record-play-stop"]').off('click')
            $('[id$="record-play-stop"]').click(handlePlayStopClick);

            $(document).off('keydown', g_recordBoundHandleSpacebar);
            g_recordBoundHandleSpacebar = handleSpacebar.bind(this, handlePlayStopClick)
            $(document).on('keydown', g_recordBoundHandleSpacebar);

            g_containerHeight = document.getElementById('record-mic').offsetHeight;

            g_record_blob = mp3_blob;

            //save_data("record","pagenum",3); 
            //save_data("record","origin_blob",g_record_blob); 


            // 使用函数作为点击事件处理程序
            $("#r-del-back-tools").off('click')
            $("#r-del-back-tools").click(handleRDelBtn);

            $("#delete-record-btn").off('click');
            $("#delete-record-btn").click(handleDeleteClick);

            changeAudioAddIdForKey("record_algo_audio_collect","");
            $("#record_algo_audio_collect").off('click')
            // $("#record_algo_audio_collect").click(handleRAddMusicBtn.bind($("#record_algo_audio_collect"), "algo",g_algo_type,"record"));    
            // $("#record_algo_audio_collect").click(handleAlgoCollectBtn.bind($("#record_algo_audio_collect")))

            $("#r-edit-btn").off('click')
            $("#r-edit-btn").click(handleREditBtn);

            $("#r-download-btn").off('click')
            // $("#r-download-btn").click(handleRDownloadBtn);
            $("#r-download-btn").click(handleRDownloadBtn.bind($("#r-download-btn"), zip_file_url,duration))

            create_play(mp3_blob,false)
        }
        else{
            var secondRow = $("#edit-btn");
            var thirdRow = $("#release-btn");

            var secondRowBottom = secondRow.offset().top + secondRow.outerHeight();
            var thirdRowTop = thirdRow.offset().top;

            var gapHeight = thirdRowTop - secondRowBottom;

            $('#record-page-container-row').empty();
            var newRowHTML = $(`
            

            <div class="row edit-item special  mobile-row-long">
                <div class="col d-flex flex-column justify-content-around align-items-center ">
                 
                   
                </div>
                <div class="col d-flex flex-column justify-content-around align-items-center ">
                    <svg id="record-play-stop" class="bi bi-play-fill" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" fill="currentColor" viewBox="0 0 16 16" style="width: auto;height: 50%;border: none;outline: none;cursor: pointer;overflow: hidden;color: var(--bs-white);/*display: none;*/">
                        <g transform="translate(8, 8) scale(1.6, 1.6) translate(-8, -8)">
                            <path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"></path>
                        </g>
                    </svg>
                </div>
                <div class="col d-flex flex-column justify-content-around align-items-center ">
                    
                </div>
            </div>
            <div class="row edit-item  mobile-row-long">
                <div class="col d-flex flex-row justify-content-center align-items-end">
                    <p id="record-timer" class="music-time-display" style="margin: 0px;margin-bottom:`+gapHeight +`px;">
                        <span class="time-large">00:00</span>/<span class="time-small">00:00</span>
                    </p>
                </div>
            </div>
            <div class="row edit-item special mobile-row-long">
                <div class="col d-flex flex-row justify-content-center align-items-center item " style="padding: 0px;">
                    <div id="record-mic" class="mic-class" style="margin-bottom:`+gapHeight +`px;height:90%"></div>
                </div>
            </div>

            <div class="row item special8 mobile-row-long">
                <div class="col d-flex d-xl-flex flex-column justify-content-end align-items-center">
                    <button id="r-download-btn" class="btn btn-primary   r-last-long-btn" type="button" style="margin-bottom:`+gapHeight +`px">
                    <img class="r-last-icon" src="static/music/img/riFill-download-2-fill.svg" width height />Download audio & midi files</button>
                   
                    <button id="delete-record-btn" class="btn btn-primary   r-last-long-btn" type="button" style="margin-bottom:`+gapHeight +`px">
                    <img class="r-last-icon" src="static/music/img/record.svg" />Hum again</button>
                    <button id="r-del-back-tools" class="btn btn-primary  r-last-long-btn" type="button" style="margin-bottom:`+gapHeight +`px">
                    <img class="r-last-icon" src="static/music/img/iconPark-return.svg" />Re-select method</button>
                </div>
            </div>
 
  

          
            
            `);

            $('#record-page-container-row').append(newRowHTML);

 

            changeAudioAddIdForKey("record_algo_audio_collect","");
            $("#record_algo_audio_collect").off('click')
            // $("#record_algo_audio_collect").click(handleRAddMusicBtn.bind($("#record_algo_audio_collect"), "algo",g_algo_type,"record"));    
            // $("#record_algo_audio_collect").click(handleAlgoCollectBtn.bind($("#record_algo_audio_collect")))

            


            $("#r-download-btn").off('click')
            // $("#r-download-btn").click(handleRDownloadBtn);
            $("#r-download-btn").click(handleRDownloadBtn.bind($("#r-download-btn"), zip_file_url,duration))

            $("#r-del-back-tools").off('click')
            $("#r-del-back-tools").click(handleRDelBtn);

            $("#r-edit-btn").off('click')
            $("#r-edit-btn").click(handleREditBtn);

            // $("#r-edit-btn2").off('click')
            // $("#r-edit-btn2").click(handleREditCleanBtn);

            $("#delete-record-btn").off('click')
            $("#delete-record-btn").click(handleDeleteClick);

            $("#record-play-stop").off('click')
            $("#record-play-stop").click(handlePlayStopClick)

            $(document).off('keydown', g_recordBoundHandleSpacebar);
            g_recordBoundHandleSpacebar = handleSpacebar.bind(this, handlePlayStopClick)
            $(document).on('keydown', g_recordBoundHandleSpacebar);

            g_containerHeight = document.getElementById('record-mic').offsetHeight;

            g_record_blob = mp3_blob;

            //save_data("record","pagenum",3); 
            //save_data("record","origin_blob",g_record_blob); 

            create_play(mp3_blob)
            resetUserBtnClick();
        }

    }

    function handleRDelBtn(){
        g_record_blob = null;
        console.time("origin_blob g_record_blob");
        //save_data("record","origin_blob",g_record_blob); 
        console.timeEnd("origin_blob g_record_blob");
        g_add_music_id = null;
        console.time("origin_blob add_music_id");
        //save_data("record",'add_music_id',null)
        console.timeEnd("origin_blob add_music_id");
        g_all_file_url = null;
        g_all_midi_url = null;
        g_all_zip_url = null;

        //save_data("record","audio_url",null); 

        //save_data("record","midi_url",null); 

        //save_data("record","pagenum",0); 
      
        console.time("leavePage");
        leavePage();
        console.timeEnd("leavePage");

        console.time("enterToolsPage");
        g_isOpenRecordPage = false;
        enterToolsPage();
        console.timeEnd("enterToolsPage");
    }

    function read_record_add_data_callback(status,contains, key,value,data,data1){
        if(null === status){ 
            var add_music_id = value;
            // for (var i = 0; i < records.length; i++) {
            //     var record = records[i];
            //     add_music_id = record.value;       
            // }
            if(null === add_music_id){  //没有id，就添加
                var wsRegions = null;
                var send_url = null;
             
                // data.attr('src', 'static/music/img/ze-like-1.svg'); // 替换为第二张图片的路径
                // data.removeAttr('title');
                var ret = set_heart_colour('red',data)
                if(!ret)
                    return;
                updateUnreadNum(1)

                wsRegions = g_wsRecordRegions;
                // if(0 === g_algo_run){
                //     return;
                // }
                // g_algo_run = 0;
                send_url = "/add_music/"
                

                var regions = wsRegions.getRegions();
                if (regions.length === 0) {
                    console.log("数组为空");
                    var audioDuration = g_recordwaveplaysurfer.getDuration();
                    wsRegions.addRegion({
                        start: 0,  // 开始于 0
                        end: audioDuration,  // 结束于音频的总长度
                        color: 'rgba(189, 49, 36, 0.36)',  // 选择一个颜色
                    });
                    regions = wsRegions.getRegions();
                }
                var region = regions[0]

                // 获取区域的开始和结束时间（以秒为单位）
                var startTimeInSeconds = region.start;
                var endTimeInSeconds = region.end;

                // 将时间转换为毫秒
                var startTimeInMilliseconds = startTimeInSeconds * 1000;
                var endTimeInMilliseconds = endTimeInSeconds * 1000;

                

                var xhr = new XMLHttpRequest();

                // 配置请求
                xhr.open('POST', send_url, true); // 第三个参数为true表示异步请求

                // 设置请求头，如果需要传递CSRF令牌，请确保在请求头中设置适当的CSRF令牌
                // xhr.setRequestHeader('X-CSRFToken', 'your-csrf-token'); // 替换为实际的CSRF令牌值

                // 添加事件处理程序，用于处理响应
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            // 请求成功
                            try {
                                console.log(xhr.responseText);
                                const response = JSON.parse(xhr.responseText);
                                console.log("add success");
                                console.log(response); // 打印出来看看
                                const musicId = response.music_id;
                                
                                //save_data(contains,'add_music_id',musicId)
                                g_add_music_id = musicId
                                
                                
                            } catch (e) {
                                console.error('Error parsing JSON:', e);
                                // 处理 JSON 解析错误
                                updateUnreadNum(-1)
                                set_heart_colour('white',data)
                            }

                        } else {
                            updateUnreadNum(-1)
                            set_heart_colour('white',data)
                            // 请求失败
                            console.error('Request failed with status:', xhr.status);
                            // 处理错误情况
                            alert('Request failed with status:'+xhr.status);
                        }
                    }
                };

                // 获取表单数据
                const formData = new FormData();
                
                formData.append('user_id', window.user_id);

                // var fileName = g_music_file_name; // 创建文件名
                formData.append('title', 'record');
                // formData.append('path', 'music/uploads/lshs.mp3');
                // formData.append('save_id',g_save_id);
                formData.append('algo_type',g_algo_type);
                formData.append('start_time',startTimeInMilliseconds);
                formData.append('end_time',endTimeInMilliseconds);
                // formData.append('play_time', 'your-play-time');
                // formData.append('score', 'your-score');
                
                
                // 设置CSRF token头部
                xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
                // 发送请求
                xhr.send(formData);
            }
            else{   //有id，就删除
                var ret = set_heart_colour('white',data)
                if(!ret){
                    return;
                }
                updateUnreadNum(-1)
                let csrftoken = getCookie('csrftoken')
                $.ajax({
                    url: '/del_music/' + add_music_id + '/', // 替换为实际的接口URL
                    headers: {
                        "X-CSRFToken": csrftoken  // 在这里设置 CSRF token
                    },
                    type: 'DELETE', // 根据接口要求设置请求类型
                    success: function(response) {
                    // 请求成功的回调函数
                        console.log('删除成功！'); // 替换为实际的处理逻辑
                        
                        //save_data(contains,'add_music_id',null)
                        g_add_music_id = null;
                        updateUnreadNum(1)
                        set_heart_colour('red',data)
                        
                    },
                    error: function(xhr, status, error) {
                        updateUnreadNum(1)
                        set_heart_colour('red',data)
                    // 请求失败的回调函数
                        console.log('删除失败：' + error); // 替换为实际的处理逻辑
                        alert('delete failed');
                    }
                });
            }

        }
        else{

        }
    }


  
    function handleRAddMusicBtn(type,algo_type,save_type){
        var data = $(this)
   
        // get_data_param(save_type,'add_music_id',read_record_add_data_callback,data,algo_type)
        
    }
    


    // function handleREditCleanBtn(){
    //     // this.off('click')
    //     if(g_record != null){
    //         if (g_record.isRecording()) {
    //             g_record.stopRecording()
    //         }
    //     }
        
    //     leavePage();
    //     enterToEdit();
    //     enterEditPage("memory");
    // }



    function handleREditBtn(){
        // this.off('click')
        if(g_record != null){
            if (g_record.isRecording()) {
                g_record.stopRecording()
            }
        }
        internalEnterRecordPage(true)
        leavePage();
        enterToEdit();
        g_isOpenRecordPage = false;
        enterEditPage("direct",false,g_record_blob,"record",'RECORDED',true);
        // (way, inRelase = false, up_music_blob = null, music_file_name = null, music_file_from_type = null,is_update = false)
    }

    // 获取当前日期并格式化
    function getFormattedDate() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始
        const day = String(now.getDate()).padStart(2, '0');
        return month + day; // 格式为MMDD
    }

    // 获取音频长度并格式化
    function getFormattedDuration(duration) {
        const seconds = Math.floor(duration);
        return String(seconds).padStart(4, '0'); // 格式为四位数
    }


    function handleRDownloadBtn(zip_file_url,duration){
        // // 创建一个<a>元素用于下载
        // const a = document.createElement('a');
        //  // 创建 Blob 对象的 URL
        // const midiUrl =  G_MEDIA_URL + g_all_midi_url;
        // console.log("midi_url "+midiUrl);
        // a.href = midiUrl;
        // // 提示用户选择下载目录
        // a.download = midiUrl.substr(midiUrl.lastIndexOf('/') + 1);
        // a.style.display = 'none'; // 这会确保链接不会在页面上显示
        // // a.style.display = 'none';
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);

        // // 创建第二个<a>元素用于下载第二个文件
        // const a2 = document.createElement('a');
        // const file2Url = G_MEDIA_URL + g_all_file_url; // 第二个文件的URL
        // a2.href = file2Url;
        // a2.download = file2Url.substr(file2Url.lastIndexOf('/') + 1);
        // a2.style.display = 'none';
        // document.body.appendChild(a2);
        // // 触发第二个文件的下载
        // a2.click();
        // // 移除第二个<a>元素
        // document.body.removeChild(a2);

        // 创建一个<a>元素用于下载
        // const a = document.createElement('a');
        //  // 创建 Blob 对象的 URL
        // const zipUrl =  G_MEDIA_URL + zip_file_url;
        // console.log("zip_url "+zipUrl);
        // a.href = zipUrl;
        // // 提示用户选择下载目录
        // a.download = zipUrl.substr(zipUrl.lastIndexOf('/') + 1);
        // a.style.display = 'none'; // 这会确保链接不会在页面上显示
        // // a.style.display = 'none';
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);

        const formattedDate = getFormattedDate();
        const formattedDuration = getFormattedDuration(duration);

        const filename = `hum_${formattedDate}_${formattedDuration}`;

        downloadFile(zip_file_url,filename)

    }


    function startSecondInterval() {
        return new Promise((resolve) => {
            let startTime = 0;
            // const stepTime = 0.01;
            const interval = 10; // 单位：毫秒

            const intervalId = setInterval(() => {
                if (startTime >= 1) {  // 如果到达或超过 100%，停止
                    clearInterval(intervalId);
                    resolve(); // 完成 Promise
                    return;
                }
                startTime ++;
            }, interval);
        });
    }

    async function upload_progress(){
        let startTime = 0.1;  // 初始位置，从 0% 开始
        let stepTime = 0.01;  // 步进，每次移动 1%
        let interval = 100;  // 每 100 毫秒更新一次

        // const intervalId = setInterval(() => {
        //     if (startTime >= 1) {  // 如果到达或超过 100%，停止
        //         g_waverecordsurfer.seekTo(0.999);
        //         clearInterval(intervalId);
        //         return;
        //     }
        //     g_waverecordsurfer.seekTo(startTime);
        //     startTime += stepTime;
        //     document.getElementById('record-timer').textContent = `${(startTime * 100).toFixed(2)}%`;
    
        // }, interval);

        while (startTime < 1) {
            // 这里插入你想执行的代码
            // startSecondInterval().then(() => {
            //     console.log("upload_progress Interval has finished, do something else now.");
            //     // 在这里执行其他操作
            // });
            await startSecondInterval();
            g_recordwaveplaysurfer.seekTo(startTime);
            startTime += stepTime;
            // console.log("upload_progress startTime",startTime);
            document.getElementById('record-timer').textContent = `${(startTime* 100).toFixed(2)}%`;
        }
        console.log("upload_progress finish");
    } 


    function create_play(blob = null,need_region = true) {

        try
        { 
            setStyleDisplay("moblie-btn-row","flex")
            setStyleDisplay("record-play-stop","block")
            setStyleDisplay("delete-record-btn","block")

            g_containerHeight = document.getElementById('record-mic').offsetHeight;

            var recordedUrl
            if (blob === null || blob === undefined) {
                recordedUrl = 'assets/audio/test.mp3'
            }
            else{
                recordedUrl = URL.createObjectURL(blob)
            }

            let audioContext = new (window.AudioContext || window.webkitAudioContext)();
                // 使用jQuery移除事件监听器
            // $(document).off('visibilitychange');
            
            //     // 使用jQuery添加事件监听器
            // $(document).on('visibilitychange', function() {
            //     if (document.visibilityState === 'visible') {
            //         if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
            //             audioContext.resume().then(() => {
            //                 console.log('Playback resumed successfully.');
            //                 // 在此处开始播放音频逻辑，如使用BufferSourceNode等
            //             }).catch(error => {
            //                 console.error('An error occurred while resuming audio context:', error);
            //             });
            //         }
            //     }
            // });
                
            const web_audio_player = new WebAudioPlayer(audioContext)
            web_audio_player.src = recordedUrl

            //   const container = document.querySelector('#recordings')
            const container = document.querySelector('#record-mic')

            const waveplaysurfer = WaveSurfer.create({
                container,
                waveColor: 'rgb(255, 255, 255)',
                progressColor: 'rgb(255, 255, 255)',
                // url: recordedUrl,
                media:web_audio_player,
                height: g_containerHeight,
                barHeight: g_barHeight,
                barWidth:4,
                barRadius:4,
                cursorColor:'rgb(255, 78, 0)',
                cursorWidth: 2,
                loop: false,

            })

            g_recordwaveplaysurfer = waveplaysurfer

              // 使用jQuery添加事件监听器
            $(document).on('visibilitychange', function() {
            if (document.visibilityState === 'visible') {
                if (audioContext.state === 'suspended' || audioContext.state === 'interrupted') {
                    audioContext.resume().then(() => {
                        console.log('record Playback resumed successfully.');
                        // 在此处开始播放音频逻辑，如使用BufferSourceNode等
                    }).catch(error => {
                        console.error('record An error occurred while resuming audio context:', error);
                    });
                }
            }
            });
            

            // waveplaysurfer.on('interaction', () => waveplaysurfer.playPause())
            waveplaysurfer.on('ready', function () {
                g_currentPlayPosition = 0;
                updatePlayTimeDisplay(g_currentPlayPosition)
            });

            const handlePlayformInteraction = createHandlePlayformInteraction(waveplaysurfer);
            waveplaysurfer.on('interaction', handlePlayformInteraction);


            const handlePlayformAudioprocess = createHandlePlayformAudioprocess(waveplaysurfer);
            g_handlePlayformAudioprocess = handlePlayformAudioprocess;
            waveplaysurfer.on('audioprocess', g_handlePlayformAudioprocess);

            const handlePlayformSeek = createHandlePlayformSeek(waveplaysurfer);
            waveplaysurfer.on('seeking', handlePlayformSeek);

            const handlePlayformClick = createHandlePlayformClick(waveplaysurfer);
            waveplaysurfer.on('click', handlePlayformClick);


            if(need_region){
                const wsRegions = waveplaysurfer.registerPlugin(RegionsPlugin.create({loop: false}))

                // wsRegions.enableDragSelection({
                //     color: 'rgba(255, 255, 255, 0.1)',            
                // })
                // waveplaysurfer.registerPlugin(TimelinePlugin.create())
                // waveplaysurfer.registerPlugin(Hover.create({
                //     lineColor: '#ff0000',
                //     lineWidth: 2,
                //     labelBackground: '#555',
                //     labelColor: '#fff',
                //     labelSize: '11px',
                // }))
                g_wsRecordRegions = wsRegions


                const handlePlayformRegioncreated = createHandlePlayformRegioncreated(wsRegions);
                wsRegions.on('region-created', handlePlayformRegioncreated);

                const handlePlayformRegionin = createHandlePlayformRegionin(wsRegions);
                wsRegions.on('region-in', handlePlayformRegionin);

                const handlePlayformRegionout = createHandlePlayformRegionout(waveplaysurfer);
                wsRegions.on('region-out', handlePlayformRegionout);

                const handlePlayformRegionclicked = createHandlePlayformRegionclicked(wsRegions);
                wsRegions.on('region-clicked', handlePlayformRegionclicked);

                waveplaysurfer.on('decode', () => {
                    // var audioDuration = waveplaysurfer.getDuration();
                    // g_wsRecordRegions.addRegion({
                    //     start: 0,  // 开始于 0
                    //     end: audioDuration,  // 结束于音频的总长度
                    //     color: 'rgba(189, 49, 36, 0.36)',  // 选择一个颜色
                    //     drag: false,
                    //     resize: true,
                    // })
                    var audioDuration = waveplaysurfer.getDuration();
                    const region1 = g_wsRecordRegions.addRegion({
                        id:'region_1',
                        start: 0,  // 开始于 0
                        end: 0,  // 结束于音频的总长度
                        color: "rgba(0, 0,0, 0.7)",  // 选择一个颜色
                        // waveColor: 'rgb(233, 157, 66, 0.3)',
                        drag: false,
                        resize: false,
                        // MouseEvent: false,
                    })

                    const region2 = g_wsRecordRegions.addRegion({
                        id:'region_2',
                        start: 0,  // 开始于 0
                        end: audioDuration,  // 结束于音频的总长度
                        color: "transparent",  // 选择一个颜色
                        // color:"rgba(100, 100,100, 0.5)",
                        // waveColor: 'rgb(233, 157, 66, 0.3)',
                        drag: false,
                        resize: true,
                        // MouseEvent: true,
                        minLength: 1,
                    })
                    var audioDuration = g_recordwaveplaysurfer.getDuration();
                    const region3 = g_wsRecordRegions.addRegion({
                        id:'region_3',
                        start: audioDuration,  // 开始于 0
                        end: audioDuration,  // 结束于音频的总长度
                        color: "rgba(0, 0,0, 0.7)",  // 选择一个颜色
                        // waveColor: 'rgb(233, 157, 66, 0.3)',
                        drag: false,
                        resize: false,
                        // MouseEvent: false,
                    })

                    region2.on('update_location', (start,end) => {
            

                        region1.setOptions({
                            id:'region_1',
                            start: 0,  // 开始于 0
                            end: start,  // 结束于音频的总长度
                            color: "rgba(0, 0,0, 0.7)",  // 选择一个颜色
                            // waveColor: 'rgb(233, 157, 66, 0.3)',
                            drag: false,
                            resize: false,
                        })

                        region3.setOptions({
                            id:'region_3',
                            start: end,  // 开始于 0
                            end: audioDuration,  // 结束于音频的总长度
                            color: "rgba(0, 0,0, 0.7)",  // 选择一个颜色
                            // waveColor: 'rgb(233, 157, 66, 0.3)',
                            drag: false,
                            resize: false,
                        })
                        
                    })


                });
            }

            
        } catch (err) {
            console.error("Error create_play:", err);
            alert("Error create_play:" + err.toString());
        }

    }

    function createHandlePlayformInteraction(waveplaysurfer) {
        return function () {
            // 在这里你可以访问传递过来的 waveplaysurfer
            console.log('createHandlePlayformInteraction');
            waveplaysurfer.playPause();
        };
    }

    function createHandlePlayformRegioncreated(wsRegions) {
        return function (region) {
            // 在这里你可以访问传递过来的 waveplaysurfer
            // console.log('createHandlePlayformRegioncreated', region.start, region.end);
            // // region.update({ loop: false });
            // var regions = wsRegions.getRegions();
            // if (regions.length > 1) {
            //     regions[0].remove();
            // }
            // region.update({ loop: false });
        };
    }



    function createHandlePlayformRegionin(wsRegions) {
        return function (region) {
            console.log('createHandlePlayformRegionin');
            g_activeRegion = region
        };
    }

    function createHandlePlayformRegionout(waveplaysurfer) {
        return function (region) {
            if(region.id === 'region_2'){
                g_recordwaveplaysurfer.pause()
            }

        };
    }

    function createHandlePlayformRegionclicked(wsRegions) {
        return function (region, e) {
            console.log('createHandlePlayformRegionclicked');
            e.stopPropagation() // prevent triggering a click on the waveform
            g_activeRegion = region
            region.play()
            // region.setOptions({ color: g_randomColor() })
        };
    }

    function createHandlePlayformAudioprocess(waveplaysurfer) {
        return function (currentTime) {
            // console.log("createHandlePlayformAudioprocess",currentTime);
            g_currentPlayPosition = currentTime;

            updatePlayTimeDisplay(g_currentPlayPosition);

            var btnPathElement = document.querySelector("#record-play-stop path");
            var mobileBtnPathElement = document.querySelector("#mobile-record-play-stop path");
            var elements = [];
            if (btnPathElement) {
                elements.push(btnPathElement);
            }
            if (mobileBtnPathElement) {
                elements.push(mobileBtnPathElement);
            }
            elements.forEach((element) => {
                // 对每个匹配的元素执行操作
                if (g_recordwaveplaysurfer.isPlaying()) {
                    // console.log('createHandlePlayformAudioprocess_playing')
                    // recButton.setAttribute('d', 'm493.022358,226.385079l-444.05468,-219.284511c-5.423082,-2.646765 -11.005666,-4.234825 -17.385762,-4.234825c-17.385762,0 -31.581475,11.910444 -31.581475,26.467654l-0.159502,0l0,455.243643l0.159502,0c0,14.55721 14.195714,26.467654 31.581475,26.467654c6.539598,0 11.96268,-1.852736 17.864269,-4.499501l443.576173,-219.019834c10.527158,-7.278605 17.226259,-18.262681 17.226259,-30.57014c0,-12.307459 -6.699101,-23.159197 -17.226259,-30.57014z'); // 更改回"播放"图标为暂停
                    // var btnPathElement = document.querySelector("#record-play-stop path");
                    element.setAttribute('d', 'M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z');
                    // recButton.textContent = 'stop'
                    return
                }
                // recButton.textContent = 'play'
                // console.log('createHandlePlayformAudioprocess_stop')
                // var btnPathElement = document.querySelector("#record-play-stop path");
                element.setAttribute('d', 'm11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'); // 更改回"暂停"图标为播放
            });

            // const recButton = document.querySelector('#record-play-stop')
            // var btnPathElement = document.querySelector("#record-play-stop path");
            // if (g_recordwaveplaysurfer.isPlaying()) {
            //     // console.log('createHandlePlayformAudioprocess_playing')
            //     // recButton.setAttribute('d', 'm493.022358,226.385079l-444.05468,-219.284511c-5.423082,-2.646765 -11.005666,-4.234825 -17.385762,-4.234825c-17.385762,0 -31.581475,11.910444 -31.581475,26.467654l-0.159502,0l0,455.243643l0.159502,0c0,14.55721 14.195714,26.467654 31.581475,26.467654c6.539598,0 11.96268,-1.852736 17.864269,-4.499501l443.576173,-219.019834c10.527158,-7.278605 17.226259,-18.262681 17.226259,-30.57014c0,-12.307459 -6.699101,-23.159197 -17.226259,-30.57014z'); // 更改回"播放"图标为暂停
            //     // var btnPathElement = document.querySelector("#record-play-stop path");
            //     btnPathElement.setAttribute('d', 'm493.022358,226.385079l-444.05468,-219.284511c-5.423082,-2.646765 -11.005666,-4.234825 -17.385762,-4.234825c-17.385762,0 -31.581475,11.910444 -31.581475,26.467654l-0.159502,0l0,455.243643l0.159502,0c0,14.55721 14.195714,26.467654 31.581475,26.467654c6.539598,0 11.96268,-1.852736 17.864269,-4.499501l443.576173,-219.019834c10.527158,-7.278605 17.226259,-18.262681 17.226259,-30.57014c0,-12.307459 -6.699101,-23.159197 -17.226259,-30.57014z');
            //     // recButton.textContent = 'stop'
            //     return
            // }
            // // recButton.textContent = 'play'
            // // console.log('createHandlePlayformAudioprocess_stop')
            // // var btnPathElement = document.querySelector("#record-play-stop path");
            // btnPathElement.setAttribute('d', 'm11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'); // 更改回"暂停"图标为播放

        }
    }

    function createHandlePlayformSeek(waveplaysurfer) {
        return function (currentTime) {
            console.log('currentTime', currentTime)
            g_currentSeekPosition = currentTime;
        }
    }

    function createHandlePlayformClick(waveplaysurfer) {
        return function (relativeX) {
            // console.log('createHandlePlayformClick')
            // const recButton = document.querySelector('#record-play-stop')
            // recButton.textContent = 'stop'

        }
    }

    // Buttons
    // {
        // Start recording
        // const recButton = document.querySelector('#record-play-stop')
        // recButton.onclick = () => {
    function handlePlayStopClick()
    {

        if (g_recordwaveplaysurfer.isPlaying()) {
            g_recordwaveplaysurfer.pause()
            // recButton.textContent = 'play'
            //   recButton.setAttribute('d', 'm493.022358,226.385079l-444.05468,-219.284511c-5.423082,-2.646765 -11.005666,-4.234825 -17.385762,-4.234825c-17.385762,0 -31.581475,11.910444 -31.581475,26.467654l-0.159502,0l0,455.243643l0.159502,0c0,14.55721 14.195714,26.467654 31.581475,26.467654c6.539598,0 11.96268,-1.852736 17.864269,-4.499501l443.576173,-219.019834c10.527158,-7.278605 17.226259,-18.262681 17.226259,-30.57014c0,-12.307459 -6.699101,-23.159197 -17.226259,-30.57014z'); // 更改回"播放"图标的 path 数据
            return
        }

        // var elements = document.querySelectorAll('[id$="edit-play-stop"]');
        // elements.forEach((element) => {
        //     // 对每个匹配的元素执行操作
        //     element = true
        // });

        var regions = g_wsRecordRegions.getRegions();
       
        var region = regions.find(region => region.id === 'region_2');

        if(region != null){
            var play_current_time = g_recordwaveplaysurfer.getCurrentTime()
            if((play_current_time < region.start) || (play_current_time > region.end)){
                region.play();
            }
            else{
                g_recordwaveplaysurfer.play()
            }

        }
        else{
            // g_waveplaysurfer.play().then(() => {
            //     // recButton.textContent = 'Stop'
            //     // elements.forEach((element) => {
            //     //     // 对每个匹配的元素执行操作
            //     //     element = false
            //     // });
            // })
            g_recordwaveplaysurfer.play()
        }






        // const recButton = document.querySelector('#record-play-stop')
        // if (g_recordwaveplaysurfer.isPlaying()) {
        //     g_recordwaveplaysurfer.pause()
        //     // recButton.textContent = 'play'
        //     //   recButton.setAttribute('d', 'm493.022358,226.385079l-444.05468,-219.284511c-5.423082,-2.646765 -11.005666,-4.234825 -17.385762,-4.234825c-17.385762,0 -31.581475,11.910444 -31.581475,26.467654l-0.159502,0l0,455.243643l0.159502,0c0,14.55721 14.195714,26.467654 31.581475,26.467654c6.539598,0 11.96268,-1.852736 17.864269,-4.499501l443.576173,-219.019834c10.527158,-7.278605 17.226259,-18.262681 17.226259,-30.57014c0,-12.307459 -6.699101,-23.159197 -17.226259,-30.57014z'); // 更改回"播放"图标的 path 数据
        //     return
        // }

        // var elements = document.querySelectorAll('[id$="record-play-stop"]');
        // elements.forEach((element) => {
        //     // 对每个匹配的元素执行操作
        //     element.disabled=true
        // });

        // g_recordwaveplaysurfer.play().then(() => {
        //     // recButton.textContent = 'Stop'
        //     elements.forEach((element) => {
        //         // 对每个匹配的元素执行操作
        //         element.disabled=false
        //     });
        // })
        // recButton.setAttribute('d', 'm11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z'); // 更改回"播放"图标的 path 数据
    }
    // }


    // delete Buttons
    function handleDeleteClick()
    {
        // Start recording
        // const delButton = document.querySelector('#delete-record-btn')
        // delButton.onclick = () => {
        // g_recordwaveplaysurfer.destroy()
        // init()
        // // location.reload();
        // var btn = document.getElementById('record');
        // btn.src = "static/music/img/t13.png"
        // // document.getElementById("record-play-stop").style.display = "none";
        // // document.getElementById("delete-record-btn").style.display = "none";
        // setStyleDisplay("record-play-stop","none")
        // setStyleDisplay("delete-record-btn","none")
        // g_currentPlayPosition = 0
        // g_currentSeekPosition = 0
        // stopRecordTimer()
        // }
        g_record_blob = null;
        //save_data("record","origin_blob",g_record_blob); 

        g_add_music_id = null;
        //save_data("record",'add_music_id',null)

        g_all_file_url = null;
        g_all_midi_url = null;

        //save_data("record","audio_url",null); 

        //save_data("record","midi_url",null); 
                        

        leavePage();
        enterRecordPage("direct",true);
    }

    function setStyleDisplay(id,type)
    {
        const elements = document.querySelectorAll(`[id$="${id}"]`);
        elements.forEach((element) => {
            // 对每个匹配的元素执行操作
            element.style.display=type
        });
    }


    // 格式化时间为 mm:ss 格式
    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 更新播放时间显示
    function updatePlayTimeDisplay(currentTime) {
        const totalTime = g_recordwaveplaysurfer.getDuration();
        var elements = document.querySelectorAll('[id$="record-timer"]');
        // elements.forEach((element) => {
        //     // 对每个匹配的元素执行操作
        //     element.textContent = `${formatTime(currentTime)}/${formatTime(totalTime)}`;
        // });

        elements.forEach((element) => {
            // 选择具有类名 `time-large` 的子元素并更新其内容
            var largeTimeElement = element.querySelector('.time-large');
            if (largeTimeElement) {
                largeTimeElement.textContent = formatTime(currentTime);
            }
        
            // 选择具有类名 `time-small` 的子元素并更新其内容
            var smallTimeElement = element.querySelector('.time-small');
            if (smallTimeElement) {
                smallTimeElement.textContent = formatTime(totalTime);
            }
        });

    }


})();

export const enterRecordPage = exports.enterRecordPage;
export const loadProcessedMusic = exports.loadProcessedMusic;
export const releaseRecordResource = exports.releaseRecordResource;
export const getOpenRecordPageStatus = exports.getOpenRecordPageStatus;
















