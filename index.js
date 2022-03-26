function Mine(tr, td, mineNum) {
    this.tr = tr;
    this.td = td; //模式确定了行、单元格数量，交由用户确定
    this.mineNum = mineNum; //模式对应的雷数

    this.squares = [];//存储所有方块的属性信息。行列信息和xy轴信息。是雷还是数字的信息。
    this.tds = [];//存储所有方块元素
    this.surplusMine = mineNum;//插旗后剩余雷数
    this.allRight = false;//标的小红旗是否全是雷，用来判断游戏是否成功

    this.parent = document.querySelector('.gameBox');//获取棋盘父元素

    this.init();//只要调用函数，就自动调用init函数
}

// 调用方法
Mine.prototype.init = function () {
    var rn = this.randomNum();//rn接收含雷个数元素的随机排序数组，每个元素的值它在所有雷里的索引，注意不是雷数组里的索引

    var n = 0;//用来找到格子对应的索引(因为需要所有格子索引，循环里的i和j不好表示，用n，以后没循环一次加一即可)
    for (var i = 0; i < this.tr; i++) {//行
        this.squares[i] = [];//每行作为一个数组放在大数组中
        for (var j = 0; j < this.td; j++) {//列

            // 取一个在数组里的数据要使用行和列的形式获取，找某方块周围的方块使用坐标获取。注意：行列数和坐标xy是相反的(如0行3列对应x3，y0)

            if (rn.indexOf(n) != -1) {//条件成立，说明目前这个格子在雷个数的数组中

                this.squares[i][j] = { type: 'bomb', x: j, y: i };//然后给这个格子存为对象，增加雷属性，和x，y坐标(前面说过，xy和行列刚好相反)
            } else {
                this.squares[i][j] = { type: 'number', x: j, y: i, value: 0 };//否则该格子就是number。value属性存放该格子的数字
            };
            n++;//每循环一次，加1即索引也加1
        }
    }

    this.parent.addEventListener('contextmenu', function (e) {
        e.preventDefault();//阻止默认事件，contextmenu是那个平常右击弹出一些选项的事件(因为我们自己要设置右击事件，所以阻止默认的)
    });

    this.updateNum();//调用更新数字的方法
    // 注意，先更新再创建table，这样的数据才是最新的
    this.createDom();//调用创建table的方法

    this.mineNumDom = document.querySelector('.mineNum');//获取放雷数字的元素
    this.mineNumDom.innerHTML = this.surplusMine;//剩余雷数

};

//生成N个不重复的数字
Mine.prototype.randomNum = function () {
    var square = new Array(this.tr * this.td);//空数组，长度为格子总数 

    for (var i = 0; i < square.length; i++) {
        square[i] = i;//给每个格子元素添加数字
    };
    square.sort(function () {
        return 0.5 - Math.random();//数组元素随机排序
    });
    return square.slice(0, this.mineNum);//截取雷数个数,返回数组
};

// 在Mine构造函数原型对象上添加创建元素方法(即创建好table)
Mine.prototype.createDom = function () {
    var that = this;
    var table = document.createElement('table');
    for (var i = 0; i < this.tr; i++) {//循环行，原型上的this也指向调用者，即调用构造函数的兄弟

        var domTr = document.createElement('tr');
        this.tds[i] = [];//每一行创建[]放在大数组中保存信息

        for (var j = 0; j < this.td; j++) {//循环列
            var domTd = document.createElement('td');

            domTd.pos = [i, j];//创建属性把格子对应的行列存到格子身上，用于play方法点的是哪一个格子

            // 格子创建完毕添加点击事件
            domTd.onmousedown = function () {
                that.play(event, this);//这个this是点击的格子(传递事件对象参数event(这里必须是event，调用函数的形参才能是事件参数，不然没有作用)，和点击的格子参数)
            };

            this.tds[i][j] = domTd;//存放所有格子元素

            domTr.appendChild(domTd);//再把每个单元格放在行的数组中
        }

        // 然后把添加好单元格的每一行给table
        table.appendChild(domTr);
    }
    // 最后把table放在parent元素下
    this.parent.innerHTML = '';//先清空上一次棋盘内容，避免棋盘一直往下加
    this.parent.appendChild(table);
};

// 找某格子周围的格子中能显示数字的格子
Mine.prototype.getAround = function (singleSquare) {
    var x = singleSquare.x;
    var y = singleSquare.y;
    var result = [];//把找到的格子返回出去

    /*  
        x-1,y-1   x,y-1    x+1,y-1  
        x-1,y     x,y      x+1,y
        x-1,y+1   x,y+1    x+1,y+1 
     */

    for (var i = x - 1; i <= x + 1; i++) {
        for (var j = y - 1; j <= y + 1; j++) {
            // 排除边角周围不存在格子，以及不循环自身的情况
            if (i < 0 ||  //左边超出范围
                j < 0 ||  //上边
                i > this.td - 1 ||  //右边
                j > this.tr - 1 ||  //下边
                (i == x && j == y) ||  //到自己时
                this.squares[j][i].type == 'bomb'  //雷就是自己，没有数字显示，所以也去掉。判断该格子的style属性是啥，注意squares是按行列存储数据，和xy相反，所以这里反着写
            ) {
                continue;//以上的情况就不继续执行了
            }
            result.push([j, i]);//把格子周围不是雷的格子，用行列的形式返回，到时候需要用其取数组的数据
        }
    }
    return result;
};

// 更新雷周围数字格子的value
Mine.prototype.updateNum = function () {
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            // 更新的是雷周围的数字，周围没有雷默认还是0就不必更新了
            if (this.squares[i][j].type == 'number') {
                continue; //是由雷来决定数字的，所以数字的周围格子不必更新数字了。雷可以全部完成
            };

            var num = this.getAround(this.squares[i][j]);//获取到每个雷周围可以显示数字的格子行列信息,是个数组，用num接收

            for (var k = 0; k < num.length; k++) {
                // num数组里有每个格子信息的小数组，用俩[]才能取到行列
                this.squares[num[k][0]][num[k][1]].value += 1;
            }
        }
    }
};

