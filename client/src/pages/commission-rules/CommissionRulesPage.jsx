import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { commissionRulesApi } from '../../services';
import { Chip } from '@mui/material';

const conditionLabels = { before_delivery: 'ก่อนส่งสินค้า', within_credit: 'ภายในเครดิต', after_credit: 'หลังเครดิต' };

export default function CommissionRulesPage() {
  return (
    <SimpleCrudPage
      title="เงื่อนไข Commission"
      api={commissionRulesApi}
      fields={[
        { name: 'name', label: 'ชื่อเงื่อนไข', required: true },
        { name: 'condition_type', label: 'ประเภท', required: true, options: [
          { value: 'before_delivery', label: 'ก่อนส่งสินค้า (Before Delivery)' },
          { value: 'within_credit', label: 'ภายในเครดิต (Within Credit)' },
          { value: 'after_credit', label: 'หลังเครดิต (After Credit)' },
        ]},
        { name: 'days_after_credit', label: 'จำนวนวันหลังเครดิต (เฉพาะ after_credit)', type: 'number' },
        { name: 'commission_percent', label: 'Commission (%)', required: true, type: 'number' },
        { name: 'description', label: 'คำอธิบาย', multiline: true },
      ]}
      extraColumns={[
        {
          field: 'condition_type', headerName: 'ประเภท', width: 160,
          renderCell: (p) => <Chip label={conditionLabels[p.value] || p.value} size="small" />
        },
        { field: 'commission_percent', headerName: 'Commission %', width: 120 },
      ]}
    />
  );
}
