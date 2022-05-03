


# 05-03 PHP Bypass Waf思路

主要以当前安全狗提供的ApacheV4.0版本进行测试

## 访问的绕过

直接在文件后添加/即可，根据大佬的解释，"应该是apache和安全狗对连接的解析不一致，apache会寻找最后一个.的位置，把后面的/抛弃掉后路由到文件，安全狗则粗略的寻找/发现后面没有字符了就直接过了。"
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/1.jpg)
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/2.jpg)

## 文件后缀的绕过
Content-Disposition增加name和filename之间的数据，让其无法识别filename，数据大小为1810字节左右；
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/3.png)
Content-Disposition: form-data; name="uploaded";filename="11.php，上传绕过，安全狗似乎无法匹配规则，但服务器又可以接收
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/4.png)
尝试超出防火墙检测数据大小，在boundry末尾插入垃圾数据实际测试boundry大小为1810长度（略有偏差），安全狗不再拦截
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/5.png)
绕过成功
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/6.png)
回车换行截断绕过，POST请求头的值（不是请求头）是可以换行的，但是中间不得有空行。若WAF匹配文件名到换行截止，则可以绕过。

> Content-Disposition: form-data; name="uploaded";fi
> 
> lena
> 
> me
> 
> ="1
> 
> 1.p
> 
> h
> 
> p
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/7.jpg)
后缀检测的话chunk编码也能绕过
## 文件内容的绕过
分块传输编码，chunk编码妥妥绕过
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/8.jpg)
除了chunk编码，尝试插入冗余数据直接绕过检测并未成功
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/9.jpg)
查看安全狗记录是检测文件头的样子，直接在图片数据后面插入一句话+文件后缀绕过
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/10.png)
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/11.jpg)
![](https://github.com/youki992/youki992.github.io/blob/master/_posts/picture/12.png)
