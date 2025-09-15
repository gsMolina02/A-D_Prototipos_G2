-- Políticas de Seguridad para Supabase (RLS)
-- Ejecutar después del script principal

-- Deshabilitar RLS para desarrollo (reactivar en producción)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios DISABLE ROW LEVEL SECURITY;  
ALTER TABLE citas DISABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones DISABLE ROW LEVEL SECURITY;

-- O si prefieres habilitar RLS con políticas permisivas para desarrollo:
/*
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para desarrollo
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on horarios" ON horarios FOR ALL USING (true);
CREATE POLICY "Allow all operations on citas" ON citas FOR ALL USING (true);
CREATE POLICY "Allow all operations on notificaciones" ON notificaciones FOR ALL USING (true);
*/
