

let exports = {};

(function() {

    var g_swiper1 = null;
    var g_swiper2 = null

    exports.init_swiper = init_swiper;

    function init_swiper(){

        // if (g_swiper1) {
        //     g_swiper1.destroy();
        //     g_swiper1 = null;
        // }

        g_swiper1 = new Swiper(".mySwiper1", {
            // centeredSlides: true,
            // centeredSlidesBounds:true,
            // centerInsufficientSlides: true,
            slidesPerView: "auto",
            // spaceBetween: 30,
            on: {
                slideChange: function() {
                    const ids = ['e-collapse1', 'e-collapse2', 'e-collapse3', 'e-collapse4','e-collapse5','e-collapse6'];
                    ids.forEach(id => {
                        let collapseElem = document.getElementById(id);
                        if (collapseElem && collapseElem.classList.contains('show')) {
                            new bootstrap.Collapse(collapseElem).hide();
                        }
                    });
                }
            }
        });

        // if (g_swiper2) {
        //     g_swiper2.destroy();
        //     g_swiper2 = null;
        // }

        g_swiper2 = new Swiper(".mySwiper2", {
            // centeredSlides: true,
            // centeredSlidesBounds:true,
            // centerInsufficientSlides: true,
            slidesPerView: "auto",
            // spaceBetween: 30,
        });

        init_process();

    }

    


    

    function init_process(){

        // 选择多个具有类似命名的ID的元素
        var elements = $('#e-collapse1, #e-collapse2, #e-collapse3, #e-collapse4, #e-collapse5, #e-collapse6');

        // 监听展开事件
        elements.on('show.bs.collapse', function() {
            // 在这里执行你的代码，例如：
            // console.log('一个元素展开了！');
            // 检查#elementAbove是否存在
            if ($('#move-above').length > 0 && 
            $('#row-collapse-move').length > 0 &&
            $("[id*='move-below']").length > 0 &&
            $('#row-collapse-below').length > 0)  {
                // 计算上面元素和下面元素之间的距离
                var topElemBottom = $('#move-above').offset().top + $('#move-above').outerHeight();
                var bottomElemTop = $("[id*='move-below']").offset().top;
                var bottomRowTop = $('#row-collapse-below').offset().top;
                var middleElemTop = $('#row-collapse-move').offset().top;

                var middleElemMarginTop = $('#row-collapse-move').css('margin-top');
                if(middleElemMarginTop == '0px'){    
                    var gap = bottomElemTop - topElemBottom;
                    var littleGap = bottomElemTop - bottomRowTop;
                    // var middleYCoordinate = bottomElemTop + gap/2;
                    // 计算row的高度
                    // var rowHeight = $('#row-collapse-move').outerHeight();

                    // 计算row应该移动到的位置，使其位于gap的中心
                    var moveDistance = -(gap - 2 * littleGap);

                    // 使用上面的margin-top的方法将row移动到计算出的位置
                    $('#row-collapse-move').css('margin-top', moveDistance + 'px');
                }
            }
        });
    }

})();

export const init_swiper = exports.init_swiper;
