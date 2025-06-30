
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface DataFilterProps<T> {
  data: T[];
  filterFn: (item: T, permissions: ReturnType<typeof useUserPermissions>) => boolean;
  children: (filteredData: T[]) => React.ReactNode;
}

function DataFilter<T>({ data, filterFn, children }: DataFilterProps<T>) {
  const permissions = useUserPermissions();

  if (permissions.isLoading) {
    return <div className="flex items-center justify-center p-4">Carregando...</div>;
  }

  const filteredData = data.filter(item => filterFn(item, permissions));
  return <>{children(filteredData)}</>;
}

export default DataFilter;
