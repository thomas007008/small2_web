$(window).scroll(function () {
    document.querySelector('.navbar')
    var scrolled = $(window).pageYOffset || document.documentElement.scrollTop
    if (scrolled === 0) {
        $('.navbar').css('background', 'transparent')
        $('.navbar').css('backdrop-filter', 'blur(0px)')
    } else {
        $('.navbar').css('background', 'rgba(0,0,0,0.8)')
        $('.navbar').css('backdrop-filter', 'blur(5px)')
    }
})

var elements = document.getElementsByClassName('p_content_class');
if (elements.length > 0) {
    var p_container = elements[0];
    // var p_container = document.getElementsByClassName('p_content_class')[0]
    $(p_container).scroll(updateNavbarBackground)
    // Run the function once at page load
    $(p_container).ready(updateNavbarBackground)
} else {
    console.log('No elements with class name "p_content_class" found');
}



function updateNavbarBackground() {
    var scrolled = p_container.scrollTop
    if (scrolled === 0) {
        $('.navbar').css('background', 'transparent')
        $('.navbar').css('backdrop-filter', 'blur(0px)')
    } else {
        $('.navbar').css('background', 'rgba(0,0,0,0.8)')
        $('.navbar').css('backdrop-filter', 'blur(5px)')
    }
}



// Run specific setting at page load
$(document).ready(function () {
    $('.navbar').css('background', 'transparent')
    $('.navbar').css('backdrop-filter', 'blur(0px)')
})

$(document).ready(function () {
    $('.dropdown').on('show.bs.dropdown', function () {
        $(this).find('.dropdown-menu').first().stop(true, true).slideDown(200)
        $('dropdown-menu').css('padding-top', '10px')
        // $("dropdown-menu").css('width', '120px');
    })

    $('.dropdown').on('hide.bs.dropdown', function () {
        $(this).find('.dropdown-menu').first().stop(true, true).slideUp(200)
        $('dropdown-menu').css('padding-top', '0px')
    })
})
// // Ensure the page is fully loaded before running the script
// document.addEventListener('DOMContentLoaded', function() {
//   // Get the viewport height and convert it to pixels
// let viewportHeight = window.innerHeight + 'px';

// // Set the body height to the viewport height
// document.body.style.height = viewportHeight;
// });

var initialViewportHeight = window.innerHeight

// window.addEventListener('resize', function() {
//     // if(window.innerHeight <= initialViewportHeight) {
//         document.body.style.height = initialViewportHeight + 'px';
//     // } else {
//     //     document.body.style.height = '100%';
//     // }
// });

setTimeout(function () {
    let viewheight = $(window).height()
    let viewwidth = $(window).width()
    let viewport = document.querySelector('meta[name=viewport]')
    viewport.setAttribute(
        'content',
        'height=' +
            viewheight +
            'px, width=' +
            viewwidth +
            'px, initial-scale=1.0'
    )
}, 300)

// $(document).ready(function() {
//     // 初始化Tooltip为手动触发
//     $('[data-toggle="tooltip"]').tooltip({
//         trigger: 'manual'
//     });

//     // 显示tooltip
//     $('#buttonInput').tooltip('show');
// });

$(document).ready(function () {
    const errorMsgText = document.getElementById('errorMsg')
    if (errorMsgText) {
        $('#errorMsg').show() // 使用 jQuery 的 show 方法显示错误消息
    }
})

// function validatePassword() {
//     var password = document.getElementById("passwordInput").value;
//     var feedback = document.getElementById("feedback");

//     // 正则表达式验证
//     var hasNumber = /[0-9]/.test(password);
//     var hasLetter = /[a-zA-Z]/.test(password);
//     var hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
//     var haslength8 = password.length;

//     if (!hasNumber) {
//         feedback.textContent = "password must contains at least one number";
//         return;
//     }

//     if (!hasLetter) {
//         feedback.textContent = "password must contain at least one letter";
//         return;
//     }

//     if (!hasSymbol) {
//         feedback.textContent = "password must contain at least one letter";
//         return;
//     }

//     if(haslength8 < 8){
//         feedback.textContent = "password must be at least 8 characters long";
//         return;
//     }
//     feedback.textContent = "密码有效！";
// }

