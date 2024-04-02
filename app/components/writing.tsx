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
    Avatar,
    Dropdown,
    Space,
    MenuProps
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
import {DownOutlined} from "@ant-design/icons";
import styles from './writing.scss';
import * as UUID from "uuid";

// 写作页面
export function Writing() {
    const accessStore = useAccessStore();
    const [wrtingType, setWrtingType] = useState("chat");
    const [modelOptions,setModelOptions] = useState([]);

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
    // 滚动
    const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();

    // 格式
    let [articleFormat, setArticleFormat] = useState("文章");
    // 回复格式
    let [replyFormat, setReplyFormat] = useState("评论");
    // 语气
    const [articleTone, setArticleTone] = useState("随性");
    // 长度
    const [articleLength, setArticleLength] = useState("中等");
    // 语言
    const [articleLanguage, setArticleLanguage] = useState("中文");

    // 文章主题
    const [articleTop, setArticleTop] = useState("");


    const [waitReplycontent, setWaitReplycontent] = useState("");

    const [replyContent, setReplyContent] = useState("");


    // 模型
    const [articleModel, setArticleModel] = useState("零一万物");

    const [data, setData] = useState('');

    const [loading, setLoading] = useState(false);

    const [genload, setGenload] = useState(false);

    const [streaming, setStreaming] = useState(false);

    const [isStop, setIsStop] = useState(false);
    let controller = new AbortController();
    const handleStopStream = () => {
        setIsStop(true);
        // controller.signal.aborted = true;
        setStreaming(false);
    }

    const fetchData = (newModel:string) => {
        // 检查下是否填写了主题
        if(wrtingType == '1'){
            if(articleTop === ''){
                message.warning('请填写文章主题');
                return;
            }
            if(articleFormat =='小红书文案'){
                articleFormat = "你的任务是以小红书博主的文章结构，以我给出的主题写一篇帖子推荐。你的回答应包括使用表情符号来增加趣味和互动" +
                    "，以及与每个段落相匹配的图片。请以一个引人入胜的介绍开始，为你的推荐设置基调。然后，提供至少三个与主题相关的段落，突出它们的独特特点和吸引力。在你的写作中使用表情符号，使它更加引人入胜和有趣。对于每个段落，请提供一个与描述内容相匹配的图片。这些图片应该视觉上吸引人，并帮助你的描述更加生动形象。我给出的主题是："+articleTop;
            }else if(articleFormat == '文章'){
                articleFormat= "你的任务是写一篇关于"+articleTop+"的文章。文章应该包括一个有吸引力的标题，一个引人入胜的介绍，然后提供至少三个与主题相关的段落。每个段落都应该突出主题的独特特点和吸引力。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '段落'){
                articleFormat = "你的任务是写一段关于"+articleTop+"的文章的段落。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '大纲'){
                articleFormat = "你的任务是写一篇关于"+articleTop+"的文章的大纲。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '用户评论'){
                articleFormat = "你的任务是写一篇关于"+articleTop+"的用户评论。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '朋友圈文案'){
                articleFormat = "你的任务是写一篇关于"+articleTop+"的朋友圈文案。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '邮件'){
                articleFormat = "你的任务是写一封关于"+articleTop+"的邮件。在你的写作中，确保你的语气和风格与主题相匹配。";
            }else if(articleFormat == '博客'){
                articleFormat = "你的任务是写一篇关于"+articleTop+"的博客文章。在你的写作中，确保你的语气和风格与主题相匹配。";
            }
        }else{
            if(waitReplycontent === ''){
                message.warning('请填写需要回复的内容！');
                return;
            }
            if(replyFormat =='评论'){
                articleFormat = "你的任务是以用户评论的视角，来回复"+waitReplycontent+"这个话题，并参考"+replyContent+"的想法，在你的回复中使用表情符号，使它更加引人入胜和有趣";
            }else if(replyFormat == '邮件'){
                articleFormat = "你的任务是以用户回复邮件的视角，来回复"+waitReplycontent+"这个话题，并参考"+replyContent+"的想法。";
            }else if(replyFormat == '短信'){
                articleFormat = "你的任务是以用户回复邮件的视角，来回复"+waitReplycontent+"这个话题，并参考"+replyContent+"的想法。";
            }else if(replyFormat == '微信'){
                articleFormat = "你的任务是以用户回复微信的视角，来回复"+waitReplycontent+"这个话题，并参考"+replyContent+"的想法，在你的回复中使用有趣的表情符号，使它更加引人入胜和有趣";
            }else if(replyFormat == '微博'){
                articleFormat = "你的任务是以用户回复邮件的视角，来回复"+waitReplycontent+"这个话题，并参考"+replyContent+"的想法，在你的回复中使用表情符号，使它更加引人入胜和有趣";
            }
        }

        setData('');
        setGenload(true);
        setLoading(true);



        const requestPayload = { // JSON 参数对象
            frequency_penalty: 0,
            messages: [
                {
                    content : articleFormat  + "，语气为:"+articleTone
                        +"，长度:"+articleLength+"，语言为:"+articleLanguage,
                    role : 'user',
                    fileImgList : [],
                }
            ],
            model: newModel ? newModel : articleModel,
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
            "Model": encodeURIComponent(articleModel),
            'sessionId': '1',
            // 当前会话是否启用上下文
            'isContext' : '1',
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
            || remainText == '请求失败，请联系管理员'
                || remainText == '积分不足，请充值！'){
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

        setAutoScroll(true);

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
                        console.log(extraInfo)
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

    const onClick: MenuProps['onClick'] = ({ key }) => {
        // message.info(`Click on item ${key}`);
        askModel(key)
    };

    const [items,setItems] = useState([]);

    const handleLanguagelChange = (value: string) => {
        console.log(`selected ${value}`);
        setArticleLanguage(value);
    };

    const handleModelChange = (value: string) => {
        console.log(`selected ${value}`);
        setArticleModel(value);
    };

    // 使用Promise来处理异步操作
    const askModel = async (newModel:string) => {
        setArticleModel(newModel);
        await new Promise((resolve) => setTimeout(resolve, 0));
        // 在这里添加需要在状态更新后执行的代码
        console.log('Article model updated to:', articleModel);
        fetchData(newModel);
    };

    // 获取模型列表
    const modelList = () => {
        fetch(`${API_BASE_URL}/v1/api/model/list?modelType=0`,{
            method: 'GET',
            headers: {
                'Token': accessStore.accessCode,
            }
        })
            .then(response => response.json()
            )
            .then(data => {
                    if(data.code==200){
                        setModelOptions(data.data.modeList.map((item: any) => {
                            return { value: item.displayName, label: item.displayName, };
                        }));

                        setItems(data.data.modeList.map((item: any) => {
                            return { key: item.displayName, label: item.displayName, };
                        }));
                    }else{
                        message.error(data.data);
                    }
                }
            )
            .catch((error) => {
                    console.error('Error:', error);
                }
            );
    }

    useEffect(() => {
        // 加载获取可使用模型列表
        modelList();
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
                    <h3>写作</h3>
                    <Tabs
                        onChange={(key) => setWrtingType(key)}
                        defaultActiveKey="1"
                        items={[{
                            label: `撰写`,
                            key: '1',
                            style: {width: '270px'},
                            children: (
                                <div style={{}}>
                                    <TextArea
                                        showCount
                                        value={articleTop}
                                        onChange={(e) => setArticleTop(e.target.value)}
                                        maxLength={200}
                                        placeholder="您要撰写的主题"
                                        style={{ height: 80, resize: 'none',width:'120%' }}
                                        rows={4} />
                                    <div>
                                        <h4>格式</h4>
                                        <div style={{width:'100%',wordWrap:'break-word'}}>
                                            <Radio.Group value={articleFormat} onChange={(e) => setArticleFormat(e.target.value)}>
                                                <Radio.Button value="文章">文章</Radio.Button>
                                                <Radio.Button value="段落">段落</Radio.Button>
                                                <Radio.Button value="小红书文案">小红书文案</Radio.Button>
                                                <Radio.Button value="大纲">大纲</Radio.Button>
                                                <Radio.Button value="用户评论" style={{marginTop:'5px'}}>用户评论</Radio.Button>
                                                <Radio.Button value="朋友圈文案">朋友圈文案</Radio.Button>
                                                <Radio.Button value="邮件" style={{marginTop:'5px'}}>邮件</Radio.Button>
                                                <Radio.Button value="博客">博客</Radio.Button>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                </div>
                            )
                        },{
                            label: `回复`,
                            key: '2',
                            style: {width: '270px'},
                            children: (
                                <div>
                                    <TextArea
                                        showCount
                                        value={waitReplycontent}
                                        onChange={(e) => setWaitReplycontent(e.target.value)}
                                        maxLength={500}
                                        placeholder="您要回复的原文"
                                        autoSize={{ minRows: 4, maxRows: 8 }}
                                        style={{ height: 80, resize: 'none',width:'120%' }}
                                        rows={4} />
                                    <TextArea
                                        showCount
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        maxLength={200}
                                        placeholder="请输入回复的大致想法"
                                        style={{ height: 80, resize: 'none',width:'120%',marginTop:'30px' }}
                                        rows={4} />
                                    <div>
                                        <h4>格式</h4>
                                        <div style={{width:'100%',wordWrap:'break-word'}}>
                                            <Radio.Group value={replyFormat} onChange={(e) => setReplyFormat(e.target.value)}>
                                                <Radio.Button value="评论">评论</Radio.Button>
                                                <Radio.Button value="邮件">邮件</Radio.Button>
                                                <Radio.Button value="短信">短信</Radio.Button>
                                                <Radio.Button value="微信">微信</Radio.Button>
                                                <Radio.Button value="微博" style={{marginTop:'5px'}}>微博</Radio.Button>
                                            </Radio.Group>
                                        </div>
                                    </div>
                                </div>
                            ),
                        }]}
                    />

                    <div>
                        <h4>个性化语气</h4>
                        <div style={{display:"flex",flexDirection:'row',width:'200%'}}>
                            <Radio.Group value={articleTone} onChange={(e) => setArticleTone(e.target.value)}>
                                <Radio.Button value="随性">随性</Radio.Button>
                                <Radio.Button value="专业">专业</Radio.Button>
                                <Radio.Button value="热情洋溢">热情洋溢</Radio.Button>
                                <Radio.Button value="新闻">新闻</Radio.Button>
                                <Radio.Button value="幽默">幽默</Radio.Button>
                            </Radio.Group>
                        </div>
                    </div>
                    <div>
                        <h4>长度</h4>
                        <div style={{display:"flex",flexDirection:'row',width:'200%'}}>
                            <Radio.Group value={articleLength} onChange={(e) => setArticleLength(e.target.value)}>
                                <Radio.Button value="短">短</Radio.Button>
                                <Radio.Button value="中等">中等</Radio.Button>
                                <Radio.Button value="长">长</Radio.Button>
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

                    <div>
                        <h4>模型支持</h4>
                        <Select
                            value={articleModel}
                            defaultValue={articleModel}
                            maxCount={1}
                            style={{ width: '60%',marginTop:'10px' }}
                            onChange={handleModelChange}
                            options={modelOptions}
                        />
                        <Button
                            disabled={genload}
                            danger style={{marginLeft:'10px'}} onClick={() => fetchData('')}>生成草稿</Button>
                    </div>
                </div>
                <Divider type="vertical" style={{height:'100%'}}/>
                <div style={{padding:'5px',width:'70%',overflowY:'auto',height:'100%'}}>
                    <h3>草稿预览</h3>

                    {loading && (
                        <>
                        <img src={GptImg.src} width={'30px'}/>
                        <h4>{articleModel}</h4>
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
                                    <h4>{articleModel}</h4>
                                    <Divider style={{width:'100%'}}/>
                                </>
                                )}
                            <Markdown
                                content={data}
                                loading={
                                    false
                                }
                                fontSize={13}
                                parentRef={scrollRef}
                                // defaultShow={i >= messages.length - 6}
                            />
                                {data && (
                                    <div style={{display:'flex',flexDirection:'row',marginTop:'30px'}}>
                                        <IconButton
                                            disabled={genload}
                                            icon={<ResetIcon/>} onClick={()=> fetchData(articleModel)}/>
                                        <IconButton icon={<CopyIcon/>} onClick={()=> copyToClipboard(data)}/>

                                        <Dropdown menu={{ items, onClick }} disabled={genload}>
                                            <a onClick={(e) => e.preventDefault()}>
                                                <Space>
                                                    {articleModel}
                                                    <DownOutlined />
                                                </Space>
                                            </a>
                                        </Dropdown>

                                        {/*<Button type='primary' onClick={askGpt4}>询问GPT4?</Button>*/}
                                    </div>
                                )}
                                {/*{streaming && !isStop && (*/}
                                {/*    <Button danger type="dashed"*/}
                                {/*            style={{position: 'absolute',*/}
                                {/*                bottom: '10px',*/}
                                {/*                left: '60%'}}*/}
                                {/*            onClick={() => handleStopStream()}*/}
                                {/*    >*/}
                                {/*        停止输出*/}
                                {/*    </Button>*/}
                                {/*)}*/}



                            </>
                        )}

                    {/*</Spin>*/}
                </div>



            </div>
    );
}

function useScrollToBottom() {
    // for auto-scroll
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    function scrollDomToBottom() {
        const dom = scrollRef.current;
        if (dom) {
            requestAnimationFrame(() => {
                setAutoScroll(true);
                dom.scrollTo(0, dom.scrollHeight);
            });
        }
    }

    // auto scroll
    useEffect(() => {
        if (autoScroll) {
            scrollDomToBottom();
        }
    });

    return {
        scrollRef,
        autoScroll,
        setAutoScroll,
        scrollDomToBottom,
    };
}
