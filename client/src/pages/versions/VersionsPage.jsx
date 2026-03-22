import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { versionsApi } from '../../services';

export default function VersionsPage() {
  return (
    <SimpleCrudPage
      title="เวอร์ชัน (Versions)"
      api={versionsApi}
      fields={[
        { name: 'code', label: 'รหัส (1 ตัวอักษร)', required: true },
        { name: 'name', label: 'ชื่อเวอร์ชัน', required: true },
        { name: 'description', label: 'คำอธิบาย', multiline: true },
      ]}
    />
  );
}