// const passwordInput = document.getElementById("password");
// const lengthReq = document.getElementById("length");
// const uppercaseReq = document.getElementById("uppercase");
// const lowercaseReq = document.getElementById("lowercase");
// const numberReq = document.getElementById("number");

// passwordInput.addEventListener("input", function() {
//     const passwordValue = passwordInput.value;

//     // Check length
//     if (passwordValue.length >= 8) {
//         lengthReq.classList.remove("invalid");
//         lengthReq.classList.add("valid");
//     } else {
//         lengthReq.classList.remove("valid");
//         lengthReq.classList.add("invalid");
//     }

//     // Check uppercase letter
//     if (/[A-Z]/.test(passwordValue)) {
//         uppercaseReq.classList.remove("invalid");
//         uppercaseReq.classList.add("valid");
//     } else {
//         uppercaseReq.classList.remove("valid");
//         uppercaseReq.classList.add("invalid");
//     }

//     // Check lowercase letter
//     if (/[a-z]/.test(passwordValue)) {
//         lowercaseReq.classList.remove("invalid");
//         lowercaseReq.classList.add("valid");
//     } else {
//         lowercaseReq.classList.remove("valid");
//         lowercaseReq.classList.add("invalid");
//     }

//     // Check number
//     if (/[0-9]/.test(passwordValue)) {
//         numberReq.classList.remove("invalid");
//         numberReq.classList.add("valid");
//     } else {
//         numberReq.classList.remove("valid");
//         numberReq.classList.add("invalid");
//     }
// });

// function validatePassword() {
//     var password = document.getElementById("password").value;
//     var message = "";

//     // Check length
//     if (password.length < 8) {
//         message += "At least 8 characters. ";
//     }

//     // Check for a number
//     if (!/[0-9]/.test(password)) {
//         message += "1 number. ";
//     }

//     // Check for an uppercase letter
//     if (!/[A-Z]/.test(password)) {
//         message += "1 uppercase letter. ";
//     }

//     // Check for a lowercase letter
//     if (!/[a-z]/.test(password)) {
//         message += "1 lowercase letter. ";
//     }

//     // Check for a symbol
//     var specialCharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
//     if (!specialCharacters.test(password)) {
//         message += "1 symbol. ";
//     }

//     var validationMessage = document.getElementById("passwordValidation");
//     validationMessage.innerHTML = message;
// }

$(document).ready(function () {
    $('[data-toggle="popover"]').popover() // 初始化所有具有 popover 功能的元素

    $('#password').popover({
        trigger: 'focus' // 指定当输入框获得焦点时显示
    })

    $('#password').on('keyup', function () {
        var password = $(this).val()
        // 这里您可以添加密码验证逻辑
        if (password.length < 8) {
            $(this).attr('data-content', '密码长度应该大于或等于8位。')
            $(this).popover('show')
        } else {
            $(this).popover('hide')
        }
    })
})

function onCaptchaSuccess() {
    var captchaElement = document.querySelector('.h-captcha')
    captchaElement.style.display = 'none'
}

$(document).ready(function () {
    // $(document).on('click', '#mybutton', function(){
    $('.debouncing-form').submit(function (e) {
        // console.log("cccccccccclick");
        var btn = $('.debouncing-button')
        var debounceTime = btn.attr('id') === 'btnCaptchaId' ? 10000 : 2000 // 如果id是btnCaptchaId则时间是10秒，否则是2秒

        btn.prop('disabled', true) // 禁用按钮

        setTimeout(function () {
            btn.prop('disabled', false) // 一段时间后再启用按钮
        }, debounceTime)
    })
})

