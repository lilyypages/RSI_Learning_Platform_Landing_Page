-- =========================================================================
-- RSI_LEARNING_PLATFORM — PostgreSQL Schema
-- Converted from SQL Server, adapted for Next.js App Router structure
-- =========================================================================
-- ubah database ke pusat

-- =========================================================================
-- EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Untuk gen_random_uuid()


-- =========================================================================
-- LEVEL 1: TABEL INDEPENDEN
-- =========================================================================

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('STUDENT', 'TEACHER', 'PARENT', 'PRINCIPAL')),
    name        VARCHAR(255) NOT NULL,
    image_url   VARCHAR(255),
    is_active   BOOLEAN DEFAULT TRUE,
    created_by  UUID,                          -- Self-ref: diisi setelah tabel exist
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Self-referencing FK (Kepsek yang buat akun)
ALTER TABLE users
    ADD CONSTRAINT fk_users_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE subjects (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name     VARCHAR(100) NOT NULL,
    code     VARCHAR(50)  UNIQUE NOT NULL,
    icon_url VARCHAR(255)
);


-- =========================================================================
-- LEVEL 2: PROFIL PER ROLE & KELAS
-- =========================================================================

CREATE TABLE parents (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    phone   VARCHAR(20),
    address TEXT
);

CREATE TABLE teachers (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nip     VARCHAR(50) UNIQUE,
    phone   VARCHAR(20)
);

CREATE TABLE principals (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    nip     VARCHAR(50) UNIQUE
);

CREATE TABLE classes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(50) NOT NULL,
    grade_level         INT NOT NULL,
    homeroom_teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    academic_year       INT NOT NULL
);


-- =========================================================================
-- LEVEL 3: SISWA & RELASI KELAS
-- =========================================================================

CREATE TABLE students (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    class_id         UUID REFERENCES classes(id) ON DELETE SET NULL,
    parent_id        UUID REFERENCES parents(id) ON DELETE SET NULL,
    nis              VARCHAR(50) UNIQUE NOT NULL,
    birthdate        DATE,
    total_points     INT DEFAULT 0,
    current_streak   INT DEFAULT 0,
    lives_remaining  INT DEFAULT 3
);

CREATE TABLE class_subjects (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id    UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id    UUID REFERENCES teachers(id) ON DELETE SET NULL,
    semester      INT NOT NULL,
    academic_year INT NOT NULL,
    UNIQUE (class_id, subject_id, semester, academic_year)
);


-- =========================================================================
-- LEVEL 4: MATERI PEMBELAJARAN
-- =========================================================================

CREATE TABLE materials (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_subject_id UUID NOT NULL REFERENCES class_subjects(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    content_text     TEXT,
    order_index      INT NOT NULL,
    difficulty       VARCHAR(20) DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    is_published     BOOLEAN DEFAULT FALSE
);


-- =========================================================================
-- LEVEL 5: VIDEO & SOAL
-- =========================================================================

CREATE TABLE videos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id      UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    title            VARCHAR(255) NOT NULL,
    embed_url        VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL,
    point_reward     INT DEFAULT 0
);

CREATE TABLE questions (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id    UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    question_text  TEXT NOT NULL,
    options        JSONB NOT NULL,              -- Array pilihan jawaban, pakai JSONB (lebih efisien dari JSON)
    correct_answer VARCHAR(255) NOT NULL,
    difficulty     VARCHAR(20) DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    point_reward   INT DEFAULT 0,
    order_index    INT NOT NULL,

    CONSTRAINT chk_options_is_array CHECK (jsonb_typeof(options) = 'array')
);


-- =========================================================================
-- LEVEL 6: AKTIVITAS, PROGRESS & EVALUASI
-- =========================================================================

CREATE TABLE student_progress (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_subject_id  UUID NOT NULL REFERENCES class_subjects(id),
    completion_percent REAL DEFAULT 0.0,
    total_score       INT DEFAULT 0,
    adaptive_level    VARCHAR(20) DEFAULT 'STANDARD' CHECK (adaptive_level IN ('REMEDIAL', 'STANDARD', 'ADVANCED')),
    last_activity     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, class_subject_id)
);

CREATE TABLE quiz_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES class_subjects(id),
    material_id      UUID NOT NULL REFERENCES materials(id),
    score            INT DEFAULT 0,
    correct_count    INT DEFAULT 0,
    wrong_count      INT DEFAULT 0,
    lives_used       INT DEFAULT 0,
    streak_count     INT DEFAULT 0,
    result_level     VARCHAR(20) CHECK (result_level IN ('FAILED', 'PASSED', 'EXCELLENT')),
    started_at       TIMESTAMPTZ DEFAULT NOW(),
    finished_at      TIMESTAMPTZ
);

CREATE TABLE quiz_answers (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id     UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    question_id    UUID NOT NULL REFERENCES questions(id),
    answer_given   VARCHAR(255) NOT NULL,
    is_correct     BOOLEAN NOT NULL,
    time_taken_sec INT
);

CREATE TABLE video_watches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES videos(id),
    watched_seconds INT DEFAULT 0,
    is_completed    BOOLEAN DEFAULT FALSE,
    watched_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE point_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id   UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    points_earned INT NOT NULL,
    source_type  VARCHAR(20) NOT NULL CHECK (source_type IN ('QUIZ', 'VIDEO', 'STREAK', 'BONUS')),
    source_id    UUID,                          -- Opsional: ID quiz_session atau video
    description  VARCHAR(255),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_reports (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES class_subjects(id),
    teacher_id       UUID REFERENCES teachers(id) ON DELETE SET NULL,
    week_start       DATE NOT NULL,
    avg_score        INT DEFAULT 0,
    completion_rate  REAL DEFAULT 0.0,
    recommendation   TEXT,
    kkm_achieved     BOOLEAN DEFAULT FALSE,
    generated_at     TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================================================
-- LEVEL 7: NOTIFIKASI & PESAN
-- =========================================================================

CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    is_read     BOOLEAN DEFAULT FALSE,
    sent_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(150) NOT NULL,
    body       TEXT NOT NULL,
    notif_type VARCHAR(20) NOT NULL CHECK (notif_type IN ('SYSTEM', 'QUIZ', 'MESSAGE', 'REPORT')),
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- =========================================================================
-- INDEXES
-- =========================================================================
CREATE INDEX idx_users_email              ON users(email);
CREATE INDEX idx_users_role               ON users(role);
CREATE INDEX idx_students_nis             ON students(nis);
CREATE INDEX idx_students_class           ON students(class_id);
CREATE INDEX idx_students_parent          ON students(parent_id);
CREATE INDEX idx_quiz_answers_session     ON quiz_answers(session_id);
CREATE INDEX idx_student_progress_lookup  ON student_progress(student_id, class_subject_id);
CREATE INDEX idx_quiz_sessions_student    ON quiz_sessions(student_id);
CREATE INDEX idx_materials_class_subject  ON materials(class_subject_id);
CREATE INDEX idx_questions_material       ON questions(material_id);
CREATE INDEX idx_notifications_user       ON notifications(user_id, is_read);
CREATE INDEX idx_messages_receiver        ON messages(receiver_id, is_read);
CREATE INDEX idx_point_logs_student       ON point_logs(student_id);
CREATE INDEX idx_weekly_reports_student   ON weekly_reports(student_id, week_start);
