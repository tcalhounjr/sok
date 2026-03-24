/**
 * Frontend unit tests: FilterPresetModal component
 * Mirrors: src/components/filters/FilterPresetModal.tsx
 *
 * Covers: create mode, edit mode (pre-populated fields), type selector changes
 *         value options, save mutation calls, delete confirmation with
 *         preset.searches.length, cancel closes modal.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const { mockUseMutation } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(),
}));

vi.mock('@apollo/client', () => ({
  useMutation: mockUseMutation,
  gql: (strings: TemplateStringsArray) => strings.join(''),
}));

vi.mock('../components/ui/Modal', () => ({
  Modal: ({
    open,
    onClose,
    title,
    children,
  }: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div data-testid="modal">
        <span data-testid="modal-title">{title}</span>
        <button data-testid="modal-close-x" onClick={onClose}>X</button>
        {children}
      </div>
    ) : null,
}));

vi.mock('../components/ui/KeywordTag', () => ({
  KeywordTag: ({
    label,
    onRemove,
  }: {
    label: string;
    onRemove?: () => void;
  }) => (
    <span data-testid="selected-value">
      {label}
      {onRemove && (
        <button data-testid={`deselect-${label}`} onClick={onRemove}>
          remove
        </button>
      )}
    </span>
  ),
}));

vi.mock('lucide-react', () => ({
  SlidersHorizontal: () => <span />,
  Trash2:            () => <span />,
}));

import { FilterPresetModal } from '../components/filters/FilterPresetModal';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PRESET_FIXTURE = {
  id: 'fp-1',
  name: 'Tier 1 Sources',
  type: 'SOURCE_TIER' as const,
  value: 'US',    // Use a simple value from REGION type to avoid colon chars in assertions
  searches: [
    { id: 's1', name: 'Search A', keywords: ['chip'], status: 'active' as const, createdAt: '', updatedAt: '' },
    { id: 's2', name: 'Search B', keywords: ['fab'],  status: 'active' as const, createdAt: '', updatedAt: '' },
  ],
};

const mockCreateFn = vi.fn();
const mockUpdateFn = vi.fn();
const mockDeleteFn = vi.fn();

beforeEach(() => {
  mockUseMutation.mockReset();
  mockCreateFn.mockReset();
  mockUpdateFn.mockReset();
  mockDeleteFn.mockReset();

  // The component calls useMutation 3 times per render: CREATE, UPDATE, DELETE.
  // Use modulo-based implementation so every re-render cycle maps correctly
  // regardless of how many times the component re-renders.
  let callCount = 0;
  mockUseMutation.mockImplementation(() => {
    const slot = callCount % 3;
    callCount++;
    if (slot === 0) return [mockCreateFn, { loading: false }];
    if (slot === 1) return [mockUpdateFn, { loading: false }];
    return [mockDeleteFn, { loading: false }];
  });
});

function renderCreate(onClose = vi.fn()) {
  return render(<FilterPresetModal open={true} onClose={onClose} preset={null} />);
}

function renderEdit(preset = PRESET_FIXTURE, onClose = vi.fn()) {
  return render(<FilterPresetModal open={true} onClose={onClose} preset={preset} />);
}

// ===========================================================================
// Closed state
// ===========================================================================

describe('FilterPresetModal — closed', () => {
  it('should not render when open is false', () => {
    render(<FilterPresetModal open={false} onClose={vi.fn()} preset={null} />);
    expect(screen.queryByTestId('modal')).toBeNull();
  });
});

// ===========================================================================
// Create mode
// ===========================================================================

describe('FilterPresetModal — create mode', () => {
  it('should render the modal title', () => {
    renderCreate();
    expect(screen.getByTestId('modal-title').textContent).toBe('Filter Preset Engine');
  });

  it('should render the PRESET NAME input as empty in create mode', () => {
    renderCreate();
    const input = screen.getByPlaceholderText('e.g. Tier 1 US Sources') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('should render the FILTER TYPE selector defaulting to SOURCE TIER', () => {
    renderCreate();
    const select = screen.getByDisplayValue('SOURCE TIER') as HTMLSelectElement;
    expect(select).toBeDefined();
  });

  it('should render available type-value options for the default SOURCE_TIER type', () => {
    renderCreate();
    expect(screen.getByText('+ Tier 1: Premium Publishers')).toBeDefined();
  });

  it('should not render the Discard Preset button in create mode', () => {
    renderCreate();
    expect(screen.queryByText('Discard Preset')).toBeNull();
  });

  it('should render the Save Preset Logic button', () => {
    renderCreate();
    expect(screen.getByText('Save Preset Logic')).toBeDefined();
  });

  it('should disable Save Preset Logic when name is empty and no values selected', () => {
    renderCreate();
    const saveBtn = screen.getByText('Save Preset Logic') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
  });
});

// ===========================================================================
// Edit mode — pre-populated fields
// ===========================================================================

describe('FilterPresetModal — edit mode', () => {
  it('should pre-populate the name field with the preset name', () => {
    renderEdit();
    const input = screen.getByDisplayValue('Tier 1 Sources') as HTMLInputElement;
    expect(input).toBeDefined();
  });

  it('should pre-populate the selected value from the preset', () => {
    renderEdit();
    expect(screen.getByTestId('selected-value')).toBeDefined();
    // preset.value='US'; verify the selected value tag renders
    expect(screen.getByTestId('selected-value').textContent).toContain('US');
  });

  it('should render the Discard Preset button in edit mode', () => {
    renderEdit();
    expect(screen.getByText('Discard Preset')).toBeDefined();
  });
});

// ===========================================================================
// preset.searches.length in impact preview
// ===========================================================================

describe('FilterPresetModal — impact preview with preset.searches.length', () => {
  it('should display the count of searches linked to the preset in the impact preview', () => {
    renderEdit();
    // PRESET_FIXTURE.searches has 2 entries — should show "2" in the panel
    expect(screen.getByText('2')).toBeDefined();
  });

  it('should display 0 searches when the preset has no linked searches', () => {
    const presetNoSearches = { ...PRESET_FIXTURE, searches: [] };
    renderEdit(presetNoSearches);
    expect(screen.getByText('0')).toBeDefined();
  });

  it('should show 0 in the impact preview when rendered in create mode (no preset)', () => {
    renderCreate();
    // null preset means searches.length ?? 0 = 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});

// ===========================================================================
// Type selector changes option list
// ===========================================================================

describe('FilterPresetModal — type selector changes available values', () => {
  it('should show SENTIMENT values when SENTIMENT type is selected', async () => {
    renderCreate();
    const select = screen.getByDisplayValue('SOURCE TIER') as HTMLSelectElement;
    await userEvent.selectOptions(select, 'SENTIMENT');
    expect(screen.getByText('+ POSITIVE')).toBeDefined();
    expect(screen.getByText('+ NEUTRAL')).toBeDefined();
  });

  it('should show REGION values when REGION type is selected', async () => {
    renderCreate();
    const select = screen.getByDisplayValue('SOURCE TIER') as HTMLSelectElement;
    await userEvent.selectOptions(select, 'REGION');
    expect(screen.getByText('+ US')).toBeDefined();
  });
});

// ===========================================================================
// Value toggling
// ===========================================================================

describe('FilterPresetModal — value toggling', () => {
  it('should add a value to the selected list when a + button is clicked', async () => {
    renderCreate();
    await userEvent.click(screen.getByText('+ Tier 1: Premium Publishers'));
    const selectedTag = screen.getByTestId('selected-value');
    expect(selectedTag.textContent).toContain('Tier 1: Premium Publishers');
  });

  it('should remove a value from the selected list when its KeywordTag remove action fires', async () => {
    renderCreate();
    await userEvent.click(screen.getByText('+ Tier 1: Premium Publishers'));
    expect(screen.getByTestId('selected-value')).toBeDefined();

    await userEvent.click(screen.getByTestId('deselect-Tier 1: Premium Publishers'));
    expect(screen.queryByTestId('selected-value')).toBeNull();
  });

  it('should update the projected reduction percentage as values are selected', async () => {
    renderCreate();
    // SOURCE_TIER has 4 options; selecting 2 should show ceil(2/4 * 65) = 33%
    await userEvent.click(screen.getByText('+ Tier 1: Premium Publishers'));
    await userEvent.click(screen.getByText('+ Tier 2: Specialized Tech'));
    expect(screen.getByText('33%')).toBeDefined();
  });
});

// ===========================================================================
// Create mutation
// ===========================================================================

describe('FilterPresetModal — create mutation', () => {
  it('should call createFilterPreset with correct variables when Save is clicked in create mode', async () => {
    renderCreate();
    const nameInput = screen.getByPlaceholderText('e.g. Tier 1 US Sources') as HTMLInputElement;

    await userEvent.type(nameInput, 'My Preset');
    await userEvent.selectOptions(screen.getByDisplayValue('SOURCE TIER'), 'SENTIMENT');
    await userEvent.click(screen.getByText('+ POSITIVE'));

    const saveBtn = screen.getByText('Save Preset Logic').closest('button') as HTMLButtonElement;
    expect(saveBtn).toBeDefined();
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);

    expect(mockCreateFn).toHaveBeenCalledWith({
      variables: {
        input: {
          name:  'My Preset',
          type:  'SENTIMENT',
          value: 'Include Exactly:POSITIVE',
        },
      },
    });
  });

  it('should not call createFilterPreset when name is empty', async () => {
    renderCreate();
    await userEvent.click(screen.getByText('+ Tier 1: Premium Publishers'));
    // Save Preset Logic should be disabled (name is empty) so click has no effect
    const saveBtn = screen.getByText('Save Preset Logic') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);
    expect(mockCreateFn).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Update mutation
// ===========================================================================

describe('FilterPresetModal — update mutation', () => {
  it('should call updateFilterPreset when Save is clicked in edit mode', async () => {
    renderEdit();

    // Wait for useEffect to flush selected state from preset
    await act(async () => {});

    const saveBtn = screen.getByText('Save Preset Logic').closest('button') as HTMLButtonElement;
    expect(saveBtn).toBeDefined();
    expect(saveBtn.disabled).toBe(false);

    fireEvent.click(saveBtn);

    expect(mockUpdateFn).toHaveBeenCalledWith({
      variables: {
        id:    'fp-1',
        input: {
          name:  'Tier 1 Sources',
          type:  'SOURCE_TIER',
          // PRESET_FIXTURE.value='US' has no colon so useEffect sets operator='Include Exactly', selected=['US']
          // handleSave encodes: `${operator}:${selected.join(',')}` → 'Include Exactly:US'
          value: 'Include Exactly:US',
        },
      },
    });
  });
});

// ===========================================================================
// Delete mutation
// ===========================================================================

describe('FilterPresetModal — delete mutation', () => {
  it('should call deleteFilterPreset with the preset id when Discard Preset is clicked', async () => {
    renderEdit();
    await userEvent.click(screen.getByText('Discard Preset'));
    expect(mockDeleteFn).toHaveBeenCalledWith({ variables: { id: 'fp-1' } });
  });
});

// ===========================================================================
// Cancel
// ===========================================================================

describe('FilterPresetModal — cancel', () => {
  it('should call onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    renderCreate(onClose);
    await userEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });
});

// ===========================================================================
// Loading state
// ===========================================================================

describe('FilterPresetModal — loading state', () => {
  it('should disable the Discard Preset button when any mutation is in flight in edit mode', () => {
    // Reset and override: deleting=true so loading=true
    mockUseMutation.mockReset();
    let lsCallCount = 0;
    mockUseMutation.mockImplementation(() => {
      const slot = lsCallCount % 3;
      lsCallCount++;
      if (slot === 0) return [mockCreateFn, { loading: false }];
      if (slot === 1) return [mockUpdateFn, { loading: false }];
      return [mockDeleteFn, { loading: true }];
    });

    renderEdit();
    // When deleting=true, the Discard Preset button is disabled
    const discardBtn = screen.getByText('Discard Preset') as HTMLButtonElement;
    expect(discardBtn.disabled).toBe(true);
  });
});
