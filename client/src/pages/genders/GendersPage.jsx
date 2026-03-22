import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { gendersApi } from '../../services';

export default function GendersPage() {
  return (
    <SimpleCrudPage
      title="เพศ (Genders)"
      api={gendersApi}
      fields={[
        { name: 'code', label: 'รหัส (1 ตัวอักษร)', required: true },
        { name: 'name', label: 'ชื่อ (EN)', required: true },
        { name: 'name_th', label: 'ชื่อ (TH)', required: true },
      ]}
    />
  );
}