/*
$(document).ready(function () {
  var isClicked = false;
  if (userIsAuthenticated) {
    $('.btn-user').hover(
      function () {
        $.ajax({
          url: 'small-user-func.html',
          success: function (data) {
            console.log("Ajax request succeeded.");
            var content = $('<div>').addClass('hover-content').html(data).appendTo('.btn-user');
            // content.click(function(event) {
            //   event.stopPropagation();
            //   // event.preventDefault();  // 阻止默认行为
            //   // isClicked = true;
            //  });

            // Add a new hover event to the pop-up content
            content.hover(
              function () {
                // When the mouse enters the pop-up, remove the 'hover-out' class
                $(this).removeClass('hover-out');
              },
              function () {
                if (!isClicked) {
                  // When the mouse leaves the pop-up, add the 'hover-out' class
                  $(this).addClass('hover-out');

                  // After a short delay, remove the pop-up if it still has the 'hover-out' class
                  var _this = $(this);
                  setTimeout(function () {
                    if (_this.hasClass('hover-out')) {
                      _this.remove();
                    }
                  }, 300);   // delay in milliseconds
                }
              }
            );
          },
          error: function (xhr, status, error) {
            console.log("Ajax request failed. Status: " + status + ", Error: " + error);
          },
          complete: function () {
            console.log("Ajax request completed.");
          }
        });
      },
      function () {
        if (!isClicked) {
          // When the mouse leaves the button, add the 'hover-out' class to the pop-up
          $('.hover-content').addClass('hover-out');

          // After a short delay, remove the pop-up if it still has the 'hover-out' class
          setTimeout(function () {
            if ($('.hover-content').hasClass('hover-out')) {
              $('.hover-content').remove();
            }
          }, 300);   // delay in milliseconds
        }
      }
    );
  }
});
*/


export function isMobileDevice() {
    // return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    return window.innerWidth <= 991
}

export function getSessionId() {
    // 获取所有的 cookies
    var sessionId
    let csrftoken = getCookie('csrftoken')
    $.ajax({
        headers: {
            'X-CSRFToken': csrftoken // 在这里设置 CSRF token
        },
        url: '/get_session_key/', // 替换为您的后端视图 URL
        method: 'GET',
        async: false, // 设置为同步
        success: function (response) {
            sessionId = response.session_key
            console.log('Session Key:', sessionId)
            // 在这里使用 sessionKey 做其他操作
        },
        error: function (error) {
            console.error('Error fetching session key:', error)
        }
    })
    return sessionId
}



export function navDetectPhoneOrComputer(){
    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    var isiPad = /iPad/i.test(navigator.userAgent);
    var isSafari = /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent);

    var isLandscape = window.matchMedia("(orientation: landscape)").matches;
    var width = $(window).width();

    if (isiPad || isSafari) {
        // 检测横屏模式
        if (isLandscape || width > 991) {
            // iPad横屏时，认为是电脑模式
            return 'computer'
        } else {
            // iPad竖屏时，认为是移动设备模式
            return 'phone'
        }
    } else if (isMobile) {
        return 'phone'
    } else {
        return 'computer'
    }
}


// 添加到全局
window.navDetectPhoneOrComputer = navDetectPhoneOrComputer;



function handleCredentialResponse(response) {
    console.log("Encoded JWT ID token: " + response.credential);
    // var base64Url = response.credential.split('.')[1];
    // var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    // var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
    //     return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    // }).join(''));
    // console.log(jsonPayload)
    // return JSON.parse(jsonPayload);

    // 创建包含 setJSON 和 user_id 的数据对象
    const requestData = {
        token: response.credential
    }

    let csrftoken = getCookie('csrftoken')

    $.ajax({
        url: '/process_google_login/',
        type: 'POST',
        data: JSON.stringify(requestData), // 将整个对象作为 JSON 字符串发送
        headers: {
            'X-CSRFToken': csrftoken // 在这里设置 CSRF token
        },
        contentType: 'application/json', // 设置请求的内容类型为 JSON
        success: function (response) {
            // WebSocket will handle this part
            // if(data.ret === 'success'){
                // 跳转到 /tools.html
                console.log("pre to tools.html");
                var type = navDetectPhoneOrComputer();

                // 检测移动设备的一些常见标识
                if (type === 'phone') {
                    // 如果是移动设备，设置链接为 m-tools.html
                    window.location.href = '/m-tools.html';
                } else {
                    // 如果是非移动设备，设置链接为 tools.html
                    window.location.href = '/tools.html';
                }
                console.log("to tools.html");
            // }
          
        },
        error: function (jqXHR, textStatus, errorThrown) {
            // 处理错误
            console.log('AJAX 请求出错：' + textStatus)
            console.log('错误详情：' + errorThrown)

            // 在页面上显示错误消息
            alert('error:' + textStatus)
        }
    })


}
      




