import { useDebouncedCallback } from "use-debounce";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment, RefObject,
} from "react";
import FGpt from "../icons/fgpt.png";
import Case17 from "../icons/case17.png";
import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/编辑消息.svg";
import ExportIcon from "../icons/导出.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/复制.svg";
import ContextIcon from "../icons/开启上下文.svg";
import NetIcon from "../icons/开启联网.svg";
import LoadingIcon from "../icons/three-dots.svg";
import PromptIcon from "../icons/快捷指令.svg";
import MaskIcon from "../icons/所有面具.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/刷新.svg";
import BreakIcon from "../icons/清除聊天.svg";
import SettingsIcon from "../icons/对话设置.svg";
import DeleteIcon from "../icons/删除.svg";
import PinIcon from "../icons/固定.svg";
import EditIcon from "../icons/编辑消息.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import UploadIcon from "../icons/upload.svg";
import LightIcon from "../icons/亮色模式.svg";
import DarkIcon from "../icons/深色模式.svg";
import AutoIcon from "../icons/自动主题.svg";
import BottomIcon from "../icons/滚到最新.svg";
import StopIcon from "../icons/停止响应.svg";
import RobotIcon from "../icons/gpt.svg";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';
import {
  Button,
  Card, Divider, GetProp,
  message, Typography,
  Modal as AntModal,
  Tabs,
  List as AntList,
  TabsProps,
  Tooltip,
  Tour,
  TourProps,
  Upload,
  UploadFile, UploadProps, FloatButton, Avatar as AntAvatar
} from 'antd';