// 游戏开始(格子点击事件调用)
Mine.prototype.play = function (e, obj) {
    var that = this;

    if (e.which == 1 && obj.className != 'flag') {//判断点击事件是不是点的左键，并且已经插旗的不能再点击

        // 点击后，是that调用的该方法，所以这里面的this还是指向的Mine
        var curSquare = this.squares[obj.pos[0]][obj.pos[1]]; //obj是点击的格子，获取其行列让squares用,这样就可以获取到点击格子信息了

        var cl = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

        if (curSquare.type == 'number') {//点到是数字

            // 显示和数字样式
            obj.innerHTML = curSquare.value;
            obj.className = `${cl[curSquare.value]} all`;//all是都要有的样式，前面那个是不同数字对应的样式

            // 点到0就扩展处理  递归
            /* 点到0
                    1-显示自己
                    2-找四周格子
                      1-显示四周
                      2-如果值为0
                        1-显示自己
                        2-找四周
                        ...直到四周都没0，就不找了
            */
            if (curSquare.value == 0) {
                obj.innerHTML = '';

                function getAllZero(singleSquare2) {
                    var around = that.getAround(singleSquare2);//获取四周可以显示数字的格子组成的数组

                    for (var k = 0; k < around.length; k++) {
                        var r = around[k][0];//行
                        var c = around[k][1];//列

                        // tds存了每一个格子，可以通过行列调用(注意不要认为squres也是存的格子，它只是存的格子的属性信息)

                        that.tds[r][c].className = `${cl[that.squares[r][c].value]} all`;
                        // 由0衍生显示的格子样式由其value值决定
                        // 在后面再通过判断让其显示数字

                        if (that.squares[r][c].value == 0) {//如果周围某格子又是0，再调用函数

                            // 因为一个格子可以是多个格子的四周，程序会反复判断它是不是0，浪费资源，所以增加check属性判断是不是已经找过过的格子
                            if (!that.tds[r][c].check) {
                                // 第一次是开始没有check属性为假，!变为真真就可以执行if语句。紧接着就让其为真，下一次就不能执行了
                                that.tds[r][c].check = true;
                                getAllZero(that.squares[r][c]);
                            }
                        } else {//不为0就显示出来
                            that.tds[r][c].innerHTML = that.squares[r][c].value;
                        }
                    }
                };

                getAllZero(curSquare);//当前的格子传给getAllZero，再传给getAround
            }

            // 点到雷
        } else {
            this.gameOver(obj);//调用游戏结束函数
        }
    }

    if (e.which == 3) {//右键点击
        if (obj.className && obj.className != 'flag') {//不能右击已经显示样式的数字，包括0
            return;
        }
        obj.className = (obj.className == 'flag' ? '' : 'flag');
        // 三元判断点击的有不有小红旗，有就去掉，没有就加。这样小红旗就可以实现取消了

        if (obj.className == 'flag') {//通过插旗让剩余雷数变化
            this.mineNumDom.innerHTML = --this.surplusMine;
        } else {
            this.mineNumDom.innerHTML = ++this.surplusMine;
        }

        var allbomb = 0;
        if (this.surplusMine == 0) {//用户已经标完小红旗了，判断所有小红旗是否标对了
            for (var i = 0; i < this.tr; i++) {
                for (var j = 0; j < this.td; j++) {
                    if (this.tds[i][j].className == 'flag') {
                        if (this.squares[i][j].type == 'bomb') {
                            allbomb++;
                            console.log(allbomb);
                            // 如果既是小红旗，又是炸弹，allbomb就++。
                        }
                    }
                }
            };
            if (allbomb == this.mineNum) {//判断既是小红旗，又是炸弹的格子数是不是和总雷数相等
                this.allRight = true;
            } else {
                this.allRight = false;
            };

            if (this.allRight) {//判断是否全标对
                alert('终于完了！');
            } else {
                alert('您得重来了');
                this.gameOver();//然后调用gameOver显示所有炸弹
            }
        }

    }
};

// 游戏失败
Mine.prototype.gameOver = function (clickTd) {
    // 1-游戏结束，显示所有雷
    for (var i = 0; i < this.tr; i++) {
        for (var j = 0; j < this.td; j++) {
            if (this.squares[i][j].type == 'bomb') {
                this.tds[i][j].className = 'bomb';
                // 上面调用游戏结束函数，该函数把所有雷都显示出来
            }
            // this.tds[i][j].removeEventListener('mousedown', toPlay);//移除点击事件
            this.tds[i][j].onmousedown = null;
        }
    }
    if (clickTd) {//clickTd是传过来的点击的雷格子
        clickTd.style.backgroundImage = 'url()';
        clickTd.style.backgroundColor = 'brown';//点击的炸弹显示红色
    }
};


// 按钮功能
var btns = document.querySelectorAll('button');
var arr = [[9, 9, 10], [16, 16, 40], [28, 28, 99]];
var mine = null;
for (var i = 0; i < btns.length - 1; i++) {
    btns[i].index = i;//给每个按钮添加类索引属性，方便后面调用
    btns[i].addEventListener('click', function () {
        this.parentNode.querySelector('.active').
            classList.remove('active');
        this.classList.add('active');

        mine = new Mine(...arr[this.index]);


        btns[3].onclick = () => {
            mine = new Mine(...arr[this.index]);
        }
    })

};

btns[0].click();//主动调用点击事件，使打开浏览器棋盘处于初级阶段
