JFlow
=============

JavaScript任务执行库。

Example 1：
-------------
    var qr = new jf.Qr();
    qr.log('start').ts().wait(1000).log('end').ts();

+ 结果      
start  
2015/8/22 1:17:0.591  
end  
2015/8/22 1:17:1.592  

Example 2：
-------------
    var qr = new jf.Qr();
    qr.exec(function(cb) {
        var x = 3;
        var y = 4;
        cb(x + y);
    }).sync(function(r) {
        console.log('sum: ' + r);
    });

+ 结果:      
sum: 7    

Example 3：
-------------
    exec(function(cb) {
        jQuery.get('manxisuo/JFlow', function(resp){
            cb(resp.length);
        });
    }).log(function(r) {
        return 'length of resp: ' + r;
    });

+ 结果:      
length of resp: 45388  

Example 4：
-------------
    var box = document.getElementById('box');
    
    function fn() {
        qr.exec(function(cb, n) {
            if (n === undefined) {
                n = 1;
            }
    
            n = n + 0.05;
    
            box.style.left = (Math.cos(n) * 50 + 200) + 'px';
            box.style.top = (Math.sin(n) * 50 + 100) + 'px';
            cb(n);
        });
    
        qr.sleep(20);
    
        qr.sync(function(r) {
            fn();
        });
    }
    
    fn();

+ 结果:      
页面显式一个转圈的元素  