import {
  ChatMessage,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  createMessage,
  useAccessStore,
  Theme,
  useAppConfig,
  DEFAULT_TOPIC,
  ModelType,
} from "../store";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen, readFromFile,
} from "../utils";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  Input,
  List,
  ListItem,
  Modal,
  Selector,
  showConfirm, showModal,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useNavigate } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  LAST_INPUT_KEY,
  Path,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
} from "../constant";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import API_BASE_URL from "../../config";
import Meta from "antd/es/card/Meta";
import {LegacyRef} from "react/index";
import {QuestionCircleOutlined, UploadOutlined} from "@ant-design/icons";
import {FileType} from "next/dist/lib/file-exists";
import {Avatar} from "./emoji";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function SessionConfigModel(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const maskStore = useMaskStore();
  const navigate = useNavigate();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Context.Edit}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            text={Locale.Chat.Config.Reset}
            onClick={async () => {
              if (await showConfirm(Locale.Memory.ResetConfirm)) {
                chatStore.updateCurrentSession(
                  (session) => (session.memoryPrompt = ""),
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={Locale.Chat.Config.SaveAs}
            onClick={() => {
              navigate(Path.Masks);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateCurrentSession((session) => (session.mask = mask));
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                className="copyable"
                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.mask.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && (
        <div
          className={styles["prompt-toast-inner"] + " clickable"}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </div>
      )}
      {props.showModal && (
        <SessionConfigModel onClose={() => props.setShowModal(false)} />
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
  prompts: RenderPompt[];
  onPromptSelect: (prompt: RenderPompt) => void;
}) {
  const noPrompts = props.prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectIndex(0);
  }, [props.prompts.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        e.stopPropagation();
        e.preventDefault();
        const nextIndex = Math.max(
          0,
          Math.min(props.prompts.length - 1, selectIndex + delta),
        );
        setSelectIndex(nextIndex);
        selectedRef.current?.scrollIntoView({
          block: "center",
        });
      };

      if (e.key === "ArrowUp") {
        changeIndex(1);
      } else if (e.key === "ArrowDown") {
        changeIndex(-1);
      } else if (e.key === "Enter") {
        const selectedPrompt = props.prompts.at(selectIndex);
        if (selectedPrompt) {
          props.onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompts.length, selectIndex]);

  if (noPrompts) return null;
  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          ref={i === selectIndex ? selectedRef : null}
          className={
            styles["prompt-hint"] +
            ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
          }
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function ClearContextDivider() {
  const chatStore = useChatStore();

  return (
    <div
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateCurrentSession(
          (session) => (session.clearContextIndex = undefined),
        )
      }
    >
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
      <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div>
    </div>
  );
}

function ChatAction(props: {
  text: string;
  textStyle?: Object;
  icon: JSX.Element;
  onClick: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });
  // console.log(props.textStyle != null ? props.textStyle['contextBackgroundColor'] : '无');

  function updateWidth() {
    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <div
        className={`${styles["chat-input-action-model"]} clickable ${
            props.textStyle &&
            typeof props.textStyle === 'object' &&
            'contextBackgroundColor' in props.textStyle &&
            typeof props.textStyle['contextBackgroundColor'] === 'string' && // 检查属性值的类型
            props.textStyle['contextBackgroundColor'] !== undefined
                ? styles[props.textStyle['contextBackgroundColor']]
                : ''
        } ${
            props.textStyle &&
            typeof props.textStyle === 'object' &&
            'netColor' in props.textStyle &&
            typeof props.textStyle['netColor'] === 'string' && // 检查属性值的类型
            props.textStyle['netColor'] !== undefined
                ? styles[props.textStyle['netColor']]
                : ''
        }`}

        onClick={() => {
        props.onClick();
        // setTimeout(updateWidth, 1);
      }}
      // onMouseEnter={updateWidth}
      // onTouchStart={updateWidth}
      // style={
      //   {
      //     "--icon-width": `${width.icon}px`,
      //     "--full-width": `${width.full}px`,
      //   } as React.CSSProperties
      // }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      <div className={styles["text"]} ref={textRef}>
        {props.text}
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

export function ChatActions(props: {
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // 以下为漫游引导
  const ref1 = useRef(null);
  const ref2 = useRef(null);
  const ref3 = useRef(null);

  const [open, setOpen] = useState<boolean>(true);

  const steps: TourProps['steps'] = [
    {
      title: '分析图片-支持多轮会话',
      description: '上传你的图片',
      cover: (
          <img
              alt="分析图片"
              src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case1.png'
          />
      ),
      target: () => ref1.current,
    },
    {
      title: '图片-分析的结果',
      description: '支持多轮提问，记得开启上下文.',
      cover: (
          <img
              alt="分析图片"
              src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case2.png'
          />
      ),
      target: () => ref2.current,
    },
    {
      title: '切换模型',
      description: '选择更合适的模型，解决问题事半功倍.',
      cover: (
          <>
            <img
                alt="切换模型"
                src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case3.png'
            />
            <img
                alt="插件市场"
                src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case4.png'
            />
          </>
      ),
      target: () => ref3.current,
    },
    {
      title: '如何使用插件',
      description: '如何使用插件.',
      cover: (
          <>
            <img
                alt="如何使用插件"
                src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case5.png'
            />
          </>
      ),
      target: () => ref3.current,
    },
    {
      title: '每日打卡获取积分',
      description: '每日打卡获取积分.',
      cover: (
          <>
            <img
                alt="如何使用插件"
                src='https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/case6.png'
            />
          </>
      ),
      target: () => ref3.current,
    },
  ];

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();
  // 上下文按钮
  const [contextBackgroundColor, setContextBackgroundColor] = useState('contextChangedColor');
  // 开启联网按钮
  const [netColor, setNetColor] = useState('netChangedColor');

  const [modelTab, setModelTab] = useState('model');

  const handleModelTabChange = (value:string) => {
    console.log(value)
    setModelTab(value);
  }

  const handleNetChange = () => {
    if(netColor === 'netInitialColor'){
      showToast('当前模式下, 发送消息会访问联网数据',undefined,3000);
    }else{
      showToast('当前模式下, 发送消息不会访问联网数据',undefined,3000);
    }
    setNetColor((prevColor) =>
        prevColor === 'netInitialColor' ? 'netChangedColor' : 'netInitialColor'
    );

    chatStore.updateCurrentSessionIsNet(netColor === 'netInitialColor');
  };

  const handleContextColorChange = () => {
    if(contextBackgroundColor === 'initialColor'){
      showToast('当前模式下, 发送消息会携带之前的聊天记录',undefined,3000);
    }else{
      showToast('当前模式下, 发送消息不会携带之前的聊天记录',undefined,3000);
    }
    setContextBackgroundColor((prevColor) =>
        prevColor === 'initialColor' ? 'contextChangedColor' : 'initialColor'
    );

    chatStore.updateCurrentSessionIsContext(contextBackgroundColor === 'initialColor');
  };


  // switch model
  const currentModel = chatStore.currentSession().mask.modelConfig.model.toLowerCase() === "gpt-3.5-turbo-(极速、联网支持)".toLowerCase() ? 'GPT-3.5-TURBO' : chatStore.currentSession().mask.modelConfig.model;
  chatStore.currentSession().mask.modelConfig.model = currentModel;
  const allModels = useAllModels();
  const models = useMemo(
      () => allModels.filter((m) => m.available).slice().sort((a, b) => a.index - b.index),
      [allModels],
  );
  const [showModel, setShowModel] = useState(false);

  const [modeList, setModeList] = useState([]);
  const [gptsList, setGptsList] = useState([]);

  const selectModel = (displayName:string,model:string) =>{
    console.log('当前选择的model-'+displayName)
    chatStore.updateCurrentSession((session) => {
      session.mask.modelConfig.model = displayName as ModelType;
      session.mask.syncGlobalConfig = false;
    });
    setShowModel(false);
  }

  const onChange = (key: string) => {
    if(key == '1'){
      handleModelTabChange('model');
    }else{
      handleModelTabChange('gpts');
    }
  };

  const items: TabsProps['items'] = [
    {
      key: '1',
      label: '云模型',
      children: '',
    },
    {
      key: '2',
      label: '插件商店',
      children: '',
    },
  ];

  // 获取模型列表
  const modelList = () => {
    fetch(`${API_BASE_URL}/v1/api/model/list`,{
      method: 'GET',
      headers: {
      }
    })
        .then(response => response.json()
        )
        .then(data => {
          if(data.code==200){
            setModeList(data.data.modeList);
            setGptsList(data.data.gptsList);
          }else{
            message.error(data.data)
          }
        }
        )
        .catch((error) => {
          console.error('Error:', error);
        }
        );
  }

  const handleModelChange = () => {
    setShowModel(true);
    modelList();
    setModelTab('model');

  }

  const tourFinish = () =>{
    // 记录到本地
    localStorage.setItem('tourFinish', 'true');
  }

  const [hasFetchedModelList, setHasFetchedModelList] = useState(false);

  useEffect(() => {
    // if current model is not available
    // switch to first available model
    // const isUnavaliableModel = !models.some((m) => m.name === currentModel);
    // if (isUnavaliableModel && models.length > 0) {
    //   const nextModel = models[0].name as ModelType;
    //   chatStore.updateCurrentSession(
    //     (session) => (session.mask.modelConfig.model = nextModel),
    //   );
    //   showToast(nextModel);
    // }

    // 读取当前上下文是否启用的状态 setContextBackgroundColor
    if(chatStore.currentSession().isContext){
      setContextBackgroundColor('contextChangedColor');
    }else{
      setContextBackgroundColor('initialColor');
    }

    // 读取当前 联网 是否启用的状态 setNetColor
    if(chatStore.currentSession().isNet){
      setNetColor('netChangedColor');
    }else{
      setNetColor('netInitialColor');
    }
    // 获取模型列表
    if (!hasFetchedModelList) {
      modelList();
      setHasFetchedModelList(true);
    }

    if(localStorage.getItem('tourFinish') == 'true'){
      setOpen(false);
    }

  }, [chatStore, currentModel, models,hasFetchedModelList]);

  return (
    <>
      <Tour open={open} onClose={() => setOpen(false)} steps={steps}
            onFinish={()=>tourFinish()}/>

    <div className={styles["chat-input-actions"]}>
      {showModel && (
          <AntModal
              title="模型选择"
              centered
              okText={'确定'}
              cancelText={'取消'}
              open={showModel}
              // onOk={() => setShowModel(false)}
              onCancel={() => setShowModel(false)}
              width={1000}
          >
            <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
            { modelTab === "model" && (

                <div
                    ref={ref2}
                    style={{
                  flexWrap: 'wrap',
                  width:'100%',
                  // backgroundColor: '#f0f0f3',
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                  {modeList && modeList.map((item: any, index: number) => (
                      <Card
                          onClick={() => selectModel(item.displayName,item.name)}
                          hoverable={true}
                          style={{ width: 220,cursor: 'pointer',margin:'5px'}}
                      >
                        <div style={{display:'flex',flexDirection:'column'}}>
                          <img src={item.logo} width={'80px'}/>
                          <div style={{marginLeft:'10px'}}>
                            <Tooltip title={item.description} color={'orange'} key={'orange'}>
                              <h4>{item.displayName}</h4>
                              <span>{item.description && item.description.substring(0,40)+'...'}</span>
                            </Tooltip>
                          </div>
                        </div>
                      </Card>
                  ))
                  }
                </div>
            )

            }

            { modelTab === "gpts" && (
                <div style={{
                  flexWrap: 'wrap',
                  width:'100%',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'row',
                }}>
                  {gptsList && gptsList.map((item: any, index: number) => (
                      <Card
                          onClick={() => selectModel(item.displayName,item.name)}
                          hoverable={true}
                          style={{ width: 220,cursor: 'pointer',margin:'5px'}}
                      >
                        <div style={{display:'flex',flexDirection:'column'}}>

                            <img src={item.logo} width={'115px'}/>
                            <div style={{marginLeft:'10px'}}>
                              <Tooltip title={item.description} color={'orange'} key={'orange'}>
                              <h4>{item.displayName}</h4>
                              <span>{item.description && item.description.substring(0,40)+'...'}</span>
                              </Tooltip>
                            </div>

                        </div>

                      </Card>
                  ))
                  }
                </div>
            )

            }
          </AntModal>

          // <div className='modal-mask'>
          //   <div style={{boxShadow: 'var(--card-shadow)',
          //     backgroundColor: 'var(--white)',
          //     borderRadius: '12px',
          //     width: '80vw',
          //     maxWidth: '900px',
          //     minWidth: '300px',
          //     maxHeight: '40vh',
          //     padding: 'var(--modal-padding)',
          //     overflow: 'auto',
          //     // animation: ui-lib_slide-in__1VMXW ease 0.3s,
          //     '--modal-padding': '20px'}}>
          //
          //   </div>
          //
          // </div>

      )}


      {couldStop && (
        <ChatAction
          onClick={stopAll}
          text={Locale.Chat.InputActions.Stop}
          icon={<StopIcon />}
        />
      )}
      {!props.hitBottom && (
        <ChatAction
          onClick={props.scrollToBottom}
          text={Locale.Chat.InputActions.ToBottom}
          icon={<BottomIcon />}
        />
      )}
      {props.hitBottom && (
        <ChatAction
          onClick={props.showPromptModal}
          text={Locale.Chat.InputActions.Settings}
          icon={<SettingsIcon />}
        />
      )}

      <ChatAction
        onClick={nextTheme}
        text={Locale.Chat.InputActions.Theme[theme]}
        icon={
          <>
            {theme === Theme.Auto ? (
              <AutoIcon />
            ) : theme === Theme.Light ? (
              <LightIcon />
            ) : theme === Theme.Dark ? (
              <DarkIcon />
            ) : null}
          </>
        }
      />

      <ChatAction
        onClick={props.showPromptHints}
        text={Locale.Chat.InputActions.Prompt}
        icon={<PromptIcon />}
      />

      <ChatAction
        onClick={() => {
          navigate(Path.Masks);
        }}
        text={Locale.Chat.InputActions.Masks}
        icon={<MaskIcon />}
      />

      <ChatAction
        text={Locale.Chat.InputActions.Clear}
        icon={<BreakIcon />}
        onClick={() => {
          chatStore.updateCurrentSession((session) => {
            if (session.clearContextIndex === session.messages.length) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = session.messages.length;
              session.memoryPrompt = ""; // will clear memory
            }
          });
        }}
      />

      <ChatAction
        onClick={handleModelChange}
        text={currentModel}
        icon={<RobotIcon />}
      />

      <ChatAction
          onClick={handleContextColorChange}
          textStyle={{contextBackgroundColor}}
          text={'开启上下文'}
          icon={<ContextIcon />}
      />

      {/*<ChatAction*/}
      {/*    onClick={handleNetChange}*/}
      {/*    textStyle={{netColor}}*/}
      {/*    text={'开启联网'}*/}
      {/*    icon={<NetIcon />}*/}
      {/*/>*/}
    </div>
    </>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const [messages, setMessages] = useState(session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.EditMessage.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            text={Locale.UI.Cancel}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateCurrentSession(
                (session) => (session.messages = messages),
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Chat.EditMessage.Topic.Title}
            subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
          >
            <input
              type="text"
              value={session.topic}
              onInput={(e) =>
                chatStore.updateCurrentSession(
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

function _Chat() {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const fontSize = config.fontSize;

  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const { scrollRef, setAutoScroll, scrollDomToBottom } = useScrollToBottom();
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(2);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(2 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateCurrentSession(
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    // const markdownImages = imgFileUrlList.map((file) => {
    //   return `![](${file.imgUrl})`;
    // });
    // console.log(markdownImages);
    // console.log(imgFileUrlList);
    // let markdownImagesString = ''
    // markdownImagesString = markdownImages.join("\n"); // 使用换行符连接每个图片链接
    // console.log(markdownImagesString+text);
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.startsWith(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };


  const doSubmit = (userInput: string) => {
    if (userInput.trim() === "") return;
    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();

      return;
    }
    setIsLoading(true);
    // 处理包含对象的情况
    if (imgFileUrlList.length === 0) {
      chatStore.onUserInput(userInput, []).then(() => setIsLoading(false));
    } else {
      // 处理包含对象的情况
      setImgFileUrlList([]);
      const formattedList = imgFileUrlList.map(url => ({ imgUrl: url.imgUrl }));
      chatStore.onUserInput(userInput, formattedList).then(() => setIsLoading(false));
    }


    localStorage.setItem(LAST_INPUT_KEY, userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);

  };

  const onPromptSelect = (prompt: RenderPompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };

  useEffect(() => {
    chatStore.updateCurrentSession((session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
      e.preventDefault();
      return;
    }
    if (shouldSubmit(e) && promptHints.length === 0) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, message.content)) {
      if (userInput.length === 0) {
        setUserInput(message.content);
      }

      e.preventDefault();
    }
  };


  const uploadFileUrl = API_BASE_URL + '/v1/api/upload';

  type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

  const handleChange: UploadProps['onChange'] = (info) => {
    console.log(info)
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      if(200 != info.file.response.code){
        // 提示上传失败
        message.error(info.file.response.message);
      }else{
        console.log(info.file.response.data)
        setImgFileUrlList(info.file.response.data.map((url: string) => ({ imgUrl: url })));
      }
    }
  };

  const previewFile = (file:any) => {
    console.log(file.response.data[0])
    // window.open(file.response.data[0], '_blank');
    const newTab = window.open();
    if(newTab){
      newTab.document.body.innerHTML = `<img src="${file.response.data[0]}" alt="展示图片" />`;
    }


  }


  const [showUploadList, setShowUploadList] = useState(true);
  const beforeUpload = (file: FileType) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('你只能上传 JPG/PNG 文件!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小需要小于 2MB!');
      return false;
    }
    setShowUploadList(true);
    return isJpgOrPng && isLt2M;
  };

  const handleUploadRemove = () => {
    setImgFileUrlList([]);
  }

  const deleteMessage = (msgId?: string) => {
    chatStore.updateCurrentSession(
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input

    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }

    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }

    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);

    // resend the message
    setIsLoading(true);
    chatStore.onUserInput(userMessage.content, userMessage.fileMessages.map(url => ({ imgUrl: url }))).then(() => setIsLoading(false));

    inputRef.current?.focus();
  };

  const onPinMessage = (message: ChatMessage) => {
    chatStore.updateCurrentSession((session) =>
      session.mask.context.push(message),
    );

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);
  const accessStore = useAccessStore();

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content
  ) {
    const copiedHello = Object.assign({}, BOT_HELLO);
    if (!accessStore.isAuthorized()) {
      copiedHello.content = Locale.Error.Unauthorized;
    }
    context.push(copiedHello);
  }

  // preview messages
  const renderMessages = useMemo(() => {
    return context
      .concat(session.messages as RenderMessage[])
      .concat(
        isLoading
          ? [
              {
                ...createMessage({
                  role: "assistant",
                  content: "……",
                }),
                preview: true,
              },
            ]
          : [],
      )
      .concat(
        userInput.length > 0 && config.sendPreviewBubble
          ? [
              {
                ...createMessage({
                  role: "user",
                  content: userInput,
                }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    config.sendPreviewBubble,
    context,
    isLoading,
    session.messages,
    userInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };

  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  const [uploadLoading, setUploadLoading] = useState(false);


  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (text) => {
      if (accessStore.disableFastLink) return;
      console.log("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.update((access) => (access.accessCode = text));
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink) return;

      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        console.log("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          showConfirm(
            Locale.URLCommand.Settings +
              `\n${JSON.stringify(payload, null, 4)}`,
          ).then((res) => {
            if (!res) return;
            if (payload.key) {
              accessStore.update(
                (access) => (access.openaiApiKey = payload.key!),
              );
            }
            if (payload.url) {
              accessStore.update((access) => (access.openaiUrl = payload.url!));
            }
          });
        }
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });
  const [imgFileUrlList, setImgFileUrlList] = useState<Array<{ imgUrl: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const addData2FileUrlList = (data:string[]) => {
    // setImgFileUrlList([...imgFileUrlList, ...data]);
    // console.log(imgFileUrlList)
    setImgFileUrlList(prevList => [...prevList, ...data.map(url => ({ imgUrl: url }))]);
  };


  const data = [
    '👨我该怎么跟孩子解释，什么是地球磁暴呢？',
    '最近很迷惘，我该如何改变现状，有什么办法可以帮助我摆脱困境？',
  ];

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  const [isHovered, setIsHovered] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [userInfo, setUserInfo] = useState<{ userName: string, avatarUrl: string,email: string,openId: string } | null>(null);

  const getUserInfo = () =>{
    // 发送 GET 请求获取用户信息
    if(accessStore.accessCode){
      fetch(`${API_BASE_URL}/v1/api/getUserInfo`, {
        method: 'GET',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        },
      })
          .then(response => response.json())
          .then(data => {
            // 处理返回的用户信息数据
            if(data.success){
              setUserInfo(data.data);
            }else{
              showToast('请求频繁,请稍后再试！')
            }
          })
          .catch(error => {
            console.error('Error:', error);
            // 处理错误情况
          });
    }

  }

  const handleImg = (userInput:string) => {
    doSubmit(userInput);
    // 初始化图片list
    setImgFileUrlList([]);
    // 初始化上传文件组件
    setShowUploadList(false);
  }

  // const handleMouseEnter = (e) => {
  //   setIsHovered(true);
  //   setOffsetX(e.nativeEvent.offsetX);
  // };
  //
  // const handleMouseLeave = () => {
  //   setIsHovered(false);
  //   setOffsetX(0);
  // };
  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    getUserInfo();
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(key, dom?.value ?? "");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className={styles.chat} key={session.id}>
      {/*<FloatButton icon={<QuestionCircleOutlined />} type="primary" style={{ right: 24 }} />*/}
      { session.messages.length == 0 && (
          <div style={{position:'absolute',top:'40%',
            left: '50%',
            flexDirection: 'column',
            display: 'flex',
            zIndex: 100,
            transform: 'translate(-50%, -50%)'}}>
            <img src={FGpt.src} style={{width:'100px',height:'100px',alignSelf:'center'}}></img>
            <h3 style={{alignSelf:'center'}}>我今天能帮助你做些什么？</h3>
            <Divider orientation="left"></Divider>
            <AntList
                bordered
                dataSource={data}
                renderItem={(item) => (
                    <AntList.Item>
                     <a href={'#'}
                        style={{cursor:'pointer',color:'#1890ff'}}
                        onClick={()=>{doSubmit(item)}}>{item}</a>
                    </AntList.Item>
                )}
            />
          </div>
      )}
      <div className="window-header" data-tauri-drag-region>
        {isMobileScreen && (
          <div className="window-actions">
            <div className={"window-action-button"}>
              <IconButton
                icon={<ReturnIcon />}
                bordered
                title={Locale.Chat.Actions.ChatList}
                onClick={() => navigate(Path.Home)}
              />
            </div>
          </div>
        )}

        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
            onClickCapture={() => setIsEditingMessage(true)}
          >
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          <div className="window-header-sub-title">
            {Locale.Chat.SubTitle(session.messages.length)}
          </div>
        </div>
        <div className="window-actions">
          {!isMobileScreen && (
            <div className="window-action-button">
              <IconButton
                icon={<RenameIcon />}
                bordered
                onClick={() => setIsEditingMessage(true)}
              />
            </div>
          )}
          <div className="window-action-button">
            <IconButton
              icon={<ExportIcon width='16px' height='16px'/>}
              bordered
              title={Locale.Chat.Actions.Export}
              onClick={() => {
                setShowExport(true);
              }}
            />
          </div>
          {/*{showMaxIcon && (*/}
          {/*  <div className="window-action-button">*/}
          {/*    <IconButton*/}
          {/*      icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}*/}
          {/*      bordered*/}
          {/*      onClick={() => {*/}
          {/*        config.update(*/}
          {/*          (config) => (config.tightBorder = !config.tightBorder),*/}
          {/*        );*/}
          {/*      }}*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>

        <PromptToast
          showToast={!hitBottom}
          showModal={showPromptModal}
          setShowModal={setShowPromptModal}
        />
      </div>

      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onMouseDown={() => inputRef.current?.blur()}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          const isContext = i < context.length;
          const showActions =
            i > 0 &&
            !(message.preview || message.content.length === 0) &&
            !isContext;
          const showTyping = message.preview || message.streaming;

          const shouldShowClearContextDivider = i === clearContextIndex - 1;

          return (
            <Fragment key={message.id}>
              <div
                className={
                  isUser ? styles["chat-message-user"] : styles["chat-message"]
                }
              >
                <div className={styles["chat-message-container"]}>
                  <div className={styles["chat-message-header"]}>
                    <div className={styles["chat-message-avatar"]}>
                      <div className={styles["chat-message-edit"]}>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={async () => {
                            const newMessage = await showPrompt(
                              Locale.Chat.Actions.Edit,
                              message.content,
                              10,
                            );
                            chatStore.updateCurrentSession((session) => {
                              const m = session.mask.context
                                .concat(session.messages)
                                .find((m) => m.id === message.id);
                              if (m) {
                                m.content = newMessage;
                              }
                            });
                          }}
                        ></IconButton>
                      </div>
                      {isUser ? (
                        // <Avatar avatar={config.avatar} />
                          <AntAvatar
                              size={{ xs: 24, sm: 32, md: 40, lg: 40, xl: 40, xxl: 40 }}
                              className={styles.userAvatar} src={<img src={userInfo?.avatarUrl || ''} />} />
                      ) : (
                        <>
                          {["system"].includes(message.role) ? (
                            <Avatar avatar="2699-fe0f" />
                          ) : (
                            <MaskAvatar
                              avatar={session.mask.avatar}
                              model={
                                message.model || session.mask.modelConfig.model
                              }
                            />
                          )}
                        </>
                      )}
                    </div>

                    {showActions && (

                      <div className={styles["chat-message-actions"]}>

                        <div className={styles["chat-input-actions"]}>
                          {message.streaming ? (
                            <ChatAction
                              text={Locale.Chat.Actions.Stop}
                              icon={<StopIcon />}
                              onClick={() => onDelete(message.id?.toString() ?? i.toString())}
                            />
                          ) : (
                            <>
                              <ChatAction
                                text={Locale.Chat.Actions.Retry}
                                icon={<ResetIcon />}
                                onClick={() => onResend(message)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Delete}
                                icon={<DeleteIcon />}
                                onClick={() => onDelete(message.id?.toString() ?? i.toString())}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Pin}
                                icon={<PinIcon />}
                                onClick={() => onPinMessage(message)}
                              />
                              <ChatAction
                                text={Locale.Chat.Actions.Copy}
                                icon={<CopyIcon />}
                                onClick={() => copyToClipboard(message.content)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {showTyping && (
                    <div className={styles["chat-message-status"]}>
                      {Locale.Chat.Typing}
                    </div>
                  )}
                  <div className={styles["chat-message-item"]}>
                    <Markdown
                        content={message.fileMessages ? (
                            message.fileMessages.map((file) => {
                              return `![](${file})`;
                            }).join("\n")+'\n' + message.content
                        ) : (
                            message.content
                        )}
                      // content={message.fileMessages.map((file) => {
                      //   return `![](${file})`;
                      // }).join("\n")+'\n' + message.content}
                      loading={
                        (message.preview || message.streaming) &&
                        message.content.length === 0 &&
                        !isUser
                      }
                      onContextMenu={(e) => onRightClick(e, message)}
                      onDoubleClickCapture={() => {
                        if (!isMobileScreen) return;
                        setUserInput(message.content);
                      }}
                      fontSize={fontSize}
                      parentRef={scrollRef}
                      defaultShow={i >= messages.length - 6}
                    />
                  </div>

                  <div className={styles["chat-message-action-date"]}>
                    {isContext
                      ? Locale.Chat.IsContext
                      : message.date.toLocaleString()}
                  </div>
                </div>
              </div>
              {shouldShowClearContextDivider && <ClearContextDivider />}
            </Fragment>
          );
        })}
      </div>

      <div style={{'margin':'20px',marginBottom:'1%',width:'30%',border:'1px #ff2222'}}>
        <Upload
            name={"files"}
            accept="image/png, image/jpeg"
            action={uploadFileUrl}
            maxCount={1}
            headers={{ Token: accessStore.accessCode }}
            listType="picture"
            showUploadList = {showUploadList}
            onPreview={previewFile}
            onRemove={handleUploadRemove}
            beforeUpload={beforeUpload}
            onChange={handleChange}
        >
          <IconButton
              icon={<UploadIcon />}
              className={styles["chat-input-upload"]}
              // text={Locale.UI.Import}
              bordered
              // onClick={handleButtonClick}
          />
        </Upload>
        {imgFileUrlList.length > 0 && (
            <div style={{fontSize:'12px',width:'130px',fontWeight: 600}}>
              {/*<a style={{display:'block',color:'rgb(29, 147, 171)',cursor:'pointer',backgroundColor:'rgba(0, 0, 0, .03)'*/}
              {/*  ,marginBottom:'2px',padding:'4px',borderRadius:'3px',transition: 'background ease .2s'}}*/}
              {/*   // onMouseEnter={handleMouseEnter}*/}
              {/*   // onMouseLeave={handleMouseLeave}*/}
              {/*   href={'#'}*/}
              {/*   onClick={() => handleImg('从图像中提取文字')}*/}
              {/*>*/}
              {/*  从图像中提取文字 ➡</a>*/}
              <a style={{display:'block',color:'rgb(29, 147, 171)'
                ,cursor:'pointer',backgroundColor:'rgba(0, 0, 0, .03)',padding:'4px',borderRadius:'3px',transition: 'background ease .2s'}}
                 // onMouseEnter={handleMouseEnter}
                 // onMouseLeave={handleMouseLeave}
                 href={'#'}
                 onClick={() => handleImg('描述一下这张图片')}
              >
                描述以下这张图片 ➡</a>
            </div>
        )}

      </div>


      {/*{chatStore.currentSession().mask.modelConfig.model.includes('月之暗面AI大模型') && (*/}
      {/*    <div style={{'marginBottom':'7px'}}>*/}
      {/*      <label style={{'color':'rgb(144 144 144)',fontSize:'13px',marginLeft:'20px'}}>该模型支持对文件进行提问，请上传文件，解读较正常文本回答耗时较长请耐心等待</label>*/}
      {/*      <br/>*/}
      {/*      {uploadLoading && (*/}
      {/*          <span style={{color:"red",marginLeft:'15px'}}>数据上传中...</span>*/}
      {/*      )}*/}

      {/*      {imgFileUrlList.length > 0 && (*/}
      {/*          <div style={{'display':'flex','marginTop':'10px'}}>*/}
      {/*            {imgFileUrlList.map((imgFile, index) => (*/}
      {/*                <div key={index} style={{'marginLeft':'10px'}}>*/}
      {/*                  <span>附件+{index}</span>*/}
      {/*                  <IconButton*/}
      {/*                      icon={<DeleteIcon/>} onClick={() => handleRemoveImage(imgFile.imgUrl)}*/}
      {/*                  />*/}
      {/*                </div>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*      )}*/}
      {/*    </div>*/}

      {/*)}*/}

      {/*{chatStore.currentSession().mask.modelConfig.model == 'gemini-pro-vision-(极速、联网支持、识图)-(1次/1500积分🔥)' && (*/}
      {/*    <div style={{'marginBottom':'7px'}}>*/}
      {/*      <label style={{'color':'rgb(144 144 144)',fontSize:'13px',marginLeft:'20px'}}>该模型支持对图片文件进行提问，请上传图片,最大图片数量：5张，图片解读较正常文本回答耗时较长请耐心等待</label>*/}
      {/*      <br/>*/}
      {/*      {imgFileUrlList.length > 0 && (*/}
      {/*          <div style={{'display':'flex','marginTop':'10px'}}>*/}
      {/*            {imgFileUrlList.map((imgFile, index) => (*/}
      {/*                <div key={index} style={{'marginLeft':'10px'}}>*/}
      {/*                  <PhotoProvider>*/}
      {/*                    <PhotoView src={imgFile.imgUrl}>*/}
      {/*                      <img src={imgFile.imgUrl} alt="" width={50} height={50}/>*/}
      {/*                    </PhotoView>*/}
      {/*                  </PhotoProvider>*/}
      {/*                  <IconButton*/}
      {/*                              icon={<DeleteIcon/>} onClick={() => handleRemoveImage(imgFile.imgUrl)}*/}
      {/*                  />*/}
      {/*                </div>*/}
      {/*            ))}*/}
      {/*          </div>*/}
      {/*      )}*/}
      {/*    </div>*/}

      {/*)}*/}

      <div className={styles["chat-input-panel"]}>
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        <ChatActions
          showPromptModal={() => setShowPromptModal(true)}
          scrollToBottom={scrollToBottom}
          hitBottom={hitBottom}
          showPromptHints={() => {
            // Click again to close
            if (promptHints.length > 0) {
              setPromptHints([]);
              return;
            }

            inputRef.current?.focus();
            setUserInput("/");
            onSearch("");
          }}
        />
        <div className={styles["chat-input-panel-inner"]}>
          {/*<div style={{marginRight:'10px',height:'79px'}}>*/}
            {/*<input type="file" onChange={handleFileSubmit} style={{ display: 'none' }} ref={fileInputRef} multiple accept="image/*"/>*/}

          {/*</div>*/}
          {/*{chatStore.currentSession().mask.modelConfig.model.includes('月之暗面AI大模型') && (*/}
          {/*    <div style={{marginRight:'10px',height:'79px'}}>*/}
          {/*      <input type="file" onChange={handleFileSubmit} style={{ display: 'none' }} ref={fileInputRef}/>*/}
          {/*      <IconButton*/}
          {/*          icon={<UploadIcon />}*/}
          {/*          className={styles["chat-input-upload"]}*/}
          {/*          // text={Locale.UI.Import}*/}
          {/*          bordered*/}
          {/*          onClick={handleButtonClick}*/}

          {/*      />*/}
          {/*    </div>*/}
          {/*)}*/}


          {/*{'gemini-pro-vision-(极速、联网支持、识图)-(1次/1500积分🔥)' == chatStore.currentSession().mask.modelConfig.model && (*/}
          {/*    <div style={{marginRight:'10px',height:'79px'}}>*/}
          {/*      <input type="file" onChange={handleFileSubmit} style={{ display: 'none' }} ref={fileInputRef} multiple accept="image/*"/>*/}
          {/*      <IconButton*/}
          {/*          icon={<UploadIcon />}*/}
          {/*          className={styles["chat-input-upload"]}*/}
          {/*          // text={Locale.UI.Import}*/}
          {/*          bordered*/}
          {/*          onClick={handleButtonClick}*/}

          {/*      />*/}
          {/*    </div>*/}
          {/*)}*/}

          <textarea
            ref={inputRef}
            className={styles["chat-input"]}
            placeholder={Locale.Chat.Input(submitKey)}
            onInput={(e) => onInput(e.currentTarget.value)}
            value={userInput}
            onKeyDown={onInputKeyDown}
            onFocus={scrollToBottom}
            onClick={scrollToBottom}
            rows={inputRows}
            autoFocus={autoFocus}
            style={{
              fontSize: config.fontSize,
            }}
          />


          <IconButton
            icon={<SendWhiteIcon />}
            text={Locale.Chat.Send}
            className={styles["chat-input-send"]}
            type="primary"
            onClick={() => doSubmit(userInput)}
          />


        </div>

      </div>

      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}
    </div>
  );
}

export function Chat() {
  const chatStore = useChatStore();
  const sessionIndex = chatStore.currentSessionIndex;
  return <_Chat key={sessionIndex}></_Chat>;
}
