import React, {useState, useEffect, useCallback, useRef} from 'react';


import {useAccessStore, useChatStore} from '../store';
import API_BASE_URL from '../../config.ts';
import {
    Button,
    message,
    Select,
    SelectProps,
    Radio,
    Tabs,
    Tag,
    Divider,
    Spin,
} from 'antd';
import TextArea from "antd/es/input/TextArea";
import {EventStreamContentType, fetchEventSource} from "@fortaine/fetch-event-source";
import Locale from "../locales";
import {Markdown} from "./markdown";
import {prettyObject} from "../utils/format";
import CopyIcon from "../icons/copy.svg";
import ResetIcon from "../icons/reload.svg";
import {IconButton} from "./button";
import GptImg from "../icons/gpt_zhuan.png";
import {copyToClipboard} from "../utils";
import {CHAT_PAGE_SIZE, REQUEST_TIMEOUT_MS} from "../constant";
import styles from './writing.scss';

// 音乐页面
export function Music() {
    const accessStore = useAccessStore();
    const [wrtingType, setWrtingType] = useState("1");

    const languageOptions: SelectProps['options'] = [
        { "value": "chinese", "label": "中文" },
        { "value": "english", "label": "English" },
        { "value": "spanish", "label": "Español" },
        { "value": "french", "label": "Français" },
        { "value": "german", "label": "Deutsch" },
        { "value": "japanese", "label": "日本語" },
        { "value": "korean", "label": "한국어" },
        { "value": "russian", "label": "русский" },
        { "value": "italian", "label": "Italiano" },
        { "value": "portuguese", "label": "Português" },
        { "value": "arabic", "label": "العربية" },
        { "value": "dutch", "label": "Nederlands" }
    ];

    // 格式
    let [musicFormat, setMusicFormat] = useState("摇滚歌曲");
    // 歌曲个性化
    const [musicTone, setMusicTone] = useState("男");
    // 语言
    const [articleLanguage, setArticleLanguage] = useState("中文");

    // 音乐主题
    let [musicTip, setMusicTip] = useState("");
    const [data, setData] = useState('');

    const [loading, setLoading] = useState(false);

    const [genload, setGenload] = useState(false);

    const [streaming, setStreaming] = useState(false);

    const [isStop, setIsStop] = useState(false);
    let controller = new AbortController();

    const fetchData = () => {
        // 检查下是否填写了主题
        if(wrtingType == '1'){
            if(musicTip === ''){
                message.warning('请填写您的音乐想法');
                return;
            }
            musicTip = "你的任务是写一首引入入胜的歌曲，内容与"+musicTip+"相关,歌曲类型是"+musicFormat+",演唱者性别是:"+musicTone+"歌曲应该包括一个引人入胜的副歌和至少两个与主题相关";
        }

        setData('');
        setGenload(true);
        setLoading(true);



        const requestPayload = { // JSON 参数对象
            frequency_penalty: 0,
            messages: [
                {
                    content : musicFormat  + "，歌手是"+musicTone
                        +"，语言为:"+articleLanguage,
                    role : 'user',
                    fileImgList : [],
                }
            ],
            model: 'AI 音乐生成',
            presence_penalty : 0,
            stream: true,
            temperature: 0.5,
            top_p: 1,

        };
        controller = new AbortController();
        const chatPayload = {
            method: "POST",
            body: JSON.stringify(requestPayload),
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json",
                "x-requested-with": "XMLHttpRequest",
                "Token": encodeURIComponent(accessStore.accessCode),
                "Model": encodeURIComponent('AI 音乐生成'),
                'sessionId': '1',
                // 当前会话是否启用上下文
                'isContext' : 'false',
                // 当前会话是否联网
                'isNet' : 'false'
            }
        };
        // make a fetch request
        const requestTimeoutId = setTimeout(
            () => controller.abort(),
            REQUEST_TIMEOUT_MS,
        );
        // fetch chat response
        let remainText = "";
        let finished = false;
        let responseText = "";
        // animate response to make it looks smooth 动画响应使其看起来光滑
        function animateResponseText() {
            if(data == '请求失败，请联系管理员'
            || remainText == '请求失败，请联系管理员'){
                setLoading(false);
                setData(remainText);
            }
            if (finished || controller.signal.aborted || isStop) {
                responseText += remainText;
                console.log("[Response Animation] finished");
                return;
            }
            if (remainText.length > 0) {
                const fetchCount = Math.max(1, Math.round(remainText.length / 60));
                const fetchText = remainText.slice(0, fetchCount);
                responseText += fetchText;
                remainText = remainText.slice(fetchCount);
                // options.onUpdate?.(responseText, fetchText);
                setData(responseText+fetchText);
                if(responseText){
                    setStreaming(true);
                    setLoading(false);
                }

            }
            // console.log(remainText)

            requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
            if (!finished) {
                finished = true;
                setData(responseText + remainText);
            }
        };

        controller.signal.onabort = finish;

        fetchEventSource(`${API_BASE_URL}/new/v1/chat/completions`, {
            ...chatPayload,
            async onopen(res) {
                console.log("onopen", res);
                clearTimeout(requestTimeoutId);
                if (
                    !res.ok ||
                    !res.headers
                        .get("content-type")
                        ?.startsWith(EventStreamContentType) ||
                    res.status !== 200
                ) {
                    const responseTexts = [responseText];
                    let extraInfo = await res.clone().text();
                    console.log(extraInfo)
                    try {
                        const resJson = await res.clone().json();
                        if(resJson.code==200){
                            // responseTexts.push('{"role":"assistant","content":"积分不足！","fileImgList":null}');
                            setLoading(false);
                            // setData(remainText);
                            // console.log(123)
                        }
                        extraInfo = prettyObject(resJson);
                    } catch {}

                    if (res.status === 401) {
                        responseTexts.push(Locale.Error.Unauthorized);
                    }

                    if (extraInfo) {
                        responseTexts.push(extraInfo);
                    }

                    responseText = responseTexts.join("\n\n");

                    return finish();
                }
            },
            onmessage(msg) {

                if (msg.data === "[DONE]" || finished) {
                    return finish();
                }
                const text = msg.data;
                if(!text){
                    return;
                }
                console.log(text)
                try {
                    const json = JSON.parse(text)
                    const delta = json.content;

                    if (delta) {
                        remainText += delta;
                    }
                } catch (e) {
                    console.error("[Request] parse error", text);
                }
            },
            onclose() {
                console.log('sse close');
                finish();
                setGenload(false);
                setStreaming(false);
            },
            onerror(e) {
                // options.onError?.(e);
                throw e;
            },
            openWhenHidden: true,
        });
    };

    const [items,setItems] = useState([]);

    const handleLanguagelChange = (value: string) => {
        console.log(`selected ${value}`);
        setArticleLanguage(value);
    };

    useEffect(() => {
        setWrtingType('1');
    }, [accessStore]);

