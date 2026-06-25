import { handleTableReorder } from './table-utils';
import type {
  Table,
  Row
} from '@tanstack/react-table';

interface TestRow {
  id: string;
  val: string;
}

describe('handleTableReorder', () => {
  const createMockTable = (rows: TestRow[]): Table<TestRow> => {
    return {
      getRowModel: () => ({
        rows: rows.map(r => ({ id: r.id } as Row<TestRow>)),
      }),
    } as unknown as Table<TestRow>;
  };

  it('should shift item down and update state and trigger onReorder callback', () => {
    const data: TestRow[] = [
      { id: 'row-1', val: 'A' },
      { id: 'row-2', val: 'B' },
      { id: 'row-3', val: 'C' },
      { id: 'row-4', val: 'D' },
    ];

    const table = createMockTable(data);
    const onReorderSpy = vi.fn();
    const setDataSpy = vi.fn();

    // Drag row-1 over row-3 (moving down)
    handleTableReorder({
      activeId: 'row-1',
      overId: 'row-3',
      table,
      data,
      onReorder: onReorderSpy,
      setData: setDataSpy,
    });

    expect(onReorderSpy).toHaveBeenCalledWith('row-1', 'row-3');
    expect(setDataSpy).toHaveBeenCalledWith([
      { id: 'row-2', val: 'B' },
      { id: 'row-3', val: 'C' },
      { id: 'row-1', val: 'A' },
      { id: 'row-4', val: 'D' },
    ]);
  });

  it('should shift item up and update state and trigger onReorder callback', () => {
    const data: TestRow[] = [
      { id: 'row-1', val: 'A' },
      { id: 'row-2', val: 'B' },
      { id: 'row-3', val: 'C' },
      { id: 'row-4', val: 'D' },
    ];

    const table = createMockTable(data);
    const onReorderSpy = vi.fn();
    const setDataSpy = vi.fn();

    // Drag row-3 over row-2 (moving up)
    handleTableReorder({
      activeId: 'row-3',
      overId: 'row-2',
      table,
      data,
      onReorder: onReorderSpy,
      setData: setDataSpy,
    });

    expect(onReorderSpy).toHaveBeenCalledWith('row-3', 'row-1');
    expect(setDataSpy).toHaveBeenCalledWith([
      { id: 'row-1', val: 'A' },
      { id: 'row-3', val: 'C' },
      { id: 'row-2', val: 'B' },
      { id: 'row-4', val: 'D' },
    ]);
  });

  it('should handle dragging to the very top (index 0) correctly', () => {
    const data: TestRow[] = [
      { id: 'row-1', val: 'A' },
      { id: 'row-2', val: 'B' },
      { id: 'row-3', val: 'C' },
    ];

    const table = createMockTable(data);
    const onReorderSpy = vi.fn();
    const setDataSpy = vi.fn();

    // Drag row-3 over row-1 (moving up to the top)
    handleTableReorder({
      activeId: 'row-3',
      overId: 'row-1',
      table,
      data,
      onReorder: onReorderSpy,
      setData: setDataSpy,
    });

    expect(onReorderSpy).toHaveBeenCalledWith('row-3', null);
    expect(setDataSpy).toHaveBeenCalledWith([
      { id: 'row-3', val: 'C' },
      { id: 'row-1', val: 'A' },
      { id: 'row-2', val: 'B' },
    ]);
  });

  it('should do nothing if activeId or overId cannot be found in table rows', () => {
    const data: TestRow[] = [
      { id: 'row-1', val: 'A' },
      { id: 'row-2', val: 'B' },
    ];

    const table = createMockTable(data);
    const onReorderSpy = vi.fn();
    const setDataSpy = vi.fn();

    handleTableReorder({
      activeId: 'non-existent',
      overId: 'row-2',
      table,
      data,
      onReorder: onReorderSpy,
      setData: setDataSpy,
    });

    expect(onReorderSpy).not.toHaveBeenCalled();
    expect(setDataSpy).not.toHaveBeenCalled();
  });
});
