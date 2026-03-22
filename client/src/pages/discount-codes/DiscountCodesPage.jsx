import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { discountCodesApi } from '../../services';

export default function DiscountCodesPage() {
  return (
    <SimpleCrudPage
      title="โค้ดส่วนลด (Discount Codes)"
      api={discountCodesApi}
      fields={[
        { name: 'code', label: 'รหัสส่วนลด', required: true },
        { name: 'name', label: 'ชื่อส่วนลด', required: true },
        { name: 'discount_type', label: 'ประเภท (percentage/fixed)', required: true },
        { name: 'discount_value', label: 'มูลค่าส่วนลด', required: true, type: 'number' },
        { name: 'start_date', label: 'วันที่เริ่ม', type: 'date' },
        { name: 'end_date', label: 'วันที่สิ้นสุด', type: 'date' },
        { name: 'max_usage', label: 'จำนวนครั้งที่ใช้ได้ (ว่าง = ไม่จำกัด)', type: 'number' },
      ]}
    />
  );
}
