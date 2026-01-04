-- ========================================
-- SCHEMA COMPLETO PARA CONCESIONARIA CRM
-- PostgreSQL + MinIO + JWT Auth
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- TABLA: users
-- ========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = TRUE;

-- ========================================
-- TABLA: sessions (JWT token tracking)
-- ========================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    user_agent TEXT,
    ip_address INET,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
CREATE INDEX idx_sessions_token ON sessions(refresh_token_hash);

-- ========================================
-- TABLA: labels
-- ========================================
CREATE TABLE labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#5B8DEF',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labels_name ON labels(name);

-- ========================================
-- TABLA: tags
-- ========================================
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tags_name ON tags(name);

-- ========================================
-- TABLA: car_states (estados de vehículos)
-- ========================================
CREATE TABLE car_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#5B8DEF',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_car_states_name ON car_states(name);

-- ========================================
-- TABLA: clients
-- ========================================
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    platform VARCHAR(50) DEFAULT 'web' CHECK (platform IN ('web', 'whatsapp', 'instagram', 'facebook', 'email', 'phone')),
    agent VARCHAR(50) DEFAULT 'AI' CHECK (agent IN ('AI', 'human')),
    bot_enable BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'negotiation', 'won', 'lost')),
    auto_interes TEXT,
    auto_entrega TEXT,
    label_id UUID REFERENCES labels(id) ON DELETE SET NULL,
    assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_label ON clients(label_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_assigned ON clients(assigned_user_id);
CREATE INDEX idx_clients_updated ON clients(updated_at DESC);
CREATE INDEX idx_clients_platform ON clients(platform);

-- ========================================
-- TABLA: tag_client (many-to-many)
-- ========================================
CREATE TABLE tag_client (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(client_id, tag_id)
);

CREATE INDEX idx_tag_client_client ON tag_client(client_id);
CREATE INDEX idx_tag_client_tag ON tag_client(tag_id);

-- ========================================
-- TABLA: notes
-- ========================================
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_client ON notes(client_id);
CREATE INDEX idx_notes_user ON notes(user_id);
CREATE INDEX idx_notes_created ON notes(created_at DESC);

-- ========================================
-- TABLA: messages
-- ========================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT,
    message_file JSONB DEFAULT '[]',
    platform VARCHAR(50) DEFAULT 'web',
    read BOOLEAN DEFAULT FALSE,
    external_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_agent ON messages(agent_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(session_id, read) WHERE read = FALSE;
CREATE INDEX idx_messages_platform ON messages(platform);
CREATE INDEX idx_messages_external ON messages(external_id) WHERE external_id IS NOT NULL;

-- ========================================
-- TABLA: phone_calls (llamadas telefónicas)
-- ========================================
CREATE TABLE phone_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    direction VARCHAR(20) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'missed')),
    duration INTEGER DEFAULT 0,
    recording_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_phone_calls_client ON phone_calls(client_id);
CREATE INDEX idx_phone_calls_status ON phone_calls(status);
CREATE INDEX idx_phone_calls_created ON phone_calls(created_at DESC);

-- ========================================
-- TABLA: email_messages (mensajes de email)
-- ========================================
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    direction VARCHAR(20) DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
    subject TEXT,
    body TEXT,
    from_email VARCHAR(255),
    to_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('draft', 'sent', 'delivered', 'read', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_messages_client ON email_messages(client_id);
CREATE INDEX idx_email_messages_direction ON email_messages(direction);
CREATE INDEX idx_email_messages_created ON email_messages(created_at DESC);

-- ========================================
-- TABLA: event_types
-- ========================================
CREATE TABLE event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#5B8DEF',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_event_types_name ON event_types(name);

-- ========================================
-- TABLA: events_calendar
-- ========================================
CREATE TABLE events_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 30 CHECK (duration > 0),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    event_type_id UUID REFERENCES event_types(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events_calendar(date);
CREATE INDEX idx_events_client ON events_calendar(client_id);
CREATE INDEX idx_events_type ON events_calendar(event_type_id);
CREATE INDEX idx_events_user ON events_calendar(user_id);

-- ========================================
-- TABLA: vehicles
-- ========================================
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER CHECK (year >= 1900 AND year <= 2100),
    price DECIMAL(12,2) CHECK (price >= 0),
    mileage INTEGER CHECK (mileage >= 0),
    color VARCHAR(50),
    status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold')),
    description TEXT,
    images JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_make ON vehicles(make);
CREATE INDEX idx_vehicles_year ON vehicles(year);
CREATE INDEX idx_vehicles_price ON vehicles(price);

-- ========================================
-- TABLA: teams
-- ========================================
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_created_by ON teams(created_by);

-- ========================================
-- TABLA: team_users
-- ========================================
CREATE TABLE team_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

CREATE INDEX idx_team_users_team ON team_users(team_id);
CREATE INDEX idx_team_users_user ON team_users(user_id);

-- ========================================
-- TABLA: team_messages
-- ========================================
CREATE TABLE team_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    message_file JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_team_messages_team ON team_messages(team_id);
CREATE INDEX idx_team_messages_user ON team_messages(user_id);
CREATE INDEX idx_team_messages_created ON team_messages(created_at DESC);

-- ========================================
-- FUNCTION: Actualizar updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGERS: updated_at automático
-- ========================================
CREATE TRIGGER tr_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_vehicles_updated_at
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER tr_phone_calls_updated_at
    BEFORE UPDATE ON phone_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- FUNCTION: Actualizar client updated_at al recibir mensaje
-- ========================================
CREATE OR REPLACE FUNCTION update_client_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE clients SET updated_at = NOW(), last_message = NEW.message WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_message_updates_client
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_client_on_message();

-- ========================================
-- INSERT: Usuario admin inicial
-- ========================================
-- Password: admin123 (cambiar en producción!)
INSERT INTO users (email, password_hash, full_name, role)
VALUES (
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    'Administrator',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- INSERT: Tipos de eventos por defecto
-- ========================================
INSERT INTO event_types (name, color) VALUES
    ('Test Drive', '#22C55E'),
    ('Reunión', '#3B82F6')
ON CONFLICT DO NOTHING;

-- ========================================
-- INSERT: Estados de autos por defecto
-- ========================================
INSERT INTO car_states (name, color) VALUES
    ('Disponible', '#22C55E'),
    ('Vendido', '#EF4444'),
    ('Reservado', '#F59E0B')
ON CONFLICT DO NOTHING;

-- ========================================
-- INSERT: Labels por defecto
-- ========================================
INSERT INTO labels (name, color) VALUES
    ('No Calificado', '#9CA3AF'),
    ('Calificado', '#22C55E')
ON CONFLICT DO NOTHING;

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE users IS 'Usuarios del sistema con autenticación JWT';
COMMENT ON TABLE sessions IS 'Sesiones JWT con refresh tokens';
COMMENT ON TABLE clients IS 'Clientes/leads del CRM';
COMMENT ON TABLE messages IS 'Mensajes de conversaciones con clientes';
COMMENT ON TABLE team_messages IS 'Mensajes en chats de equipo interno';
COMMENT ON TABLE vehicles IS 'Inventario de vehículos';
COMMENT ON TABLE car_states IS 'Estados posibles para vehículos';
COMMENT ON TABLE phone_calls IS 'Registro de llamadas telefónicas';
COMMENT ON TABLE email_messages IS 'Historial de emails con clientes';