// 定义一个变量来存储setTimeout返回的定时器ID
var g_hoverOutTimer;

$(document).ready(function () {
    var isClicked = false

    var in_mouse_time = 0;
    var out_mouse_time = 0;


    

    var pathname = window.location.pathname;  // 获取URL的路径部分
    if (pathname.includes("index") || pathname === "/" || pathname === ""){
        $("#nav-blog-link-3").addClass("nav-link-click")
    }
    else if(pathname.includes("tools")){
        $("#nav-blog-link-4").addClass("nav-link-click")
    }
    else if(pathname.includes("blog")){    
        $("#nav-blog-link-2").addClass("nav-link-click")
    }
    else if(pathname.includes("about")){    
        $("#nav-about-link-2").addClass("nav-link-click")
    }
    else if(pathname.includes("tools")){
        $("#nav-user-link-2").addClass("nav-link-click")
    }


    setInterval(function() {
        // 选择 #nav-dropdown-2 的所有子孙元素
        var descendants = $("#nav-dropdown-2").find('*');

        // 检测任何一个子孙元素是否含有 'show' 类
        var hasShow = descendants.hasClass('show');
        if(hasShow){
            $("#dropdown-trigger-2").addClass("nav-link-click");
        }
        else{
            $("#dropdown-trigger-2").removeClass("nav-link-click") 
        }
    },100)

    if (userIsAuthenticated) {
        if (isMobileDevice()) {
            // 手机浏览器的逻辑
            $.ajax({
                // url: 'small-user-func.html',
                success: function (data) {
                    // 将内容直接显示在nav上
                    // 你需要指定一个nav的选择器，例如#navbar
                    // $('.navcol-class .btn').after('<p class="nav-collapse-type d-flex flex-row justify-content-end small-page-p" style="margin: 0px;padding: 0px;">' + availableTime + '</p>');
                    // $('.navcol-class #nav-user-link-2').after('<p class="nav-collapse-type d-flex flex-row justify-content-end small-page-p" style="margin: 0px;padding: 0px;">' + currentUserEmail + '</p>');
                    // $('.navcol-class #nav-user-link-2').next().after('<form action="' + logout_url + '" method="post">' + csrf_token + '<button class="btn btn-primary nav-collapse-type d-sm-flex justify-content-sm-end" style="background: transparent;border-style: none;" type="submit">Log Out</button></form>');
                    var containerDiv = $('<div>')
                        .addClass(
                            'd-flex align-items-center justify-content-between'
                        )
                        .css({
                            'font-family':
                                '"PingFang SC", "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif'
                        })

                    var displayText =
                    currentUserProcessedEmail.length > 30
                            ? currentUserProcessedEmail.substring(0, 30) + '...'
                            : currentUserProcessedEmail
                    // 创建 p 元素
                    var pElement = $('<p>')
                        .addClass(
                            'nav-collapse-type d-flex flex-row justify-content-end small-page-p'
                        )
                        .css({
                            margin: '0px',
                            padding: '0px',
                            'font-family':
                                '"PingFang SC", "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif'
                        })
                        .text(displayText)

                    // 创建 form 元素
                    var formElement = $('<form>')
                        .attr('action', logout_url)
                        .attr('method', 'post')
                        .html(
                            csrf_token +
                                '<button class="btn btn-primary nav-link nav-collapse-type log-style d-sm-flex justify-content-sm-end " style="font-family:"PingFang SC", "Helvetica Neue", Helvetica, "Segoe UI", Arial, sans-serif;" type="submit">Log Out</button>'
                        )

                    // 将 p 和 form 元素追加到容器 div
                    containerDiv.append(pElement).append(formElement)
                    // containerDiv.append(formElement)
                    // 将容器 div 插入到目标位置
                    $('.navcol-class #nav-dropdown-2').after(containerDiv)

                    $('.small-page-p').on('click', function (event) {
                        event.preventDefault()
                        console.log(event)
                        event.stopPropagation()
                    })
                },
                error: function (xhr, status, error) {
                    console.log(
                        'Ajax request failed. Status: ' +
                            status +
                            ', Error: ' +
                            error
                    )
                }
            })
        } else {
            $('.btn-user').off('mouseenter mouseleave').hover(
                function () {
                    $.ajax({
                        url: 'small-user-func.html',
                        success: function (data) {
                            console.log('Ajax request succeeded.')
                            var content = $('<div>')
                                .attr('id', 'user-page-id')
                                .addClass('hover-content')
                                .css('min-width', '400px')
                                .html(data)
                                .appendTo('.btn-user')
                            // content.click(function(event) {
                            //   event.stopPropagation();
                            //   // event.preventDefault();  // 阻止默认行为
                            //   // isClicked = true;
                            //  });
                            // 防止点击.hover-content导致事件冒泡到document

                            in_mouse_time = Date.now();

                            $('.hover-content').on('click', function (event) {
                                event.preventDefault()
                                console.log(event)
                                event.stopPropagation()
                            })

                            $('.small-page-button').on(
                                'click',
                                function (event) {
                                    // event.preventDefault();
                                    console.log(event)
                                    event.stopPropagation()
                                }
                            )

                            // 监听整个文档的点击
                            $(document).on('click', function (event) {
                                console.log(event)
                                var $target = $(event.target)
                                if (
                                    !$target.closest('.hover-content').length &&
                                    !$target.closest('.btn-user').length
                                ) {
                                    // 点击发生在.hover-content和.btn-user之外
                                    $('.hover-content').remove()
                                }
                            })
                            // Add a new hover event to the pop-up content
                            // content.hover(
                            //     function () {
                            //         // When the mouse enters the pop-up, remove the 'hover-out' class
                            //         $(this).removeClass('hover-out')
							// 		clearTimeout(g_hoverOutTimer)
                            //     },
                            //     function () {
                            //         if (!isClicked) {
                            //             // When the mouse leaves the pop-up, add the 'hover-out' class
                            //             $(this).addClass('hover-out')

							// 			clearTimeout(g_hoverOutTimer)

                            //             // After a short delay, remove the pop-up if it still has the 'hover-out' class
                            //             var _this = $(this)
                            //             g_hoverOutTimer = setTimeout(function () {
                            //                 if (_this.hasClass('hover-out')) {
                            //                     _this.remove()
                            //                 }
                            //             }, 300) // delay in milliseconds
                            //         }
                            //     }
                            // )
                        },
                        error: function (xhr, status, error) {
                            console.log(
                                'Ajax request failed. Status: ' +
                                    status +
                                    ', Error: ' +
                                    error
                            )
                        },
                        complete: function () {
                            console.log('Ajax request completed.')
                        }
                    })
                },
                function () {
                    // if (!isClicked) {
                    //     // When the mouse leaves the button, add the 'hover-out' class to the pop-up
                    //     $('.hover-content').addClass('hover-out')

                    //     // After a short delay, remove the pop-up if it still has the 'hover-out' class
                    //     setTimeout(function () {
                    //         if ($('.hover-content').hasClass('hover-out')) {
                    //             $('.hover-content').remove()
                    //         }
                    //     }, 300) // delay in milliseconds
                    // }
                    // console.log('.hover-content_remove')
                    // $('.hover-content').remove()

                }
            )
        }
    }

    let mouseX = 0; // 存储鼠标 X 坐标
    let mouseY = 0; // 存储鼠标 Y 坐标

    $(document).mousemove(function(event) {

        mouseX = event.clientX; // 更新鼠标 X 坐标
        mouseY = event.clientY; // 更新鼠标 Y 坐标

    });

    setInterval(function() {
        var $el = $('#user-page-id'); // 使用 jQuery 选择器获取元素

        var has_el = false;
        // 检查元素是否存在
        if ($el.length > 0) {
            has_el = true
        } else {
            has_el = false;
        }

        var inside = false
        if(has_el){
            var rect = $el[0].getBoundingClientRect(); // 获取边界位置

            // 检查鼠标位置是否在元素内部
            inside = (
                mouseX >= rect.left &&
                mouseX <= rect.right &&
                mouseY >= rect.top &&
                mouseY <= rect.bottom
            );
        }

        if(!inside){
            var $nav_el = $('#nav-user-link-2');
            if ($nav_el.length > 0) {
                var rect = $nav_el[0].getBoundingClientRect(); // 获取边界位置
                // 检查鼠标位置是否在元素内部
                inside = (
                    mouseX >= rect.left &&
                    mouseX <= rect.right &&
                    mouseY >= rect.top &&
                    mouseY <= rect.bottom
                );
            }
        }
          
        if (!inside) {
            out_mouse_time = Date.now();
            // console.log('鼠标在元素外面',out_mouse_time);
        } else {
            in_mouse_time = Date.now();
            // console.log('鼠标在元素里面',in_mouse_time);
        }
        // 计算时间差
        var timeDiff = out_mouse_time - in_mouse_time;
        if (timeDiff > 1000) {
            // console.log('.hover-content_remove',timeDiff)
            $('.hover-content').remove()
        }
        // 这里可以添加其他基于鼠标位置的逻辑
    }, 100); // 每1000毫秒

    // var type = navDetectPhoneOrComputer();
    // // var linkElement = $('#nav-blog-link-4');  // 使用 jQuery 选择器获取链接元素

    // // 检测移动设备的一些常见标识
    // if (type === 'phone') {
    //     if (window.location.href.indexOf('m-tools.html') === -1)
    //     // 如果是移动设备，设置链接为 m-tools.html
    //         window.location.href = '/m-tools.html';
    // } else {
    //     if (window.location.href.indexOf('tools.html') === -1)
    //         // 如果是非移动设备，设置链接为 tools.html
    //         window.location.href = '/tools.html';
    // }


})

