
import React from 'react';
import SearchableSelect from '@/components/ui/searchable-select';

interface Option {
  id: string;
  name: string;
}

interface NoteFormSelectProps {
  options: Option[];
  value: string | string[];
  onValueChange: (value: string | string[]) => void;
  placeholder?: string;
  multiple?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
}

const NoteFormSelect: React.FC<NoteFormSelectProps> = (props) => {
  return <SearchableSelect {...props} />;
};

export default NoteFormSelect;
