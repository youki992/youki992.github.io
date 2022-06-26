#! /usr/bin/env python3
# -*- coding: utf-8 -*-
import requests,json,socket,sys,time
import threading
import telegram
from time import strftime,gmtime
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
import datetime
Token=''
ids=[]

#需要配置的地方
########################################################################################################################
#脚本干嘛用的？ARL持续监控，把ARL侦察到的资产导入AWVS进行漏洞扫描，实现对目标资产持续监控，持续扫描，漏洞通知
arl_url='https://XXXX:5003/'
username='admin'
password='XXXX'
time_sleep=3600# 秒为单位，获取资产
get_size=100   # 每次获取任务数，不用改
awvs_url='https://XXXX:13443/'
key='XXXX'
profile_id='11111111-1111-1111-1111-111111111111' #扫描类型,全部扫描
#profile_id='11111111-1111-1111-1111-111111111112' #高风险漏洞,全部扫描
headers2 = {'Content-Type': 'application/json',"X-Auth": key}

webhook_url='XXXX'  #漏洞结果，企业微信漏洞通知key


########################################################################################################################


def target_scan(url,target_id):
    global awvs_url, key, profile_id, headers2
    try:
        data = {"target_id": target_id, "profile_id": profile_id, "incremental": False,
                "schedule": {"disable": False, "start_date": None, "time_sensitive": False},
                "case_sensitive":"auto","limit_crawler_scope": False}
        response = requests.post(awvs_url + '/api/v1/scans', data=json.dumps(data), headers=headers2, timeout=30, verify=False)
        if 'profile_id' in str(response.text) and 'target_id' in str(response.text):
            print(target_id,'添加到AWVS扫描成功',url,str(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')))
    except Exception as e:
        print('扫描出错了',e)
        return False
def add_target(url,description='ARL-AUTO'):
    global awvs_url,key,profile_id,headers2
    try:
        post_data={"targets":[{"address":url,"description":description}],"groups":[]}
        add_log = requests.post(awvs_url + '/api/v1/targets/add',data=json.dumps(post_data), headers=headers2, timeout=30, verify=False)
        target_id = json.loads(add_log.content.decode())
        target_scan(url,target_id['targets'][0]['target_id'])
    except Exception as e:
        print(url,'配置出错了',e)
        return False



def push_wechat_group(content):
    global webhook_url
    try:
        # print('开始推送')
        # 这里修改为自己机器人的webhook地址
        resp = requests.post(webhook_url,
                             json={"msgtype": "markdown",
                                   "markdown": {"content": content}})
        print(content)
        if 'invalid webhook url' in str(resp.text):
            print('企业微信key 无效,无法正常推送')
            sys.exit()
        if resp.json()["errcode"] != 0:
            raise ValueError("push wechat group failed, %s" % resp.text)
    except Exception as e:
        print(e)

def push_telegram(content):
    try:
        chat_id = 'XXXX'
        token = 'XXXX'
        bot = telegram.Bot(token=token)

        bot.send_message(chat_id=chat_id,text=content)
    except Exception as e:
        print(e)

def message_push():
    while True:
        time.sleep(10)
        try:
            get_target_url = awvs_url + '/api/v1/vulnerability_types?l=100&q=status:open;severity:3;'
            r = requests.get(get_target_url, headers=headers2, timeout=30, verify=False)
            result = json.loads(r.content.decode())
            # print(result)
            init_high_count = 0
            for xxxx in result['vulnerability_types']:
                init_high_count = init_high_count + xxxx['count']
            print('当前高危:', init_high_count)
            while 1:
                try:
                    time.sleep(10)
                    r2 = requests.get(get_target_url, headers=headers2, timeout=30, verify=False)
                    result = json.loads(r2.content.decode())
                    high_count = 0
                    for xxxx in result['vulnerability_types']:
                        high_count = high_count + xxxx['count']
                    # print(high_count,init_high_count)
                    if high_count != init_high_count:
                        current_date = str(strftime("%Y-%m-%d %H:%M:%S", gmtime()))
                        message_push = str(socket.gethostname()) + '\n' + current_date + '\n'
                        for xxxx in result['vulnerability_types']:
                            message_push = message_push + '漏洞: ' + xxxx['name'] + '数量: ' + str(xxxx['count']) + '\n'
                        print(message_push)
                        #push_wechat_group(message_push)
                        push_telegram(message_push)
                        init_high_count = high_count
                    else:
                        # print('高危漏洞数量无变化 ',high_count)
                        init_high_count = high_count
                except Exception as e:
                    print('监控出错了，请检查', e)
        except Exception as e:
            print(e)
threading.Thread(target=message_push,).start()
#add_target('https://meeting.jd.com','sdf')
#input(123)

while True:
    try:
        data = {"username":username,"password":password}
        headers = {'Content-Type': 'application/json; charset=UTF-8'}
        logreq=requests.post(url=arl_url+'/api/user/login',data=json.dumps(data),headers=headers,timeout=30, verify=False)
        result = json.loads(logreq.content.decode())
        if result['code']==401:
            print(data,'登录失败')
            sys.exit()
        if result['code']==200:
            print(data, '登录成功',result['data']['token'])
            Token=result['data']['token']
        headers = {'Token': Token,'Content-Type': 'application/json; charset=UTF-8'}
        print('开始获取最近侦察资产')
        req =requests.get(url=arl_url+'/api/task/?page=1&size='+str(get_size), headers=headers,timeout=30, verify=False)
        result = json.loads(req.content.decode())
        for xxx in result['items']:
            if xxx['status']=='done':
                ids.append(xxx['_id'])
        ids=str(ids).replace('\'','"')
        ids_result = json.loads(ids)
        data = {"task_id":ids_result}
        req2=requests.post(url=arl_url+'/api/batch_export/site/',data=json.dumps(data),headers=headers,timeout=30, verify=False)
        if '"not login"' in str(req2.text):
            ids = []
            continue
        target_list=req2.text.split()
        file_list=open('caches/cache.txt','r',encoding='utf-8').read().split('\n')
        add_list=set(file_list).symmetric_difference(set(target_list))
        current_time=str(datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')).replace(' ','-').replace(':','-')
        for xxxx in add_list:
            if xxxx in target_list:
                caches_file=open('caches/cache.txt', 'a', encoding='utf-8')
                caches_file.write(xxxx+'\n')
                caches_file.close()
                get_log=open('get_log/'+current_time+'.txt','a', encoding='utf-8')
                get_log.write(xxxx+'\n')
                add_target(xxxx.strip(), 'ARL-'+current_time)
                get_log.close()
                print(xxxx)
        time.sleep(int(time_sleep))
        Token = ''
        ids = []

    except Exception as e:
        print(e,'出错了，请排查')