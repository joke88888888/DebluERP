import SimpleCrudPage from '../../components/common/SimpleCrudPage';
import { categoriesApi } from '../../services';

export default function CategoriesPage() {
  return (
    <SimpleCrudPage
      title="ประเภทสินค้า (Categories)"
      api={categoriesApi}
      fields={[
        { name: 'code', label: 'รหัส (1 ตัวอักษร)', required: true },
        { name: 'name', label: 'ชื่อประเภท', required: true },
        { name: 'description', label: 'คำอธิบาย', multiline: true },
      ]}
    />
  );
}
