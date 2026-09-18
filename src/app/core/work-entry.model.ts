export type WorkCategory =
  'LESSON' | 'PREPARATION' | 'CONFERENCE' | 'PARENT_TALK' | 'SUBSTITUTION' | 'OTHER';

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
  sampleDuration: string;
  sampleShare: number;
}> = [
  {
    id: 'LESSON',
    label: 'Unterricht',
    icon: 'pi pi-book',
    color: '#176b87',
    sampleDuration: '14:55',
    sampleShare: 47,
  },
  {
    id: 'PREPARATION',
    label: 'Vor- & Nachbereitung',
    icon: 'pi pi-pencil',
    color: '#7256a5',
    sampleDuration: '8:20',
    sampleShare: 26,
  },
  {
    id: 'CONFERENCE',
    label: 'Konferenz',
    icon: 'pi pi-users',
    color: '#c76a2a',
    sampleDuration: '3:30',
    sampleShare: 11,
  },
  {
    id: 'PARENT_TALK',
    label: 'Elterngespräch',
    icon: 'pi pi-comments',
    color: '#2b8065',
    sampleDuration: '2:15',
    sampleShare: 7,
  },
  {
    id: 'SUBSTITUTION',
    label: 'Vertretungsunterricht',
    icon: 'pi pi-arrow-right-arrow-left',
    color: '#b0465b',
    sampleDuration: '1:30',
    sampleShare: 5,
  },
  {
    id: 'OTHER',
    label: 'Sonstiges',
    icon: 'pi pi-ellipsis-h',
    color: '#68717c',
    sampleDuration: '1:15',
    sampleShare: 4,
  },
];
