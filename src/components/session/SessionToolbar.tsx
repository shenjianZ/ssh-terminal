import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { memo } from 'react';

interface SessionToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
}

export const SessionToolbar = memo(function SessionToolbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
}: SessionToolbarProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索会话..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => onFilterChange('all')}
        >
          全部
        </Button>
        <Button
          size="sm"
          variant={filter === 'connected' ? 'default' : 'outline'}
          onClick={() => onFilterChange('connected')}
        >
          已连接
        </Button>
        <Button
          size="sm"
          variant={filter === 'disconnected' ? 'default' : 'outline'}
          onClick={() => onFilterChange('disconnected')}
        >
          已断开
        </Button>
      </div>
    </div>
  );
});
