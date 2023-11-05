import { Table, Col, Card } from "antd";
import { useMediaQuery } from "react-responsive";
const customCSS = `
  .table-diem-danh .ant-table-content .negative-lech-row .ant-table-cell{
    border-top: 2px solid yellow;
    border-bottom: 2px solid yellow;
  }
  .table-diem-danh .ant-table-content .negative-het-han .ant-table-cell:last-child{
    background-color:#fdc6bf;
  }
    .table-diem-danh .ant-table-content .negative-lech-row .ant-table-cell:first-child{
      border-left: 2px solid yellow;
    }
    .table-diem-danh .ant-table-content .negative-lech-row .ant-table-cell:last-child{
      border-right: 2px solid yellow;
    }
    .table-diem-danh .ant-table-content .negative-lech-row:hover .ant-table-cell{
      border-color: #c0c0c0;
    }
`;

interface BaseTableProps {
  columns: any[];
  data: any[];
  gridOption: any;
  loading: boolean;
}
const BaseTable: React.FC<BaseTableProps> = ({
  columns,
  data,
  gridOption,
  loading
}) => {
  const isMobile = useMediaQuery({ minWidth: 600 });
  // const dataWithKeys = data.map((item, index) => ({ ...item, key: index }));
  return (
    <div>
      <style>{customCSS}</style>
      {isMobile ? (
        <Table
          columns={columns}
          dataSource={data}
          {...gridOption}
          pagination={true}
          loading={loading}
          className="table-diem-danh"
          rowClassName={(record) => {
            const loaiLop = record.loai;
            const yeuCau = getYeuCauForLop(loaiLop);
            const currentDate = new Date(); // Lấy ngày hiện tại

            if (!yeuCau) {
              return "";
            }

            const isNegativeCount = record.count - yeuCau < 0;
            const isExpired = new Date(record.ngay_dong_setting) < currentDate;

            if (isNegativeCount && isExpired) {
              return "negative-lech-row negative-het-han";
            } else if (isNegativeCount) {
              return "negative-lech-row";
            }
            return "";
          }}
        />
      ) : (
        <div className="card-chi-tiet-diem-danh">
          {data.length === 0 ? (
            <div>Không có giá trị nào thỏa mãn</div>
          ) : (
            data.map((record, key) => {
              return (
                <Col span={24} key={key} className="my-2">
                  <Card>
                    <p>
                      <strong>Tên giảng viên:</strong>{" "}
                      {record?.lop?.giao_viens
                        ? Array.from(
                            new Set(
                              record.lop.giao_viens.map(
                                (record: any) => record.name
                              )
                            )
                          ).join(", ")
                        : ""}
                    </p>
                    <p>
                      <strong>Mã học phần:</strong> {record?.ma_hp}
                    </p>
                    <p>
                      <strong>Tên học phần:</strong> {record?.ten_hp}
                    </p>
                    <p>
                      <strong>Mã lớp:</strong> {record?.ma}
                    </p>
                    <p>
                      <strong>Loại:</strong> {record?.loai}
                    </p>
                    <p>
                      <strong>Tuần học:</strong> {record?.tuan_hoc}
                    </p>
                    <p>
                      <strong>Số lần điểm danh:</strong> {record?.count}
                    </p>
                    <p>
                      <strong>Tuần đóng điểm danh:</strong> {record?.count}
                    </p>
                    <p>
                      <strong>Yêu cầu:</strong>{" "}
                      {record?.lop?.loai === "BT" || record?.loai === "LT"
                        ? 1
                        : record?.lop?.loai === "BT+LT" ||
                          record?.lop?.loai === "LT+BT"
                        ? 2
                        : 0}
                    </p>
                    <p>
                      <strong>Lệch:</strong>{" "}
                      {record?.count -
                        (record?.loai === "BT" || record?.loai === "LT"
                          ? 1
                          : record?.loai === "BT+LT" || record?.loai === "LT+BT"
                          ? 2
                          : 0)}
                    </p>
                  </Card>
                </Col>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default BaseTable;

function getYeuCauForLop(loaiLop: string) {
  if (loaiLop === "BT" || loaiLop === "LT") {
    return 1;
  } else if (loaiLop === "BT+LT" || loaiLop === "LT+BT") {
    return 2;
  }
  return null;
}
