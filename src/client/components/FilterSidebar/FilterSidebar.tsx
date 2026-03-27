import { Drawer } from 'antd';
import { FilterForm, type FilterFormProps } from './FilterForm.js';

const DRAWER_BODY_STYLE = { body: { display: 'flex', flexDirection: 'column' as const, padding: 16, overflow: 'hidden' } };

interface FilterSidebarProps extends FilterFormProps {
  drawerOpen?: boolean;
  onDrawerClose?: () => void;
}

export { FilterForm } from './FilterForm.js';

export function FilterSidebar(props: FilterSidebarProps) {
  const { drawerOpen, onDrawerClose, ...formProps } = props;

  return (
    <Drawer
      title="Filters"
      open={drawerOpen}
      onClose={onDrawerClose}
      placement="left"
      size="default"
      styles={DRAWER_BODY_STYLE}
    >
      <FilterForm {...formProps} />
    </Drawer>
  );
}
