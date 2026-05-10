# Feature Spec: Listening Transcription
Created: 2026-05-10

## 1. Executive Summary
Thêm tính năng cho phép Admin nhập thủ công lời thoại (transcription) cho từng câu hỏi có audio trong bài nghe TCF. Transcription được lưu trên Supabase và hiển thị cho giáo viên (read-only) và học viên (toggle xem).

## 2. User Stories
- **US-01**: Là Admin, tôi muốn nhập transcription cho từng câu hỏi listening để học viên có thể đọc lời thoại.
- **US-02**: Là Admin, tôi muốn sửa transcription đã nhập khi phát hiện sai sót.
- **US-03**: Là Teacher, tôi muốn xem transcription của câu hỏi để hỗ trợ giảng dạy.
- **US-04**: Là Student, tôi muốn xem lời thoại khi làm bài nghe để hiểu rõ hơn nội dung.
- **US-05**: Là Student, tôi muốn xem lời thoại khi review bài đã nộp để học lại.

## 3. Database Design

### Table: `listening_transcriptions`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| serie_id | INTEGER | NOT NULL |
| question_id | INTEGER | NOT NULL |
| transcription | TEXT | NOT NULL, default '' |
| created_by | UUID | FK → auth.users(id), ON DELETE SET NULL |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |

**Constraints:** UNIQUE(serie_id, question_id)
**Indexes:** idx_listening_transcriptions_serie(serie_id)

### RLS Policies
- Admin: ALL operations
- Teacher: SELECT only
- Student: SELECT only

## 4. Logic Flowchart

### Admin Flow
```
Admin mở /admin/exams/listening
  → Chọn série
  → Expand câu hỏi
  → Thấy section "Transcription"
  → Nhập text vào textarea
  → Bấm "Enregistrer"
  → Server Action: upsertTranscription()
  → INSERT hoặc UPDATE ON CONFLICT
  → Response success → UI feedback
```

### Student Flow
```
Student làm bài /exam/listening/[serieId]
  → Page load → fetch transcriptions cho série
  → Với câu hỏi có audio + transcription:
    → Hiện nút "📝 Voir le script"
    → Bấm toggle → hiện/ẩn panel transcription
```

## 5. API Contract (Server Actions)

### upsertTranscription
```typescript
"use server"
async function upsertTranscription(
  serieId: number,
  questionId: number,
  transcription: string
): Promise<{ success: boolean; error?: string }>
```
- Auth: Admin only
- Method: UPSERT (INSERT ... ON CONFLICT UPDATE)

### getTranscriptionsForSerie
```typescript
"use server"
async function getTranscriptionsForSerie(
  serieId: number
): Promise<Record<number, string>>
```
- Auth: Any authenticated user
- Returns: Map of questionId → transcription text

## 6. UI Components

### TranscriptionEditor (Admin)
- Textarea + Save button
- Loading state on save
- Success/error feedback
- Sử dụng trong expanded question row

### TranscriptionViewer (Teacher/Student)
- Read-only text display
- Styled panel with FileText icon
- Collapsible (Student exam) / Always visible (Teacher bank, Review)

## 7. Files Affected
- NEW: `supabase/migrations/XXXXXXXX_listening_transcriptions.sql`
- NEW: `src/app/actions/transcription.actions.ts`
- MODIFY: `src/app/admin/exams/listening/page.tsx`
- MODIFY: `src/app/teacher/exams/listening/page.tsx`
- MODIFY: `src/app/exam/listening/[serieId]/page.tsx`
- MODIFY: `src/app/dashboard/submissions/[id]/page.tsx`
- MODIFY: `src/components/exam/DashboardSubmissionMcqSection.tsx`
- MODIFY: `src/components/exam/McqSubmissionReview.tsx`

## 8. Build Checklist
- [ ] Phase 01: Database migration applied
- [ ] Phase 02: Server Actions working
- [ ] Phase 03: Admin can create/edit transcriptions
- [ ] Phase 04: Teacher can view transcriptions
- [ ] Phase 05: Student can toggle transcription during exam
- [ ] Phase 06: Student/Admin/Teacher see transcription in review
