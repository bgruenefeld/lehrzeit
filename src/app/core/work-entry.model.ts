export type WorkCategory =
  'LESSON' | 'PREPARATION' | 'CONFERENCE' | 'PARENT_TALK' | 'SUBSTITUTION' | 'OTHER' | 'MINUS_HOURS';

export interface WorkEntry {
  readonly id: string;
  readonly category: WorkCategory;
  readonly date: string;
  readonly durationMinutes: number;
  readonly note: string;
  readonly createdAt: string;
}

export type NewWorkEntry = Pick<WorkEntry, 'category' | 'date' | 'durationMinutes' | 'note'>;

export const CATEGORY_META: ReadonlyArray<{
  id: WorkCategory;
  label: string;
  icon: string;
  color: string;
}> = [
  {
    id: 'LESSON',
    label: 'Unterricht',
    icon: 'pi pi-book',
    color: '#176b87',
  },
  {
    id: 'PREPARATION',
    label: 'Vor- & Nachbereitung',
    icon: 'pi pi-pencil',
    color: '#7256a5',
  },
  {
    id: 'CONFERENCE',
    label: 'Konferenz',
    icon: 'pi pi-users',
    color: '#c76a2a',
  },
  {
    id: 'PARENT_TALK',
    label: 'Elterngespräch',
    icon: 'pi pi-comments',
    color: '#2b8065',
  },
  {
    id: 'SUBSTITUTION',
    label: 'Vertretungsunterricht',
    icon: 'pi pi-arrow-right-arrow-left',
    color: '#b0465b',
  },
  {
    id: 'OTHER',
    label: 'Sonstiges',
    icon: 'pi pi-ellipsis-h',
    color: '#68717c',
  },
  {
    id: 'MINUS_HOURS',
    label: 'Minusstunden',
    icon: 'pi pi-minus-circle',
    color: '#b93838',
  },
];
