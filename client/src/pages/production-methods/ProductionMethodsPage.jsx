import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { productionMethodsApi } from '../../services';

export default function ProductionMethodsPage() {
  return (
    <SimpleCrudPage
      title="วิธีการผลิต (Production Methods)"
      api={productionMethodsApi}
      fields={[
        { name: 'code', label: 'รหัส (1 ตัวอักษร)', required: true },
        { name: 'name', label: 'ชื่อวิธีการผลิต', required: true },
        { name: 'description', label: 'คำอธิบาย', multiline: true },
      ]}
    />
  );
}
