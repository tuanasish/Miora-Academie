export const ADMIN_GRADE_MAX = 20;

export const TCF_GRADE_BANDS = [
  { range: '4-5', level: 'A2', nclc: 'NCLC 4' },
  { range: '6', level: 'B1', nclc: 'NCLC 5' },
  { range: '7-9', level: 'B1', nclc: 'NCLC 6' },
  { range: '10-11', level: 'B2', nclc: 'NCLC 7' },
  { range: '12-13', level: 'B2', nclc: 'NCLC 8' },
  { range: '14-15', level: 'C1', nclc: 'NCLC 9' },
  { range: '16-20', level: 'C1-C2', nclc: 'NCLC 10+' },
] as const;
