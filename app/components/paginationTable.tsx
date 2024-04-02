import React, { useEffect, useState, useMemo } from 'react';
import { useTable, usePagination } from 'react-table';
import { useAccessStore } from "../store";
import styles from "./home.module.scss";
import { IconButton } from "./button";
import {showToast} from "./ui-lib";
import API_BASE_URL from "../../config";
import {Table, TableProps, DatePicker} from "antd";
import locale from 'antd/es/date-picker/locale/zh_CN';

import 'dayjs/locale/zh-cn';

const accessStore = useAccessStore.getState();

export function PaginationTable() {
    const [backendData, setBackendData] = useState([]);
    const [totalPages, setTotalPages] = useState(0);
    const [startTimestamp, setStartTimestamp] = useState('');
    const [endTimestamp, setEndTimestamp] = useState('');
    const [pageIndex, setPageIndex] = useState(0);

    const { RangePicker } = DatePicker;


    interface DataType {
        title: string;
        name: string;
        age: number;
        address: string;
    }

    const columns = [
        {
            title: '请求耗时',
            dataIndex: 'elapsedTime',
            key: 'elapsedTime',
        },
        {
            title: '积分',
            dataIndex: 'tokens',
            key: 'tokens',
        },
        {
            title: '动作',
            dataIndex: 'modelName',
            key: 'modelName',
        },
        {
            title: '发送时间',
            key: 'createTime',
            dataIndex: 'createTime',
        }
        // ,
        // {
        //     title: 'Action',
        //     key: 'action',
        //     render: (_, record) => (
        //         <Space size="middle">
        //             <a>Invite {record.name}</a>
        //             <a>Delete</a>
        //         </Space>
        //     ),
        // },
    ];

    const data: DataType[] = useMemo(() => backendData, [backendData]);


    // const data = useMemo(() => backendData, [backendData]);

    // const columns = useMemo(() => [
    //     { Header: '请求耗时', accessor: 'elapsedTime' },
    //     // { Header: '发送', accessor: 'sendMessageLength' },
    //     // { Header: '接收', accessor: 'receiveMessageLength' },
    //     { Header: '积分消耗', accessor: 'tokens' },
    //     { Header: '模型名称', accessor: 'modelName' },
    //     { Header: '发送时间', accessor: 'createTime' },
    // ], []);

    // const {
    //     getTableProps,
    //     getTableBodyProps,
    //     headerGroups,
    //     page,
    //     prepareRow,
    //     nextPage,
    //     previousPage,
    //     canNextPage,
    //     canPreviousPage,
    //     pageOptions,
    //     // state: { pageIndex },
    // } = useTable(
    //     {
    //         columns,
    //         data,
    //         initialState: { pageIndex: 0 },
    //     },
    //     usePagination
    // );

    const fetchData = async () => {
        try {

            const response = await fetch(`${API_BASE_URL}/v1/api/tokenLogs?page=${pageIndex}&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}`, {
                method: 'GET',
                headers: {
                    'Token': accessStore.accessCode,
                },
            });
            const result = await response.json();
            if (result.success) {
                setBackendData(result.data.content);
                setTotalPages(result.data.totalPages);
            }else{
                showToast('操作过快，请刷新重试')
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [pageIndex]);

    const handleSearch = () => {
        fetchData();
    };

    const getPageContent= (page:number,pageSize:number)=>{
        console.log(page, pageSize);
        setPageIndex(page)
    }

    const onDateChange = (value:any, dateString:any) => {
        console.log('Selected Time: ', value);
        console.log('Formatted Selected Time: ', dateString);
        setStartTimestamp(dateString[0]);
        setEndTimestamp(dateString[1]);
    }

    return (
        <div className={styles.recordTable}>
            <div className={styles.recordTableHeader}>
                <RangePicker onChange={onDateChange} format='YYYY-MM-DD HH:mm:ss' locale={locale}/>
                <IconButton
                    className={styles.tableSearchButton}
                    text="搜索"
                    type="primary"
                    onClick={handleSearch}
                />
            </div>

            {/*<div className={styles.recordTableHeader}>*/}
            {/*    <input type="date" className={styles.tableSearch} value={startTimestamp} onChange={(e) => setStartTimestamp(e.target.value)} placeholder="开始时间" />*/}
            {/*    <input type="date" className={styles.tableSearch} value={endTimestamp} onChange={(e) => setEndTimestamp(e.target.value)} placeholder="结束时间" />*/}
            {/*  */}
            {/*</div>*/}
            <Table
                locale={{emptyText: '暂无数据'}}
                dataSource={data} pagination={{ total:totalPages*10,pageSize:10,onChange: getPageContent, }} columns={columns}/>;
            {/*<div style={{overflowY: 'auto','height':'310px'}}>*/}



                {/*<table style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: '#FFFFFF', marginRight: '20px', fontSize: '12px', overflowY: 'auto', maxHeight: '200px' }} {...getTableProps()}>*/}
                {/*    <thead>*/}
                {/*    {headerGroups.map((headerGroup: any)  => (*/}
                {/*        <tr {...headerGroup.getHeaderGroupProps()}>*/}
                {/*            {headerGroup.headers.map((column: any) => (*/}
                {/*                <th*/}
                {/*                    {...column.getHeaderProps()}*/}
                {/*                    style={{*/}
                {/*                        padding: '10px',*/}
                {/*                        borderBottom: '1px solid #DDDDDD',*/}
                {/*                        background: '#EEEEEE',*/}
                {/*                        fontWeight: 'bold',*/}
                {/*                    }}*/}
                {/*                >*/}
                {/*                    {column.render('Header')}*/}
                {/*                </th>*/}
                {/*            ))}*/}
                {/*        </tr>*/}
                {/*    ))}*/}
                {/*    </thead>*/}
                {/*    <tbody {...getTableBodyProps()}>*/}
                {/*    {page.map((row :any) => {*/}
                {/*        prepareRow(row);*/}
                {/*        return (*/}
                {/*            <tr {...row.getRowProps()}>*/}
                {/*                {row.cells.map((cell: any) => (*/}
                {/*                    <td*/}
                {/*                        {...cell.getCellProps()}*/}
                {/*                        key={cell.id}*/}
                {/*                        style={{*/}
                {/*                            padding: '10px',*/}
                {/*                            borderBottom: '1px solid #DDDDDD',*/}
                {/*                        }}*/}
                {/*                    >*/}
                {/*                        {cell.render('Cell')}*/}
                {/*                    </td>*/}
                {/*                ))}*/}
                {/*            </tr>*/}
                {/*        );*/}
                {/*    })}*/}
                {/*    </tbody>*/}
                {/*</table>*/}


                {/*<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px',marginBottom:'20px' }}>*/}
                {/*    <button*/}
                {/*        onClick={handlePreviousPage}*/}
                {/*        style={{*/}
                {/*            padding: '8px 16px',*/}
                {/*            marginRight: '8px',*/}
                {/*            backgroundColor: '#F5F5F5',*/}
                {/*            border: '1px solid #DDDDDD',*/}
                {/*            borderRadius: '4px',*/}
                {/*            color: '#333333',*/}
                {/*            cursor: 'pointer',*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        上一页*/}
                {/*    </button>*/}
                {/*    <button*/}
                {/*        onClick={handleNextPage}*/}
                {/*        style={{*/}
                {/*            padding: '8px 16px',*/}
                {/*            backgroundColor: '#F5F5F5',*/}
                {/*            border: '1px solid #DDDDDD',*/}
                {/*            borderRadius: '4px',*/}
                {/*            color: '#333333',*/}
                {/*            cursor: 'pointer',*/}
                {/*        }}*/}
                {/*    >*/}
                {/*        下一页*/}
                {/*    </button>*/}
                {/*    <span style={{ marginLeft: '8px', color: '#666666' }}>*/}
                {/*    页 {pageIndex + 1} / {totalPages}*/}
                {/*</span>*/}
                {/*</div>*/}
            {/*</div>*/}

        </div>
    );
}
