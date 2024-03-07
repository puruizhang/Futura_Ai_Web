import React, {useEffect, useState} from 'react';
import styles from './deawing.module.scss';
import {Input, showConfirm, showModal, showPrompt, showToast} from "./ui-lib";
import {IconButton} from "./button";
import {Button} from "emoji-picker-react/src/components/atoms/Button";
import ResetIcon from "../icons/reload.svg";
import Locale from "../locales";
import API_BASE_URL from "../../config";
import {ModalConfigValidator, useAccessStore} from "../store";
import ShareIcon from "../icons/share.svg";
import DeleteIcon from "../icons/delete.svg";
import {InputRange} from "./input-range";
import {copyToClipboard} from "../utils";
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

export function Drawing() {
    const [hoveredIndex, setHoveredIndex] = useState<null | number>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [currentTab, setCurrentTab] = useState('me');
    const [columnCount, setColumnCount] = useState(6); // 设置瀑布流布局的列数
    const initialColumns = new Array(columnCount).fill([]).map(() => []);
    const [meColumns, setMeColumns] = useState<any[][]>(initialColumns);
    const [publicColumns, setPublicColumns] = useState<any[][]>(initialColumns);
    const accessStore = useAccessStore.getState();
    const [mePageNo, setMePageNo] = useState(0);
    const [mePageLast, setMePageLast] = useState(0);
    const [publicPageNo, setPublicPageNo] = useState(0);
    const [publicPageLast, setPublicPageLast] = useState(0);

    const handleMenuClick = (page: any) => {
        setCurrentTab(page);
        if(page == 'me'){
            getImgList(0,0);
        }else{
            getImgList(0,1);
        }
    };

    // 折叠
    const foldDraw = () => {
        setFileUrl('');
    }

    const getImgList = (pageNo:number,isShare:number) => {
        fetch(`${API_BASE_URL}/v1/api/draw/page?page=`+pageNo+'&isShare='+isShare,{
            method: 'GET',
            headers: {
                'Token': accessStore.accessCode,
            }
        })
            .then(response => response.json())
            .then(data => {
                if(!data.success){
                    showToast(data.data,undefined,3000)
                    return;
                }
                if(isShare == 0){
                    console.log(data.data.length)
                    if(data.data.length < 10){
                        setMePageLast(1);
                    }
                }else{
                    console.log(data.data.length)
                    if(data.data.length < 10){
                        setPublicPageLast(1);
                    }
                }
                if(pageNo === 0){
                    setMeColumns(initialColumns);
                    setPublicColumns(initialColumns);
                }

                data.data.forEach((imageUrl:any, index:number) => {
                    const columnIndex = index % columnCount;
                    if(isShare == 0){

                        setMeColumns(prevColumns => {
                            const allImageUrls = prevColumns.flatMap(column => column.map((item: string) => item));

                            // 获取所有图片链接
                            if (!allImageUrls.includes(imageUrl.fileUrl)) { // 检查整个布局中是否存在相同的图片链接
                                const newColumns = prevColumns.map((column, index) => {
                                    if (index === columnIndex) { // 找到目标列
                                        return [...column, imageUrl]; // 将新的 imageUrl 添加到对应的列中
                                    }
                                    return column;
                                });
                                return newColumns; // 返回更新后的 columns 状态
                            } else {
                                // 处理重复链接的情况，这里可以根据具体需求进行操作，比如给出提示或者忽略重复链接
                                console.log("该图片链接已存在于布局中。");
                                return prevColumns; // 返回原始状态
                            }
                        });

                        console.log(meColumns);
                    }else{
                        setPublicColumns(prevColumns => {
                            const allImageUrls = prevColumns.flatMap(column => column.map((item: string) => item)); // 获取所有图片链接
                            if (!allImageUrls.includes(imageUrl.fileUrl)) { // 检查整个布局中是否存在相同的图片链接
                                const newColumns = prevColumns.map((column, index) => {
                                    if (index === columnIndex) { // 找到目标列
                                        return [...column, imageUrl]; // 将新的 imageUrl 添加到对应的列中
                                    }
                                    return column;
                                });
                                return newColumns; // 返回更新后的 columns 状态
                            } else {
                                // 处理重复链接的情况，这里可以根据具体需求进行操作，比如给出提示或者忽略重复链接
                                console.log("该图片链接已存在于布局中。");
                                return prevColumns; // 返回原始状态
                            }
                        });
                    }

                });
            })
            .catch(error => {
                console.error('Error:', error);
                // 处理错误情况
            });
    };


    const share2Public = async (e:any, drawRecordId:string, share:number) => {
        e.stopPropagation();
        if (await showConfirm(share==1 ? '确认分享到公开图库？':'确认取消分享到公开图库？')) {
            fetch(`${API_BASE_URL}/v1/api/draw/shareStatus`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Token': accessStore.accessCode,
                },
                body: JSON.stringify({
                    drawRecordId: drawRecordId,
                    share: share
                }),
            })
                .then(response => response.json())
                .then(data => {
                    if (!data.success) {
                        showToast(data.data, undefined, 3000)
                        return;
                    }
                    showToast(share==1 ? '分享成功！' :'取消分享成功！');
                    getImgList(0,share == 1 ? 0 : 1);
                })
                .catch(error => {
                    console.error('Error:', error);
                    // 处理错误情况
                });
        }

    }

    const handleMouseEnter = (columnIndex:number, index:number) => {
        const imageIndex = columnIndex + index * columnCount;
        setHoveredIndex(imageIndex);
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
    };

    /**
     *  加载更多我的绘图
     */
    const loadMoreMeDraw = () => {
        showToast('正在获取数据中，请稍后！');
        setMePageNo(mePageNo + 1);
    }
    /**
     *  加载更多我的绘图
     */
    const loadMorePublicDraw = () => {
        showToast('正在获取数据中，请稍后！');
        setPublicPageNo(publicPageNo + 1);
    }

    useEffect(() => {
        getImgList(publicPageNo, currentTab === 'public' ? 1 : 0)
    }, [publicPageNo]);

    useEffect(() => {
        getImgList(mePageNo, currentTab === 'public' ? 1 : 0)
    }, [mePageNo]);

    return (
        <div style={{width:'100%'}}>


            <div style={{'padding':'16px','display':'flex'}}>
                <Input placeholder='请输入绘图提示词,最大长度100个字符' style={{'flex':'1','marginRight':'10px'}}
                       maxLength={100}
                       onChange={(e) => setPrompt(e.currentTarget.value)}
                ></Input>
                <IconButton
                    className="drawmButton"
                    key="reset"
                    icon={<ResetIcon />}
                    disabled={isLoading}
                    bordered
                    text='生成图片'
                    onClick={async () => {
                        setIsLoading(true);
                        setFileUrl('https://static.iamxk.com/wp-content/uploads/2018/01/568200051cf000e77269.gif')
                        fetch(`${API_BASE_URL}/v1/api/draw`,{
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Token': accessStore.accessCode,
                            },
                            body: JSON.stringify({
                                prompt: prompt,
                            }),
                        })
                            .then(response => response.json())
                            .then(data => {
                                if(!data.success){
                                    showToast(data.data,undefined,3000)
                                    // 请求完成，loading 结束
                                    setIsLoading(false);
                                    setFileUrl('');
                                    return;
                                }
                                // 请求完成，loading 结束
                                setIsLoading(false);
                                // 把图片链接加载到 预定区域
                                setFileUrl(data.data)
                                // 刷新我的图库列表
                                setMeColumns(initialColumns);
                                getImgList(0,0);
                            })
                            .catch(error => {
                                console.error('Error:', error);
                                // 处理错误情况
                            });
                    }}
                />
            </div>
            {fileUrl && (
                <div style={{textAlign:'center'}}>
                    <img src={fileUrl}
                         width='160px' height='160px' style={{padding:'16px',borderRadius: '8px',margin:'auto',border: '2px solid #ccc'}}/>
                    <hr/>
                    <a href={'#'} onClick={foldDraw}>收起</a>
                </div>
            )}

            <hr/>
            <div style={{display:'flex'}}>
                <div className={`${styles.tab} ${currentTab === "me" ? styles.active : ""}`} onClick={() => handleMenuClick("me")}>我的图库</div>
                <div className={`${styles.tab} ${currentTab === "public" ? styles.active : ""}`} onClick={() => handleMenuClick("public")}>公开图库</div>
                <InputRange
                    className={styles.inputRange}
                    value={columnCount?.toFixed(1)}
                    min="2"
                    max="6" // lets limit it to 0-1
                    step="1"
                    onChange={(e) => {
                        setColumnCount(
                            e.currentTarget.valueAsNumber
                        );
                    }}
                ></InputRange>
            </div>
            {/*<hr style={{backgroundColor:'#ffffff'}}/>*/}
            {currentTab=='me' && (
                <div style={{height:'100%'}}>
                    <div className="image-layout-container" style={{height:'66%'
                        ,display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`
                        , gap: '20px', padding: '16px', overflowY: 'auto'}}>
                        <PhotoProvider>
                        {meColumns.map((column, columnIndex) => (
                            <div key={columnIndex}>

                                {column.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className={`image-item ${columnIndex + index * columnCount === hoveredIndex ? 'hovered' : ''}`}
                                        onMouseEnter={() => handleMouseEnter(columnIndex, index)}
                                        onMouseLeave={handleMouseLeave}
                                        style={{
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                            borderRadius: '8px',
                                            // overflow: 'hidden',
                                            marginBottom: '20px',
                                            position: 'relative', // 添加相对定位
                                        }}
                                    >

                                            <PhotoView src={imageUrl.fileUrl}>
                                                <img
                                                    // onClick={() => handleZoomIn(imageUrl.fileUrl)}
                                                    src={imageUrl.fileUrl} alt={`Image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                            </PhotoView>



                                        {columnIndex + index * columnCount === hoveredIndex && (
                                            <div>
                                                <div className="image-text"
                                                     onClick={() => {
                                                         copyToClipboard(imageUrl.prompt);
                                                     }}
                                                     style={{ cursor: 'pointer', position: 'absolute', bottom: '0', left: '0', right: '0', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0 0 8px 8px' }}>
                                                    {imageUrl.prompt}
                                                </div>
                                                <ShareIcon onClick={(e:any) => share2Public(e,imageUrl.id,1)}
                                                           style={{ position: 'absolute', top: '0', right: '0', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '0 0 8px 8px',cursor:'pointer' }}
                                                />
                                            </div>

                                        )}
                                    </div>
                                ))}

                            </div>
                        ))}
                        </PhotoProvider>
                    </div>
                    {mePageLast==0 && (
                        <div style={{textAlign:'center'}}>
                            <a href='#' onClick={loadMoreMeDraw}>加载更多...</a>
                        </div>
                    )
                    }
                </div>

            )}

            {currentTab=='public' && (
                <div style={{height:'100%'}}>

                    <div className="image-layout-container" style={{height:'66%' , display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: '20px', padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 32px)' }}>

                        <PhotoProvider>
                        {publicColumns.map((column, columnIndex) => (
                            <div key={columnIndex}>
                                {column.map((imageUrl, index) => (
                                    <div
                                        key={index}
                                        className={`image-item ${columnIndex + index * columnCount === hoveredIndex ? 'hovered' : ''}`}
                                        onMouseEnter={() => handleMouseEnter(columnIndex, index)}
                                        onMouseLeave={handleMouseLeave}
                                        style={{
                                            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            marginBottom: '20px',
                                            position: 'relative', // 添加相对定位
                                        }}
                                    >
                                        <PhotoView src={imageUrl.fileUrl}>
                                            <img
                                                // onClick={() => handleZoomIn(imageUrl.fileUrl)}
                                                src={imageUrl.fileUrl} alt={`Image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                        </PhotoView>
                                        {columnIndex + index * columnCount === hoveredIndex && (
                                            <div>
                                                <div className="image-text"
                                                     onClick={() => {
                                                         copyToClipboard(imageUrl.prompt);
                                                     }}
                                                     style={{cursor: 'pointer', position: 'absolute', bottom: '0', left: '0', right: '0', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '0 0 8px 8px' }}>
                                                    {imageUrl.prompt}
                                                </div>

                                                <DeleteIcon onClick={(e:any) => share2Public(e,imageUrl.id,0)}
                                                            style={{ position: 'absolute', top: '0', right: '0', padding: '8px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '0 0 8px 8px',cursor:'pointer' }}
                                                />
                                            </div>

                                        )}
                                    </div>
                                ))}
                            </div>

                    ))}
                        </PhotoProvider>
                </div>
                    {publicPageLast==0 && (
                        <div style={{textAlign:'center'}}>
                            <a href='#' onClick={loadMorePublicDraw}>加载更多...</a>
                        </div>
                    )
                    }
                </div>
                    )}

        </div>

    );
}
