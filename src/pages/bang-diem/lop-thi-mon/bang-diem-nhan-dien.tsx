import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import {
  CellEditingStoppedEvent,
  GetRowIdParams,
  ColDef
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { FC, useCallback, useEffect, useState } from "react";
import { convertLinkToBackEnd } from "@/utils/url";
import { useLocation } from "react-router-dom";
import diemLopThiApi from "@/api/bangDiem/diemLopThi.api";
import { Checkbox } from "antd";

const defaultColDef = {
  flex: 1,
  resizable: true,
  editable: true
};
interface Diem {
  bang_diem_id?: number;
  diem: 3.14 | number;
  mssv: string;
  page?: number;
  stt: string | number;
  create_at?: string;
  update_at?: string;
}
interface CompareDiem {
  diem_goc: Diem;
  diem_nd: Diem;
  status: number;
}
interface Props {
  diemData: any;
  setDiemEdit: (value: any) => void;
  setCountDiemSai: (value: number) => void;
}

const baseApi = convertLinkToBackEnd("/sohoa/api");

const DiemNhanDien: FC<Props> = ({
  diemData,
  setDiemEdit,
  setCountDiemSai
}) => {
  const loca = useLocation();
  const path = loca.pathname.split("/");
  const [diemCompare, setDiemCompare] = useState<CompareDiem[]>([]);
  const [diemNhanDien, setDiemNhanDien] = useState<Diem[]>([]);
  const [columnDefs, setColumDefs] = useState<ColDef[]>([]);
  const lopThiId = path[path.length - 1];
  const [conFirmData, setConFirmData] = useState<CompareDiem>();
  const [count, setCount] = useState(0);

  const columNhanDien = [
    {
      field: "stt",
      headerName: "STT",
      sortable: true,
      maxWidth: 100,
      valueGetter: (params: any) =>
        params.data.diem_goc ? parseInt(params.data.diem_goc.stt) : "",
      editable: false
    },
    {
      field: "mssv",
      headerName: "MSSV",
      maxWidth: 200,
      valueGetter: (params: any) =>
        params.data.diem_goc ? params.data.diem_goc.mssv : "",
      editable: false
    },
    {
      field: "diem_goc.diem",
      headerName: "Điểm",
      valueGetter: (params: any) =>
        params.data.diem_goc ? parseFloat(params.data.diem_goc.diem) : ""
    },
    {
      field: "Xác nhận",
      cellRenderer: ConfirmCellRender,
      cellRendererParams: {
        setValue: setConFirmData
      },
      editable: false
    }
  ];
  const columHadDiem = [
    {
      field: "stt",
      headerName: "STT",
      sortable: true,
      maxWidth: 100,
      editable: false
    },
    {
      field: "mssv",
      headerName: "MSSV",
      sortable: true,
      editable: false
    },
    {
      field: "diem",
      headerName: "Điểm",
      sortable: true
    }
  ];

  const getDiemNhanDien = async () => {
    try {
      const res = await diemLopThiApi.nhanDienList({ id: lopThiId });
      setDiemNhanDien(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const compareDiem = () => {
    const diem_cache: any[] = [];
    let count = 0;
    // lấy dữ liệu bảng nhận diện và điền vào bảng điểm
    const mergeArr = diemData.diem.map((init: Diem) => {
      const itemMatching = diemNhanDien.find(
        (itemA) => Number(itemA.mssv) === Number(init.mssv)
      );
      const diem_goc = itemMatching
        ? { ...init, diem: itemMatching.diem || 0 }
        : { ...init, diem: 0 };
      diem_cache.push(diem_goc);
      const status = Number(diem_goc.stt) === Number(itemMatching?.stt) ? 0 : 1;
      return {
        diem_goc,
        diem_nd: itemMatching || null,
        status
      };
    });

    // tìm những sinh viên sai mssv và stt
    const diem_sai = diemData.diem.filter(
      (item: Diem) =>
        !diemNhanDien.some(
          (item2: Diem) => item2.mssv !== item.mssv && item2.stt !== item.stt
        )
    );

    // tìm những sinh viên sai mssv
    // const diem_du = diemNhanDien.filter(
    //   (item: Diem) =>
    //     !diemData.diem.some((item2: Diem) => item2.mssv === item.mssv)
    // );

    // if (diem_du.length > 0) {
    //   diem_du.forEach((itemA: Diem) => {
    //     mergeArr.forEach((itemB: CompareDiem) => {
    //       if (Number(itemA.stt) === Number(itemB.diem_goc.stt) && itemA.mssv !== itemB.diem_goc.mssv) {
    //         itemB.diem_goc.diem = 0;
    //         itemB.status = 2;
    //       }
    //     });
    //   });
    // }

    if (diem_sai.length > 0) {
      diem_sai.forEach((itemA: Diem) => {
        mergeArr.forEach((itemB: CompareDiem) => {
          if (Number(itemA.stt) === Number(itemB.diem_goc.stt)) {
            itemB.diem_goc.diem = 0;
            itemB.status = 2;
          }
        });
      });
    }
    mergeArr.forEach((item: CompareDiem) => {
      if (item.status !== 0) count++;
    });

    setDiemCompare(mergeArr);
    setDiemEdit(diem_cache);
    setCount(count);
    setCountDiemSai(count);
  };

  const onCellEditingStopped = useCallback(
    (event: CellEditingStoppedEvent) => {
      if (!diemData.had_diem) {
        const updatedDiem = diemCompare.map((itemA: CompareDiem) => {
          if (itemA.diem_goc.mssv === event.data.diem_goc.mssv) {
            return {
              ...event.data.diem_goc,
              stt: Number(event.data.diem_goc.stt)
            };
          }
          return { ...itemA.diem_goc };
        });
        // setDiemCompare((pre)=> ([...pre,pre[indexChange] = {...pre[indexChange],status:0}]))
        setDiemEdit(updatedDiem);
      } else {
        const updatedDiem = diemData.diem.map((itemA: Diem) => {
          if (itemA.mssv === event.data.mssv) {
            return {
              ...event.data,
              stt: Number(event.data.stt)
            };
          }
          return { ...itemA };
        });
        setDiemEdit(updatedDiem);
      }
    },
    [diemData, diemCompare]
  );

  const getRowStyle = (params: any) => {
    if (
      params.data.status === 1 &&
      Number(params.data.diem_nd?.stt) !== Number(params.data.diem_goc?.stt) &&
      !diemData.had_diem
    ) {
      return { background: "#ffff71" };
    }
    // else if (!diemData.had_diem && params.data.status === 2) {
    //   return { background: "yellow" };
    // }
    else if (!diemData.had_diem && params.data.status === 2) {
      return { background: "red" };
    } else {
      return { background: "white" };
    }
  };

  useEffect(() => {
    if (!diemData.had_diem) {
      setColumDefs(columNhanDien);
      getDiemNhanDien();
    } else {
      setColumDefs(columHadDiem);
    }
  }, []);

  useEffect(() => {
    if (diemNhanDien.length > 0 && !diemData.had_diem) {
      compareDiem();
    }
  }, [diemData, diemNhanDien]);

  useEffect(() => {
    if (conFirmData) {
      const newDiem = diemCompare.map((item) => {
        if (item.diem_goc.mssv === conFirmData.diem_goc.mssv) {
          conFirmData.status === 0
            ? setCount((pre) => pre - 1)
            : setCount((pre) => pre + 1);
          return { ...item, status: conFirmData.status };
        } else {
          return item;
        }
      });

      setDiemCompare(newDiem);
    }
  }, [conFirmData]);

  useEffect(() => {
    setCountDiemSai(count);
  }, [count]);

  const getRowId = useCallback(function (params: GetRowIdParams) {
    return diemData.had_diem ? params.data.stt : params.data.diem_goc.stt;
  }, []);

  return (
    <div className="flex gap-4">
      <div className="col-span-1 flex-1 pdf">
        <iframe
          className="w-full"
          src={`${baseApi}/bang-diem/show-slice-pdf/${path[path.length - 1]}`}
        ></iframe>
      </div>
      <div className="flex-1">
        <AgGridReact
          className="ag-theme-alpine bang_diem_ag"
          rowData={diemData.had_diem ? diemData.diem : diemCompare}
          defaultColDef={defaultColDef}
          enableCellTextSelection
          columnDefs={columnDefs}
          onCellEditingStopped={onCellEditingStopped}
          getRowStyle={getRowStyle}
          getRowId={getRowId}
        ></AgGridReact>
      </div>
    </div>
  );
};

export default DiemNhanDien;
const ConfirmCellRender: FC<{
  data: CompareDiem;
  setValue: (data: CompareDiem) => void;
}> = ({ data, setValue }) => {
  const [newData, setNewData] = useState<CompareDiem>();
  const handleCheckboxChange = (e: any) => {
    const dataChange = { ...data, status: e.target.checked ? 0 : 2 };
    setNewData(dataChange);
    setValue(dataChange);
  };

  return (
    <Checkbox
      checked={newData ? newData.status === 0 : data.status === 0}
      onChange={handleCheckboxChange}
    />
  );
};
