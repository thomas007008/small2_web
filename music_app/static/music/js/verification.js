// import {openUserDatabase} from'./indexdb_process.mjs'
// import {getSessionId} from'./navbar.js'

// import { isMobileDevice } from "./navbar";

// import {navDetectPhoneOrComputer} from './navbar.js'

function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}


// document.getElementById('formCaptchaId').addEventListener('submit', function(event) {
//     console.log("login submit");
//     event.preventDefault(); // 阻止默认的表单提交行为
    
//     // 创建 XMLHttpRequest 对象
    
    
// });


// 定义回调函数
function callback(res) {
    // 第一个参数传入回调结果，结果如下：
    // ret         Int       验证结果，0：验证成功。2：用户主动关闭验证码。
    // ticket      String    验证成功的票据，当且仅当 ret = 0 时 ticket 有值。
    // CaptchaAppId       String    验证码应用ID。
    // bizState    Any       自定义透传参数。
    // randstr     String    本次验证的随机串，后续票据校验时需传递该参数。
    // console.log('callback:', res);
    // var btn = $('.debouncing-button');
    // console.log("222Is button disabled?:", btn.prop('disabled'));
    // res（用户主动关闭验证码）= {ret: 2, ticket: null}
    // res（验证成功） = {ret: 0, ticket: "String", randstr: "String"}
    // res（请求验证码发生错误，验证码自动返回terror_前缀的容灾票据） = {ret: 0, ticket: "String", randstr: "String",  errorCode: Number, errorMessage: "String"}
    // 此处代码仅为验证结果的展示示例，真实业务接入，建议基于ticket和errorCode情况做不同的业务处理

    var errorCode = -3;
    var errorMessage = "Verification code internal error.";  // or null
    var randstr = "";       // or null
    var ticket = "";        // or null

    if (res.ret === 0) {
        //根据errorCode情况做特殊处理
        if('errorCode' in res && res.errorCode != 0)
        {
            //自定义容灾逻辑（例如跳过这次验证）
            errorCode = res.errorCode;
            errorMessage = res.errorMessage;
        }
        else
        {
            randstr = res.randstr;
            ticket = res.ticket;
            errorCode = 0;
            errorMessage = 'success';
        } 
    }
    else
    {
        errorCode = res.ret;
        errorMessage = retmsg;

    }

    document.getElementById('ticketInput').value = ticket;
    document.getElementById('randstrInput').value = randstr;
    document.getElementById('errorCodeInput').value = errorCode;
    document.getElementById('errorMessageInput').value = errorMessage;

    console.log("verification callback");

    var form = document.getElementById('formCaptchaId');

    

    var xhr = new XMLHttpRequest();
    
    // 配置请求
    xhr.open('POST', 'regist-login.html', false); // 第三个参数设置为 false 表示同步请求
    
    xhr.setRequestHeader('X-CSRFToken', getCookie('csrftoken'));
    // 设置请求头
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    // 构建表单数据
    var formData = new FormData(form);

    // 将 FormData 对象转换为 URL 编码的字符串
    var formQueryString = new URLSearchParams(formData).toString();
    console.log("login");
    // 发送请求
    xhr.send(formQueryString);
    
    console.log("login send");
    
    // 检查响应状态
    if (xhr.status === 200) {
      // 响应成功
      var data = JSON.parse(xhr.responseText);
      // 从响应中提取 token
    //   const token = data.token;
      
    //   // 存储 token 到 Local Storage
    //   if (token) {
    //     console.log("login ret has token");
    //     localStorage.setItem('token', token);
    //     openUserDatabase(getSessionId());
    //   }
        // console.log("pre openUserDatabase");
        // openUserDatabase(getSessionId());
        if(data.ret === 'success'){
            // 跳转到 /tools.html
            console.log("pre to tools.html");

            var type = navDetectPhoneOrComputer();
            // var type = isMobileDevice()

            // 检测移动设备的一些常见标识
            if (type === 'phone') {
                // 如果是移动设备，设置链接为 m-tools.html
                window.location.href = '/m-tools.html';
            } else {
                // 如果是非移动设备，设置链接为 tools.html
                window.location.href = '/tools.html';
            }



            
            console.log("to tools.html");
        }
        else if(data.ret === 'regist_confirm'){
            console.log("regist_confirm");
            window.location.href = '/regist-confirm.html';
        }
        else{
            console.log("login_failed",data.ret);
            displayErrorMessage(data.ret);
        }
      
      
      // 其他自定义处理
    } else {
      // 处理错误
        console.log("login_net_error_code",xhr.status);
        displayErrorMessage("login_net_error_code"+xhr.status);
    }

}


// 定义验证码js加载错误处理函数
function loadErrorCallback() {
    var appid = '192641889';
    // 生成容灾票据或自行做其它处理
    var ticket = 'terror_1001_' + appid + '_' + Math.floor(new Date().getTime() / 1000);
    callback({
        ret: 0,
        randstr: '@'+ Math.random().toString(36).substr(2),
        ticket: ticket,
        errorCode: 1001,
        errorMessage: 'jsload_error'
    });
    }


// 定义验证码触发事件
window.addEventListener('load', function(){
    var btn = document.getElementById('btnCaptchaId');
    if(btn){
        btn.onclick = function(event){
            event.preventDefault(); 
            try {
                    // 生成一个验证码对象
                    // CaptchaAppId：登录验证码控制台，从【验证管理】页面进行查看。如果未创建过验证，请先新建验证。注意：不可使用客户端类型为小程序的CaptchaAppId，会导致数据统计错误。
                    // callback：定义的回调函数
                    console.log('click');
                    
                    // console.log("000Is button disabled?:", btn.prop('disabled'));
                    btn.disabled = true;  // 禁用按钮
                    $('#google_log_btn').prop('disabled', true);
                    setTimeout(function () {
                        btn.disabled = false; // 一段时间后再启用按钮
                        $('#google_log_btn').prop('disabled', false);
                    }, 10000);
                    var captcha = new TencentCaptcha('192641889', callback, {});
                    
                    // console.log("111Is button disabled?:", btn.prop('disabled'));
                    // 调用方法，显示验证码
                    captcha.show(); 
                    console.log('click out');
            } catch (error) {
            // 加载异常，调用验证码js加载错误处理函数
                    loadErrorCallback();
            }
        }
    }
    
});



function displayErrorMessage(message) {
    let errorMsgDiv = document.getElementById('errorMsg');
    errorMsgDiv.innerHTML = message;
    errorMsgDiv.style.display = 'block'; // Show the error message div
}

function hideErrorMessage() {
    let errorMsgDiv = document.getElementById('errorMsg');
    errorMsgDiv.style.display = 'none'; // Hide the error message div
}