// 在页面加载时启动倒计时
$(document).ready(function () {
    startCountdown()
})

var countdown
var initialTime = 60 // 时间设为60秒

function startCountdown() {
    var currentTime = initialTime

    // 清除已存在的计时器
    if (countdown) {
        clearInterval(countdown)
    }

    // 更新链接文本并禁用它，以防止在倒计时时重复点击
    $('#countdownLink').text(currentTime).off('click')

    countdown = setInterval(function () {
        currentTime--
        $('#countdownLink').text(currentTime)

        if (currentTime <= 0) {
            clearInterval(countdown)
            $('#countdownLink')
                .off('click')
                .text('resend code')
                .on('click', function () {
                    var actionType = $(this).data('action')
                    send_email(actionType)
                    // 这里可以添加其他逻辑，例如向服务器发送请求，重新发送邮件等。
                    startCountdown()
                    return false // 阻止默认的<a>标签点击行为
                })
        }
    }, 1000)
}

function send_email(type) {
    // $('#countdownLink').click(function() {
    $.ajax({
        url: '/send-email/' + type, // 请根据实际的URL配置进行调整
        method: 'GET', // 或者其他适当的HTTP方法
        success: function (response) {
            if (response.status === 'success') {
                startCountdown()
            } else {
                alert(
                    `There was an ${response.status} error sending the email.`
                )
            }
        },
        error: function (error) {
            alert('There was an error sending the email.')
        }
    })
    return false // 阻止默认的<a>标签点击行为
    // });
}

// 在页面加载时启动倒计时
$(document).ready(function () {
    startCountdown()
})

document.addEventListener('DOMContentLoaded', function () {
    const inputElement = document.querySelector('.e-duration-input')

    if (inputElement) {
        // 检查元素是否存在
        inputElement.addEventListener('input', function (e) {
            // let cursorPosition = e.target.selectionStart;

            e.target.value = e.target.value.replace(/[^0-9]/g, '')

            // 如果输入不为空，则在数字后加上 " seconds"
            //             if (e.target.value) {
            //                 e.target.value += ' seconds';
            //             }

            //             // 重新设置光标位置，这里可能需要进行适当的调整以适应你的需求
            //             e.target.setSelectionRange(cursorPosition, cursorPosition);
        })
    }
})

// document.getElementById('carouselExampleFade').addEventListener('slide.bs.carousel', function () {

//   const ids = ['e-collapse1', 'e-collapse2', 'e-collapse3', 'e-collapse4','e-collapse5','e-collapse6'];
//   ids.forEach(id => {
//       let collapseElem = document.getElementById(id);
//       if (collapseElem && collapseElem.classList.contains('show')) {
//           new bootstrap.Collapse(collapseElem).hide();
//       }
//   });

// });
