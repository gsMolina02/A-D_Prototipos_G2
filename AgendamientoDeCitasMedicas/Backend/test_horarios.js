const { query } = require('./src/db/db');

const testHorarios = async () => {
  try {
    console.log('1. Verificando horarios existentes...');
    const horariosExistentes = await query('SELECT * FROM horarios');
    console.log('Horarios encontrados:', horariosExistentes.rows.length);
    console.log('Horarios:', horariosExistentes.rows);

    console.log('\n2. Creando horario de prueba...');
    
    // Eliminar horarios existentes del doctor ID 3
    await query('DELETE FROM horarios WHERE doctor_id = 3');
    
    // Crear un horario de prueba
    const nuevoHorario = await query(
      'INSERT INTO horarios (doctor_id, dia, hora_inicio, hora_fin, duracion_cita, intervalo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [3, 'Lunes', '09:00', '12:00', 30, 10]
    );
    
    console.log('Horario creado:', nuevoHorario.rows[0]);
    
    console.log('\n3. Verificando horarios por doctor...');
    const horariosPorDoctor = await query(
      'SELECT * FROM horarios WHERE doctor_id = $1 ORDER BY dia, hora_inicio',
      [3]
    );
    console.log('Horarios del doctor 3:', horariosPorDoctor.rows);
    
    console.log('\n4. Verificando horarios con info del doctor...');
    const horariosConDoctor = await query(`
      SELECT h.*, u.name as doctor_name, u.apellido as doctor_apellido 
      FROM horarios h 
      JOIN users u ON h.doctor_id = u.id 
      WHERE u.rol = 'doctor'
      ORDER BY h.dia, h.hora_inicio
    `);
    console.log('Horarios con info del doctor:', horariosConDoctor.rows);
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testHorarios();
