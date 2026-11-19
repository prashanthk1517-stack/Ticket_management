import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import { DataTable, Modal } from '../components/ui';
import { usePagination } from '../hooks/usePagination';
import { useDebounce } from '../hooks/useDebounce';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { useToggle } from '../hooks/useToggle';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

interface Person {
  id: string;
  name: string;
  age: number;
}

const people: Person[] = [
  { id: '2', name: 'Morgan', age: 34 },
  { id: '1', name: 'Alex', age: 28 },
];

const columns = [
  { key: 'name', header: 'Name', sortable: true },
  {
    key: 'age',
    header: 'Age',
    render: (value: unknown) => <strong>{String(value)} years</strong>,
  },
];

function PaginatedPeopleTable() {
  const [page, setPage] = useState(1);

  return (
    <DataTable
      data={people}
      columns={columns}
      getRowId={(person) => person.id}
      pagination={{
        page,
        pageSize: 1,
        totalItems: people.length,
        onPageChange: setPage,
      }}
    />
  );
}

describe('DataTable', () => {
  it('sorts generic rows, renders custom cells, and pages controlled data', async () => {
    const user = userEvent.setup();
    render(<PaginatedPeopleTable />);

    expect(screen.getByText('Morgan')).not.toBeNull();
    expect(screen.getByText('34 years')).not.toBeNull();

    await user.click(screen.getByRole('button', { name: 'Sort by name' }));
    expect(screen.getByText('Alex')).not.toBeNull();
    expect(screen.queryByText('Morgan')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Morgan')).not.toBeNull();
  });

  it('keeps pagination callbacks stable while moving between pages', async () => {
    const user = userEvent.setup();

    function PaginationExample() {
      const { currentPage, totalPages, nextPage } = usePagination(12, {
        initialPageSize: 5,
      });

      return (
        <>
          <p>Page {currentPage} of {totalPages}</p>
          <button type="button" onClick={nextPage}>Next page</button>
        </>
      );
    }

    render(<PaginationExample />);
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 3')).not.toBeNull();
  });

  it('exposes row selection through a controlled callback', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <DataTable
        data={people}
        columns={columns}
        getRowId={(person) => person.id}
        rowSelection={{ selectedIds: [], onSelect }}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'Select row 2' }));
    expect(onSelect).toHaveBeenCalledWith(people[0], true);
  });

  it('loads virtualization on demand and mounts a small window of rows', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return this.classList.contains('data-table__scroll') ? 520 : 0;
    });
    const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
      id: `ticket-${index}`,
      name: `Ticket ${index}`,
      age: index,
    }));

    const { container } = render(
      <DataTable
        data={largeDataset}
        columns={columns}
        getRowId={(ticket) => ticket.id}
        virtualized
        caption="Large ticket list"
      />,
    );
    await waitFor(() => {
      const renderedRows = container.querySelectorAll('tbody tr[data-index]');
      expect(renderedRows.length).toBeGreaterThan(0);
      expect(renderedRows.length).toBeLessThan(30);
    });
  });
});

describe('Modal', () => {
  it('traps keyboard focus, closes with Escape, and restores focus', async () => {
    const user = userEvent.setup();

    function ModalExample() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open modal</button>
          <Modal open={open} onClose={() => setOpen(false)} ariaLabelledBy="modal-title">
            <Modal.Header id="modal-title">Example dialog</Modal.Header>
            <Modal.Body><input aria-label="First field" /></Modal.Body>
            <Modal.Footer>
              <button type="button">Cancel</button>
              <button type="button">Confirm</button>
            </Modal.Footer>
          </Modal>
        </>
      );
    }

    render(<ModalExample />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    await user.click(trigger);

    const firstField = screen.getByRole('textbox', { name: 'First field' });
    const lastAction = screen.getByRole('button', { name: 'Confirm' });
    expect(document.activeElement).toBe(firstField);

    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(document.activeElement).toBe(lastAction);
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('supports the compound Trigger and Content API', async () => {
    const user = userEvent.setup();

    render(
      <Modal ariaLabelledBy="compound-modal-title" size="sm">
        <Modal.Trigger>Open compound modal</Modal.Trigger>
        <Modal.Content>
          <Modal.Header id="compound-modal-title">Compound dialog</Modal.Header>
          <Modal.Body>Compound modal body</Modal.Body>
          <Modal.Footer>
            <button type="button">Cancel</button>
          </Modal.Footer>
        </Modal.Content>
      </Modal>,
    );

    await user.click(screen.getByRole('button', { name: 'Open compound modal' }));
    expect(screen.getByRole('dialog')).not.toBeNull();
    expect(screen.getByText('Compound modal body')).not.toBeNull();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Reusable hooks', () => {
  it('debounces a changing value', async () => {
    vi.useFakeTimers();

    function DebounceExample() {
      const [value, setValue] = useState('');
      const debouncedValue = useDebounce(value, 200);
      return (
        <>
          <input aria-label="Search" value={value} onChange={(event) => setValue(event.target.value)} />
          <span>{debouncedValue || 'waiting'}</span>
        </>
      );
    }

    render(<DebounceExample />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Search' }), {
      target: { value: 'ticket' },
    });
    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(screen.getByText('waiting')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByText('ticket')).not.toBeNull();
    vi.useRealTimers();
  });

  it('toggles boolean UI state', () => {
    function ToggleExample() {
      const { isOpen, toggle, close } = useToggle();
      return (
        <>
          <button type="button" onClick={toggle}>Toggle</button>
          <button type="button" onClick={close}>Close</button>
          <span>{isOpen ? 'open' : 'closed'}</span>
        </>
      );
    }

    render(<ToggleExample />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.getByText('open')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByText('closed')).not.toBeNull();
  });

  it('detects outside clicks and cleans up listeners', () => {
    const outside = vi.fn();

    function OutsideExample() {
      const ref = useRef<HTMLDivElement>(null);
      useOutsideClick(ref, outside);
      return <div ref={ref}>Inside</div>;
    }

    render(<OutsideExample />);
    fireEvent.pointerDown(document.body);
    expect(outside).toHaveBeenCalledTimes(1);
  });
});