return (
            <div style={{
                fontSize:'12px',
                margin: 'auto', width: '100%', flexDirection: 'row',
                height:"96%",padding:'20px',marginBottom:'30px',
                display: 'flex'
            }}>
                <div style={{overflowY:'auto',minWidth:'380px'
                    ,padding:'10px',overflowX:'clip'
                    }}>
                    <h3>AI音乐生成</h3>
                    <Tabs
                        onChange={(key) => setWrtingType(key)}
                        defaultActiveKey="1"
                        items={[{
                            label: `音乐生成`,
                            key: '1',
                            style: {width: '270px'},
                            children: (
                                <div style={{}}>
                                    <TextArea
                                        showCount
                                        value={musicTip}
                                        onChange={(e) => setMusicTip(e.target.value)}
                                        maxLength={200}
                                        placeholder="请描述您的音乐想法！"
                                        style={{ height: 80, resize: 'none',width:'120%' }}
                                        rows={4} />
                                    <div>
                                        <h4>歌曲类型</h4>
                                        <div style={{width:'100%',wordWrap:'break-word'}}>
                                            <Radio.Group value={musicFormat} onChange={(e) => setMusicFormat(e.target.value)}>
                                                <Radio.Button value="摇滚歌曲">摇滚歌曲</Radio.Button>
                                                <Radio.Button value="乡村歌曲">乡村歌曲</Radio.Button>
                                                <Radio.Button value="流行歌曲">流行歌曲</Radio.Button>
                                                <Radio.Button value="校园歌曲">校园歌曲</Radio.Button>
                                                <Radio.Button value="儿童歌曲" style={{marginTop:'5px'}}>儿童歌曲</Radio.Button>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                </div>
                            )
                        }]}
                    />

                    <div>
                        <h4>歌手个性化</h4>
                        <div style={{display:"flex",flexDirection:'row',width:'200%'}}>
                            <Radio.Group value={musicTone} onChange={(e) => setMusicTone(e.target.value)}>
                                <Radio.Button value="男">男</Radio.Button>
                                <Radio.Button value="女">女</Radio.Button>
                                <Radio.Button value="男女组合">男女组合</Radio.Button>
                                <Radio.Button value="纯乐器">纯乐器</Radio.Button>
                            </Radio.Group>
                        </div>
                    </div>
                    <div>
                        <h4>语言</h4>
                        <div style={{display:"flex",flexDirection:'row',width:'100%'}}>
                            <Select
                                defaultValue={'中文'}
                                maxCount={1}
                                style={{ width: '60%',marginTop:'5px' }}
                                onChange={handleLanguagelChange}
                                options={languageOptions}
                            />
                        </div>
                    </div>

                    <div style={{marginTop:'20px',width:'100%'}}>
                        <Button
                            disabled={genload}
                            danger style={{width:'83%'}} onClick={() => fetchData()}>生成音乐</Button>
                    </div>
                </div>
                <Divider type="vertical" style={{height:'100%'}}/>
                <div style={{padding:'5px',width:'70%',overflowY:'auto',height:'100%'}}>
                    <h3>歌曲预览</h3>
                    {loading && (
                        <>
                        <img src={GptImg.src} width={'30px'}/>
                        <h4>{'AI音乐生成'}</h4>
                        <Divider style={{width:'100%'}}/>
                        <div className={styles["chat-message-status"]}>
                            <Spin tip="正在生成...">
                                <div className="content" />
                            </Spin>
                        </div>
                        </>
                    )}
                    {/*<Spin tip="Loading" spinning={loading}>*/}
                        {!loading && (
                            <>
                            {data && (
                                <>
                                    <img src={GptImg.src} width={'30px'}/>
                                    <h4>{'AI音乐生成'}</h4>
                                    <Divider style={{width:'100%'}}/>
                                </>
                                )}
                            <Markdown
                                content={data}
                                loading={
                                    false
                                }
                                fontSize={13}
                            />
                                {data && (
                                    <div style={{display:'flex',flexDirection:'row',marginTop:'30px'}}>
                                        <IconButton
                                            disabled={genload}
                                            icon={<ResetIcon/>} onClick={()=> fetchData()}/>
                                        <IconButton icon={<CopyIcon/>} onClick={()=> copyToClipboard(data)}/>
                                    </div>
                                )}
                            </>
                        )}

                    {/*</Spin>*/}
                </div>



            </div>
    );
}

