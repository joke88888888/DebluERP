import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { sizesApi } from '../../services';

export default function SizesPage() {
  return (
    <SimpleCrudPage
      title="ขนาด (Sizes)"
      api={sizesApi}
      fields={[
        { name: 'code', label: 'รหัส (2 ตัวอักษร)', required: true },
        { name: 'size_value', label: 'ขนาด (36, 37, ...)', required: true },
        { name: 'size_system', label: 'ระบบ (EU/US/UK)', required: false },
      ]}
    />
  );
}
