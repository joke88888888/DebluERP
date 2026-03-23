import { Box } from '@mui/material';
import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { colorsApi } from '../../services';

const hexCol = {
  field: 'hex_code', headerName: 'สี', width: 80,
  renderCell: (p) => p.value ? (
    <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: p.value, border: '1px solid #ccc' }} />
  ) : null
};

export default function ColorsPage() {
  return (
    <SimpleCrudPage
      title="สี (Colors)"
      api={colorsApi}
      fields={[
        { name: 'code', label: 'รหัส (3 ตัวอักษร)', required: true },
        { name: 'name', label: 'ชื่อสี', required: true },
        { name: 'name_en', label: 'ชื่อสี (English)', required: false },
        { name: 'hex_code', label: 'HEX Code (#RRGGBB)', required: false },
      ]}
      extraColumns={[hexCol]}
    />
  );
}
