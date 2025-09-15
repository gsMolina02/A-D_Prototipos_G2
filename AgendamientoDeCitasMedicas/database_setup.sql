-- Script SQL para configurar la base de datos en producción
-- Ejecutar este script en tu base de datos PostgreSQL (Supabase, Railway, Render, etc.)

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) DEFAULT 'paciente' CHECK (rol IN ('paciente', 'doctor', 'administrador')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de horarios
CREATE TABLE IF NOT EXISTS horarios (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dia VARCHAR(20) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_cita INTEGER NOT NULL,
    intervalo INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de citas
CREATE TABLE IF NOT EXISTS citas (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    dia DATE NOT NULL,
    horario VARCHAR(20) NOT NULL,
    especialidad VARCHAR(100),
    estado VARCHAR(20) DEFAULT 'agendada' CHECK (estado IN ('agendada', 'cancelada', 'atendida', 'reprogramada')),
    motivo_cancelacion TEXT,
    fecha_agendada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(doctor_id, dia, horario)
);

-- Crear tabla de notificaciones
CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    mensaje TEXT NOT NULL,
    destinatario_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    leida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuario doctor por defecto
-- Email: axeldoge4@gmail.com, Password: doctor123
INSERT INTO users (name, apellido, cedula, email, telefono, password, rol) 
VALUES (
    'Dr. Axel',
    'Doge',
    '1234567890',
    'axeldoge4@gmail.com',
    '0987654321',
    '$2a$10$JYEvSGvfq9NsKv29ROWFyurloK0pESv2q.CGSg2.7G95ZFAZ9JATu',
    'doctor'
) ON CONFLICT (email) DO NOTHING;

-- Insertar usuario paciente de prueba  
-- Email: juan.perez@email.com, Password: 123456
INSERT INTO users (name, apellido, cedula, email, telefono, password, rol) 
VALUES (
    'Juan',
    'Pérez',
    '0987654321',
    'juan.perez@email.com',
    '0912345678',
    '$2a$10$JgbXfIowKf6b/ejwvXulkeqlPHv.GPAc19aaP8SbX/9W/zBNAW/cu',
    'paciente'
) ON CONFLICT (email) DO NOTHING;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_citas_doctor_dia ON citas(doctor_id, dia);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_horarios_doctor ON horarios(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_destinatario ON notificaciones(destinatario_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cedula ON users(cedula);

-- Crear vista para facilitar consultas
CREATE OR REPLACE VIEW vista_citas_completa AS
SELECT 
    c.id,
    c.dia,
    c.horario,
    c.especialidad,
    c.estado,
    c.motivo_cancelacion,
    c.fecha_agendada,
    p.name as paciente_name,
    p.apellido as paciente_apellido,
    p.email as paciente_email,
    p.telefono as paciente_telefono,
    p.cedula as paciente_cedula,
    d.name as doctor_name,
    d.apellido as doctor_apellido,
    d.email as doctor_email,
    d.telefono as doctor_telefono
FROM citas c
JOIN users p ON c.paciente_id = p.id
JOIN users d ON c.doctor_id = d.id;

-- Configurar permisos (opcional, dependiendo del proveedor)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tu_usuario;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tu_usuario;
